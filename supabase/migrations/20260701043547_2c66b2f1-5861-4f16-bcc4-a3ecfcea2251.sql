-- Phase 1: account_type on profiles
DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM ('end_user', 'advertiser', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type public.account_type NOT NULL DEFAULT 'end_user',
  ADD COLUMN IF NOT EXISTS username text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- New signups: honor account_type from raw_user_meta_data (defaults to end_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_type public.account_type;
BEGIN
  v_type := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'account_type', '')::public.account_type,
    'end_user'::public.account_type
  );
  INSERT INTO public.profiles (id, company_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', split_part(NEW.email, '@', 1)),
    v_type
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$fn$;
