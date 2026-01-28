-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS roll_number text UNIQUE,
ADD COLUMN IF NOT EXISTS employee_id text UNIQUE;

-- Update handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  selected_role app_role;
BEGIN
  -- Get role from metadata or default to student
  selected_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'student'::app_role
  );
  
  -- Insert profile with all fields
  INSERT INTO public.profiles (id, email, full_name, roll_number, employee_id)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN selected_role = 'student' THEN NEW.raw_user_meta_data->>'roll_number' ELSE NULL END,
    CASE WHEN selected_role = 'staff' THEN NEW.raw_user_meta_data->>'employee_id' ELSE NULL END
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);
  
  RETURN NEW;
END;
$function$;