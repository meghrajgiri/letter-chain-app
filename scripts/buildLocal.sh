#!/bin/sh
# Local Android build with EAS. Usage: scripts/buildLocal.sh [production|preview]
# Loads .env (and .env.local) into the shell so the Sentry Gradle step can upload
# source maps: Gradle only sees real environment variables, not dotenv files.
set -e
cd "$(dirname "$0")/.."

PROFILE="${1:-production}"
case "$PROFILE" in
  production) OUT="letter-chain.aab" ;;
  preview) OUT="letter-chain.apk" ;;
  *) echo "Unknown profile: $PROFILE (use production or preview)" >&2; exit 1 ;;
esac

# npm runs this without your shell profile, so fall back to the standard install paths.
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [ -z "$JAVA_HOME" ] && [ -x /usr/libexec/java_home ]; then
  JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
  export JAVA_HOME
fi

set -a
[ -f .env ] && . ./.env
[ -f .env.local ] && . ./.env.local
set +a

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "SENTRY_AUTH_TOKEN is not set; skipping the Sentry upload." >&2
  export SENTRY_DISABLE_AUTO_UPLOAD=true
fi

npx -y eas-cli@latest build --local --platform android --profile "$PROFILE" --output "$OUT"
