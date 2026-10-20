# Ads (Google AdMob)

Library: `react-native-google-mobile-ads` (v17). Config: `app.json` plugin (`androidAppId`, `androidSdk`, `delayAppMeasurementInit`). Code: `src/features/ads/`.

> Keep `"androidSdk": "classic"` in the plugin config. Without it, the library's Android build fails with *"Cannot get property 'googleMobileAdsJson' on extra properties extension"*: its `build.gradle` reads that property unguarded, but its `app-json.gradle` sets a misspelled one when `app.json` has no top-level `react-native-google-mobile-ads` section. The Gradle property written by `androidSdk` short-circuits that read.

| | Value |
|---|---|
| App ID | `ca-app-pub-6296571874627648~8797562192` |
| Rewarded "Hint reward" | `ca-app-pub-6296571874627648/6139609264` |
| Interstitial "Between puzzles" | `ca-app-pub-6296571874627648/8715913553` |
| Rewarded "Streak save" | `ca-app-pub-6296571874627648/2808311873` |
| Publisher ID | `pub-6296571874627648` (in `site/app-ads.txt`) |

These IDs are not secret; they ship inside the app.

## How ads behave (`adPolicy.ts`, unit-tested)

- **Consent first.** On launch, Google's consent form (UMP) appears only where the law requires it (EU/UK/Switzerland). The SDK starts only after that, and ads load only once `canRequestAds` is true. Players who must be offered it get **Settings → Ad privacy choices**.
- **Rewarded:** when out of hints, the hint button becomes "Watch ad: +1 hint", up to 3 times per puzzle. The hint is granted only when Google reports the reward was earned. The clock pauses while the ad plays.
- **Rewarded streak save:** the day after a missed daily, Home shows "Save your N-day streak" (rules in `progress/streakSave.ts`: one missed day, run of 2+ days, once per 7 days). Watching to the end records the save; closing early doesn't. Music pauses while it plays.
- **No ad available** (no fill, offline, ads not allowed yet): rewarded placements retry every 30 s while wanted (`useRewarded`). The streak card says "No ad right now" after 12 s instead of loading forever, and keeps the offer for the rest of the day.
- **Interstitial:** only when tapping Continue after a free-play puzzle, at most one per 3 finished free-play puzzles and 3 minutes apart (counted per app session). Never before, during or after the daily.
- **No banners, no app-open ads.**
- **Web build:** no ads (`*.web.ts` stand-ins).

## Testing

- **Development builds (`__DEV__`) always use Google's test ad units**, so clicking them is safe. Release builds use the real units.
- **Never tap real ads** on your own device. To test a release build safely, add your phone as a test device in AdMob (Settings → Test devices).
- **Native module:** a new development build is required after adding it:

  ```bash
  npx expo prebuild --clean --platform android
  npx expo run:android
  ```

## AdMob console checklist

- [x] App added (not yet linked to a store)
- [x] Ad units: Hint reward (rewarded), Between puzzles (interstitial), Streak save (rewarded)
- [ ] Privacy & messaging → European regulations message, published (privacy policy: `https://letterchain.meghrajgiri.com/privacy`)
- [ ] Payments: name, address and tax info (PIN letter arrives at about $10 of earnings)
- [ ] After the app is live on Play: Apps → App settings → **link to Google Play**, then wait for AdMob's app review. Real ads only serve after this.
- [ ] Play Console store listing → **Website: `https://letterchain.meghrajgiri.com`** (AdMob reads `app-ads.txt` from there)

## Play Console: Data safety (with ads)

Use Google's official guide for what the Mobile Ads SDK collects: <https://developers.google.com/admob/android/privacy/play-data-disclosure>. In summary:

| Data type | Collected by | Purpose | Optional? |
|---|---|---|---|
| Device or other IDs (advertising ID) | AdMob SDK | Advertising, analytics, fraud prevention | Required while ads run |
| Approximate location (from IP) | AdMob SDK | Advertising, analytics, fraud prevention | Required while ads run |
| App interactions; crash logs and diagnostics | AdMob SDK | Advertising, analytics, fraud prevention | Required while ads run |
| Crash logs; diagnostics (device model, OS, app version, memory) | App (Sentry) | Analytics (fixing crashes) | Collected automatically; not linked to the user's identity |
| Name, email address | App (Google sign-in) | Account management | Optional (guests don't sign in) |
| App activity: game results | App (when signed in) | App functionality | Optional |

Also answer: data is encrypted in transit (yes); users can request deletion (yes, with `https://letterchain.meghrajgiri.com/delete-account`). In the **Ads** declaration, say the app **contains ads**.

Keep `site/privacy.html` in line with this table whenever ads or data collection change.
