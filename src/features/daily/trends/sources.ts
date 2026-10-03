/**
 * Fetches yesterday's most viewed English Wikipedia articles and their
 * Wikidata facts. Free, official APIs; no keys. `fetchImpl` is injectable so
 * this runs in Node, Deno (Edge Function) and tests alike.
 */
import { isTopicTitle, type EntityFacts, type TrendArticle } from './classify';

type Fetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** Wikimedia asks API clients to identify themselves. */
const HEADERS = { 'User-Agent': 'LetterChain/1.0 (daily puzzle themes; https://github.com/meghrajgiri/letter-chain-app)', 'Api-User-Agent': 'LetterChain/1.0' };

const chunks = <T,>(items: readonly T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

async function getJson(fetchImpl: Fetch, url: string): Promise<any> {
  const response = await fetchImpl(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.json();
}

/** Most viewed article titles for a UTC date (YYYY-MM-DD), topic pages only. */
export async function fetchTopArticles(day: string, fetchImpl: Fetch, limit = 60): Promise<{ title: string; views: number }[]> {
  const path = day.replace(/-/g, '/');
  const data = await getJson(fetchImpl, `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${path}`);
  const articles: { article: string; views: number }[] = data?.items?.[0]?.articles ?? [];
  return articles
    .filter((a) => isTopicTitle(a.article))
    .slice(0, limit)
    .map((a) => ({ title: a.article, views: a.views }));
}

const claimIds = (entity: any, property: string): string[] =>
  (entity?.claims?.[property] ?? [])
    .map((claim: any) => claim?.mainsnak?.datavalue?.value?.id)
    .filter((id: unknown): id is string => typeof id === 'string');

const claimTime = (entity: any, property: string): string | null => entity?.claims?.[property]?.[0]?.mainsnak?.datavalue?.value?.time ?? null;

/** Wikidata facts for each title (titles without a Wikidata item get null). */
export async function fetchFacts(titles: readonly string[], fetchImpl: Fetch): Promise<Map<string, EntityFacts | null>> {
  // 1. Title → Wikidata id (following redirects and title normalisation).
  const qidByTitle = new Map<string, string>();
  for (const batch of chunks(titles, 50)) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&titles=${encodeURIComponent(batch.join('|'))}`;
    const data = await getJson(fetchImpl, url);
    const finalTitle = new Map<string, string>();
    for (const n of data?.query?.normalized ?? []) finalTitle.set(n.from, n.to);
    for (const r of data?.query?.redirects ?? []) finalTitle.set(r.from, r.to);
    const qidByFinal = new Map<string, string>();
    for (const page of Object.values<any>(data?.query?.pages ?? {})) {
      if (page?.pageprops?.wikibase_item) qidByFinal.set(page.title, page.pageprops.wikibase_item);
    }
    for (const title of batch) {
      let t = title;
      for (let hops = 0; hops < 3 && finalTitle.has(t); hops++) t = finalTitle.get(t)!;
      const qid = qidByFinal.get(t);
      if (qid) qidByTitle.set(title, qid);
    }
  }

  // 2. Wikidata id → facts.
  const facts = new Map<string, EntityFacts>();
  for (const batch of chunks([...new Set(qidByTitle.values())], 50)) {
    const data = await getJson(fetchImpl, `https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&ids=${batch.join('|')}`);
    for (const [qid, entity] of Object.entries<any>(data?.entities ?? {})) {
      facts.set(qid, {
        instanceOf: claimIds(entity, 'P31'),
        occupations: claimIds(entity, 'P106'),
        sports: claimIds(entity, 'P641'),
        diedAt: claimTime(entity, 'P570'),
      });
    }
  }
  return new Map(titles.map((title) => [title, facts.get(qidByTitle.get(title) ?? '') ?? null]));
}

/** Trending articles for a UTC date, with facts. Falls back a day if that date isn't published yet. */
export async function fetchTrendingArticles(day: string, fetchImpl: Fetch): Promise<{ day: string; articles: TrendArticle[] }> {
  let used = day;
  let top: { title: string; views: number }[];
  try {
    top = await fetchTopArticles(day, fetchImpl);
  } catch {
    used = new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
    top = await fetchTopArticles(used, fetchImpl);
  }
  const facts = await fetchFacts(top.map((a) => a.title), fetchImpl);
  return { day: used, articles: top.map((a) => ({ ...a, facts: facts.get(a.title) ?? null })) };
}
