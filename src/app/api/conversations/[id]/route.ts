import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const [conv, msgs] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .eq("id", id)
      .single(),
    supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (conv.error) {
    return NextResponse.json({ error: conv.error.message }, { status: 404 });
  }
  if (msgs.error) {
    return NextResponse.json({ error: msgs.error.message }, { status: 500 });
  }

  return NextResponse.json({
    conversation: conv.data,
    messages: msgs.data ?? [],
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getSupabase()
    .from("conversations")
    .delete()
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
