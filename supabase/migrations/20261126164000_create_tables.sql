-- Migration: 20261126164000_create_tables.sql
-- Description: Core tables, constraints, indexes, and triggers for CFBMS

-- 1. Enable btree_gist extension for exclusion constraint support
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'requester' CHECK (role IN ('requester', 'administrator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create facilities table
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  facility_type TEXT NOT NULL CHECK (facility_type IN ('classroom', 'fablab')),
  description TEXT,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE RESTRICT,
  activity_title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  participant_count INTEGER NOT NULL CHECK (participant_count > 0),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bookings_start_before_end CHECK (start_at < end_at)
);

-- Conflict detection exclusion constraint:
-- Prevents overlapping active/pending bookings for the same facility
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    facility_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status IN ('pending', 'approved'));

-- 5. Create booking_logs table
CREATE TABLE IF NOT EXISTS public.booking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_bookings_requester_id ON public.bookings(requester_id);
CREATE INDEX IF NOT EXISTS idx_bookings_facility_id ON public.bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_end_at ON public.bookings(start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id ON public.booking_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_facilities_facility_type ON public.facilities(facility_type);
CREATE INDEX IF NOT EXISTS idx_facilities_is_active ON public.facilities(is_active);

-- 7. Create updated_at trigger function and apply to profiles, facilities, bookings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_facilities_updated_at ON public.facilities;
CREATE TRIGGER set_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_bookings_updated_at ON public.bookings;
CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Create booking status log trigger function and trigger
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.booking_logs (booking_id, actor_id, old_status, new_status)
    VALUES (NEW.id, NEW.requester_id, NULL, NEW.status);
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.booking_logs (booking_id, actor_id, old_status, new_status, reason)
    VALUES (NEW.id, COALESCE(auth.uid(), NEW.requester_id), OLD.status, NEW.status, NEW.rejection_reason);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_booking_status_change ON public.bookings;
CREATE TRIGGER trg_booking_status_change
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change();

-- 9. Create handle_new_user trigger function that creates a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'requester'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
