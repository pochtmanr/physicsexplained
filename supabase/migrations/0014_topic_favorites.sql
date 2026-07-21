-- Physics.explained — iOS: let a signed-in reader save topics.
--
-- A join table rather than a column, unlike `ask_conversations.starred`
-- (0006): a conversation is already owned by one user, so starring it is a
-- property of that row. Topics are *global* content shared by every reader, so
-- the favourite belongs to the (user, topic) pair and nowhere else.
--
-- Topics are identified the way the taxonomy identifies them — branch_slug plus
-- slug (contracts §2.1: `content_entries.slug` is branch-qualified, the
-- taxonomy's own `slug` is bare). No foreign key to content: the taxonomy is
-- rebuilt from MDX on every content deploy, and a cascade there would silently
-- delete a reader's saved list on an unrelated republish.

create table if not exists public.topic_favorites (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  branch_slug text        not null,
  slug        text        not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, branch_slug, slug)
);

-- Newest-first reads of one user's list. The primary key already covers the
-- point lookup ("is this topic saved"), so this exists only for ordering.
create index if not exists topic_favorites_user_created_idx
  on public.topic_favorites (user_id, created_at desc);

alter table public.topic_favorites enable row level security;

drop policy if exists "user reads own favorites"   on public.topic_favorites;
drop policy if exists "user inserts own favorites" on public.topic_favorites;
drop policy if exists "user deletes own favorites" on public.topic_favorites;

-- No update policy: a favourite has no mutable field. Changing your mind is a
-- delete, and leaving update unpolicied keeps it that way.
create policy "user reads own favorites"   on public.topic_favorites for select to authenticated using (user_id = auth.uid());
create policy "user inserts own favorites" on public.topic_favorites for insert to authenticated with check (user_id = auth.uid());
create policy "user deletes own favorites" on public.topic_favorites for delete to authenticated using (user_id = auth.uid());
