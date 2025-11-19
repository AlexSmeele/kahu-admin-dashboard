-- Add images column to foundation_modules table
ALTER TABLE public.foundation_modules 
ADD COLUMN images JSONB;