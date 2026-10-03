/** Google sign-in is native-only; the web build (browser testing) reports it as unavailable. */
export const googleSignInConfigured = false;

export class GoogleSignInError extends Error {}

export async function getGoogleIdToken(): Promise<string | null> {
  throw new GoogleSignInError('Google sign-in is available in the mobile app');
}

export async function googleSignOut() {}
