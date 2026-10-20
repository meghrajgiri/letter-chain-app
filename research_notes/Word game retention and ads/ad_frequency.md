# Ad frequency and placement for casual word/puzzle games on AdMob (Letter Chain)

Context we checked against: interstitials only between free-play puzzles, at most 1 per 3 finished puzzles and at least 3 minutes apart, none around the daily puzzle; rewarded ads for an extra hint, up to 3 per puzzle; no banners; no IAP.

Source quality notes: Unity/ironSource, Google AdMob help pages and PocketGamer.biz (reporting Unity's report) are primary or near-primary. Several numeric "benchmarks" (Playio, AdReact, RevenueLab, MonetizeMore, FlexyConsent, AppSamurai) come from vendor/SEO blogs with unclear methods. They are marked "(vendor blog, low confidence)". Some figures were only seen in search-result snippets and are marked "(snippet only, not verified on page)".

## 1. Interstitial frequency caps, cooldowns and grace periods

### Takeaway
Letter Chain's policy (one ad per 3 puzzles, at least 3 minutes apart, and an ad only at a level break) sits at the conservative end of common practice. Industry guidance converges on two caps at once (time and levels), which the game already has. The clear missing piece is a **new-user grace period**: no interstitials until some number of levels or sessions, or until day 2 or later.

### Cited Findings
- AdMob policy guidance: interstitials only at logical breaks (between pages, stages or levels). Do not show them on app load or exit. Do not show one "after every user action": the guidance says "no more than one interstitial ad after every two user actions". Never show one immediately after another closes. Preload the ad so it does not pop up late after new content has loaded. — [AdMob Help: Disallowed interstitial implementations](https://support.google.com/admob/answer/6201362?hl=en)
- Unity (2021, older but primary): the first interstitial should come between level 3 and level 8, not level 1, to improve retention and ARPU. Hyper-casual games can show ads from day 1. For casual, midcore and hardcore games, Unity suggests "wait at least two weeks" before showing interstitials. Do not show interstitials to payers or to "ad whales" (heavy rewarded watchers). Run frequency A/B tests for at least 2 weeks and watch D1 retention against ARPU. Showing the ad *before* the end-level screen keeps ARPU with less retention damage than showing it after. — [Unity blog: Best practices for maximizing revenue from interstitial ads (Mar 2021)](https://unity.com/blog/best-practices-for-maximizing-revenue-from-interstitial-ads-in-your-app)
- Felix Braberg (Jun 2026): fire ads only on level transitions, never on timers. Gate new users by levels cleared, session count or time since install. Use two caps at once, minimum seconds AND minimum levels since the last ad, so fast players are not punished. Track post-win and post-loss ads separately. Reset the interstitial timer after a rewarded ad and never stack an interstitial on top of one. Keep the cooldown, level gates, session caps and win/loss frequencies in remote config. The article gives no concrete numbers. — [Felix Braberg, 7 Best Practices for Interstitial Ads in Level-Based Games](https://felixbraberg.substack.com/p/7-best-practices-for-interstitial) (also syndicated on [Gamigion](https://www.gamigion.com/7-best-practices-for-interstitial-ads-in-level-based-games/))
- Snippet claims: an example game with no interstitials during its first 19 levels. "Industry standards by 2026": first ad of a session delayed 60–90 s, at least 2–3 minutes between ads, and a stop at 4–6 impressions per session. Pushing the first ad to 60–90 s reportedly improved D1 retention by 5–8% with no meaningful revenue loss. — (snippet only, vendor blog, low confidence) [AdReact](https://adreact.com/blog/interstitial-ad-best-practices-mobile-games/); [Playio blog](https://blog.playio.co/interstitial-ads-mobile-games); [HackerNoon "Morning Words"](https://hackernoon.com/how-i-monetize-morning-words-without-interrupting-players-after-every-level) (page body could not be retrieved)
- Appodeal case (snippet only; the page now returns 404): cutting the time before the first interstitial from 3 to 2 minutes raised ad ARPU by about 20% with no measured retention impact. — [Appodeal](https://appodeal.com/20-arpu-retention-strategies-3-successful-games)

### Inferences
- The current 3-puzzle / 3-minute double cap is reasonable and likely below the 2–3 minute norm, so on the light side. There is headroom: test 2 puzzles / 2–2.5 minutes in free play, but only after a grace period.
- Add a grace period: no interstitials during the first session, or for the first ~5–10 puzzles, or on day 0. This matches Unity's "level 3–8" advice for the first ad and the general "respect new users" rule.
- Add a per-session cap (for example 4–6), reset the interstitial cooldown after any rewarded view, and skip interstitials for anyone who ever pays (once IAP exists).
- Move all of these thresholds into remote config so they can be A/B tested without a release.

### Gaps
- No primary, word-game-specific source gave an exact "every N levels" value for named top games (Wordscapes, Word Connect, CodyCross). No published teardown of their caps was found.

## 2. Measured impact of interstitials on retention

### Takeaway
Published A/B results usually show interstitials adding **~17–25% revenue** for a **small retention cost (0–3% D7)** when they are placed at natural breaks. The cost grows with frequency, and with how early in a new user's life the ads start.

### Cited Findings
- ZiMAD "Dig Out!" (Unity case study, Dec 2019): adding day-1 interstitials on top of rewarded video and banners gave +17% revenue and +18% ARPDAU. D7 retention fell 2.5%, rewarded impressions fell 3%, and engagement dipped slightly. — [Unity: ZiMAD increases ARPDAU 18%](https://unity.com/en/resources/zimad-dig-out)
- Pomelo Games (Firebase case study, snippet only): two weeks of interstitial testing gave +25% AdMob revenue and +35% IAP revenue with "almost no effect on retention". — [Firebase: Pomelo Games](https://firebase.google.com/use-cases/pomelo-games)
- Unity: "The number of ads you can show your users without damaging your retention really depends on your app's genre." Hyper-casual players are the most tolerant and RPG/strategy players the least. Unity also reports mid-level interstitials (for levels of 45 s or longer) that left D7/D14 retention unchanged. — [Unity blog (2021)](https://unity.com/blog/best-practices-for-maximizing-revenue-from-interstitial-ads-in-your-app)
- Unity reports that 73% of mobile puzzle players think ads have no effect on their experience, or even a positive one. — [Unity blog: Top 5 rewarded placements for puzzle games (Apr 2023)](https://unity.com/blog/top-5-rewarded-video-placements-to-boost-puzzle-game-revenue)

### Inferences
- The biggest retention risk is early exposure and ads at unexpected moments, more than the steady-state frequency. Keeping the daily puzzle ad-free is a sensible retention protection, because the daily puzzle is the habit loop.
- For a solo developer, the main lever is a remote-config A/B test (2 weeks or more; metrics D1/D7 retention and ARPDAU) on the puzzle count and cooldown.

### Gaps
- No 2022–2026 public A/B results from AppLovin, Homa, Voodoo or GameAnalytics on interstitial frequency specifically for word games were found within the search budget. Most published case studies are older (2019–2021).

## 3. Best-performing rewarded placements and engagement rates

### Takeaway
Word games have the **highest rewarded engagement of any genre (38.4% of DAU)**. Context-sensitive placements, offered when the player is stuck or out of resources, beat between-level placements (38.1% vs 23.8%). More placements raise engagement up to roughly 15–20. Letter Chain's single placement (hint, 3 per puzzle) is good but leaves revenue on the table.

### Cited Findings
- Unity Mobile Growth & Monetization Report 2024 (2023 data), rewarded engagement as a share of DAU: word games 38.4%, RPG 37.6%, casual 36%, sports/trivia 27.3%. Context-sensitive placements (for example running out of resources) got 38.1% engagement, against 23.8% for between-level placements. Games with 15 or more placements reached up to 46% engagement. — [PocketGamer.biz, Sep 2024](http://www.pocketgamer.biz/unity-global-rewarded-ad-engagement-rose-by-32-in-2023/)
- Unity's top puzzle placements: reward multipliers after a level (2x to 20x), extra currency on the home screen or in the shop on a countdown timer (usually available once or twice a day), and mystery or daily rewards. These raise session length and give players a reason to come back. — [Unity blog: Top 5 rewarded placements for puzzle games (Apr 2023)](https://unity.com/blog/top-5-rewarded-video-placements-to-boost-puzzle-game-revenue)
- Top motivators for watching rewarded ads, by conversion: gacha 31.1%, extra moves 30.5%, daily rewards 30.3%. Conversion grows with the number of rewarded placements but plateaus after about 15–20. — (vendor blog, low confidence) [AppSamurai](https://appsamurai.com/blog/rewarded-ads-in-mobile-games-strategy-data-and-best-practices/)
- Reset the interstitial timer after a rewarded view. Rewarded eCPM can be about 1.5–2x interstitial eCPM in some geos, so protect rewarded engagement. — [Felix Braberg](https://felixbraberg.substack.com/p/7-best-practices-for-interstitial)
- Unity's meta match-3 lessons cover more rewarded placements for meta layers. — [Unity blog: 10 rewarded video lessons from meta match-3](https://unity.com/blog/rewarded-video-monetization-lessons-from-meta-match-3-games)

### Inferences
- Candidate additions, in rough priority order for Letter Chain:
  1. A post-puzzle multiplier ("2x coins/stars") if a soft currency or progression exists.
  2. A daily bonus chest or free-hint timer on the home screen (once or twice a day). It also works as a retention hook.
  3. On the daily puzzle, an opt-in rewarded "reveal a letter" or "second chance" (opt-in only, which keeps the daily puzzle free of forced ads).
  4. Rewarded unlocks of themes or cosmetics.
- Keeping hints at 3 per puzzle is fine. The bigger gain is adding more reasons to watch, not more hint views.

### Gaps
- No public benchmark of rewarded views per DAU specifically for word-search games. One vendor example claims 2.1 views per DAU for a casual puzzle game ([RevenueLab, low confidence](https://www.revenuelab.fyi/blog/admob-ecpm-benchmarks-2026)).

## 4. Banners: worth it?

### Takeaway
Banners pay about 10–20x less per impression than interstitials, and Tier 3 banner eCPM is close to zero. In a word-search game, where screen space for the grid matters, banners during gameplay are a poor trade. If used at all, they should be adaptive banners on menu or level-select screens only, and the first thing a "Remove ads" purchase removes.

### Cited Findings
- eCPM ranges (vendor blogs, low confidence):
  - Tier 1 banners: about $0.50–$2.10. Tier 3 banners: as low as $0.06.
  - Tier 1 interstitials: about $6–14. Tier 3 interstitials: about $1–2.
  - Tier 1 rewarded: about $15–45.
  - US casual puzzle: rewarded $15–22, interstitial $10–15.
  - US Android interstitial: about $14 in Q4 2024, roughly 20x banner rates.

  Sources: [RevenueLab AdMob eCPM benchmarks 2026](https://www.revenuelab.fyi/blog/admob-ecpm-benchmarks-2026); [Playio eCPM benchmarks 2026](https://blog.playio.co/mobile-game-ecpm-benchmarks-2026); [MonetizeMore](https://www.monetizemore.com/blog/admob-monetization/)
- ZiMAD's baseline monetization already included banners, and the incremental revenue came from interstitials. — [Unity ZiMAD case](https://unity.com/en/resources/zimad-dig-out)
- AdMob app open guidance: don't layer app open ads over banners. — [AdMob Help: App open ads](https://support.google.com/admob/answer/9341964?hl=en)

### Inferences
- With global traffic weighted toward Tier 3 (typical for Android), banner revenue would be small while the cost to grid space and readability is large. Recommendation: skip banners during gameplay. An adaptive banner on the home or level list is optional and low value, so test it only if analytics show long menu dwell time.

### Gaps
- No primary A/B test was found that measures the retention impact of banners in word games.

## 5. App open ads: pros and cons

### Takeaway
App open ads monetize cold starts and resumes, but AdMob says they work best when users open the app more than once every 4 hours. They are banned for Designed for Families apps, and they hit the user at the exact moment they want to play the daily puzzle. For Letter Chain they are a risky add with low priority.

### Cited Findings
- Show them only on app open or return, over the loading or splash screen. Never show one once users can interact with content, never after loading finishes, and never right before or after another ad. They may have up to a 2 s delay before the close button appears (5 s if high-engagement ads are enabled). Apps that are opened more than once every 4 hours perform best. Apps in Google Play's Designed for Families program cannot use app open ads. — [AdMob Help: App open ads](https://support.google.com/admob/answer/9341964?hl=en)
- AdMob ad units support frequency caps per user per minute, hour or day. — [AdMob Help (snippet)](https://support.google.com/admob/answer/9341964?hl=en)

### Inferences
- A daily-puzzle game probably sees 1–2 opens a day, below AdMob's "opens more than once every 4 hours" sweet spot. The app open ad would also sit right in front of the ad-free daily puzzle. If tested at all, use it only on warm resumes after a long gap, cap it at about 1 a day, never in the first days after install, and never on the first open of the day.

### Gaps
- No published retention A/B results for app open ads in puzzle games were found.

## 6. "Remove ads" IAP: price, conversion, rewarded still allowed

### Takeaway
"Remove ads" is the standard first IAP in casual and word games. It is usually a one-time **$2.99–$4.99** purchase, often bundled with hints. It removes forced ads (interstitials and banners) but **keeps opt-in rewarded ads**. Typical overall IAP conversion is about 2–5%.

### Cited Findings
- Meta's games monetization guidance describes "Remove Ads" as a durable purchase that removes interstitials and banners. It turns buyers into identified payers who can then be offered more IAPs, so it is "often the gateway to further spending". — [Meta for Developers: Monetization best practices](https://developers.facebook.com/documentation/games/monetize/best-practices)
- Word game price points:
  - A Word Game: "100 Hints and Remove Ads" $2.99; "200 Hints + Remove Ads" $4.99.
  - WordBubbles: "Remove ads + hints" $2.99.
  - Worder: Remove Ads $9.99.
  - Word Games Master: membership to remove ads, with rewarded videos still giving hints.

  Sources: [App Store: A Word Game](https://apps.apple.com/us/app/-/id1189770320); [App Pricing Lab](https://apppricinglab.com/iap/apple/1189770320); [App Store: Word Games Master](https://apps.apple.com/us/app/-/id1370307771); [App Store: Worder](https://apple.co/2BxrohH)
- Average IAP conversion is about 2–3%, and hybrid-casual titles reach 3–5%. 24% of Gen Z users say they would pay a one-time fee to remove ads. Hybrid-casual revenue splits about 40–50% IAP and 50–60% ads. — (aggregator snippets, low confidence) [AdInMo](https://adinmo.com/?p=24359); [WN Hub](https://wnhub.io/news/analytics/item-2880); [AppsFlyer](https://www.appsflyer.com/open-report/)
- Unity: don't serve interstitials to payers. — [Unity blog](https://unity.com/blog/best-practices-for-maximizing-revenue-from-interstitial-ads-in-your-app)

### Inferences
- Recommended shape: a "Remove ads" non-consumable at about $2.99–$3.99 (localized lower in Tier 3 through Play pricing templates), plus a "Remove ads + N hints" bundle at about $4.99. After purchase, keep rewarded hints available. They are opt-in and still earn revenue.
- Show the offer after the player has seen several interstitials (for example after the 3rd or 5th), not at install.

### Gaps
- No source gave a specific conversion rate for "Remove ads" itself, as opposed to IAP in general.

## 7. AdMob-specific features, mediation, policy and UMP consent

### Takeaway
Use AdMob's built-in frequency caps as a backstop on top of the in-app logic. Add bidding mediation (AppLovin, Meta Audience Network, Unity, Liftoff) once volume allows. Follow the interstitial placement rules strictly. Use a Google-certified CMP (UMP), and optimize the consent message, because consent rate materially moves EEA/UK eCPM.

### Cited Findings
- Frequency capping: you can cap each ad unit per user per minute, hour or day. — [AdMob Help](https://support.google.com/admob/answer/9341964?hl=en)
- Policy pitfalls:
  - Interstitials that appear suddenly during gameplay lead to accidental clicks and are disallowed.
  - No interstitials on app load or exit.
  - No interstitial immediately after another closes.
  - No more than one interstitial per two user actions.
  - Preload ads so they do not appear late.

  Source: [AdMob Help 6201362](https://support.google.com/admob/answer/6201362?hl=en)
- Families: apps in the Designed for Families program can't use app open ads. — [AdMob Help 9341964](https://support.google.com/admob/answer/9341964?hl=en)
- Mediation uplift (vendor and anecdotal):
  - Claims of 40–100% ARPU uplift from moving to hybrid bidding mediation (vendor, low confidence).
  - Shimmer Games: +36% revenue and +9% eCPM from AdMob mediation optimization.
  - One developer's revenue split after adding adapters: AdMob 44%, Unity 15%, Meta 15%, Liftoff 14%, AppLovin 7% (anecdotal forum post).

  Sources: [Segwise](https://segwise.ai/blog/ad-mediation-platform-mobile-apps-games.md); [PPC Land on AdMob bidding updates](https://ppc.land/google-launches-major-admob-mediation-updates-with-new-bidding-partners/); [Solar2D forum](https://forums.solar2d.com/t/admob-mediation-for-ios/357570); AdMob AppLovin adapter docs: [Google Developers](https://developers.google.com/admob/unity/mediation/applovin)
- UMP and consent:
  - Google requires a Google-certified CMP to serve personalized ads in the EEA/UK.
  - Non-personalized ad eCPM is about 0.5–0.7x personalized.
  - A 10-point swing in consent rate reportedly moves eCPM 1.3–2.0x.
  - Raising consent from 60% to 80% reportedly gives about a 10–15% revenue lift in that country.

  Sources (vendor blogs, low confidence): [FlexyConsent](https://flexyconsent.com/blog/consent-impact-mobile-game-ad-revenue/); [Antigravity Lab](https://antigravitylab.net/en/articles/integrations/antigravity-ump-att-consent-rate-weekly-optimization-agent); [CookieScript](https://cookie-script.com/compare/google-certified-vs-non-certified-cmp-the-ad-revenue-impact)

### Inferences
- For a solo developer: (1) use UMP (it is free and certified) and track the consent rate per country; (2) add AdMob bidding partners (AppLovin, Meta, Unity, Liftoff) once DAU reaches the low thousands; (3) set AdMob-side caps a little looser than the in-app rules as a safety net; (4) review the Ad Review Center and block sensitive categories if the audience skews young.
- If the app is not in Designed for Families, still avoid content that appeals to children, or AdMob families/COPPA tagging obligations may apply.

### Gaps
- The AdMob "Families" ad policy and the Ad Review Center pages were not fetched within the call budget. The details of the child-directed treatment tag and of max ad content rating should be checked on the AdMob help pages.
- No primary Google figure was found for UMP consent rates or the size of the non-personalized eCPM discount.

## Overall verdict (inference)
- **Interstitials:** about right to slightly light for free play. Add a new-user grace period first, then test tightening to 1 per 2 puzzles with a 2–2.5 minute cooldown and a per-session cap. Keep the daily puzzle free of forced ads.
- **Rewarded ads:** under-used. Word games lead every genre in rewarded engagement, so add context-sensitive and daily placements (multiplier, daily chest or free-hint timer, rewarded help on the daily puzzle, theme unlocks).
- **Banners and app open ads:** low priority or skip.
- **IAP:** add "Remove ads" at $2.99–$3.99 plus a hint bundle, and keep rewarded ads available after purchase.
- **Infrastructure:** mediation and UMP consent tuning are the biggest "free" revenue levers once traffic exists.
