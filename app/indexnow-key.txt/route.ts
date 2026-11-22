// IndexNow ownership proof: search engines fetch this file and compare its
// body with the key sent by `pnpm seo:indexnow` (scripts/seo/indexnow.ts).
export const dynamic = "force-dynamic";

export function GET(): Response {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
