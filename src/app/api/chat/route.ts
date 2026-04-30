import { query } from "@anthropic-ai/claude-agent-sdk";
import { NextRequest, NextResponse } from "next/server";
import { loadPdfContext } from "@/lib/pdf";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 120;

interface RequestBody {
  conversationId: string;
  message: string;
}

function formatHistory(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): string {
  return messages
    .map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
    .join("\n\n");
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as RequestBody;
  const { conversationId, message } = body;

  if (!conversationId || !message?.trim()) {
    return NextResponse.json(
      { error: "conversationId and message required" },
      { status: 400 }
    );
  }

  // Load existing history for this conversation
  const { data: history, error: histErr } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (histErr) {
    return NextResponse.json({ error: histErr.message }, { status: 500 });
  }

  // Persist user message
  const { error: userInsertErr } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message.trim(),
  });
  if (userInsertErr) {
    return NextResponse.json(
      { error: userInsertErr.message },
      { status: 500 }
    );
  }

  // Auto-set conversation title from first user message
  if (!history || history.length === 0) {
    const title = message.trim().slice(0, 60);
    await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId);
  }

  const pdfText = await loadPdfContext();

  const systemPrompt = `Você é um assistente que responde perguntas APENAS com base no(s) PDF(s) abaixo. Se a pergunta não puder ser respondida pelo conteúdo, diga isso claramente. Responda em português, de forma concisa.

=== CONTEÚDO DO(S) PDF(s) ===
${pdfText || "(nenhum PDF carregado)"}
=== FIM DO CONTEÚDO ===`;

  const prompt =
    history && history.length > 0
      ? `Histórico da conversa:\n${formatHistory(
          history as Array<{ role: "user" | "assistant"; content: string }>
        )}\n\nNova pergunta do usuário: ${message.trim()}`
      : message.trim();

  let answer = "";
  try {
    const result = query({
      prompt,
      options: {
        systemPrompt,
        allowedTools: [],
        maxTurns: 1,
        permissionMode: "bypassPermissions",
      },
    });

    for await (const m of result) {
      if (m.type === "result" && m.subtype === "success") {
        answer = m.result;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Persist assistant message
  const { error: asstInsertErr } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: answer,
  });
  if (asstInsertErr) {
    return NextResponse.json(
      { error: asstInsertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ answer });
}
