import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    const visible = Object.keys(process.env)
      .filter((k) => /SUPABASE|AUTH_|CLAUDE_|ANTHROPIC/.test(k))
      .sort();
    console.error(
      "[supabase] env vars missing. Visible runtime vars matching SUPABASE/AUTH/CLAUDE/ANTHROPIC:",
      visible.length ? visible : "(none)"
    );
    throw new Error(
      `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required (visible: ${
        visible.join(",") || "none"
      })`
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false },
  });
  return client;
}

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type DbMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};
