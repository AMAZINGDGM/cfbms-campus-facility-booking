import { createClient } from '@/lib/supabase/server';

export async function getActiveFacilities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
}

export async function getAllFacilities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getFacilityById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getFacilityUtilization() {
  const supabase = await createClient();

  const { data: facilities, error: facilityError } = await supabase
    .from('facilities')
    .select('id, name, facility_type')
    .eq('is_active', true);

  if (facilityError) throw facilityError;

  const utilization = await Promise.all(
    (facilities || []).map(async (facility) => {
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('facility_id', facility.id);

      const { count: approvedBookings } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('facility_id', facility.id)
        .eq('status', 'approved');

      const { count: pendingBookings } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('facility_id', facility.id)
        .eq('status', 'pending');

      return {
        ...facility,
        totalBookings: totalBookings ?? 0,
        approvedBookings: approvedBookings ?? 0,
        pendingBookings: pendingBookings ?? 0,
      };
    })
  );

  return utilization;
}
