// Sentry's Metro config adds debug IDs to bundles so crash reports map back to the source.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
