"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LogOut, Plus, Trash2, MessageSquare, Menu, X } from "lucide-react";
import ChatInput from "@/components/ui/prompt-input-dynamic-grow";
import { MarkdownMessage } from "@/components/ui/markdown-message";

const HeroWave = dynamic(
  () => import("@/components/ui/ai-input-hero").then((m) => m.HeroWave),
  { ssr: false }
);

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function Home() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) return [];
    const data = await res.json();
    setConversations(data.conversations);
    return data.conversations as Conversation[];
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(
      (data.messages as { role: "user" | "assistant"; content: string }[]).map(
        (m) => ({ role: m.role, content: m.content })
      )
    );
  }, []);

  useEffect(() => {
    (async () => {
      await loadConversations();
      setBootstrapped(true);
    })();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function ensureConversation(): Promise<string> {
    if (activeId) return activeId;
    const res = await fetch("/api/conversations", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.conversation?.id) {
      throw new Error(
        data?.error || `Falha ao criar conversa (HTTP ${res.status})`
      );
    }
    const id = data.conversation.id as string;
    setActiveId(id);
    setConversations((prev) => [data.conversation, ...prev]);
    return id;
  }

  async function send(value: string) {
    setLoading(true);
    const optimistic: Message[] = [
      ...messages,
      { role: "user", content: value },
    ];
    setMessages(optimistic);

    try {
      const conversationId = await ensureConversation();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
      loadConversations();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function newConversation() {
    setActiveId(null);
    setMessages([]);
  }

  async function deleteConversation(id: string) {
    if (!confirm("Excluir esta conversa?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (!bootstrapped) {
    return (
      <main className="min-h-screen bg-[#05060a] flex items-center justify-center text-gray-400 text-sm">
        Carregando...
      </main>
    );
  }

  function selectConversation(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
  }

  function startNew() {
    newConversation();
    setSidebarOpen(false);
  }

  // Empty state (no active conversation, no messages) → HeroWave
  if (!activeId && messages.length === 0) {
    return (
      <main className="bg-[#05060a] min-h-screen flex relative">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={startNew}
          onDelete={deleteConversation}
          onLogout={logout}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur border border-white/20 text-white"
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex-1 relative">
          <HeroWave
            title="Converse com seu PDF"
            subtitle="Pergunte qualquer coisa sobre o calendário nacional de vacinação 2026"
            buttonText="Enviar"
            onPromptSubmit={send}
            loading={loading}
            showNavbar={false}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#05060a] text-white flex relative overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={startNew}
        onDelete={deleteConversation}
        onLogout={logout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col relative min-w-0">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(31,61,188,0.35), transparent 60%)",
          }}
        />

        <header className="relative z-10 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-black/30 backdrop-blur flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white shrink-0"
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-sm font-medium text-white/90 truncate">
            {conversations.find((c) => c.id === activeId)?.title ||
              "Nova conversa"}
          </h1>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10"
        >
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#1f3dbc] text-white shadow-[0_4px_24px_rgba(31,61,188,0.4)] whitespace-pre-wrap"
                      : "bg-white/5 border border-white/10 text-gray-100 backdrop-blur-md"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <MarkdownMessage content={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl text-sm text-gray-400 flex gap-1">
                  <span className="animate-bounce [animation-delay:-0.3s]">
                    ●
                  </span>
                  <span className="animate-bounce [animation-delay:-0.15s]">
                    ●
                  </span>
                  <span className="animate-bounce">●</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-4 sm:bottom-6 px-3 sm:px-4 z-20 flex justify-center">
          <ChatInput
            placeholder="Pergunte sobre o PDF"
            onSubmit={send}
            disabled={loading}
            textColor="#ffffff"
            backgroundOpacity={0.08}
          />
        </div>
      </div>
    </main>
  );
}

function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onLogout,
  open,
  onClose,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-72 md:w-64 shrink-0 bg-black/80 md:bg-black/40 border-r border-white/10 backdrop-blur flex flex-col h-[100dvh] md:h-screen transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white transition-colors"
        >
          <Plus size={16} />
          Nova conversa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && (
          <div className="px-4 py-6 text-xs text-gray-500 text-center">
            Sem conversas ainda
          </div>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group mx-2 mb-1 px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-colors ${
              activeId === c.id
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
            onClick={() => onSelect(c.id)}
          >
            <MessageSquare size={14} className="shrink-0" />
            <span className="flex-1 truncate">{c.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 p-1"
              aria-label="Excluir conversa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>

      {/* Close button on mobile */}
      <button
        onClick={onClose}
        className="md:hidden absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white"
        aria-label="Fechar menu"
      >
        <X size={18} />
      </button>
    </aside>
    </>
  );
}
