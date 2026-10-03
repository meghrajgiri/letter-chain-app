/**
 * Maps a trending Wikipedia article to a puzzle theme, using Wikidata facts.
 *
 * Allowlist only: an article counts only if it clearly is a film, TV show,
 * album, sports event, living athlete/actor/musician, space mission, festival…
 * Everything else (news events, crimes, accidents, politics, deaths, people
 * of other occupations) is ignored, so sad or divisive news can't become a
 * puzzle theme. Players only ever see the theme and its curated words, never
 * the article itself. Pure TypeScript.
 */

export type TrendCategory =
  | 'football'
  | 'cricket'
  | 'basketball'
  | 'tennis'
  | 'racing'
  | 'sports'
  | 'movies'
  | 'television'
  | 'music'
  | 'gaming'
  | 'space'
  | 'festivals';

/** Puzzle theme used for each category (ids in `THEMES`). */
export const CATEGORY_THEME: Record<TrendCategory, string> = {
  football: 'football',
  cricket: 'cricket',
  basketball: 'basketball',
  tennis: 'tennis',
  racing: 'racing',
  sports: 'sports',
  movies: 'movies',
  television: 'television',
  music: 'music',
  gaming: 'gaming',
  space: 'space',
  festivals: 'festivals',
};

/** The Wikidata facts we look at, as plain id lists. */
export type EntityFacts = {
  /** P31 "instance of" */
  instanceOf: string[];
  /** P106 "occupation" (people) */
  occupations: string[];
  /** P641 "sport" */
  sports: string[];
  /** P570 "date of death": any value means the person is not living. */
  diedAt: string | null;
};

const HUMAN = 'Q5';

/** P641 sport → category. Other sports fall back to the general Sports theme. */
const SPORT: Record<string, TrendCategory> = {
  Q2736: 'football', // association football
  Q5375: 'cricket',
  Q5372: 'basketball',
  Q847: 'tennis',
  Q1968: 'racing', // Formula One
  Q5367: 'racing', // motorsport
  Q5386: 'racing', // auto racing
};

/** Things that are sports competitions; their category comes from P641 when present. */
const SPORTS_EVENT = new Set([
  'Q27020041', // sports season
  'Q13406554', // sports competition
  'Q500834', // tournament
  'Q167170', // multi-sport event
  'Q46135307', // nation at sport competition
  'Q5389', // Olympic Games
  'Q18536594', // Olympic sporting event
]);

/** Non-person "instance of" classes we accept directly. */
const INSTANCE: Record<string, TrendCategory> = {
  Q11424: 'movies', // film
  Q24856: 'movies', // film series
  Q5398426: 'television', // television series
  Q3464665: 'television', // television series season
  Q1259759: 'television', // miniseries
  Q15416: 'television', // television program
  Q7889: 'gaming', // video game
  Q7058673: 'gaming', // video game series
  Q482994: 'music', // album
  Q7366: 'music', // song
  Q134556: 'music', // single
  Q215380: 'music', // musical group
  Q5741069: 'music', // rock band
  Q1573906: 'music', // concert tour
  Q40218: 'space', // spacecraft
  Q2133344: 'space', // space mission
  Q26529: 'space', // space probe
  Q3559: 'space', // comet
  Q1445650: 'festivals', // holiday
  Q132241: 'festivals', // festival
};

/** Occupations of living people we accept (first match in the person's own order wins). */
const OCCUPATION: Record<string, TrendCategory> = {
  Q937857: 'football', // association football player
  Q628099: 'football', // association football coach
  Q12299841: 'cricket', // cricketer
  Q3665646: 'basketball', // basketball player
  Q10833314: 'tennis', // tennis player
  Q378622: 'racing', // racing driver
  Q10841764: 'racing', // Formula One driver
  Q2066131: 'sports', // athlete
  Q19204627: 'sports', // American football player
  Q10800557: 'movies', // film actor
  Q33999: 'movies', // actor
  Q10798782: 'television', // television actor
  Q947873: 'television', // television presenter
  Q177220: 'music', // singer
  Q639669: 'music', // musician
  Q488205: 'music', // singer-songwriter
  Q2252262: 'music', // rapper
  Q11631: 'space', // astronaut
};

/** Category for one article's facts, or null when it isn't on the allowlist. */
export function classifyEntity(facts: EntityFacts): TrendCategory | null {
  if (facts.instanceOf.includes(HUMAN)) {
    // Only living people: a trending person who just died must never become a cheerful puzzle.
    if (facts.diedAt) return null;
    for (const occupation of facts.occupations) {
      const category = OCCUPATION[occupation];
      if (category) return category;
    }
    return null;
  }
  for (const cls of facts.instanceOf) {
    const category = INSTANCE[cls];
    if (category) return category;
  }
  if (facts.instanceOf.some((cls) => SPORTS_EVENT.has(cls))) {
    for (const sport of facts.sports) if (SPORT[sport]) return SPORT[sport];
    return 'sports';
  }
  return null;
}

/** Wikipedia pages that are never topics (navigation, search, lists, death lists…). */
export function isTopicTitle(title: string): boolean {
  if (/^(Main_Page|Special:|Wikipedia:|Portal:|File:|Help:|Template:|Category:|Talk:|User:)/.test(title)) return false;
  if (/^(Deaths_in|List_of|Lists_of|\d{4}_in_)/.test(title)) return false;
  if (/_medal_table$/.test(title)) return false;
  return true;
}

export type TrendArticle = {
  /** Wikipedia title (underscores). */
  title: string;
  views: number;
  /** Wikidata facts; null when the article has no Wikidata item. */
  facts: EntityFacts | null;
};

export type TrendMatch = { article: TrendArticle; category: TrendCategory; theme: string };

/** Allowlisted trends, most viewed first. */
export function matchTrends(articles: readonly TrendArticle[]): TrendMatch[] {
  const matches: TrendMatch[] = [];
  for (const article of [...articles].sort((a, b) => b.views - a.views)) {
    if (!isTopicTitle(article.title) || !article.facts) continue;
    const category = classifyEntity(article.facts);
    if (category) matches.push({ article, category, theme: CATEGORY_THEME[category] });
  }
  return matches;
}
