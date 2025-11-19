-- Fix corrupted schema_definition for troubleshooting_modules table
-- Reset to empty array so it can be synced from database
UPDATE admin_content_tables 
SET schema_definition = '[]'::jsonb
WHERE table_name = 'troubleshooting_modules'
  AND (
    schema_definition IS NULL 
    OR jsonb_typeof(schema_definition) != 'array'
  );