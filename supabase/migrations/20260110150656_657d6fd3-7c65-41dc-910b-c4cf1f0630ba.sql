-- Create table for multiple about banners
CREATE TABLE public.about_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.about_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can view active banners (for public display)
CREATE POLICY "Anyone can view active banners"
ON public.about_banners
FOR SELECT
USING (is_active = true);

-- Admins can view all banners
CREATE POLICY "Admins can view all banners"
ON public.about_banners
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert banners
CREATE POLICY "Admins can insert banners"
ON public.about_banners
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update banners
CREATE POLICY "Admins can update banners"
ON public.about_banners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete banners
CREATE POLICY "Admins can delete banners"
ON public.about_banners
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_about_banners_updated_at
BEFORE UPDATE ON public.about_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();