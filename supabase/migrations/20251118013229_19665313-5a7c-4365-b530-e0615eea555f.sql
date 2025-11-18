-- Admin policies for troubleshooting_issues
CREATE POLICY "Admins can insert troubleshooting issues"
ON public.troubleshooting_issues
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update troubleshooting issues"
ON public.troubleshooting_issues
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete troubleshooting issues"
ON public.troubleshooting_issues
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for media_assets
CREATE POLICY "Admins can insert media assets"
ON public.media_assets
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update media assets"
ON public.media_assets
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media assets"
ON public.media_assets
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));