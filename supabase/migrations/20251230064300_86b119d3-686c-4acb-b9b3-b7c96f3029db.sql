-- Update the handle_new_user function to auto-assign admin role for specific phone numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_phone text;
  clean_phone text;
  assigned_role app_role;
BEGIN
  -- Get the phone number from metadata
  user_phone := COALESCE(NEW.raw_user_meta_data ->> 'phone', '');
  
  -- Clean the phone number (remove spaces, dashes, parentheses, and +91 prefix)
  clean_phone := regexp_replace(user_phone, '[\s\-\(\)\+]', '', 'g');
  IF clean_phone LIKE '91%' AND length(clean_phone) > 10 THEN
    clean_phone := substring(clean_phone from 3);
  END IF;
  IF clean_phone LIKE '0%' THEN
    clean_phone := substring(clean_phone from 2);
  END IF;
  
  -- Check if phone matches admin phones
  IF clean_phone IN ('9831037455', '9007038444') THEN
    assigned_role := 'admin';
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