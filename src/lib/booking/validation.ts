import { z } from 'zod';
import { CAMPUS_TIMEZONE } from '@/lib/constants';

export const createBookingSchema = z.object({
  facility_id: z.string().uuid('Invalid facility ID'),
  activity_title: z.string().min(3, 'Activity title must be at least 3 characters').max(200, 'Activity title too long'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters').max(1000, 'Purpose too long'),
  participant_count: z.coerce.number().int().positive('Participant count must be positive'),
  start_at: z.string().min(1, 'Start time is required'),
  end_at: z.string().min(1, 'End time is required'),
}).refine(
  (data) => new Date(data.start_at) < new Date(data.end_at),
  { message: 'Start time must be before end time', path: ['end_at'] }
).refine(
  (data) => {
    const now = new Date();
    const startAt = new Date(data.start_at);
    return startAt > now;
  },
  { message: 'Booking start time must be in the future', path: ['start_at'] }
);

export const rejectBookingSchema = z.object({
  rejection_reason: z.string().min(5, 'Rejection reason must be at least 5 characters').max(500, 'Rejection reason too long'),
});

export const createFacilitySchema = z.object({
  name: z.string().min(2, 'Facility name must be at least 2 characters').max(200),
  facility_type: z.enum(['classroom', 'fablab']),
  description: z.string().max(1000).optional().or(z.literal('')),
  location: z.string().min(2, 'Location is required').max(300),
  capacity: z.coerce.number().int().positive('Capacity must be positive').max(1000, 'Capacity too large'),
});

export const updateFacilitySchema = createFacilitySchema.extend({
  is_active: z.coerce.boolean().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RejectBookingInput = z.infer<typeof rejectBookingSchema>;
export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;

// Re-export CAMPUS_TIMEZONE for convenience
export { CAMPUS_TIMEZONE };
