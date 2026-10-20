# Protect the streak, multiply the reasons to watch

Letter Chain already has the "Wordle layer" of retention: a daily puzzle, streaks, a share card, stats and reminders. The best-evidenced next step is not a big new meta-game. It is making the streak easier to keep and harder to lose, with streak freezes, milestone celebrations and smarter reminders. After that comes a light progression layer that gives free-play sessions a purpose: earned hints from bonus words, a coin economy, a chapter map and date-seeded weekly events. On ads, the current interstitial policy (at most 1 per 3 puzzles, 3 minutes apart, never around the daily) is already at the conservative end of industry practice. It lacks two things: a grace period for new users, and enough rewarded placements. Word games have the highest rewarded-ad engagement of any genre, and Letter Chain offers only one reason to watch. The economics are sobering for a South Asia-heavy audience. With 3 interstitials and 0.5 rewarded views per daily user, ad-only revenue works out to roughly **$80 a month per 1,000 DAU**, against about $1,250 for a US-heavy audience. That makes mediation, consent and audience mix as important as ad frequency. The roadmap at the end therefore puts cheap, client-side retention work and ad hygiene before launch. Coins, archive and events follow in the first two months, and social and paid features come later.

## Letter Chain's daily loop is solid, but the streak is still brittle

Compared with the top titles, Letter Chain's gaps are specific. NYT Games built a habit business on one finite puzzle a day wrapped in streaks and stats, and the portfolio effect is large: **more than 50% of NYT weekly users play several puzzles a day, and over 25% play four or more** ([Creative Review](https://www.creativereview.co.uk/new-york-times-games-wordle-crossplay-design-jonathan-knight/)). Streaks are so central that NYT tracks "streaks broken" per puzzle. One hard word, "corer", ended **5.6 million Wordle streaks** in a single day ([AOL/Yahoo](https://www.aol.com/exclusive-wordle-puzzle-ended-5-013624721.html)). NYT does not appear to offer streak protection. That is a deliberate design choice for a subscription product, and Letter Chain has no reason to copy it.

Duolingo has published the strongest causal evidence on streaks, and every result points the same way: make the streak easier to keep. Letting a single lesson extend the streak raised **D14 retention by 3.3%** and increased the number of learners on a streak by 10.5% ([Duolingo](https://blog.duolingo.com/improving-the-streak)). Milestone animations for new learners added **+1.7% D7 retention**, and letting users hold two streak freezes instead of one added +0.38% daily actives ([Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit)). A streak wager, where users bet in-game currency that they will keep the streak for 7 days, reportedly lifted **D7 retention by 14%** ([Econsultancy](https://econsultancy.com/six-a-b-tests-used-by-duolingo-to-tap-into-habit-forming-behaviour/)). Duolingo's own explanation is loss aversion. Going from a 2-day to a 3-day streak is a 50% gain, while day 200 to 201 barely registers, so the first week needs the most support ([Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit)).

These results come from a language app, not a word game, so the effect sizes for Letter Chain are unknown. The mechanism transfers cleanly, though, and the build cost on top of an existing streak is small. Three changes follow. First, any completed daily should count, with or without hints. Second, give one free freeze, allow up to two to be held, and earn more at milestones or with a rewarded ad. Store the freeze count in Supabase next to the streak so it survives reinstalls. Third, celebrate days 3, 7, 14, 30, 50, 100 and 365. "Repair a broken streak within 24–48 hours by watching an ad" is a common pattern but has no published A/B result. Treat it as a reasonable bet, not a proven lever.

Reminders need the same care. Since Android 13 requires a runtime permission, games have lost **nearly a third of their opted-in users**. Average Android opt-in is now around 60%, though well-run games reach about 76% ([Pushwoosh](https://pushwoosh.com/blog/android-13-opt-in-rates-research)). Google recommends asking in context rather than at first launch ([Android Developers](https://developer.android.com/develop/ui/views/notifications/notification-permission)). Older Airship data shows the stakes: **55% of game users who opted in were retained in month one, against 29% of those who opted out**. That gap is correlational, since engaged players self-select into notifications ([PocketGamer.biz](https://www.pocketgamer.biz/chart-of-the-week-why-getting-players-to-opt-in-to-game-push-notifications-matters/)). Duolingo's notification bandit added **+2% new-user retention** mainly by rotating templates and penalising repeats ([Duolingo Research](https://research.Duolingo.com/papers/yancey.kdd20.pdf)). Duolingo also stops sending reminders after about a month of being ignored ([Taplytics](https://taplytics.com/blog/duolingo-sends-push-notifications-to-let-users-know-they-know-theyre-not-engaging-with-their-reminders)). Letter Chain can capture most of this with local notifications alone:

- Show a soft pre-prompt after the first completed daily.
- Rotate 5–10 templates that mention the day's trending theme, with no repeats within a few days.
- Send one evening "streak at risk" nudge only to players on a streak of 3 days or more.
- Back off after a week of being ignored and stop after about 30 days.

None of this needs a push server.

## Free play needs a reason to continue past the daily

The daily caps engagement at one or two puzzles. Free play is where both the long sessions and the interstitial inventory live. Word-game players are capable of high frequency: GameAnalytics found word games in Europe reaching **up to 7 sessions a day**, and puzzle games have the highest D7 retention of any genre ([GameDevReports](https://gamedevreports.substack.com/p/gameanalytics-benchmarks-in-mobile)). Realistic Android targets for a casual puzzle game are about **D1 28–32%, D7 9–12% and D30 3.5–5%**. These come from AppsFlyer's 2022 breakdown, the last widely published one ([Game Growth Advisor](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-kpis-benchmarks-2026/)). A D1 below about 25% points to an onboarding problem. A steep drop from D1 to D7 points to a missing reason to return.

The cheapest way to deepen the daily is to release both a Classic and a Chain daily every day instead of alternating them, and add a "Next: today's Chain puzzle" button on the results screen. This copies NYT's multi-puzzle habit with no new content systems, since boards are already generated automatically. The streak should still require only one of the two.

Next, give free play a lightweight meta. The top word games share a pattern. Words of Wonders runs recurring weekly "collect" events and a daily reward wheel ([Google Play](https://play.google.com/store/apps/eventdetails/4828223051197758005)). Word Search Explorer, the closest analogue to Letter Chain, promotes themed grids, daily challenges with special rewards, and offline play ([BlueStacks](https://www.bluestacks.com/apps/word/word-search-explorer-on-pc.html)). Royal Match, which led match-3 games at **16.5% D30**, keeps its decoration meta as background progress rather than a second game ([PocketGamer.biz](https://www.pocketgamer.biz/news/77656/dream-games-royal-match-leads-match-3-d30-retention-at-165/); [Cubix](https://www.cubix.co/blog/the-design-decisions-that-made-royal-match-a-top-grossing-game/)). App Annie found that the highest-retaining match-3 games shared "in-game events and foreshadowed content". This is a correlation, not a proven cause.

For Letter Chain, the natural centre of that meta is a soft currency tied to the existing hint system. NYT Strands shows the model: finding three non-theme words earns a hint ([WePC](https://www.wepc.com/news/todays-nyt-strands-hint-answers-clues-for-april-20/)). Every word-search board contains incidental words, so "bonus words earn coins, and coins buy hints" fits naturally. The economy can then feed several things:

- a chapter map built from the existing themes, with the next chapter visible but locked;
- a collection album per theme;
- streak freezes bought with coins;
- eventually a streak wager.

One tension needs an explicit decision. Today players get 3 free hints per puzzle, which probably covers most needs and leaves little demand for rewarded hints. Moving those free hints into coins earned through play, while keeping the rewarded hint, would give hints real value without making the game feel stingier. This is a design judgment, not a sourced finding, so tune it with remote config rather than shipping it blind.

Events do not need a live-ops team. Date-seeded weekly formats can be scheduled in Supabase tables with `pg_cron` handling rollover, for example "collect 30 leaves this week", a 7-board theme pack with a badge, or a holiday week tied to the trending themes. Google Play Promotional Content can then surface these events on the store. In Google's analysis of about 6,000 events, just over half showed a significant uplift, with a **median uplift of 106%** ([Play Console](https://play.google.com/console/about/programs/promotionalcontent/)). Eligibility for small apps is not documented. Real-time competitive races, like Royal Match's 100-player win-streak event, need matchmaking infrastructure and are out of scope for now ([GameDevReports](https://gamedevreports.substack.com/p/liftoff-and-gamerefinery-casual-games)).

## Sharing and competition should stay social, not global

Wordle's growth came from a spoiler-free emoji grid that players invented in a group chat and Wardle then turned into a share button. The game went from **90 players in November 2021 to over 300,000 by January 3, 2022** ([BuzzFeed News](https://www.buzzfeednews.com/article/stefficao/how-wordle-went-viral-strategy)) and passed 2 million by the end of that month ([Smithsonian](https://www.smithsonianmag.com/smart-news/heres-why-the-word-game-wordle-went-viral-180979439/)). No credible K-factor has ever been published. What made it work was the format: a puzzle number, a score and a grid, pasteable as plain text anywhere ([CUNY Pressbooks](https://pressbooks.cuny.edu/inspire/part/the-wordle-effect-how-five-letters-changed-the-internet/)).

Letter Chain's share card is an image. For a WhatsApp-heavy South Asian audience, adding a plain-text version is a quick win, for example `Letter Chain #142 · Chain 🔗 · 🔥12 · Today: 🎬 Oscars`. So is attaching an Android App Link that opens that day's puzzle, or the Play Store if the app is not installed. Play Console's deep-link tooling helps validate those links ([Android Developers Blog](https://android-developers.googleblog.com/2023/11/power-your-growth-on-google-play.html)).

Leaderboards are where solo developers most often over-build. NYT added friends leaderboards in April 2025, capped at 100 invited friends, after years of share-driven virality, and chose not to build global rankings ([GearDiary](https://geardiary.com/2025/05/01/new-york-times-games-app/)). Duolingo's competition uses 30-person weekly cohorts ([Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/leagues)). Global time boards invite cheating: LinkedIn's daily Mini Sudoku accepted a client-reported time, and a single tampered parameter produced a **3-second solve** ([InfoSec Write-ups](https://infosecwriteups.com/beating-linkedins-mini-sudoku-in-3-seconds-a-parameter-tampering-case-study-9261b57873a8)). The right order is:

1. A daily percentile ("faster than 72% of players today"), computed by a Supabase RPC. It feels social, and there is no public board to game.
2. A friends leaderboard with invite codes and row-level security.
3. A global board, built only with server-side timing and word validation.

Google Play also offers cheap discovery levers. Play Games Services achievements matter because games where players earn **5 or more achievements in the first 2 hours** see deeper engagement. Achievements also feed Play Points quests, which gave Hay Day a **177% average install uplift** ([Android Developers Blog](https://android-developers.googleblog.com/2025/06/get-ready-for-next-generation-gameplay-play-games-services.html)). The streak milestones and badges Letter Chain already has map directly onto achievements. The Expo integration needs a config plugin and a development build, and its library status was not verified. The In-App Review API should fire after a positive moment, such as the 3rd–5th completed daily or a 7-day streak. It must never be attached to a button, because its quota means the prompt can silently fail to appear ([Android Developers](https://developer.android.com/guide/playcore/in-app-review)).

## The interstitial policy is already gentle; rewarded ads are under-used

Letter Chain's interstitial rules follow AdMob policy: ads only at natural breaks, never on app load or exit, never back to back, and preloaded ([AdMob Help](https://support.google.com/admob/answer/6201362?hl=en)). They also use the double cap (minimum puzzles and minimum time) that current practitioner guidance recommends ([Felix Braberg](https://felixbraberg.substack.com/p/7-best-practices-for-interstitial)). The missing piece is a new-user grace period. Unity advises placing the first interstitial between level 3 and level 8, and for casual games it suggests waiting much longer ([Unity](https://unity.com/blog/best-practices-for-maximizing-revenue-from-interstitial-ads-in-your-app)). Published tests show what interstitials cost. ZiMAD added day-1 interstitials and gained **+17% revenue, at the cost of 2.5% of D7 retention** ([Unity](https://unity.com/en/resources/zimad-dig-out)). Pomelo Games reported +25% AdMob revenue with "almost no effect on retention" ([Firebase](https://firebase.google.com/use-cases/pomelo-games)). The pattern is consistent: retention damage comes mostly from early, unexpected exposure, not from the steady-state frequency.

The interstitial changes are therefore mostly hygiene:

- No interstitials in the first session, or for roughly the first 5–10 free-play puzzles.
- A per-session cap of about 4–6.
- Reset the cooldown after any rewarded view, so an interstitial never lands on top of a rewarded ad.
- Move every threshold into a Supabase-backed remote config.

After launch, once there is enough traffic, run a two-week test of 1 interstitial per 2 puzzles with a 2–2.5 minute cooldown against the current rule, and watch D1/D7 retention alongside ARPDAU. Keeping the daily free of forced ads is right, because the daily is the habit loop.

Rewarded ads are where the real gap is. Unity's 2024 report found word games have the **highest rewarded engagement of any genre, at 38.4% of DAU**. Context-sensitive placements, shown when players run out of something, reached **38.1% engagement against 23.8% for between-level placements**, and games with 15 or more placements reached up to 46% ([PocketGamer.biz](http://www.pocketgamer.biz/unity-global-rewarded-ad-engagement-rose-by-32-in-2023/)). Unity's top puzzle placements are reward multipliers after a level, a timed free-currency offer on the home screen once or twice a day, and daily or mystery rewards ([Unity](https://unity.com/blog/top-5-rewarded-video-placements-to-boost-puzzle-game-revenue)). Rewarded ads also usually earn 1.5–2x the eCPM of interstitials. Letter Chain has one placement. The retention features above create natural new ones:

- earning or repairing a streak freeze;
- a daily bonus chest;
- a coin doubler on the results screen;
- unlocking an archive puzzle;
- an opt-in "reveal a letter" on the daily.

Each is opt-in, so none adds friction for players who do not want ads.

The other formats are poor fits. Banners earn about 10–20x less per impression than interstitials, and in South Asia almost nothing (under $0.10 eCPM). They would also take screen space from the grid ([Mistplay](https://business.mistplay.com/resources/mobile-ads-ecpm/); [RevenueLab](https://www.revenuelab.fyi/blog/admob-ecpm-benchmarks-2026)). App open ads work best when users open an app more than once every 4 hours. A daily-puzzle game sees one or two opens a day, and the ad would sit directly in front of the ad-free daily ([AdMob Help](https://support.google.com/admob/answer/9341964?hl=en)). Skip both.

## A South Asian audience earns a tenth as much, so revenue levers matter more than ad volume

Geography dominates the revenue picture. US Android rewarded eCPM averaged **$30.25** and interstitial **$16.15** in the first half of 2024 ([GameDevReports/Tenjin](https://gamedevreports.substack.com/p/tenjin-ad-monetization-in-mobile-00b?open=false)). AdMob rewarded eCPM in India runs about **$0.80–1.50** ([CAS.AI](https://cas.ai/?p=11066)). The table below models 3 interstitials and 0.5 rewarded views per DAU at 90% fill. These are planning estimates built from those eCPM bands, not reported figures.

| Audience mix | Interstitial eCPM | Rewarded eCPM | ARPDAU | 1k DAU / month | 10k DAU / month |
|---|---|---|---|---|---|
| South Asia-heavy (~90%) | $0.80 | $1.20 | ~$0.003 | ~$80 | ~$800 |
| Mixed global (~25–30% Tier-1) | $4.00 | $6.00 | ~$0.014 | ~$400 | ~$4,000 |
| US / Tier-1-heavy | $12.00 | $20.00 | ~$0.041 | ~$1,250 | ~$12,500 |

At the top of the market, word search is overwhelmingly ad-funded. Word Search Explorer is estimated at about 95% ad revenue, and Words of Wonders at about 90% ([Felix Braberg](https://felixbraberg.substack.com/p/the-mobile-ad-monetization-newsletter-d5a)). Tightening interstitials therefore matters less than the multipliers on each impression.

Mediation is the first multiplier. AdMob case studies report **+14% to +36% revenue** from adding bidding networks ([Go Rewards](https://admob.google.com/home/resources/go-rewards-achieves-fourteen-percent-revenue-growth-by-adding-new-ad-networks-to-mediation/); [Shimmer Games](https://admob.google.co.in/home/resources/shimmer-games-sees-36-percentage-revenue-growth-with-admob-mediation)). In India and Southeast Asia, InMobi's rewarded eCPM of $1.20–2.50 beats AdMob's ([CAS.AI](https://cas.ai/?p=11066)), so adding a regional bidder suits this audience specifically. Vendor case studies are biased toward success, and lifts will be smaller at low DAU. Consent is the second multiplier: Google requires a certified consent platform for personalised ads in the EEA and UK, and non-personalised ads earn substantially less ([FlexyConsent](https://flexyconsent.com/blog/consent-impact-mobile-game-ad-revenue/), vendor source). The third is audience mix. Localising the store listing and ASO for the US, UK, Canada and Australia shifts revenue more than any frequency change. Waffle reached about 475k DAU and found that press and word of mouth far outperformed paid TikTok, Meta and Google ads ([MobileGamer.biz](https://mobilegamer.biz/daily-word-game-studio-waffle-is-the-latest-small-dev-to-find-a-big-audience)).

A "Remove ads" purchase is the standard first IAP. In the market it is usually a one-time $2.99–4.99 purchase, often bundled with hints ([App Store: A Word Game](https://apps.apple.com/us/app/-/id1189770320)). It removes forced ads while keeping opt-in rewarded ads, and it turns buyers into identified payers ([Meta for Developers](https://developers.facebook.com/documentation/games/monetize/best-practices)). Wordscapes moved its "No Ads" product to a 7–30-day subscription and saw a notable ARPDAU jump ([AdInMo](https://adinmo.com/?p=24295)). That source is a search summary of a page that could not be loaded. For a solo developer, RevenueCat is free up to $2,500 in monthly tracked revenue ([RevenueCat](https://www-docs.revenuecat.com/pricing)), and Play takes 15% ([Google Play Help](https://support.google.com/googleplay/android-developer/answer/112622)). With localised pricing for South Asia, this is a sensible second-month addition. Offer it only after a player has seen several interstitials, never at install.

## Roadmap for a solo developer

Impact ratings are judgments that combine the strength of evidence with expected effect. "Existing Supabase" means a small table or RPC on the current backend, with no new services. The game ships in about three weeks, so the first phase is kept deliberately small.

### Phase 1: now and the launch release (late October 2026)

| Item | Expected impact | Effort | Backend? |
|---|---|---|---|
| New-user interstitial grace period (none in first session / first ~5–10 puzzles), per-session cap of 4–6, cooldown reset after rewarded views | High: protects D1/D7, where the evidence says ad damage concentrates | Low (hours) | No |
| Move ad thresholds, hint counts and caps into remote config | High enabler: makes every later tuning possible without a release | Low | Existing Supabase |
| Retention and ad analytics (D1/D7/D30 cohorts, ARPDAU, rewarded views per DAU, opt-in rate) | High enabler: without it no test can be read | Low–medium | Existing Supabase or a hosted analytics SDK |
| Streak freeze (1 free, hold up to 2, earn at milestones or via rewarded ad) and low-bar streak rules | High: Duolingo +0.38% DAU, plus a new rewarded placement | Low–medium | Existing Supabase (sync the freeze count) |
| Streak milestone celebrations (3/7/14/30/50/100/365) | Medium–high: Duolingo +1.7% D7 for new users | Low | No |
| Contextual notification pre-prompt after first daily, rotating theme-based copy, evening streak-at-risk nudge, back-off rule | Medium–high: recovers Android 13 opt-in losses | Low–medium | No (local notifications) |
| Plain-text emoji share string alongside the image card | Medium: better WhatsApp and SMS virality | Low | No |
| UMP consent form verified for EEA/UK; AdMob-side frequency caps as a backstop | Medium: protects eCPM and policy standing | Low | No |
| In-App Review prompt after 3rd–5th daily or 7-day streak | Medium: store rating drives organic installs | Low | No |

### Phase 2: the next one to two months (November–December 2026)

| Item | Expected impact | Effort | Backend? |
|---|---|---|---|
| Both Classic and Chain dailies every day, with "Next puzzle" CTA | High: copies NYT multi-puzzle depth with no new content pipeline | Low–medium | Existing Supabase |
| AdMob bidding mediation (AppLovin, Meta, Unity, Liftoff, plus InMobi/Pangle for South Asia) | High revenue: +14–36% in case studies, at no cost to the player | Medium (SDK adapters, dev build) | No |
| Coin economy with bonus words earning coins; hints, freezes bought with coins; post-puzzle rewarded coin doubler; daily bonus chest | High: gives free play purpose and adds 2–3 context-sensitive rewarded placements | Medium–high | Existing Supabase (sync balance) |
| Daily archive calendar: last 7 days free, older days unlocked per rewarded ad; archive plays do not count to streak | Medium–high: catch-up for missed days plus rewarded inventory | Medium | Existing Supabase |
| Interstitial frequency A/B test (1 per 2 puzzles, 2–2.5 min vs current), 2+ weeks | Medium revenue: likely +15–25% at small retention cost, if retention holds | Low (once remote config exists) | Existing Supabase |
| "Remove ads" one-time IAP (~$2.99–3.99, localised lower in South Asia) plus hint bundle, rewarded ads kept | Medium: low conversion but near-zero downside; identifies payers | Medium (billing, entitlement, restore) | No, or RevenueCat |
| Daily percentile ("faster than X% today") | Medium: social feel without cheating incentive | Low–medium | Existing Supabase (RPC) |
| Store listing localised for US/UK/CA/AU and Promotional Content submissions for themed events | Medium–high revenue via better audience mix | Low–medium | No |

### Phase 3: later (2027 and beyond)

| Item | Expected impact | Effort | Backend? |
|---|---|---|---|
| Chapter or journey map over existing themes, with locked next chapter and theme collection album | Medium–high: visible progression and foreshadowing | High | Existing Supabase |
| Date-seeded weekly events (collect-token weeks, 7-board theme packs, holiday weeks) via `pg_cron` | Medium–high: recurring reasons to return, no live-ops staff | Medium–high | Existing Supabase plus scheduled jobs |
| Streak wager (bet coins on 7 more days) | Medium–high: Duolingo reported +14% D7; requires coins first | Medium | Existing Supabase |
| Play Games Services v2 achievements mapped to badges and milestones | Medium: Play Points quests and discovery | Medium (config plugin, dev build; library status unverified) | No |
| Friends leaderboard with invite codes and referral reward (one freeze each) | Medium: social pressure without global cheating | Medium–high | New tables, RLS, deep links, assetlinks site |
| Server push for friend activity ("Sam beat your time") | Low–medium | Medium | New: Edge Functions plus FCM |
| Remove-ads subscription or VIP tier, coin packs | Medium revenue at scale | Medium | RevenueCat |
| Global daily leaderboard, weekly 30-person leagues | Low–medium for a casual audience; anti-cheat cost is high | High | Significant: server timing and validation |

Skip banners, app open ads and real-time competitive races unless analytics later make a specific case for them.

## Conclusion

The research shifts the question from "how many ads can Letter Chain show" to "how many reasons can it give players to opt in." Interstitial frequency is a small lever at this audience's eCPMs, and the evidence says it does the most harm when it is aggressive early. Rewarded ads in the genre's most rewarded-friendly category are the larger opportunity. Each retention feature on the roadmap (freezes, coins, chests, archive unlocks) doubles as a new opt-in placement, so retention work and monetization work become the same work. The pairing matters because a South Asia-heavy launch caps ad revenue at tens of dollars per thousand DAU. Until Tier-1 share grows through ASO, mediation and word of mouth, the realistic goal for the first months is retention that compounds, not revenue.

Two uncertainties should shape the first post-launch weeks. First, almost none of the retention evidence is word-game-specific: the Duolingo effect sizes are borrowed, and no top word game publishes retention numbers. Second, the current 3-free-hints rule may be quietly suppressing rewarded demand. Both can only be resolved with Letter Chain's own data. That is why remote config and cohort analytics belong in the launch release, ahead of any feature that looks more exciting.
