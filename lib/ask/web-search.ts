const BRAVE_URL = "https://api.search.brave.com/res/v1/web/search";

const ALLOWLIST = [
  /(^|\.)wikipedia\.org$/,
  /(^|\.)arxiv\.org$/,
  /(^|\.)nist\.gov$/,
  /\.edu$/,
];

export async function braveSearch(
  q: string,
  limit = 5,
): Promise<Array<{ url: string; title: string; snippet: string }>> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return []; // graceful: feature disabled when key missing
  const url = `${BRAVE_URL}?q=${encodeURIComponent(q)}&count=${limit}&safesearch=strict`;
  const res = await fetch(url, {
    headers: { "X-Subscription-Token": key, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    web?: { results?: Array<{ url: string; title: string; description: string }> };
  };
  return (body.web?.results ?? [])
    .slice(0, limit)
    .map((r) => ({ url: r.url, title: r.title, snippet: r.description }));
}

export async function fetchAllowlistedUrl(
  url: string,
): Promise<{ title: string; text_excerpt: string }> {
  const parsed = new URL(url);
  if (!ALLOWLIST.some((re) => re.test(parsed.hostname))) {
    throw new Error(`URL not in allowlist: ${parsed.hostname}`);
  }
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`fetchUrl ${res.status}`);
  const text = (await res.text()).slice(0, 8192);
  const title = /<title>(.*?)<\/title>/i.exec(text)?.[1]?.trim() ?? parsed.hostname;
  const excerpt = text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 1500);
  return { title, text_excerpt: excerpt };
}
