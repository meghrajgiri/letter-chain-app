/**
 * App identity and outward links. The share link lives here only, so
 * switching to a website / challenge link later is a one-line change.
 */
import Constants from 'expo-constants';

export const APP_NAME = 'Letter Chain';

/** Permanent Android application id (also set in app.json). */
export const ANDROID_PACKAGE: string = Constants.expoConfig?.android?.package ?? 'com.letterchain.app';

export function playStoreUrl(packageName: string): string {
  return `https://play.google.com/store/apps/details?id=${packageName}`;
}

/** Link included in shared results. */
export const SHARE_URL = playStoreUrl(ANDROID_PACKAGE);
