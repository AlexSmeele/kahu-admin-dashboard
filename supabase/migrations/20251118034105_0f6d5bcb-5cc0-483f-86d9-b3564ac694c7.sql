-- Ensure RLS is enabled on skills table
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Allow admins to insert skills
CREATE POLICY "Admins can insert skills"
  ON public.skills
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update skills
CREATE POLICY "Admins can update skills"
  ON public.skills
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete skills
CREATE POLICY "Admins can delete skills"
  ON public.skills
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));