-- Physics.explained — billing hardening: guard billing_increment, CHECK on order state, tighten grants
-- Follow-up to 0004_billing.sql addressing code-review feedback.

-- 1. Replace billing_increment with input guard + single updated_at source (trigger)
create or replace function public.billing_increment(
  p_user_id         uuid,
  p_weighted_tokens bigint,
  p_is_free         boolean
) returns void language plpgsql as $$
begin
  if not p_is_free and (p_weighted_tokens is null or p_weighted_tokens <= 0) then
    raise exception 'billing_increment: p_weighted_tokens must be positive for paid plan, got %', p_weighted_tokens;
  end if;
  update public.user_billing
     set tokens_used         = case when p_is_free then tokens_used else tokens_used + p_weighted_tokens end,
         free_questions_used = case when p_is_free then free_questions_used + 1 else free_questions_used end
   where user_id = p_user_id;
end;
$$;

-- Re-assert tight grants on the new function body
revoke all on function public.billing_increment(uuid, bigint, boolean) from public, anon, authenticated;
grant execute on function public.billing_increment(uuid, bigint, boolean) to service_role;

-- 2. Add CHECK on billing_orders.state (align with webhook-handler state set)
alter table public.billing_orders
  drop constraint if exists billing_orders_state_check;
alter table public.billing_orders
  add constraint billing_orders_state_check
  check (state in ('pending','completed','failed','refunded'));
