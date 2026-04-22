import { NextResponse } from "next/server";
import { getSsrClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getSsrClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { data, error } = await db
    .from("ask_conversations")
    .select("id,title,updated_at")
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data });
}
