-- Migration: 00003_booking_integrity_hardening.sql
-- Purpose:
--   1. Enforce active-facility and participant-capacity rules at database level.
--   2. Require a non-empty rejection reason for rejected bookings.
--   3. Restrict booking status changes to Pending -> Approved/Rejected.
--   4. Restrict authenticated UPDATE access to status and rejection_reason only.
--
-- Decision baseline:
--   DEC-01: Facility capacity MUST be validated for every booking.
--
-- This is an additive migration. Do not edit 00001 or 00002.
-- Apply only after 00001_create_tables.sql and 00002_rls_policies.sql.

-- ============================================================================
-- 1. Enforce active facility and participant capacity on booking writes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_booking_facility_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_capacity INTEGER;
  v_is_active BOOLEAN;
BEGIN
  -- Lock the facility row while reading its current capacity and active status.
  -- This prevents a concurrent facility update from changing these values
  -- halfway through this booking validation.
  SELECT f.capacity, f.is_active
    INTO v_capacity, v_is_active
  FROM public.facilities AS f
  WHERE f.id = NEW.facility_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Facility % does not exist', NEW.facility_id
      USING ERRCODE = '23503';
  END IF;

  IF v_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Facility % is inactive and cannot be booked', NEW.facility_id
      USING ERRCODE = '23514';
  END IF;

  IF NEW.participant_count > v_capacity THEN
    RAISE EXCEPTION
      'Participant count (%) exceeds facility capacity (%)',
      NEW.participant_count,
      v_capacity
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_booking_facility_capacity() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_booking_facility_capacity
  ON public.bookings;

CREATE TRIGGER trg_enforce_booking_facility_capacity
  BEFORE INSERT OR UPDATE OF facility_id, participant_count
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_facility_capacity();

COMMENT ON FUNCTION public.enforce_booking_facility_capacity() IS
  'Rejects booking inserts or facility/participant changes when the facility is inactive or participant_count exceeds current facility capacity.';

-- ============================================================================
-- 2. Require a non-empty rejection reason for rejected bookings
-- ============================================================================

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE status = 'rejected'
      AND NULLIF(BTRIM(rejection_reason), '') IS NULL
  ) THEN
    RAISE EXCEPTION
      'Cannot apply migration 00003: existing rejected bookings contain an empty rejection_reason. Review and correct those records before retrying.';
  END IF;
END;
$preflight$;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_rejection_reason_required;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_rejection_reason_required
  CHECK (
    status <> 'rejected'
    OR NULLIF(BTRIM(rejection_reason), '') IS NOT NULL
  );

-- ============================================================================
-- 3. Enforce valid booking status transitions
--    Only Pending -> Approved or Pending -> Rejected is permitted.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_booking_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status <> 'pending' THEN
      RAISE EXCEPTION
        'Only pending bookings can be approved or rejected'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.status NOT IN ('approved', 'rejected') THEN
      RAISE EXCEPTION
        'A pending booking can only transition to approved or rejected'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.status = 'rejected'
       AND NULLIF(BTRIM(NEW.rejection_reason), '') IS NULL THEN
      RAISE EXCEPTION
        'A non-empty rejection reason is required'
        USING ERRCODE = '23514';
    END IF;

    -- Approved bookings must not retain a rejection reason.
    IF NEW.status = 'approved' THEN
      NEW.rejection_reason := NULL;
    END IF;
  ELSIF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION
      'The rejection reason can only be set during a Pending-to-Rejected transition'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.enforce_booking_status_transition() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_booking_status_transition
  ON public.bookings;

CREATE TRIGGER trg_enforce_booking_status_transition
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_status_transition();

COMMENT ON FUNCTION public.enforce_booking_status_transition() IS
  'Allows only Pending-to-Approved or Pending-to-Rejected transitions and requires a non-empty reason for rejection.';

-- ============================================================================
-- 4. Narrow the Administrator booking UPDATE policy
--    USING checks the existing row; WITH CHECK checks the resulting row.
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update bookings"
  ON public.bookings;

DROP POLICY IF EXISTS "Admins can transition pending bookings"
  ON public.bookings;

CREATE POLICY "Admins can transition pending bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    AND status = 'pending'
  )
  WITH CHECK (
    public.is_admin()
    AND status IN ('approved', 'rejected')
  );

-- ============================================================================
-- 5. Restrict authenticated UPDATE privileges to decision fields only
--    RLS still ensures that only Administrators can update booking rows.
-- ============================================================================

REVOKE UPDATE ON TABLE public.bookings
  FROM PUBLIC, anon, authenticated;

GRANT UPDATE (status, rejection_reason)
  ON TABLE public.bookings
  TO authenticated;

-- Ask PostgREST to refresh its schema/privilege cache after the migration.
NOTIFY pgrst, 'reload schema';
