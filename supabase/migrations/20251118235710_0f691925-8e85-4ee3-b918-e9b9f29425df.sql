-- Create admin_sections table for managing content sections
CREATE TABLE IF NOT EXISTS public.admin_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_content_tables table for managing dynamic content tables
CREATE TABLE IF NOT EXISTS public.admin_content_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.admin_sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  table_name TEXT NOT NULL UNIQUE, -- Actual database table name
  schema_definition JSONB NOT NULL DEFAULT '[]'::jsonb, -- Field definitions
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_content_tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_sections (admin-only access)
CREATE POLICY "Admins can view sections"
  ON public.admin_sections
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sections"
  ON public.admin_sections
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sections"
  ON public.admin_sections
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sections"
  ON public.admin_sections
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_content_tables (admin-only access)
CREATE POLICY "Admins can view content tables"
  ON public.admin_content_tables
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert content tables"
  ON public.admin_content_tables
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update content tables"
  ON public.admin_content_tables
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content tables"
  ON public.admin_content_tables
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger for admin_sections
CREATE TRIGGER update_admin_sections_updated_at
  BEFORE UPDATE ON public.admin_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for admin_content_tables
CREATE TRIGGER update_admin_content_tables_updated_at
  BEFORE UPDATE ON public.admin_content_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections for existing content
INSERT INTO public.admin_sections (name, display_name, description, icon, order_index) VALUES
  ('training-content', 'Training Content', 'Manage training skills, modules, and troubleshooting resources', 'GraduationCap', 1),
  ('dog-knowledge', 'Dog Knowledge Base', 'Manage breeds, health issues, vaccines, and treatments', 'BookOpen', 2),
  ('media-library', 'Media Library', 'Manage media assets and files', 'Image', 3),
  ('system-management', 'System Management', 'User management, invitations, and system settings', 'Settings', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert default content tables for existing admin pages
INSERT INTO public.admin_content_tables (section_id, name, display_name, table_name, description, order_index)
SELECT 
  s.id,
  'skills',
  'Skills',
  'skills',
  'Training skills and exercises',
  1
FROM public.admin_sections s WHERE s.name = 'training-content'
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.admin_content_tables (section_id, name, display_name, table_name, description, order_index)
SELECT 
  s.id,
  'modules',
  'Modules',
  'course_modules',
  'Training course modules',
  2
FROM public.admin_sections s WHERE s.name = 'training-content'
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.admin_content_tables (section_id, name, display_name, table_name, description, order_index)
SELECT 
  s.id,
  'troubleshooting',
  'Troubleshooting',
  'troubleshooting_issues',
  'Common training issues and solutions',
  3
FROM public.admin_sections s WHERE s.name = 'training-content'
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.admin_content_tables (section_id, name, display_name, table_name, description, order_index)
SELECT 
  s.id,
  'breeds',
  'Breeds',
  'dog_breeds',
  'Dog breed information',
  1
FROM public.admin_sections s WHERE s.name = 'dog-knowledge'
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.admin_content_tables (section_id, name, display_name, table_name, description, order_index)
SELECT 
  s.id,
  'vaccines',
  'Vaccines',
  'vaccine_types',
  'Vaccine types and schedules',
  2
FROM public.admin_sections s WHERE s.name = 'dog-knowledge'
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.admin_content_tables (section_id, name, display_name, table_name, description, order_index)
SELECT 
  s.id,
  'treatments',
  'Treatments',
  'treatment_types',
  'Treatment types and protocols',
  3
FROM public.admin_sections s WHERE s.name = 'dog-knowledge'
ON CONFLICT (name) DO NOTHING;