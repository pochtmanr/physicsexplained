import { buildLlmsTxt } from "@/lib/seo/llms";

export const revalidate = 86400;

export async function GET(): Promise<Response> {
  return new Response(buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
