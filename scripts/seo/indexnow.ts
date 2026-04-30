import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const SITE_URL = "https://physics.it.com";
const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.error("Missing INDEXNOW_KEY in .env — generate at https://www.bing.com/indexnow + add to env");
  process.exit(1);
}

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  const xml = await res.text();
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
}

async function main() {
  const urls = await fetchSitemapUrls();
  console.log(`Submitting ${urls.length} URLs to IndexNow…`);

  const body = {
    host: new URL(SITE_URL).host,
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    urlList: urls,
  };

  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  if (text) console.log(text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
