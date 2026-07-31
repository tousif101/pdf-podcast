-- Postgres grants EXECUTE on new functions to PUBLIC by default, which would
-- let any signed-in user call these via the publishable key (leaking any
-- user's balance, or minting refunds). Only the secret-key role should invoke
-- them; the app always calls through the admin client.
revoke execute on function public.credit_balance(uuid) from public, anon, authenticated;
revoke execute on function public.spend_credits(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.refund_episode(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
