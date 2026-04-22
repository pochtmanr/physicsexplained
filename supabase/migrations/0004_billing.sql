-- Physics.explained — token quota + Revolut Merchant recurring billing
-- See docs/superpowers/specs/2026-04-23-profile-billing-tokens-design.md

-- 1. Per-user billing state (one row per auth.users row)
create table if not exists public.user_billing (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  plan                 text not null default 'free'
                         check (plan in ('free','starter','pro')),
  status               text not null default 'active'
                         check (status in ('active','past_due','canceled')),
  tokens_allowance     bigint not null default 0,
  tokens_used          bigint not null default 0,
  free_questions_used  int    not null default 0,
  cycle_start          timestamptz not null default now(),
  cycle_end            timestamptz not null default (now() + interval '1 month'),
  revolut_customer_id  text,
  revolut_token        text,
  next_charge_at       timestamptz,
  canceled_at          timestamptz,
  updated_at           timestamptz not null default now()
);

alter table public.user_billing enable row level security;

drop policy if exists "user reads own billing" on public.user_billing;
create policy "user reads own billing" on public.user_billing
  for select to authenticated using (user_id = auth.uid());

-- No insert/update/delete policies: only service-role mutates.

-- 2. Audit log of every Revolut order (first payment + renewals)
create table if not exists public.billing_orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  revolut_order_id  text not null unique,
  plan              text not null,
  amount_cents      int  not null,
  currency          text not null default 'USD',
  state             text not null,
  created_at        timestamptz not null default now()
);
create index if not exists billing_orders_user_idx
  on public.billing_orders (user_id, created_at desc);

alter table public.billing_orders enable row level security;
drop policy if exists "user reads own orders" on public.billing_orders;
create policy "user reads own orders" on public.billing_orders
  for select to authenticated using (user_id = auth.uid());

-- 3. Trigger: every new auth.users row gets a default free-plan billing row
create or replace function public.handle_new_user_billing()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_billing (user_id, plan, tokens_allowance, free_questions_used)
  values (new.id, 'free', 0, 0)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_billing on auth.users;
create trigger on_auth_user_created_billing
  after insert on auth.users
  for each row execute function public.handle_new_user_billing();

-- 4. Backfill any existing users that pre-date this migration
insert into public.user_billing (user_id, plan, tokens_allowance, free_questions_used)
select id, 'free', 0, 0 from auth.users
on conflict (user_id) do nothing;

-- 5. Atomic quota increment (service-role only)
create or replace function public.billing_increment(
  p_user_id         uuid,
  p_weighted_tokens bigint,
  p_is_free         boolean
) returns void language sql as $$
  update public.user_billing
     set tokens_used         = case when p_is_free then tokens_used else tokens_used + p_weighted_tokens end,
         free_questions_used = case when p_is_free then free_questions_used + 1 else free_questions_used end,
         updated_at          = now()
   where user_id = p_user_id;
$$;
revoke all on function public.billing_increment from public;
grant execute on function public.billing_increment to service_role;

-- 6. updated_at auto-maintenance
create or replace function public.touch_user_billing_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists user_billing_touch_updated on public.user_billing;
create trigger user_billing_touch_updated
  before update on public.user_billing
  for each row execute function public.touch_user_billing_updated_at();
