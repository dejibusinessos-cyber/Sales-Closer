-- Conversation store for the TK Store WhatsApp AI Closer.
-- Run this in the Supabase SQL Editor once per project.

create table if not exists conversations (
  phone         text primary key,
  name          text,
  product       text,
  auto_reply    boolean not null default false,
  pending_reply text,
  messages      jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now()
);

create index if not exists conversations_updated_at_idx
  on conversations (updated_at desc);
