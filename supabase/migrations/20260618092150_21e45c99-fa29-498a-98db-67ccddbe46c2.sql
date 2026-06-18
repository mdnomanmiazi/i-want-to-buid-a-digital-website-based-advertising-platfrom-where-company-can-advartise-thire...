
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles are publicly readable" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'company_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ENUMS for ads
CREATE TYPE public.ad_plan AS ENUM ('single', 'monthly', 'yearly');
CREATE TYPE public.ad_status AS ENUM ('pending_payment', 'pending_review', 'active', 'rejected', 'expired');

-- ADS
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  original_price NUMERIC(10,2),
  offer_price NUMERIC(10,2) NOT NULL,
  discount_percent INT,
  image_url TEXT,
  link_url TEXT,
  contact_phone TEXT,
  location TEXT,
  plan public.ad_plan NOT NULL,
  status public.ad_status NOT NULL DEFAULT 'pending_payment',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  transaction_id TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.ads TO service_role;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active ads publicly readable" ON public.ads
  FOR SELECT USING (status = 'active' AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "users read own ads" ON public.ads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all ads" ON public.ads
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own ads" ON public.ads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own ads" ON public.ads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins update any ad" ON public.ads
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users delete own ads" ON public.ads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_ads_status_expires ON public.ads(status, expires_at);
CREATE INDEX idx_ads_user ON public.ads(user_id);
CREATE INDEX idx_ads_category ON public.ads(category);

-- PAYMENTS
CREATE TABLE public.ad_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tran_id TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  plan public.ad_plan NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated',
  gateway_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.ad_payments TO authenticated;
GRANT ALL ON public.ad_payments TO service_role;
ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own payments" ON public.ad_payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all payments" ON public.ad_payments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own payments" ON public.ad_payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own payments" ON public.ad_payments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_ads_updated BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.ad_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
