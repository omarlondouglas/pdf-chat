-- Run this in the Supabase SQL Editor to set up the schema.

create extension if not exists "pgcrypto";

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id, created_at);

create index if not exists conversations_updated_at_idx
  on public.conversations (updated_at desc);

-- Auto-update updated_at on conversations when a new message is inserted
create or replace function public.bump_conversation_updated_at()
returns trigger language plpgsql as $$
begin
  update public.conversations
    set updated_at = now()
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_conversation_updated_at on public.messages;
create trigger trg_bump_conversation_updated_at
  after insert on public.messages
  for each row execute function public.bump_conversation_updated_at();
