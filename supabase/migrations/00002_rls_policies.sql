-- Migration: 00002_rls_policies.sql
-- Description: Row Level Security (RLS) policies and helper functions for CFBMS

-- 1. Enable RLS on all 4 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_logs ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions for role-based access control
-- Helper: get current user role (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'administrator'
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================================
-- 3. Profiles RLS Policies
-- ============================================================================

-- SELECT own profile for authenticated users
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- SELECT all profiles for admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- UPDATE own profile (but NOT role field — users cannot change their own role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    role = public.get_user_role()
  );

-- Note: INSERT is handled automatically by the handle_new_user trigger on auth.users

-- ============================================================================
-- 4. Facilities RLS Policies
-- ============================================================================

-- SELECT active facilities for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view active facilities" ON public.facilities;
CREATE POLICY "Authenticated users can view active facilities"
  ON public.facilities
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- SELECT all facilities for admins (admins see both active and inactive)
DROP POLICY IF EXISTS "Admins can view all facilities" ON public.facilities;
CREATE POLICY "Admins can view all facilities"
  ON public.facilities
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- INSERT for admins only
DROP POLICY IF EXISTS "Admins can insert facilities" ON public.facilities;
CREATE POLICY "Admins can insert facilities"
  ON public.facilities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE for admins only
DROP POLICY IF EXISTS "Admins can update facilities" ON public.facilities;
CREATE POLICY "Admins can update facilities"
  ON public.facilities
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 5. Bookings RLS Policies
-- ============================================================================

-- SELECT own bookings for requesters
DROP POLICY IF EXISTS "Requesters can view own bookings" ON public.bookings;
CREATE POLICY "Requesters can view own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid());

-- SELECT all bookings for admins
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- INSERT own pending bookings for authenticated users (requester_id = auth.uid(), status must be 'pending')
DROP POLICY IF EXISTS "Authenticated users can insert own pending bookings" ON public.bookings;
CREATE POLICY "Authenticated users can insert own pending bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid() AND
    status = 'pending'
  );

-- UPDATE for admins only (approve/reject)
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
CREATE POLICY "Admins can update bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 6. Booking Logs RLS Policies
-- ============================================================================

-- SELECT logs for own bookings (requester)
DROP POLICY IF EXISTS "Requesters can view logs for own bookings" ON public.booking_logs;
CREATE POLICY "Requesters can view logs for own bookings"
  ON public.booking_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_logs.booking_id
        AND bookings.requester_id = auth.uid()
    )
  );

-- SELECT all logs for admins
DROP POLICY IF EXISTS "Admins can view all booking logs" ON public.booking_logs;
CREATE POLICY "Admins can view all booking logs"
  ON public.booking_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Note: INSERT via trigger only (log_booking_status_change has SECURITY DEFINER).
-- No direct client INSERT policy is granted on booking_logs.
