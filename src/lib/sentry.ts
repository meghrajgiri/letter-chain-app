import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Crash reporting. Off in development and whenever no DSN is configured.
 * Crashes only: no performance tracing, session replay or personal data (IP, user IDs).
 */
Sentry.init({
  dsn,
  enabled: Boolean(dsn) && !__DEV__,
  environment: __DEV__ ? 'development' : 'production',
  sendDefaultPii: false,
});

/** Reports an error that a boundary caught (those never reach the global crash handler). */
export function reportError(error: unknown) {
  Sentry.captureException(error);
}

export const wrapRoot = Sentry.wrap;
