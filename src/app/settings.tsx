import { Redirect } from 'expo-router';

/** Settings now live on the Profile screen. */
export default function SettingsRoute() {
  return <Redirect href="/profile" />;
}
