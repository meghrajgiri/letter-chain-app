# Monetization benchmarks and revenue economics for ad-supported casual word games (Android, AdMob)

Context: "Letter Chain" is a casual word-search game on Android made by a solo developer. It uses AdMob interstitials and rewarded hints and has no in-app purchases (IAP) yet. Research date: October 2026. Most public benchmark data runs only to 2024–2025. Every number below gives its source year.

Method caveat: two primary PDFs (the Appodeal Q4 2024 eCPM report and the Appodeal Mobile Casual Benchmarks 2025) could not be text-extracted in this environment. Their figures are cited through secondary write-ups that quote them. Treat secondary-aggregator numbers as approximate.

---

## 1. Typical Android eCPMs by format and region (2024–2026)

### Takeaway
On Android, rewarded and interstitial ads in the US earn roughly $10–30 eCPM in mediated game stacks (2024). Europe is around a third to a half of the US. India, South Asia and LatAm earn about $0.30–2. Banners are under $1 almost everywhere. A word game with mostly South Asian traffic earns an order of magnitude less per impression than one with mostly US traffic.

### Cited Findings
- **Tenjin / CAS.AI, Q2 2024 (all game genres, 146B impressions, Jan–Jun 2024), Android averages by format.** Rewarded: US $30.25, Canada $23.13, South Korea $22.01. Interstitial: US $16.15, Canada $12.65, Japan $11.35. Banner: Canada $2.00, US $1.18, Japan $0.86. Android was 63% of the ad revenue in the dataset. Android ad revenue by country: US 30%, Russia 14%, Brazil 6%. — [GameDevReports summary of Tenjin Q2'24](https://gamedevreports.substack.com/p/tenjin-ad-monetization-in-mobile-00b?open=false); [Tenjin Q1'24 summary](https://gamedevreports.substack.com/p/tenjin-ad-monetization-in-mobile)
- **Appodeal Q4 2024 eCPM report (Oct–Dec 2024, 100k+ apps, 70+ networks, 200B+ views).** Top Android interstitial markets: US $14.08, South Korea $11.23, Canada $8.49. Interstitial averages sit somewhat below rewarded video, and iOS eCPMs are slightly above Android overall. — [Appodeal Q4 2024 report page](https://appodeal.com/the-mobile-ecpm-report-updated-q4-2024-view); [Appodeal Q4 2024 PDF](https://appodeal.com/wp-content/uploads/2025/03/Quarterly_Mobile_eCPM_Report_-_Q4_2024.pdf)
- **Regional Android averages (Mistplay/MAF write-up of Appodeal Q4 2024 plus Tapjoy and ironSource data, page dated 2026).** Rewarded on Android: North America $9.20, APAC $8.20, Europe $5.10, Middle East $2.30, LATAM $1.90. On iOS: North America $13.90, Europe $8.80, Middle East $8.40, APAC $7.50, LATAM $3.75. Rewarded, all platforms, by country: US $15.15, UAE $14.55, Australia $13.80, Switzerland $12.20, South Korea $12.00, Japan $10.80, UK $10.65. Interstitial, all platforms: US $12.65, Australia $9.10. Banner: North America $0.55 (Android), Europe $0.20, APAC $0.15; by country, US $0.50 and UK $0.27. — [Mistplay Business: Mobile ads eCPM](https://business.mistplay.com/resources/mobile-ads-ecpm/)
  - *Data-quality flag:* this page lists identical Android figures for rewarded and interstitial (NA $9.20, APAC $8.20, Europe $5.10, LATAM $1.90), which looks like a copy error. The regional ratios (Europe about 55% of NA, LATAM about 20%) are more usable than the absolute values. Its US figures are also much lower than Tenjin's Q2 2024 figures. The two likely differ in sample (all apps versus games) and method.
- **India.** AdMob rewarded video in India earns about $0.80–1.50 eCPM, against $1.20–2.50 for InMobi. India Android eCPMs in general run about $0.30–1.00. Tier-1 AdMob rewarded runs about $8–15. (Undated vendor blog; treat as approximate, about 2024–2025.) — [CAS.AI blog](https://cas.ai/?p=11066)
- **Offerwalls** (not currently relevant): about $400 eCPM average on Android games, with top genres up to $1,500. — [Mistplay Business](https://business.mistplay.com/resources/mobile-ads-ecpm/)

### Inferences
- Working eCPM bands to use for planning (2024–2025, Android, AdMob or a lightly mediated stack). A pure AdMob single-network setup will likely land at the lower end.

  | Region | Rewarded | Interstitial | Banner |
  |---|---|---|---|
  | US / Canada | $10–30 | $8–16 | $0.50–1.20 |
  | Western Europe / UK / Australia | $5–11 | $4–9 | $0.20–0.30 |
  | India / South Asia | $0.80–1.50 | ~$0.30–1.00 | <$0.10 (est.) |
  | LATAM / rest of world | ~$1–2.50 | ~$1–2 | ~$0.10 |

- Rewarded eCPM is usually 1.5–2x interstitial eCPM, but rewarded impressions per user are lower. So interstitials usually carry more total revenue in word and puzzle games (see the impressions data in section 2).
- A South Asia-based solo developer's organic Android audience is likely skewed toward India and Nepal. That alone can mean an effective eCPM 10–20x below US benchmarks.

### Gaps
- No reliable 2024–2026 public figure was found for **app-open ad** eCPMs on Android, by region.
- No word-game-specific eCPM breakdown was found. Genre-level eCPM data in these reports is "games" or "puzzle" at best.
- Full country tables for Germany, the UK, India and Brazil on Android were in the Appodeal and Tenjin PDFs but could not be extracted.

---

## 2. ARPDAU benchmarks, impressions per DAU and LTV for casual puzzle and word games

### Takeaway
Ad-only casual puzzle games typically earn about $0.01–0.05 ARPDAU. Hybrid games (IAP plus ads) earn about $0.10–0.30. Top hybrid word games earn about $0.10 or more (Wordscapes, roughly 2024–2025 estimates). Puzzle games in the US show very high interstitial and banner volumes per user.

### Cited Findings
- Casual and puzzle ARPDAU is typically $0.03–0.10. The genre is "hybrid territory" where both ads and IAP matter. Fewer than 5% of mobile gamers ever pay (AppsFlyer 2024). (Article dated June 2026.) — [Juego Studio: ARPDAU benchmarks by genre](https://www.juegostudio.com/blog/arpdau-benchmarks-by-game-genre)
- Casual games typically see $0.01–0.05 ARPDAU for ad-based models and $0.10–0.25 for IAP-focused models (glossary benchmark, undated). Another summary gives casual and hyper-casual at $0.10–0.30 combining IAP and ads (2026). — [Juego Studio](https://www.juegostudio.com/blog/arpdau-benchmarks-by-game-genre); search-result summaries of [AppSamurai](https://appsamurai.com/glossary/arpdau/) and [Tenjin](https://tenjin.com/glossary/average-revenue-per-daily-active-user-arpdau/) glossaries (lower confidence)
- **Appodeal Mobile Casual Benchmarks Report 2025** (Appodeal Publishing; data June 2024 – January 2025; 10,000+ casual games; Android, US users):
  - Ad impressions per user. Interstitials: Puzzle 72.5, Match 36.5. Rewarded video: Puzzle 23.4, Match 39.1, Merge-3 101.5, Idle 73.2. Banners: Puzzle 241.5, Match 114.3.
  - ARPU by subgenre: hypercasual $0.86, Match $2.99, Running $2.34, Party $4.90, Merge-3 $14.83, Luck Battle $12.23.
  - — [App Developer Magazine summary](https://appdevelopermagazine.com/mobile-casual-benchmarks-report-2025/amp/); [report PDF](https://files.gameindustrylibrary.com/documents/mobile-casual-benchmarks-report-2025.pdf)
- IAP-side reference points (2025, match-3 and merge): Gossip Harbor IAP ARPDAU $0.31, Royal Match $0.17, Candy Crush Saga $0.11. — [Naavik](https://naavik.co/digest/what-leading-match-3-and-merge-games-do-differently/) (via search summary)
- Wordscapes: DAU has declined gradually since 2023, but revenue held nearly steady thanks to ARPDAU gains of about 20% year on year. A jump in Q4 2023 is attributed to converting "No Ads" from a lifetime IAP to a 7–30-day subscription (Sensor Tower-based analysis, about 2024). — [AdInMo: Beyond Banner Ads Part 3 (Wordscapes)](https://adinmo.com/?p=24295) (search summary; the page returned HTTP 525 on fetch)

### Inferences
- The Appodeal "per user" impression counts are per *user over the observation window*, not per day. They show that puzzle players tolerate heavy interstitial and banner exposure: about 3x as many interstitials as rewarded.
- For a word-search game, a realistic daily frequency is about 2–5 interstitials and 0.3–1 rewarded per DAU. This depends on how many puzzles a session contains and on frequency caps. (This is an estimate; no word-game-specific per-DAU figure was found.)
- The $0.03–0.10 casual ARPDAU band assumes a Tier-1-weighted audience. A South Asia-heavy ad-only audience will likely sit well under $0.01 (see section 4).

### Gaps
- No published 2024–2026 **LTV** benchmark specifically for word games was found. Appodeal's subgenre ARPU (for example $2.99 for match games, US Android) is the closest proxy.
- No public per-DAU impression benchmark specific to word games was found.

---

## 3. How word-game economics work: ads versus IAP at the top titles

### Takeaway
Word games are among the most ad-heavy casual genres. Words of Wonders and Word Search Explorer get about 90–95% of revenue from ads. Wordscapes is a genuine hybrid at about 55% ads, 45% IAP. All figures are analyst estimates from 2025.

### Cited Findings
- **Wordscapes** (PeopleFun, published by AppLovin): about $226,000 per day in revenue, about 55% from ads (hybrid IAA plus IAP). Estimate from April 2025. — [Felix Braberg, Mobile Ad Monetization Newsletter, Apr 25, 2025](https://felixbraberg.substack.com/p/the-mobile-ad-monetization-newsletter-d5a)
  - DAU: "over 2M DAU" per Sensor Tower estimates, and consistently top-three among App Store word games (about 2024). — [AdInMo](https://adinmo.com/?p=24295). *Conflict:* a lower-quality source claims about 10M DAU (Q3 2025). — [Crosswordle blog](https://crosswordle.com/blog/word-game-state-of-play-2025)
- **Words of Wonders** (Fugo): about $100,000 per day, about 90% from ads (2025 estimate). — [Felix Braberg, Apr 2025](https://felixbraberg.substack.com/p/the-mobile-ad-monetization-newsletter-d5a). Hybrid model of ads, coin and hint IAP, and a subscription option; about 28M weekly active users (Q2 2024). — [Sensor Tower blog listings via search summary](https://sensortower.com/blog/2025-q1-android-top-5-word%20puzzle%20games-revenue-rs-603697f4241bc16eb8570d37)
- **Word Search Explorer** (the closest analogue to Letter Chain): 9.1M downloads in 30 days (1.4M US); 2.8M active users (780k US); about $200k IAP revenue per 30 days; an *estimated* about $200k per day in ad revenue, so about 95% ad-monetized. Ad placements: interstitials between levels, banners at the bottom from level 10 onward, and rewarded ads (April 2025). — [Felix Braberg, Apr 2025](https://felixbraberg.substack.com/p/the-mobile-ad-monetization-newsletter-d5a)
- Word-game market split claimed at about 88% ads ($2.97B ads, $0.38B IAP, 2026 projection). — [Crosswordle "Word Game Quick Data Report 2025"](https://crosswordle.com/blog/word-game-state-of-play-2025). *Low confidence:* this is a projection from a small publisher's blog, and its country figures (US $2.65B) look internally inconsistent.
- The "No Ads" subscription has become a common first IAP for ad-based games, following the Wordscapes example (about 2024). — [AdInMo](https://adinmo.com/?p=24295)

### Inferences
- Implied Wordscapes ARPDAU is about $226k / 2M+ DAU, or around $0.10 or less. This is consistent with the hybrid band.
- Word Search Explorer's implied ad revenue per *active user* is about $0.07 per day, if "active users" means DAU. If it means MAU, the figure is much lower. The source is ambiguous, so treat this as an upper-bound sanity check for a US-heavy, well-tuned, mediated stack at scale.
- Takeaway for Letter Chain: the word-search subgenre is predominantly ad-monetized even at the top. IAP is an add-on (mainly no-ads and hints), not the core.

### Gaps
- No primary Sensor Tower or AppMagic page with exact ads/IAP splits was fetched. The splits come from a newsletter analyst's estimates.

---

## 4. Rough revenue for a solo-dev game at 1k, 10k and 100k DAU (worked examples)

### Takeaway
Ad-only revenue depends mostly on where your users are. At 10k DAU, plan for roughly $900 a month with a South Asia-heavy audience, about $4,500 with a mixed global audience, and about $14k with a US-heavy audience. Every figure is an estimate built from the eCPM bands above.

### Cited Findings (inputs)
- eCPM inputs come from the section 1 sources: US Android interstitial $14–16 and rewarded about $15–30 (Appodeal Q4 2024; Tenjin Q2 2024). India rewarded $0.80–1.50 and India Android general $0.30–1.00 (CAS.AI). Europe about 55% of North America (Mistplay/Appodeal).
- Anecdotal cross-check: a word app with about 10,000 DAU reportedly made about $6,700 a month (about $0.022 ARPDAU). This comes from a search-result summary of AdMob or marketplace material, not verified. — [Flippa listing (Worde: Daily & Unlimited, sold)](https://flippa.com/11626847); a fetch of the page did not show the metrics, so treat this as unverified.
- Google Play's fee on IAP and subscriptions is 15% on the first $1M a year (enrolled developers) and 15% on all auto-renewing subscriptions. Ad revenue is not subject to the Play fee. — [Google Play Console Help](https://support.google.com/googleplay/android-developer/answer/112622)

### Inferences (worked model; all assumptions explicit)
Daily ad load per DAU: **3 interstitials and 0.5 rewarded**, no banner, about 90% fill. ARPDAU = Σ(impressions × eCPM / 1000) × fill.

| Scenario | Interstitial eCPM | Rewarded eCPM | ARPDAU | 1k DAU / mo | 10k DAU / mo | 100k DAU / mo |
|---|---|---|---|---|---|---|
| A. South Asia-heavy (India, Nepal, Bangladesh, about 90%) | $0.80 | $1.20 | ~$0.0027 | ~$80 | ~$800 | ~$8,000 |
| B. Mixed global (~25–30% Tier-1, rest ROW) | $4.00 | $6.00 | ~$0.0135 | ~$400 | ~$4,000 | ~$40,000 |
| C. US/Tier-1-heavy (organic US, or paid UA in the US) | $12.00 | $20.00 | ~$0.041 | ~$1,250 | ~$12,500 | ~$125,000 |

- Adding a bottom banner at about 30 impressions per DAU (Appodeal shows puzzle players see many banners) adds about $0.015 per DAU per day in the US at $0.50, and about $0.002 in India at under $0.10. That is meaningful only for Tier-1 traffic.
- The anecdotal $0.022 ARPDAU (10k DAU, $6.7k a month) falls between scenarios B and C. That is plausible for a word app with meaningful US share.
- **DAU is the hard part.** For context, 10k DAU at about 15% D30 retention needs a steady inflow of thousands of installs a day. Organic installs are the realistic route for a solo developer. Waffle, a viral word game, reached about 475k DAU and found press and word of mouth far more effective than paid TikTok, Meta or Google ads (2024). — [MobileGamer.biz](https://mobilegamer.biz/daily-word-game-studio-waffle-is-the-latest-small-dev-to-find-a-big-audience)

### Gaps
- No verified solo-dev word-game revenue at a known DAU and country mix was found. The worked model is synthesized, not reported.

---

## 5. Hybrid monetization trends and cheap-to-build IAP

### Takeaway
The most common first IAP in ad-based puzzle and word games is a **remove-ads** product, increasingly sold as a subscription. Next come hint and coin packs, a "skip rewarded ads" or VIP pass, and piggy banks ($1.99–14.99). For an Expo app, RevenueCat is free up to $2,500 in monthly tracked revenue, then 1%.

### Cited Findings
- Wordscapes switched "No Ads" from a lifetime purchase to a recurring 7–30-day subscription. The result was a "prominent ARPDAU jump" in Q4 2023, and it became the favorite first IAP for ad-based games. — [AdInMo](https://adinmo.com/?p=24295) (search summary)
- In Mob Control, *any* IAP, including a subscription, removes interstitials and banners. It also sells a "Skip'it" subscription that grants rewarded-ad rewards without watching the ads. Scaling piggy banks ($1.99–$14.99) are among the pricing experiments (2025). — [AppMagic Top-10 Hybrid-Casual Q1'25 via GameDevReports / Mobidictum](https://gamedevreports.substack.com/p/appmagic-top-10-hybridcasual-games); [Mobidictum](https://mobidictum.com/hybrid-casual-puzzle-games-q1-2025/)
- The top 10 hybrid-casual games made $87M in net IAP revenue in Q1 2025, up 67% year on year. Puzzle was 48% of that, led by Block Puzzle (71% of puzzle revenue), then Screw (20%) and Sort (9%). — [AppMagic via search summary](https://gamedevreports.substack.com/p/appmagic-top-10-hybridcasual-games)
- RevenueCat: free up to $2,500 in monthly tracked revenue (MTR), then 1% of MTR. MTR is gross revenue before store fees. — [RevenueCat pricing](https://www-docs.revenuecat.com/pricing); [MetaCTO analysis](https://www.metacto.com/blogs/the-real-cost-of-revenuecat-what-app-publishers-need-to-know)
- Play takes 15% of subscription revenue, and 15% of all IAP up to $1M a year. — [Google Play Help](https://support.google.com/googleplay/android-developer/answer/112622)

### Inferences
- Cheapest to build, in rough order of effort (my judgment, not sourced):
  1. **Remove ads, one-time non-consumable** (about $2.99–4.99). It needs one product, a stored entitlement, a restore-purchases flow, and gating of interstitial and banner calls. Rewarded hints can stay opt-in.
  2. **Hint packs (consumables)**, which reuse the existing hint economy.
  3. **Remove-ads or VIP subscription**: higher LTV (Wordscapes precedent) but needs entitlement checks and expiry handling. RevenueCat removes most server-side receipt work.
  4. **Piggy bank**: a coin counter that fills from play and is unlocked by a purchase. It needs a currency economy first.
- For React Native or Expo, the options are `react-native-purchases` (RevenueCat), `expo-iap` or `react-native-iap`. All need a development build, not Expo Go. Verify current package names and APIs against the docs for the SDK version in package.json (per the project's AGENTS.md). Not researched here.
- With Play's 15% and RevenueCat's 0% under $2.5k MTR, a solo developer keeps about 85% of IAP gross.

### Gaps
- No public conversion-rate benchmark for "remove ads" purchases in word games was found.
- No current docs for expo-iap, react-native-iap or RevenueCat on the user's Expo SDK version were fetched.

---

## 6. Levers that raise ad revenue without adding more ads

### Takeaway
The biggest non-volume levers are: (1) mediation with real-time bidding, typically +10–35% revenue in case studies; (2) a well-designed consent flow in the EEA, since personalized ads earn about 2–3x non-personalized ones; (3) the user geography mix, which swings eCPM 10–20x; (4) placing rewarded ads where players actually want them.

### Cited Findings
- **Mediation and bidding (AdMob case studies, vendor-published, 2023–2025):**
  - Concrete Software: total ad revenue +29% year on year with AdMob Mediation using hybrid bidding plus waterfall and preloading. +62% average ARPDAU on iOS titles; +13% D1 retention on its biggest title. — [AdMob case study](https://admob.google.com/home/resources/concrete-software-increases-total-ad-revenue-yoy-by-twenty-nine-percent-using-admob-mediation/)
  - Go Rewards: added three networks, two of them SDK bidders, for +14% revenue and +15% eCPM. — [AdMob case study](https://admob.google.com/home/resources/go-rewards-achieves-fourteen-percent-revenue-growth-by-adding-new-ad-networks-to-mediation/)
  - Gamegou: +15% revenue and +12% eCPM against a competing platform in an A/B test. — [AdMob case study](https://admob.google.co.in/home/resources/gamegou-boosts-revenue-using-admob-as-a-mediation-platform/)
  - Shimmer Games: +36% revenue with AdMob mediation. — [AdMob case study](https://admob.google.co.in/home/resources/shimmer-games-sees-36-percentage-revenue-growth-with-admob-mediation)
  - Mediation can lift revenue 30–35% over the AdMob network alone (AdMob indie success story, via search summary). — [AdMob success story](https://admob.google.com/home/resources/indie-game-developer-turns-hobby-into-income-with-admob/)
  - In India and Southeast Asia, InMobi's rewarded eCPM ($1.20–2.50) beat AdMob's ($0.80–1.50). In Tier-1, AdMob leads ($8–15 against $3–6). This argues for adding regional bidders in South Asia. — [CAS.AI](https://cas.ai/?p=11066)
  - AppLovin MAX first-price auctions push higher rewarded and interstitial eCPMs in Tier-1. Running AdMob and MAX together in one mediation layer is recommended over picking one. — [Segwise / search summary](https://segwise.ai/blog/ad-mediation-platform-mobile-apps-games.md)
- **Consent (UMP / GDPR / TCF):**
  - Personalized ads typically earn about 2–3x the eCPM of non-personalized ads. A poor consent flow can cut programmatic revenue by 30–50% in GDPR markets. Google requires a TCF-registered consent platform (CMP) for personalized ads in the EEA. — [FlexyConsent blog](https://flexyconsent.com/blog/consent-impact-mobile-game-ad-revenue/) (vendor; directional)
  - Unrestricted ads show 167% higher eCPM than restricted ones. Consented US users generate about 50% more ad revenue. — [Usercentrics](https://usercentrics.com/ad-revenue-loss-calculator/) (CMP vendor; directional)
- **Geography / UA.** The US alone was 30% of Android game ad revenue in Q2 2024 (Tenjin). US Android rewarded eCPM is about 20–30x India's (sections 1 and 4). Paid UA was much less effective than organic PR for Waffle (2024). — [Tenjin via GameDevReports](https://gamedevreports.substack.com/p/tenjin-ad-monetization-in-mobile-00b?open=false); [MobileGamer.biz](https://mobilegamer.biz/daily-word-game-studio-waffle-is-the-latest-small-dev-to-find-a-big-audience)

### Inferences
- For Letter Chain, ranked by likely ROI for a solo developer:
  1. Turn on AdMob bidding partners (for example AppLovin, Meta Audience Network, Unity/ironSource, InMobi, Liftoff/Vungle, Pangle) in AdMob mediation. Expect a +10–30% lift.
  2. Make sure the UMP form is shown and well designed in the EEA and UK.
  3. Put rewarded ads at high-intent moments, such as a hint when stuck, a coin doubler at level end, or a daily-puzzle retry. Rewarded impressions are about 1.5–2x the value of an interstitial and also help retention.
  4. Localize the store listing and ASO for Tier-1 English markets (US, UK, Canada, Australia) to shift the organic mix.
  5. Add a remove-ads IAP. Paying users are usually your most engaged, so the lost ad revenue is offset by the IAP.
- Vendor case studies are selection-biased toward success. Expect smaller lifts at low DAU, because bidders have less data and the fixed SDK overhead is the same.

### Gaps
- No independent, non-vendor 2024–2026 dataset on UMP **consent rates** (the percentage who accept) for games was found. Forum threads exist but give no reliable aggregates.
- No public benchmark for rewarded "engagement rate" (the share of DAU who watch at least one rewarded ad) in puzzle games was found.

---

## 7. What indie and solo developers report (anecdotal)

### Takeaway
Solo word-game success stories exist but are rare. Revenue scales with DAU and US share, and most hobby releases stay small. Public, verifiable figures are scarce.

### Cited Findings (anecdotal; mark accordingly)
- **Waffle** (James Robinson, 2022): built over two weekends. It reached about 400k DAU soon after launch and about 475k DAU by 2024. It added ads in summer 2022, and ad revenue became enough to fund full-time work, then grew to about 10 staff. Paid UA (TikTok, Meta, Google Ads) did not compare to early PR spikes. — [MobileGamer.biz (2024)](https://mobilegamer.biz/daily-word-game-studio-waffle-is-the-latest-small-dev-to-find-a-big-audience)
- **Lexathon** (William Ferguson, word puzzle): 500k+ downloads, about 10 minutes a day average use, with AdMob providing about 15% of his income (an older AdMob success story, pre-2023). — [AdMob success story](https://admob.google.com/home/resources/indie-game-developer-turns-hobby-into-income-with-admob/)
- A word app with about 10k DAU reportedly made about $6,700 a month. The source surfaced via a search summary, possibly a Flippa sale listing for "Worde: Daily & Unlimited", and is unverified. — [Flippa](https://flippa.com/11626847)

### Inferences
- These anecdotes line up with the scenario model in section 4: tens of thousands of DAU with Tier-1 share are needed for "full-time income" (about $3–10k a month).

### Gaps
- Searches for Reddit (r/gamedev, r/androiddev) and Indie Hackers posts with concrete word-game AdMob figures returned nothing usable in this pass. There is no verified Reddit data point.
- Liftoff, Unity/ironSource and GameAnalytics 2025 casual reports were not reached within the tool budget.
