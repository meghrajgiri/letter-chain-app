import { Redirect } from 'expo-router';

/** The mode picker tab is gone: Home's mode tiles start games directly. Old links land on the lobby. */
export default function PlayRoute() {
  return <Redirect href="/" />;
}
