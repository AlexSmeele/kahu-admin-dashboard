-- Create storage bucket for media assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-assets',
  'media-assets',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
);

-- Allow admins to upload media
CREATE POLICY "Admins can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-assets' AND
  (SELECT has_role(auth.uid(), 'admin'))
);

-- Allow admins to update media
CREATE POLICY "Admins can update media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-assets' AND
  (SELECT has_role(auth.uid(), 'admin'))
);

-- Allow admins to delete media
CREATE POLICY "Admins can delete media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-assets' AND
  (SELECT has_role(auth.uid(), 'admin'))
);

-- Allow public read access to media assets
CREATE POLICY "Public can view media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media-assets');

-- Enable RLS on media_assets table
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Allow admins full access to media_assets
CREATE POLICY "Admins can manage media assets"
ON media_assets
FOR ALL
TO authenticated
USING ((SELECT has_role(auth.uid(), 'admin')))
WITH CHECK ((SELECT has_role(auth.uid(), 'admin')));

-- Allow public to view published media assets
CREATE POLICY "Public can view published media"
ON media_assets
FOR SELECT
TO public
USING (is_published = true);