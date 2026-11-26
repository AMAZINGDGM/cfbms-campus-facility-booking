'use server';

import { createClient } from '@/lib/supabase/server';
import { createBookingSchema, rejectBookingSchema } from './validation';
import { revalidatePath } from 'next/cache';

export async function createBooking(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  const rawData = {
    facility_id: formData.get('facility_id') as string,
    activity_title: formData.get('activity_title') as string,
    purpose: formData.get('purpose') as string,
    participant_count: formData.get('participant_count') as string,
    start_at: formData.get('start_at') as string,
    end_at: formData.get('end_at') as string,
  };

  const parsed = createBookingSchema.safeParse(rawData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError.message };
  }

  const data = parsed.data;

  // Application-level validation (BR-05).
  // Migration 00003 also enforces active status and capacity in PostgreSQL,
  // so direct Data API requests cannot bypass this business rule.
  const { data: facility, error: facilityError } = await supabase
    .from('facilities')
    .select('capacity, is_active')
    .eq('id', data.facility_id)
    .single();

  if (facilityError || !facility) {
    return { error: 'Facility not found' };
  }

  if (!facility.is_active) {
    return { error: 'This facility is currently unavailable' };
  }

  if (data.participant_count > facility.capacity) {
    return { error: `Participant count exceeds facility capacity of ${facility.capacity}` };
  }

  // PostgreSQL exclusion constraint handles overlapping active bookings.
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      requester_id: user.id,
      facility_id: data.facility_id,
      activity_title: data.activity_title,
      purpose: data.purpose,
      participant_count: data.participant_count,
      start_at: data.start_at,
      end_at: data.end_at,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23P01') {
      return { error: 'This time slot conflicts with an existing booking. Please choose a different time.' };
    }
    if (error.code === '23514') {
      return { error: error.message };
    }
    return { error: error.message };
  }

  revalidatePath('/requester/bookings');
  revalidatePath('/admin/bookings');
  return { data: booking };
}

export async function approveBooking(bookingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  // Verify Administrator role (BR-14).
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'administrator') {
    return { error: 'Only administrators can approve bookings' };
  }

  // Atomic conditional update:
  // only a row that is still Pending can transition to Approved.
  // This prevents two concurrent administrators from both receiving success.
  const { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'approved' })
    .eq('id', bookingId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    if (error.code === '23P01') {
      return { error: 'Cannot approve: this time slot now conflicts with another booking' };
    }
    return { error: error.message };
  }

  if (!updatedBooking) {
    return { error: 'Booking was not found or is no longer pending' };
  }

  revalidatePath('/admin/bookings');
  revalidatePath('/requester/bookings');
  return { success: true };
}

export async function rejectBooking(bookingId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  // Verify Administrator role (BR-14).
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'administrator') {
    return { error: 'Only administrators can reject bookings' };
  }

  const rawReason = formData.get('rejection_reason');
  const parsed = rejectBookingSchema.safeParse({
    rejection_reason: typeof rawReason === 'string' ? rawReason.trim() : '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Atomic conditional update:
  // only a row that is still Pending can transition to Rejected.
  const { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({
      status: 'rejected',
      rejection_reason: parsed.data.rejection_reason,
    })
    .eq('id', bookingId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!updatedBooking) {
    return { error: 'Booking was not found or is no longer pending' };
  }

  revalidatePath('/admin/bookings');
  revalidatePath('/requester/bookings');
  return { success: true };
}
