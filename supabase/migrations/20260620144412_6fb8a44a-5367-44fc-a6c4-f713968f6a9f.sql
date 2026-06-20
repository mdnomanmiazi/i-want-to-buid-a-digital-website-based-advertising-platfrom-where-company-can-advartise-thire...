
-- Drop dependent policy temporarily so we can swap the enum
DROP POLICY IF EXISTS "active ads publicly readable" ON public.ads;

-- 1) Rebuild ad_status enum with spec-aligned values
CREATE TYPE public.ad_status_new AS ENUM (
  'draft',
  'payment_pending',
  'waiting_for_admin_approval',
  'approved',
  'rejected',
  'refunded',
  'expired'
);

ALTER TABLE public.ads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.ads
  ALTER COLUMN status TYPE public.ad_status_new
  USING (
    CASE status::text
      WHEN 'pending_payment' THEN 'payment_pending'
      WHEN 'pending_review'  THEN 'waiting_for_admin_approval'
      WHEN 'active'          THEN 'approved'
      ELSE status::text
    END
  )::public.ad_status_new;
ALTER TABLE public.ads ALTER COLUMN status SET DEFAULT 'draft'::public.ad_status_new;

DROP TYPE public.ad_status;
ALTER TYPE public.ad_status_new RENAME TO ad_status;

-- Recreate public-read policy with new status value
CREATE POLICY "approved ads publicly readable" ON public.ads FOR SELECT
  USING (status = 'approved'::public.ad_status AND (expires_at IS NULL OR expires_at > now()));

-- 2) Payment + refund status enums
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','cancelled');
CREATE TYPE public.refund_status  AS ENUM ('none','pending','completed','failed');

-- 3) Extend ad_payments
ALTER TABLE public.ad_payments
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS refund_status public.refund_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

UPDATE public.ad_payments SET payment_status = 'paid'::public.payment_status WHERE status = 'paid';
UPDATE public.ad_payments SET payment_status = 'failed'::public.payment_status WHERE status = 'failed';

-- 4) refunds table
CREATE TABLE public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.ad_payments(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  status public.refund_status NOT NULL DEFAULT 'pending',
  reason text,
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own refunds" ON public.refunds FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "admins read all refunds" ON public.refunds FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins insert refunds" ON public.refunds FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins update refunds" ON public.refunds FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER trg_refunds_updated BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_refunds_user ON public.refunds(user_id);
CREATE INDEX idx_refunds_payment ON public.refunds(payment_id);

-- 5) admin_actions audit log
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.ad_payments(id) ON DELETE SET NULL,
  refund_id uuid REFERENCES public.refunds(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read admin_actions" ON public.admin_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins insert admin_actions" ON public.admin_actions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "users read own admin_actions" ON public.admin_actions FOR SELECT TO authenticated
  USING (auth.uid() = target_user_id);
CREATE INDEX idx_admin_actions_admin ON public.admin_actions(admin_id);
CREATE INDEX idx_admin_actions_ad ON public.admin_actions(ad_id);

-- 6) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refunds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_actions;

ALTER TABLE public.ads REPLICA IDENTITY FULL;
ALTER TABLE public.ad_payments REPLICA IDENTITY FULL;
ALTER TABLE public.refunds REPLICA IDENTITY FULL;
