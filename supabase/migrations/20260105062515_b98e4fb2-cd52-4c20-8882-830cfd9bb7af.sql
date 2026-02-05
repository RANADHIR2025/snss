-- Create admin_invitations table
CREATE TABLE public.admin_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can view invitations
CREATE POLICY "Admins can view invitations"
ON public.admin_invitations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations"
ON public.admin_invitations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.admin_invitations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user function to use invitations instead of phone numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assigned_role app_role;
  invitation_record RECORD;
BEGIN
  -- Check if user was invited as admin (by email)
  SELECT * INTO invitation_record
  FROM public.admin_invitations
  WHERE email = NEW.email
    AND used_at IS NULL
    AND expires_at > now();
  
  IF FOUND THEN
    assigned_role := 'admin';
    -- Mark invitation as used
    UPDATE public.admin_invitations
    SET used_at = now()
    WHERE id = invitation_record.id;
  ELSE
    assigned_role := 'user';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, phone, email, joined_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    NEW.email,
    now()
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$;

-- Create audit log for admin role changes
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  target_email TEXT,
  target_user_id UUID,
  performed_by UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));