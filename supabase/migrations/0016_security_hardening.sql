--------------------------------------------------------------------------------
-- 0016_security_hardening
--   1. Public form tables: remove the anon INSERT policies. The server actions
--      (app/actions/contact.ts, email-signup.ts) insert with the service role
--      after the CAPTCHA and rate-limit checks; the policies let anyone holding
--      the public anon key skip both and write rows directly through the API.
--   2. Functions meant for the server only: revoke EXECUTE from anon and
--      authenticated explicitly (0005 did this for billing_increment).
--   3. Atomic per-IP rate limit: count and record a hit in one call, serialised
--      per (route, ip), so parallel requests cannot all pass the same count.
--      Also prunes old rows, which nothing did before unless pg_cron was set up.
--------------------------------------------------------------------------------

-- 1. Public form tables ------------------------------------------------------
drop policy if exists "anon can submit contact message" on public.contact_messages;
drop policy if exists "anon can sign up for branch updates" on public.email_signups;

-- 2. Server-only functions ---------------------------------------------------
revoke all on function public.ask_increment_usage(uuid, date, int, bigint, bigint, int, int, bigint)
  from public, anon, authenticated;
revoke all on function public.increment_problem_diagnoses_used_today(uuid) from public, anon, authenticated;
revoke all on function public.increment_problem_ocr_used_today(uuid) from public, anon, authenticated;
revoke all on function public.match_problem_from_ocr(text, text[], text[], text) from public, anon, authenticated;

grant execute on function public.ask_increment_usage(uuid, date, int, bigint, bigint, int, int, bigint) to service_role;
grant execute on function public.increment_problem_diagnoses_used_today(uuid) to service_role;
grant execute on function public.increment_problem_ocr_used_today(uuid) to service_role;
grant execute on function public.match_problem_from_ocr(text, text[], text[], text) to service_role;

-- 3. Atomic rate limit -------------------------------------------------------
create or replace function public.rate_limit_hit(
  p_route_key      text,
  p_ip_hash        text,
  p_max            int,
  p_window_seconds int
) returns table (allowed boolean, hits int)
language plpgsql
set search_path = public
as $$
declare
  v_count int;
begin
  -- One caller at a time per (route, ip); released at transaction end.
  perform pg_advisory_xact_lock(hashtextextended(p_route_key || '|' || p_ip_hash, 0));

  select count(*) into v_count
    from public.request_rate_limits
   where route_key = p_route_key
     and ip_hash   = p_ip_hash
     and created_at >= now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max then
    return query select false, v_count;
    return;
  end if;

  insert into public.request_rate_limits (route_key, ip_hash) values (p_route_key, p_ip_hash);

  -- Opportunistic retention: about 1 call in 50 removes a bounded batch of
  -- rows older than a day (no window is longer than that).
  if random() < 0.02 then
    delete from public.request_rate_limits
     where id in (
       select id from public.request_rate_limits
        where created_at < now() - interval '1 day'
        order by created_at
        limit 5000
     );
  end if;

  return query select true, v_count + 1;
end;
$$;

revoke all on function public.rate_limit_hit(text, text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, text, int, int) to service_role;
