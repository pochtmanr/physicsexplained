import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { SITE } from "@/lib/seo/config";

const SITE_URL = SITE.baseUrl;
const KEY = process.env.INDEXNOW_KEY;
if (!KEY) {
  console.error("Missing INDEXNOW_KEY in .env — generate at https://www.bing.com/indexnow + add to env");
  process.exit(1);
}

// .env.local points NEXT_PUBLIC_SITE_URL at localhost; never submit that.
const host = new URL(SITE_URL).hostname;
if (host === "localhost" || host === "127.0.0.1") {
  console.error(
    `Refusing to submit ${SITE_URL} to IndexNow. Run with NEXT_PUBLIC_SITE_URL=https://physics.it.com`,
  );
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
    keyLocation: `${SITE_URL}/indexnow-key.txt`,
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
