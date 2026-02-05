-- Create RLS policy for super_admins to view all roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create RLS policy for super_admins to delete admin roles (but not super_admin roles)
CREATE POLICY "Super admins can delete admin roles"
ON public.user_roles
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  AND role = 'admin'::app_role
);

-- Create RLS policy for super_admins to insert roles
CREATE POLICY "Super admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Update the has_role function to also grant admin privileges to super_admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role 
        OR (role = 'super_admin' AND _role = 'admin')
      )
  )
$$;