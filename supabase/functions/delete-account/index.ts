// Deletes the calling user's account (required by Google Play).
// Deleting the auth user cascades to profiles and game_results.
// Deploy: supabase functions deploy delete-account  (see docs/supabase-setup.md)
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

  const authorization = req.headers.get('Authorization');
  if (!authorization) return new Response('Not signed in', { status: 401, headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  // Identify the caller from their own access token.
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return new Response('Not signed in', { status: 401, headers: cors });

  // Only this function holds the service role key; the app never does.
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) return new Response(deleteError.message, { status: 500, headers: cors });

  return new Response(JSON.stringify({ deleted: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
