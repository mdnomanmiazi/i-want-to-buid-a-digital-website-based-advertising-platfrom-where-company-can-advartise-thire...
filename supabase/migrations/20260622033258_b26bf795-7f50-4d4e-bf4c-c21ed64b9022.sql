CREATE OR REPLACE FUNCTION public.promote_ad_on_payment_paid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_days int;
  v_plan text;
BEGIN
  IF NEW.payment_status = 'paid' AND NEW.ad_id IS NOT NULL THEN
    SELECT plan INTO v_plan FROM public.ads WHERE id = NEW.ad_id;
    v_days := CASE v_plan WHEN 'yearly' THEN 365 WHEN 'monthly' THEN 30 ELSE 30 END;

    -- Initial activation OR renewal: reset window and require admin approval again
    UPDATE public.ads
    SET status = 'waiting_for_admin_approval',
        starts_at = now(),
        expires_at = now() + (v_days || ' days')::interval,
        rejection_reason = NULL
    WHERE id = NEW.ad_id
      AND status IN ('draft', 'payment_pending', 'expired', 'approved', 'rejected');

    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Auto-expire approved ads whose window has ended (called on demand from app)
CREATE OR REPLACE FUNCTION public.expire_old_ads()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  UPDATE public.ads
  SET status = 'expired'
  WHERE status = 'approved'
    AND expires_at IS NOT NULL
    AND expires_at <= now();
$$;

GRANT EXECUTE ON FUNCTION public.expire_old_ads() TO authenticated, anon;