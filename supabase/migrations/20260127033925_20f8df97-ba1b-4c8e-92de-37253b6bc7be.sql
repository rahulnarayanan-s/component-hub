-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.normalize_component_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_component_defaults()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_name = public.normalize_component_name(NEW.name);
  NEW.updated_at = now();
  IF NEW.category IS NULL OR NEW.category = '' THEN
    NEW.category = 'General';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;