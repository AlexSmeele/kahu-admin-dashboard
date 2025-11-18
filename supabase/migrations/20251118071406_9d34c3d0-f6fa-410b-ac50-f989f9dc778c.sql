-- Consolidate skills table SELECT policies
-- Remove duplicate/conflicting policies
DROP POLICY IF EXISTS "Anyone can view skills" ON skills;
DROP POLICY IF EXISTS "Authenticated users can view tricks" ON skills;

-- Keep only the clear, single public access policy
-- (Policy "Skills are viewable by everyone" already exists with qual: true)

-- Add admin write policies for foundation_modules
CREATE POLICY "Admins can insert foundation modules" 
ON foundation_modules FOR INSERT 
TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update foundation modules" 
ON foundation_modules FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete foundation modules" 
ON foundation_modules FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin write policies for course_modules
CREATE POLICY "Admins can insert course modules" 
ON course_modules FOR INSERT 
TO authenticated 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update course modules" 
ON course_modules FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete course modules" 
ON course_modules FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));