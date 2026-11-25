import { createClient } from '@/lib/supabase/server';
import type { BookingFilters } from '@/types';

export async function getBookingsForRequester(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, facility:facilities(*)')
    .eq('requester_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBookingById(bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, facility:facilities(*), requester:profiles(*)')
    .eq('id', bookingId)
    .single();

  if (error) throw error;
  return data;
}

export async function getBookingLogs(bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('booking_logs')
    .select('*, actor:profiles(full_name, email)')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAllBookings(filters?: BookingFilters) {
  const supabase = await createClient();
  let query = supabase
    .from('bookings')
    .select('*, facility:facilities(*), requester:profiles(*)');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.facility_id) {
    query = query.eq('facility_id', filters.facility_id);
  }
  if (filters?.date_from) {
    query = query.gte('start_at', filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte('end_at', filters.date_to);
  }
  if (filters?.search) {
    query = query.or(`activity_title.ilike.%${filters.search}%,purpose.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getBookingsForFacility(facilityId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('bookings')
    .select('id, activity_title, start_at, end_at, status')
    .eq('facility_id', facilityId)
    .in('status', ['pending', 'approved']);

  if (startDate) query = query.gte('start_at', startDate);
  if (endDate) query = query.lte('end_at', endDate);

  const { data, error } = await query.order('start_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getDashboardStats() {
  const supabase = await createClient();

  const [facilitiesRes, bookingsRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
    supabase.from('facilities').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
  ]);

  return {
    totalFacilities: facilitiesRes.count ?? 0,
    totalBookings: bookingsRes.count ?? 0,
    pendingRequests: pendingRes.count ?? 0,
    approvedBookings: approvedRes.count ?? 0,
    rejectedBookings: rejectedRes.count ?? 0,
  };
}

export async function getRecentBookings(limit: number = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, facility:facilities(name), requester:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getRequesterDashboardStats(userId: string) {
  const supabase = await createClient();

  const [totalRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('requester_id', userId),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('requester_id', userId).eq('status', 'pending'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('requester_id', userId).eq('status', 'approved'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('requester_id', userId).eq('status', 'rejected'),
  ]);

  return {
    totalBookings: totalRes.count ?? 0,
    pendingRequests: pendingRes.count ?? 0,
    approvedBookings: approvedRes.count ?? 0,
    rejectedBookings: rejectedRes.count ?? 0,
  };
}
