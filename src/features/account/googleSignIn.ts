/** Native Google Sign-In → Google ID token (exchanged with Supabase by AccountProvider). */
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const googleSignInConfigured = webClientId.length > 0;

let configured = false;
function configure() {
  if (configured) return;
  GoogleSignin.configure({ webClientId });
  configured = true;
}

export class GoogleSignInError extends Error {}

/** Returns the Google ID token, or null if the player cancelled. */
export async function getGoogleIdToken(): Promise<string | null> {
  if (!googleSignInConfigured) throw new GoogleSignInError('Google sign-in isn’t set up yet');
  configure();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;
    if (!response.data.idToken) throw new GoogleSignInError('Google didn’t return an ID token');
    return response.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (error.code === statusCodes.IN_PROGRESS) return null;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new GoogleSignInError('Google Play services are not available');
      // DEVELOPER_ERROR (10): package name / SHA-1 / client ID mismatch in Google Cloud.
      if (String(error.code) === '10') throw new GoogleSignInError('Google sign-in is misconfigured (check the SHA-1 and client IDs)');
    }
    throw error;
  }
}

export async function googleSignOut() {
  try {
    configure();
    await GoogleSignin.signOut();
  } catch {
    // Not signed in with Google on this device; nothing to do.
  }
}
