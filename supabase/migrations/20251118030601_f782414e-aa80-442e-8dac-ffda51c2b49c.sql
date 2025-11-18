-- Add video_url column to skills table
ALTER TABLE public.skills
ADD COLUMN IF NOT EXISTS video_url TEXT;