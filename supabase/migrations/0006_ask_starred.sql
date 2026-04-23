-- Physics.explained — /ask: allow users to star conversations
alter table public.ask_conversations
  add column if not exists starred boolean not null default false;

create index if not exists ask_conversations_user_starred_idx
  on public.ask_conversations (user_id, starred, updated_at desc);
