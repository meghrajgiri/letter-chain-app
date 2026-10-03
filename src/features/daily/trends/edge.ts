/**
 * Entry point bundled into the `publish-daily` Edge Function
 * (`npm run build:edge` → supabase/functions/publish-daily/pipeline.js).
 * Only pure engine code: no React Native, no app config.
 */
export { dailyKey, dailyModeFor } from '../daily';
export { fetchTrendingArticles } from './sources';
export { planDaily, planEvergreen, type DailyPlan, type RecentDaily } from './plan';
