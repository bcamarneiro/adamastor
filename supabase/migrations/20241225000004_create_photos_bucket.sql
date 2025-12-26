-- Create storage bucket for deputy photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('deputy-photos', 'deputy-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to photos
CREATE POLICY "Public read access for deputy photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'deputy-photos');

-- Allow service role to upload photos
CREATE POLICY "Service role can upload deputy photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'deputy-photos');

-- Allow service role to update photos
CREATE POLICY "Service role can update deputy photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'deputy-photos');
