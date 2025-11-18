-- Add images field to skills table to store ordered image URLs
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN skills.images IS 'Array of image objects with url and order: [{"url": "path/to/image.jpg", "order": 1}]';