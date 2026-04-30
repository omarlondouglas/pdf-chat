import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ conversations: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const title = body.title?.trim() || "Nova conversa";

  const { data, error } = await supabase
    .from("conversations")
    .insert({ title })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ conversation: data });
}
