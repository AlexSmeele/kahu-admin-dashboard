-- Create troubleshooting_issues table
CREATE TABLE public.troubleshooting_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_name TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  problem_description TEXT NOT NULL,
  signs TEXT,
  root_causes TEXT,
  recommended_steps TEXT,
  linked_skill_ids UUID[],
  linked_module_ids UUID[],
  dos TEXT,
  donts TEXT,
  media_urls TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.troubleshooting_issues ENABLE ROW LEVEL SECURITY;

-- Anyone can view published issues
CREATE POLICY "Anyone can view published troubleshooting issues"
ON public.troubleshooting_issues
FOR SELECT
USING (is_published = true);

-- Create media_assets table for Media Library
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL, -- 'video', 'image', 'document'
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER, -- for videos
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Anyone can view published media
CREATE POLICY "Anyone can view published media assets"
ON public.media_assets
FOR SELECT
USING (is_published = true);

-- Add updated_at trigger for troubleshooting_issues
CREATE TRIGGER update_troubleshooting_issues_updated_at
BEFORE UPDATE ON public.troubleshooting_issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for media_assets
CREATE TRIGGER update_media_assets_updated_at
BEFORE UPDATE ON public.media_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();