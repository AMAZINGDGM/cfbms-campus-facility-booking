'use client';
import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { createBooking } from '@/lib/booking/actions';
import { CAMPUS_TIMEZONE } from '@/lib/constants';

interface Facility { id: string; name: string; capacity: number; facility_type: string; }

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFacilityId = searchParams.get('facility_id') ?? '';

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch('/api/facilities').then(r => r.json()).then(setFacilities).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createBooking(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/requester/bookings'), 2000);
      }
    });
  }

  if (success) {
    return (
      <DashboardLayout title="New Booking">
        <div className="max-w-xl">
          <Alert variant="success">
            <strong>Booking submitted successfully!</strong> Your request is pending administrator review.
            Redirecting to your bookings…
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // Get today's date in Jakarta timezone for min date
  const nowJakarta = new Date().toLocaleString('en-CA', { timeZone: CAMPUS_TIMEZONE }).split(',')[0];

  return (
    <DashboardLayout title="New Booking Request">
      <div className="max-w-2xl">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
          <strong>Important:</strong> All booking requests require administrator approval. Submitting a request does not guarantee reservation. Time slots are reserved while your request is pending.
        </div>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Facility */}
            <div>
              <label htmlFor="facility_id" className="block text-sm font-medium text-[#202938] mb-1">
                Facility <span className="text-red-500">*</span>
              </label>
              <select
                id="facility_id"
                name="facility_id"
                required
                defaultValue={preselectedFacilityId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[#202938] bg-white focus:outline-none focus:ring-2 focus:ring-[#14233B] focus:border-transparent"
              >
                <option value="">Select a facility…</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name} (capacity: {f.capacity})</option>
                ))}
              </select>
            </div>

            {/* Activity title */}
            <Input
              label="Activity Title *"
              name="activity_title"
              placeholder="e.g., Student Council Meeting, Python Workshop"
              required
              minLength={3}
              maxLength={200}
            />

            {/* Purpose */}
            <Textarea
              label="Booking Purpose *"
              name="purpose"
              placeholder="Describe the purpose and activities planned for this booking (at least 10 characters)"
              required
              minLength={10}
              maxLength={1000}
              rows={4}
            />

            {/* Participant count */}
            <Input
              label="Number of Participants *"
              type="number"
              name="participant_count"
              placeholder="e.g., 25"
              required
              min={1}
              helperText="Must not exceed the facility capacity"
            />

            {/* Date and times */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Date *"
                type="date"
                name="booking_date"
                required
                min={nowJakarta}
                id="booking_date"
              />
              <Input
                label="Start Time *"
                type="time"
                name="start_time"
                required
                id="start_time"
              />
              <Input
                label="End Time *"
                type="time"
                name="end_time"
                required
                id="end_time"
              />
            </div>

            {/* Hidden fields combining date + time into ISO */}
            <input type="hidden" name="start_at" id="start_at_hidden" />
            <input type="hidden" name="end_at" id="end_at_hidden" />

            <div className="flex gap-3 pt-2">
              <Button type="submit" size="lg" isLoading={isPending}>
                Submit Booking Request
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Client script to combine date+time into ISO string */}
      <script dangerouslySetInnerHTML={{__html: `
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.querySelector('form');
          form.addEventListener('submit', function(e) {
            const date = document.getElementById('booking_date').value;
            const startTime = document.getElementById('start_time').value;
            const endTime = document.getElementById('end_time').value;
            if (date && startTime && endTime) {
              // Build ISO string in Jakarta timezone offset (+07:00)
              document.getElementById('start_at_hidden').value = date + 'T' + startTime + ':00+07:00';
              document.getElementById('end_at_hidden').value = date + 'T' + endTime + ':00+07:00';
            }
          }, true);
        });
      `}} />
    </DashboardLayout>
  );
}
