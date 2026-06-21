
CREATE OR REPLACE FUNCTION public.promote_ad_on_payment_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days int;
  v_plan text;
BEGIN
  IF NEW.payment_status = 'paid'
     AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
     AND NEW.ad_id IS NOT NULL THEN

    SELECT plan INTO v_plan FROM public.ads WHERE id = NEW.ad_id;
    v_days := CASE v_plan WHEN 'yearly' THEN 365 WHEN 'monthly' THEN 30 ELSE 30 END;

    UPDATE public.ads
    SET status = 'waiting_for_admin_approval',
        starts_at = COALESCE(starts_at, now()),
        expires_at = COALESCE(expires_at, now() + (v_days || ' days')::interval)
    WHERE id = NEW.ad_id
      AND status IN ('draft', 'payment_pending');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_ad_on_payment_paid ON public.ad_payments;
CREATE TRIGGER trg_promote_ad_on_payment_paid
AFTER INSERT OR UPDATE OF payment_status ON public.ad_payments
FOR EACH ROW
EXECUTE FUNCTION public.promote_ad_on_payment_paid();
