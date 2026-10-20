# Daily-Habit, Social and Viral Loop Design for Daily Word Puzzles (Letter Chain)

Scope: what makes daily puzzles sticky and viral, with evidence, filtered for a solo Android developer using Supabase. Research date: Oct 2026. Notes on source quality: several search hits for NYT figures were low-quality SEO/spam sites; those have been excluded. Only primary or reputable secondary sources are cited below.

## 1. How the NYT Games bundle drives daily habit (streaks, stats, share grid, archive, hints, cross-promo) and published engagement numbers

### Takeaway
NYT's habit engine is one finite, human-edited puzzle per day per game, wrapped in streaks and stats, plus a portfolio that makes playing several games a day routine (50%+ of weekly users play several puzzles a day). Later additions are paid archives (Wordle 2024, Strands 2025) and friends leaderboards (April 2025). Scale: 11.1B puzzle plays in 2024 and 11.2B in 2025.

### Cited Findings
**Engagement numbers**
- 2024: 11.1 billion puzzles solved. Wordle had 5.3B plays, Connections 3.3B, Mini 2.1B and Strands 1.3B — [Wikipedia: The New York Times Games](https://en.wikipedia.org/wiki/The_New_York_Times_Games); also [AOL/Yahoo exclusive on 2024 Wordle data](https://www.aol.com/exclusive-wordle-puzzle-ended-5-013624721.html)
- Last year (2025): 11.2 billion puzzles completed. Wordle had 4.2B plays in its fifth-anniversary year. The Mini, Connections and Strands each had more than 1B — [Creative Review, interview with Jonathan Knight](https://www.creativereview.co.uk/new-york-times-games-wordle-crossplay-design-jonathan-knight/). (Wordle went from 5.3B to about 4.2B year over year, a decline. The total stayed flat because other games grew.)
- **Cross-play depth: "50%+ of weekly users play multiple puzzles daily", and "25%+ play four or more puzzles daily"** — [Creative Review](https://www.creativereview.co.uk/new-york-times-games-wordle-crossplay-design-jonathan-knight/)
- Daily active users of the NYT Games app tripled from 886k (Oct 2022) to more than 2.6M (2023). There were more than 10M daily players across platforms in 2024 — [Wikipedia](https://en.wikipedia.org/wiki/The_New_York_Times_Games)
- Wordle brought "an unprecedented tens of millions of new users" to NYT and the "best quarter ever for net subscriber additions to Games" (Q1 2022). NYT bought Wordle in Jan 2022 for a "low seven figures" sum. A Games subscription costs $5/mo or $40/yr — [TechCrunch, May 2022](https://techcrunch.com/2022/05/04/wordle-new-york-times-user-growth)
- Since the Wordle purchase, NYT Games traffic is up 10x (about 8B games played in 2023, per Axios via TechCrunch) — [TechCrunch, Aug 2023](https://techcrunch.com/2023/08/28/connections-is-the-new-york-times-most-played-game-after-wordle)

**Streaks**
- Streaks matter enough that NYT tracks "streaks broken" per puzzle. On Oct 15, 2024, the word "corer" ended 5.6 million Wordle streaks. 2.8M people used the same starting word every day — [AOL/Yahoo](https://www.aol.com/exclusive-wordle-puzzle-ended-5-013624721.html)
- No published evidence was found that NYT offers a streak freeze or streak protection. Its streaks appear to be strict. See Gaps.

**Cross-promotion and soft launch**
- Connections launched in beta (June 2023) and could only be found through search or the menus of other games. It was still "an instant hit, with millions of people playing it weekly". It became the second most-played game and the most successful in-house launch since the Mini (2014). About 9 in 10 players finish the puzzle — [TechCrunch](https://techcrunch.com/2023/08/28/connections-is-the-new-york-times-most-played-game-after-wordle)
- Knight credits the human-made, editorial quality: "the puzzle-constructor going up against them everyday and trying to outwit them" — [TechCrunch](https://techcrunch.com/2023/08/28/connections-is-the-new-york-times-most-played-game-after-wordle)

**Archives**
- Wordle Archive (announced May 2024) gives Games and All Access subscribers more than 1,000 past puzzles through a calendar going back to June 2021. Progress is saved and archive results can be shared. Free users don't get it. WordleBot (post-game analysis) was added to the app at the same time — [TechCrunch, May 2024](https://techcrunch.com/2024/05/07/nyt-games-wordle-archive-access-1000-past-puzzles); [Tom's Guide](https://www.tomsguide.com/gaming/nyt-games-rolling-out-wordle-archive-with-access-to-over-1000-puzzles)
- Strands Archive was introduced in Sept 2025. The Mini moved behind the subscription by end of Aug 2025 — [Wikipedia](https://en.wikipedia.org/wiki/The_New_York_Times_Games)

**Leaderboards (social layer, 2025)**
- A multi-game friends leaderboard rolled out on April 22, 2025, covering the Mini, Spelling Bee, Wordle and Connections. Players can add up to 100 friends by invite. Celebrity puzzlers could be added to leaderboards for a limited window (from May 8 to May 11, 2025) — [GearDiary](https://geardiary.com/2025/05/01/new-york-times-games-app/) (via search snippet; the page returned 403 on fetch); [NYT Help Center: Games app](https://thenewyorktimeshelpcenter.helpjuice.com/360011158491-New-York-Times-Games/360052273251-The-New-York-Times-Games-app)
- NYT launched a two-player game, Crossplay, as a separate app in Jan 2026. It passed 1M downloads — [Fox10](https://www.fox10phoenix.com/news/new-york-times-crossplay-multiplayer-game); [PocketGamer.biz](https://www.pocketgamer.biz/nyt-games-multiplayer-word-game-crossplay-surpasses-one-million-downloads)

**Strands hints**
- In Strands, finding 3 non-theme words (4+ letters) earns one hint. A hint highlights the letters of a theme word without saying which word it is, so players still have to work out the order. Hints are earned through play, not bought — [WePC Strands guide](https://www.wepc.com/news/todays-nyt-strands-hint-answers-clues-for-april-20/) (secondary guide site; the mechanic is widely documented but I did not fetch an NYT primary source)

### Inferences
- Letter Chain already has the core NYT loop (daily puzzle, streak, share card, reminders). The biggest unexploited NYT lever is **portfolio and multi-puzzle depth**: 50%+ of NYT weekly users play several puzzles a day. Letter Chain can copy this by releasing **both** Classic and Chain dailies every day, instead of alternating them, and adding a "Next: today's Chain puzzle →" CTA on the results screen.
- Earned hints like Strands' (find bonus or non-theme words to earn a hint) fit word search naturally. Every board has incidental words. They also live alongside rewarded-ad hints: earn one by skill, or watch an ad for another.
- NYT holds archives back as a paid perk. For an ad-supported solo app, the equivalent is unlocking past dailies with a rewarded ad, or keeping the last 7 days free.
- NYT added friend leaderboards only after years of share-grid virality. Friends-only leaderboards seem to suit daily puzzles better than global ones (see section 3).

### Gaps
- No primary NYT source was found on streak-protection mechanics. NYT does not appear to offer a streak freeze.
- No published NYT numbers were found on how the share grid, leaderboards, or cross-promo CTAs affect retention.
- No DAU or retention data was published for Strands specifically. A "12M MAU" claim appeared only on spam domains and was excluded.

## 2. Streak mechanics evidence (Duolingo streak freeze, streak saver, notifications) and transfer to games

### Takeaway
Duolingo's published A/B results show that making the streak **easier to keep** pays off. Separating the streak from the daily goal raised D14 retention by 3.3%. Equipping 2 freezes added +0.38% DAU. A streak wager added +14% D7 retention. Milestone animations added +1.7% D7 retention. For notifications, a bandit that picks among templates while penalising repetition added +0.5% DAU and +2% new-user retention. Reminders are wound down when they are ignored.

### Cited Findings
- Letting one lesson extend the streak (separating it from the daily XP goal) gave **+3.3% D14 retention**, +1% DAU, and +10.5% learners on a streak. New learners on a streak rose 19%. After a year, just over half of daily learners had a 7+ day streak, up from about a third — [Duolingo blog: Improving the streak](https://blog.duolingo.com/improving-the-streak)
- Learners on a 7-day streak were 2.4x more likely to come back the next day — [Duolingo blog: Improving the streak](https://blog.duolingo.com/improving-the-streak)
- Letting learners equip **up to two Streak Freezes** at once gave **+0.38% active learners**. New milestone animations gave +1.7% 7-day retention for new learners. More than 6M people were on a 7+ day streak. 7-day streakers were 3.6x more likely to finish their course (Jan 2022) — [Duolingo blog: How the streak builds habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
- Psychology of streaks: going from 2 to 3 days is a 50% increase, and 200 to 201 is 0.5%. Loss aversion grows with streak length, so early days need the most support — [Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
- **Streak Wager** (bet gems on keeping the streak 7 more days, win double): significant gains in D1, D7 and D14 retention, **D7 +14%** — [Econsultancy: six Duolingo A/B tests](https://econsultancy.com/six-a-b-tests-used-by-duolingo-to-tap-into-habit-forming-behaviour/)
- Duolingo has run 600+ streak experiments in 4 years, and the streak is its biggest growth lever. The PM's core lesson is "test everything" — [Lenny's Newsletter / Podcast with Jackson Shuttleworth](https://www.lennysnewsletter.com/p/behind-the-product-duolingo-streaks)
- Notifications: the "Recovering Difference Softmax" bandit (KDD 2020) picks reminder templates per user and penalises recently used templates (novelty decay). Result: **+0.5% total DAU, +2% new-user retention** over a strong baseline. The training data was 200M notifications over 35 days, with conversion counted within 2 hours — [Duolingo Research, Yancey & Settles KDD'20](https://research.Duolingo.com/papers/yancey.kdd20.pdf); [Papers with Code](https://paperswithcode.com/paper/a-sleeping-recovering-bandit-algorithm-for)
- Template effectiveness varies by audience: "Time for [language]" works for Chinese learners but not English learners. The same reminder is spaced out using a forgetting curve to avoid fatigue — [Duolingo blog: Hi, it's Duo](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/)
- After about a month of inactivity, Duolingo sends a final message ("These reminders don't seem to be working. We'll stop sending them for now") and stops reminders — [Taplytics](https://taplytics.com/blog/duolingo-sends-push-notifications-to-let-users-know-they-know-theyre-not-engaging-with-their-reminders)

### Inferences (transfer to Letter Chain)
- **Low bar to keep the streak**: any completed daily (Classic or Chain) should count. Avoid requiring hint-free wins or a time target.
- **Streak freeze**: give 1 free freeze, let players hold up to 2, and earn more at milestones (7, 30 days) or via a rewarded ad. Store `freezes_available` and `streak_last_date` in Supabase so the streak survives reinstalls, with sign-in for cloud sync. The "repair a broken streak within 24-48h by watching an ad" pattern is common, but I found no published A/B result for it.
- **Milestone celebrations** at 3, 7, 14, 30, 50, 100 and 365 days: cheap to build and backed by Duolingo's +1.7% D7 retention.
- **Notifications**: rotate 5-10 reminder templates, including trending-theme copy ("Today's theme: ⚽ Champions League"), and avoid repeating the same one. Add a streak-at-risk reminder in the evening. Stop after about 2-4 weeks of being ignored. A lightweight bandit is overkill; random rotation plus a "no repeat within N days" rule captures most of the novelty benefit.

### Gaps
- Duolingo has not published effect sizes for the standalone streak freeze launch, streak repair, or the iOS/Android widget. Lenny's transcript excerpt had no numbers.
- No published A/B evidence was found on streak mechanics in word or puzzle games specifically. The transfer from Duolingo is by analogy.

## 3. Leaderboards: global vs friends vs daily-time; retention effect and cheating/abuse

### Takeaway
The best-documented examples are **small-cohort or friends** leaderboards: Duolingo's weekly 30-person leagues and NYT's friends leaderboards (2025). Global time leaderboards for a daily puzzle are easy to cheat when the client submits its own solve time. They need server-side validation or should be limited to friends.

### Cited Findings
- Duolingo leagues: weekly leaderboard; learners matched by similar study habits and time zone; resets Sunday; 10 tiers (expanded from 5 to make Diamond a bigger achievement). Testing in 2018 showed "a little competition worked for a lot of learners" (no numbers given) — [Duolingo blog: Leagues & leaderboards](https://blog.duolingo.com/duolingo-leagues-leaderboards/)
- League cohort size is 30 users — [Deconstructor of Fun: Duolingo leagues](https://duolingo.deconstructoroffun.com/mechanics/leagues); [nogood.io case study](https://nogood.io/blog/duolingo-case-study/)
- NYT chose **friends** (up to 100, invite-based), not global rankings, for its 2025 leaderboards — [GearDiary](https://geardiary.com/2025/05/01/new-york-times-games-app/)
- Cheating case: LinkedIn's daily Mini Sudoku accepted a client-supplied completion time. Changing one parameter submitted a 3-second solve for a puzzle that takes 1-3 minutes — [InfoSec Write-ups](https://infosecwriteups.com/beating-linkedins-mini-sudoku-in-3-seconds-a-parameter-tampering-case-study-9261b57873a8)
- Mitigations: validate on the server against the achievable maximum; replay or re-simulate top entries; rate-limit and sanity-check — [Bugnet](https://bugnet.io/blog/how-to-fix-leaderboard-cheating-and-fake-scores)

### Inferences
- Recommended for Letter Chain (cheapest first):
  1. **Daily percentile only** ("You solved faster than 72% of players today"), computed in a Supabase RPC from all submissions. It feels social with no public board, so there is little incentive to cheat.
  2. **Friends leaderboard**: friend codes or invite links, a `friendships` table, and RLS so users only read friends' rows. The social pressure is real and cheaters only hurt their friends.
  3. **Global daily leaderboard** only with anti-cheat: the server records `started_at` when the daily is fetched (via RPC), the client submits found words, and the server checks the words against the stored solution and computes elapsed time. Drop times below a floor (for example < 15s for an 8-word board), cap at the top N, and shadow-ban outliers.
- Avoid all-time global leaderboards. New players can't compete and they demotivate the casual audience. Weekly reset cohorts (Duolingo-style 30-person groups) are feasible later with a scheduled `pg_cron` job.

### Gaps
- No public A/B data was found on leaderboard retention lift in casual word games specifically. Duolingo's league results are qualitative in its own blog.

## 4. Share and viral loops: share-card design, deep links, referrals, Wordle K-factor

### Takeaway
Wordle's growth came from a **spoiler-free, text-based emoji grid** that players invented themselves, pasteable anywhere. Wardle added it as a share button in Dec 2021. Players went from 90 (Nov 2021) to about 300k (early Jan 2022) to 2M+ (late Jan), then NYT bought it. No credible K-factor figure has been published.

### Cited Findings
- The grid was invented by a New Zealand player (Elizabeth S.) in a group chat (#DailyWordleClub) as a spoiler-free way to share results. Wardle saw people typing it out by hand and built it into the share button in December — [BuzzFeed News](https://www.buzzfeednews.com/article/stefficao/how-wordle-went-viral-strategy); [The Spinoff](https://thespinoff.co.nz/media/13-01-2022/those-coloured-boxes-on-twitter-are-new-zealands-fault)
- Growth: 90 players in Nov 2021, more than 300,000 by Jan 3, 2022 — [BuzzFeed News](https://www.buzzfeednews.com/article/stefficao/how-wordle-went-viral-strategy). More than 2M by the end of Jan 2022 — [CUNY Pressbooks, "The Wordle Effect"](https://pressbooks.cuny.edu/inspire/part/the-wordle-effect-how-five-letters-changed-the-internet/); [Smithsonian](https://www.smithsonianmag.com/smart-news/heres-why-the-word-game-wordle-went-viral-180979439/)
- Analysts call Wordle the "anti-growth hack": no app, no ads, one puzzle a day, scarcity, and a shared experience — [Aakash Gupta](https://www.news.aakashg.com/p/wordle)
- Elements of the share string: puzzle number ("Wordle 183"), score ("4/6"), and the grid. Because everyone plays the same puzzle that day, results can be compared — [CUNY Pressbooks](https://pressbooks.cuny.edu/inspire/part/the-wordle-effect-how-five-letters-changed-the-internet/)
- Play Console has a deep links page that flags broken deep links and maps web URLs to app links — [Android Developers Blog, Nov 2023](https://android-developers.googleblog.com/2023/11/power-your-growth-on-google-play.html)

### Inferences
- Letter Chain's share card should include a **plain-text emoji version**, not only an image. Text pastes into WhatsApp, X and SMS, and it can be copied by hand. Format: `Letter Chain #142 · Chain 🔗 · 🔥12` plus an emoji path or found-order grid, a time, hints used, and a short link.
- The link should be an Android App Link / universal link (`https://letterchain.app/d/2026-10-07`). If the app is installed, it opens **that day's puzzle**. If not, it goes to the Play Store. Google Play Install Referrer can pass the puzzle date through install. Use Expo Router linking for the in-app route, and serve `assetlinks.json` from a tiny static site.
- Referral rewards (for example, "you and your friend each get 1 streak freeze when they finish their first daily") are cheap to build with Supabase: a `referrals` table, with the code read from install referrer or the link. I found no published evidence on referral rewards in word games.
- Theme-of-the-day in the share text ("Today: 🎬 Oscars") adds topical hook value, which is an advantage of the trending-topic themes.

### Gaps
- **No credible published K-factor for Wordle.** Articles describe the K-factor formula but give no measured value. Report this as unknown.
- No data was found on image vs text share-card conversion rates.

## 5. Daily archives (play past dailies), possibly as rewarded-ad unlocks

### Takeaway
NYT uses archives as a premium perk (Wordle 2024, Strands 2025) with a calendar UI, saved progress, and shareable archive results. For an ad-funded app, the analogous model is free recent days plus rewarded-ad or IAP unlocks for older ones.

### Cited Findings
- Wordle archive: calendar of more than 1,000 past puzzles, subscribers only, progress saved, archive results shareable — [TechCrunch](https://techcrunch.com/2024/05/07/nyt-games-wordle-archive-access-1000-past-puzzles)
- Strands archive added Sept 2025. The Mini put behind the paywall Aug 2025 — [Wikipedia](https://en.wikipedia.org/wiki/The_New_York_Times_Games)

### Inferences
- Suggested design: a calendar view where the last 7 days are free, which also catches up players who missed a day. Older dailies unlock with a rewarded ad per puzzle, or all of them via a one-off "Archive pass" IAP. Archive plays **should not count toward the streak** (NYT keeps archive results separate) but can earn completion stamps or achievements.
- An archive also gives binge players more content without new content production, and creates rewarded-ad inventory.

### Gaps
- No public data was found on how rewarded-ad-unlocked archives perform in casual word games.

## 6. Weekly / limited-time events a solo developer can automate

### Takeaway
Google Play's Promotional Content (LiveOps) can surface events on the store. For half of the events Google measured, the uplift was significant, and the median was +106%. Simple automated events (weekly themed challenges, a weekend marathon, holiday theme weeks) can run on `pg_cron` plus pre-generated boards.

### Cited Findings
- In Google's analysis of about 6,000 high-quality Promotional Content events from more than 2,000 titles (Nov 2023-Jan 2024), just over half showed statistically significant uplift. **Median uplift was 106%.** Events can appear on the store listing, homepage and search — [Google Play Console: Promotional content](https://play.google.com/console/about/programs/promotionalcontent/)
- Duolingo's Diamond Tournament runs automatically: the top 10 of the Diamond league go through quarterfinals, semifinals and finals — [Duolingo blog](https://blog.duolingo.com/duolingo-leagues-leaderboards/)

### Inferences
- Automatable formats:
  - a **weekly theme pack** (7 boards on one trending topic, with a badge for finishing all 7);
  - a **weekend speed challenge** (a fixed board set, ranked with friends or by percentile);
  - **holiday or event weeks** that tie into trending themes.
  
  Schedule them via Supabase tables (`events`, `event_boards`) with start/end timestamps and `pg_cron` for rollover and reward payouts. Submit each event as Play Promotional Content (it requires a few weeks' lead time).

### Gaps
- Promotional Content eligibility for small apps was not confirmed. Google's page doesn't publish a minimum-size threshold in the material I read.
- No evidence was found specifically on tournaments in casual word games.

## 7. Push notification best practices: timing, frequency, personalisation, Android 13+ opt-in

### Takeaway
Since Android 13, games have lost about a third of opted-in users. The average Android 13 opt-in is about 60% (vs 80-90% before). Opt-in for gaming can reach about 76%, and open rates are higher than before. Ask in context (for example, after the first daily or when a streak starts), not at first launch. Personalise and rotate the copy, and stop sending when reminders are ignored.

### Cited Findings
- Pushwoosh study (16M+ devices, two years after Aug 2022, published Oct 2024): gaming had the steepest decline, losing "nearly a third" of opted-in users. Game opt-in on Android 13 is still higher than iOS, and Android 13 open rates for games are higher than before — [Pushwoosh research](https://pushwoosh.com/blog/android-13-opt-in-rates-research)
- Average Android 13 opt-in is about 60% (vs 80-90% before Android 13). Gaming companies reached up to 76% — [Pushwoosh](https://ha-public.pushwoosh.com/blog/android-push-notifications); [Netcore](https://netcorecloud.com/?p=94067) (vendor research; methodology not fully disclosed)
- Google guidance: don't prompt immediately. Trigger the prompt from a user action or a relevant moment (for example, after the 3rd or 4th launch), and explain what notifications are for. Apps targeting Android 13+ control when the dialog appears. Existing installs that already had a notification channel are pre-granted on OS upgrade — [Android Developers: Notification runtime permission](https://developer.android.com/develop/ui/views/notifications/notification-permission)
- Personalised, varied templates beat fixed ones, and repetition wears off — [Duolingo KDD'20](https://research.Duolingo.com/papers/yancey.kdd20.pdf); [Duolingo blog](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/)
- Airship's frequently cited claim is that push can raise 90-day retention by up to 190% — [AppRadar](https://appradar.com/blog/push-notifications-best-practices) (old secondary citation; the original study is dated, so treat it as directional)

### Inferences
- Suggested flow:
  1. Show a soft pre-prompt after the **first completed daily**: "Want a nudge when tomorrow's puzzle drops? Keep your streak alive." Only then trigger the OS prompt.
  2. Default to 1 reminder a day at the user's habitual play time. Compute it from the median of their last 7 completion times (store `last_completed_at` in Supabase or locally), with a configurable fallback such as 6 pm local time.
  3. Send one extra **streak-at-risk** reminder about 3 hours before local midnight, only if the streak is ≥3 days.
  4. Rotate copy that includes the day's trending theme.
  5. Back off after 7 ignored days and stop after about 30, with a Duolingo-style final message.

  Local scheduled notifications (expo-notifications) cover most of this without a push server. Server push via Supabase Edge Functions + FCM is only needed for friend activity ("Sam beat your time").

### Gaps
- No public opt-in data was found for word or puzzle games specifically. Vendor figures cover "gaming" overall.
- No robust 2024-2026 study on optimal daily send time for puzzle games was found.

## 8. Google Play features for discovery and retention

### Takeaway
The most useful Play levers for a solo dev:
- **Play Games Services v2 achievements** (feed Play Points quests; aim for 5+ earnable in the first 2 hours);
- **Promotional Content** (median +106% uplift when significant);
- **custom store listings** (up to 50, e.g. for lapsed users or by country);
- **the In-App Review API** used after a positive moment.

The PGS v1 to v2 migration deadline is May 2026.

### Cited Findings
- PGS achievements: games where players earn **5+ achievements in the first 2 hours** drive deeper engagement. The most engaging titles have **40+ achievements** across progression, hidden and even failure-based goals. Recommended minimum: 15 achievements, using incremental types. Bulk configuration is now in Play Console — [Android Developers Blog, June 2025](https://android-developers.googleblog.com/2025/06/get-ready-for-next-generation-gameplay-play-games-services.html)
- Play Points quests tied to achievements: Hay Day saw an **average 177% install uplift**. The Play Grouping API (segment-targeted promotions) gave Marvel Contest of Champions a **4x increase in lapsed-user engagement** — [Android Developers Blog, June 2025](https://android-developers.googleblog.com/2025/06/get-ready-for-next-generation-gameplay-play-games-services.html)
- PGS v1 deprecation: new apps cannot use v1 from May 2025. From May 2026, new versions cannot publish with the v1 SDK. The APIs stop working entirely in Q3 2028 — [Android Developers Blog](https://android-developers.googleblog.com/2025/06/get-ready-for-next-generation-gameplay-play-games-services.html)
- Custom store listings: up to 50 (100 with premium growth tools), targeted by country, pre-registration status, Google Ads campaign, or **inactive users**. They can be scheduled and tested on part of the audience — [Android Developers Blog, Nov 2023](https://android-developers.googleblog.com/2023/11/power-your-growth-on-google-play.html); [Adjust](https://www.adjust.com/blog/google-premium-growth-tools/)
- Promotional Content: see section 6 (median uplift 106% among significant events) — [Play Console](https://play.google.com/console/about/programs/promotionalcontent/)
- In-App Review API: prompt after the user has experienced enough of the app. Don't ask questions before or during the prompt, and don't over-prompt. Quota: calling it more than once in a short period (for example, under a month) may show nothing. **Never attach it to a button.** The quota isn't guaranteed, so the button would appear broken — [Android Developers: In-App Reviews](https://developer.android.com/guide/playcore/in-app-review)

### Inferences
- Review timing: trigger after the 3rd-5th completed daily or a 7-day streak milestone, on the success screen, at most once every 30-60 days, and never after a fail or an ad.
- PGS achievements map naturally to streak milestones, first Chain solve, no-hint solves, themed collections, and archive completion. They are cheap to add and qualify for Play Points quests. The React Native/Expo integration needs a config plugin and a dev build. Treat the platform and SDK details as something to verify against current docs.
- Play Games leaderboards are an alternative to Supabase leaderboards, but they are global and cross-player only, with no friends graph in v2. A Supabase friends board fits better (section 3).
- Pre-registration is mainly for new titles or major relaunches. It has low relevance now that the app is live.

### Gaps
- I found no primary data on Play Points' effect on small, non-IAP games.
- No current requirements were found for Promotional Content or Play Points quest eligibility for small developers.
- I did not verify the status of Expo / React Native libraries for PGS v2.
