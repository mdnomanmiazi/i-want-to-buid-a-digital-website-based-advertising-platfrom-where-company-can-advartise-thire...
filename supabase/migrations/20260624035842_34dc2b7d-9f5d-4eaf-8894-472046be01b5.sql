
-- Add multi-image support to ads
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

-- Storage policies for ad-images bucket
CREATE POLICY "Users can upload to their own folder in ad-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ad-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own ad-images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'ad-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own ad-images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'ad-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated can read ad-images"
ON storage.objects FOR SELECT TO authenticated, anon
USING (bucket_id = 'ad-images');
