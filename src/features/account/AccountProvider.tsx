import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useProgress } from '../progress/ProgressProvider';
import { getGoogleIdToken, googleSignOut } from './googleSignIn';
import { syncResults, type ResultRow, type SyncApi } from './sync';

export type AccountUser = { id: string; email: string | null; name: string | null; avatarUrl: string | null };
export type SyncState = 'idle' | 'syncing' | 'error';

type AccountApi = {
  /** 'loading' until the saved session (if any) has been restored. */
  status: 'loading' | 'guest' | 'signedIn';
  user: AccountUser | null;
  syncState: SyncState;
  lastSyncedAt: string | null;
  /** Resolves true if signed in, false if the player cancelled. Throws with a readable message on failure. */
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const AccountContext = createContext<AccountApi | null>(null);

export function useAccount(): AccountApi {
  const api = useContext(AccountContext);
  if (!api) throw new Error('useAccount must be used inside <AccountProvider>');
  return api;
}

function toUser(session: Session | null): AccountUser | null {
  if (!session) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: (meta.full_name as string) ?? (meta.name as string) ?? null,
    avatarUrl: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
  };
}

function serverApi(userId: string): SyncApi {
  return {
    async upload(rows) {
      const { error } = await supabase
        .from('game_results')
        .upsert(rows.map((r) => ({ ...r, user_id: userId })), { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
    },
    async pull(after, limit) {
      let query = supabase.from('game_results').select('*').eq('user_id', userId).order('uploaded_at').limit(limit);
      if (after) query = query.gt('uploaded_at', after);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ResultRow[];
    },
  };
}

const cursorKey = (userId: string) => `sync.cursor.${userId}`;

/**
 * Optional Google account on top of local-first progress
 * (docs/progression-and-sync.md): guests keep everything on the device;
 * signing in uploads their games and downloads games from other devices,
 * then keeps syncing after each game and whenever the app is opened.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const progress = useProgress();
  const { sync, ready, results } = progress;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const syncing = useRef(false);
  const again = useRef(false);
  const user = useMemo(() => toUser(session), [session]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const syncNow = useCallback(async () => {
    if (!user || !ready) return;
    if (syncing.current) {
      again.current = true;
      return;
    }
    syncing.current = true;
    setSyncState('syncing');
    try {
      do {
        again.current = false;
        const cursor = await sync.readValue(cursorKey(user.id));
        const outcome = await syncResults(serverApi(user.id), sync.pending(), cursor);
        const syncedAt = new Date().toISOString();
        await sync.apply({ uploadedIds: outcome.uploadedIds, downloaded: outcome.downloaded, syncedAt });
        if (outcome.cursor) await sync.writeValue(cursorKey(user.id), outcome.cursor);
        setLastSyncedAt(syncedAt);
      } while (again.current);
      setSyncState('idle');
    } catch (error) {
      console.warn('Sync failed', error);
      setSyncState('error');
    } finally {
      syncing.current = false;
    }
  }, [user, ready, sync]);

  // Sync when signed in (also right after sign-in), whenever new games are
  // waiting, and when the app comes back to the foreground.
  const pendingCount = results.filter((r) => !r.syncedAt).length;
  useEffect(() => {
    if (!user || !ready) return;
    // Short debounce: several changes in a row (e.g. sign-in + restored games) sync once.
    const timer = setTimeout(() => syncNow(), 300);
    return () => clearTimeout(timer);
  }, [user, ready, pendingCount, syncNow]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
    });
    return () => sub.remove();
  }, [syncNow]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabaseConfigured) throw new Error('Accounts aren’t set up yet');
    const idToken = await getGoogleIdToken();
    if (!idToken) return false;
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) throw new Error(error.message);
    return true;
  }, []);

  /** Signs out; games already on the server are removed from this device (a fresh guest remains). */
  const signOut = useCallback(async () => {
    if (user) await sync.writeValue(cursorKey(user.id), '');
    await supabase.auth.signOut();
    await googleSignOut();
    await sync.clearSynced();
    setLastSyncedAt(null);
  }, [user, sync]);

  /** Permanently deletes the account and its server data, then clears this device. */
  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) throw new Error('Could not delete the account. Check your connection and try again.');
    if (user) await sync.writeValue(cursorKey(user.id), '');
    await supabase.auth.signOut({ scope: 'local' });
    await googleSignOut();
    await sync.clearAll();
    setLastSyncedAt(null);
  }, [user, sync]);

  const api = useMemo<AccountApi>(
    () => ({
      status: loading ? 'loading' : user ? 'signedIn' : 'guest',
      user,
      syncState,
      lastSyncedAt,
      signInWithGoogle,
      signOut,
      deleteAccount,
      syncNow,
    }),
    [loading, user, syncState, lastSyncedAt, signInWithGoogle, signOut, deleteAccount, syncNow],
  );

  return <AccountContext.Provider value={api}>{children}</AccountContext.Provider>;
}
