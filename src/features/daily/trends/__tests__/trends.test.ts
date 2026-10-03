import { THEMES } from '../../../puzzle/data/themes';
import { CATEGORY_THEME, classifyEntity, isTopicTitle, matchTrends, type EntityFacts, type TrendArticle } from '../classify';
import { planDaily, planEvergreen } from '../plan';

const facts = (f: Partial<EntityFacts>): EntityFacts => ({ instanceOf: [], occupations: [], sports: [], diedAt: null, ...f });
const article = (title: string, views: number, f: Partial<EntityFacts> | null): TrendArticle => ({ title, views, facts: f ? facts(f) : null });

describe('classifyEntity (allowlist)', () => {
  it('accepts films, TV, albums, games, space missions and festivals', () => {
    expect(classifyEntity(facts({ instanceOf: ['Q11424'] }))).toBe('movies');
    expect(classifyEntity(facts({ instanceOf: ['Q5398426'] }))).toBe('television');
    expect(classifyEntity(facts({ instanceOf: ['Q482994'] }))).toBe('music');
    expect(classifyEntity(facts({ instanceOf: ['Q7889'] }))).toBe('gaming');
    expect(classifyEntity(facts({ instanceOf: ['Q2133344'] }))).toBe('space');
    expect(classifyEntity(facts({ instanceOf: ['Q132241'] }))).toBe('festivals');
  });

  it('maps sports events by their sport', () => {
    expect(classifyEntity(facts({ instanceOf: ['Q27020041'], sports: ['Q2736'] }))).toBe('football');
    expect(classifyEntity(facts({ instanceOf: ['Q27020041'], sports: ['Q5375'] }))).toBe('cricket');
    expect(classifyEntity(facts({ instanceOf: ['Q167170'] }))).toBe('sports');
  });

  it('accepts living people only by allowlisted occupation', () => {
    expect(classifyEntity(facts({ instanceOf: ['Q5'], occupations: ['Q937857', 'Q4610556'] }))).toBe('football');
    expect(classifyEntity(facts({ instanceOf: ['Q5'], occupations: ['Q4610556', 'Q10800557'] }))).toBe('movies');
    // Recently deceased singer → ignored.
    expect(classifyEntity(facts({ instanceOf: ['Q5'], occupations: ['Q177220'], diedAt: '+2026-09-30T00:00:00Z' }))).toBeNull();
    // Politician, murderer → ignored.
    expect(classifyEntity(facts({ instanceOf: ['Q5'], occupations: ['Q82955'] }))).toBeNull();
    expect(classifyEntity(facts({ instanceOf: ['Q5'], occupations: ['Q931260'] }))).toBeNull();
  });

  it('ignores news events, accidents and anything unknown', () => {
    expect(classifyEntity(facts({ instanceOf: ['Q3149875'] }))).toBeNull(); // aviation incident
    expect(classifyEntity(facts({ instanceOf: ['Q1190554'] }))).toBeNull(); // occurrence
    expect(classifyEntity(facts({ instanceOf: ['Q15169167'] }))).toBeNull(); // execution method
  });

  it('skips navigation and list pages', () => {
    for (const t of ['Main_Page', 'Special:Search', 'Deaths_in_2026', 'List_of_films', '2026_Asian_Games_medal_table']) expect(isTopicTitle(t)).toBe(false);
    expect(isTopicTitle('Digger_(2026_film)')).toBe(true);
  });

  it('every category has a theme with all daily word lengths', () => {
    for (const theme of Object.values(CATEGORY_THEME)) {
      const words = THEMES.find((t) => t.id === theme)!.words;
      for (const n of [4, 5, 6, 7, 8]) expect(words.filter((w) => w.length === n).length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('planDaily', () => {
  const trends = [
    article('Christa_Pike', 4_000_000, { instanceOf: ['Q5'], occupations: ['Q931260'] }),
    article('Flight_1073', 900_000, { instanceOf: ['Q3149875'] }),
    article('2026_FIFA_Cup', 300_000, { instanceOf: ['Q27020041'], sports: ['Q2736'] }),
    article('Some_film', 200_000, { instanceOf: ['Q11424'] }),
  ];

  it('picks the most viewed allowlisted trend', () => {
    expect(matchTrends(trends).map((m) => m.theme)).toEqual(['football', 'movies']);
    const plan = planDaily({ key: '2026-10-06', trends, recent: [] });
    expect(plan.source).toBe('trending');
    expect(plan.daily.theme).toBe('football');
    expect(plan.trend?.title).toBe('2026_FIFA_Cup');
    expect(plan.daily.words.map((w) => w.length).sort()).toEqual([4, 5, 6, 7, 8]);
  });

  it('skips themes used in recent dailies and avoids their words', () => {
    const recent = [{ date: '2026-10-05', theme: 'football', words: [] }];
    expect(planDaily({ key: '2026-10-06', trends, recent }).daily.theme).toBe('movies');
    const first = planDaily({ key: '2026-10-06', trends, recent: [] });
    const again = planDaily({ key: '2026-10-07', trends, recent: [{ date: '2026-10-01', theme: 'colors', words: first.daily.words }] });
    expect(again.daily.words.filter((w) => first.daily.words.includes(w))).toEqual([]);
  });

  it('falls back to an evergreen theme when nothing safe is trending', () => {
    const plan = planDaily({ key: '2026-10-06', trends: trends.slice(0, 2), recent: [] });
    expect(plan.source).toBe('generated');
    expect(plan.trend).toBeNull();
    expect(planEvergreen({ key: '2026-10-06', recent: [], excludeThemes: [plan.daily.theme] }).daily.theme).not.toBe(plan.daily.theme);
  });
});
