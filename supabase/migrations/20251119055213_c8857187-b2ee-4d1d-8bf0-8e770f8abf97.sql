-- Add route_override column to admin_content_tables
ALTER TABLE admin_content_tables 
ADD COLUMN route_override TEXT;

-- Update existing content tables with their custom routes
UPDATE admin_content_tables 
SET route_override = '/admin/training/skills' 
WHERE table_name = 'skills';

UPDATE admin_content_tables 
SET route_override = '/admin/training/modules' 
WHERE table_name = 'foundation_modules';

UPDATE admin_content_tables 
SET route_override = '/admin/training/troubleshooting' 
WHERE table_name = 'troubleshooting_issues';

UPDATE admin_content_tables 
SET route_override = '/admin/dogs/breeds' 
WHERE table_name = 'dog_breeds';

UPDATE admin_content_tables 
SET route_override = '/admin/dogs/vaccines' 
WHERE table_name = 'vaccination_records';

UPDATE admin_content_tables 
SET route_override = '/admin/dogs/treatments' 
WHERE table_name = 'medical_treatments';