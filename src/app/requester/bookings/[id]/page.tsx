import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getBookingById, getBookingLogs } from '@/lib/booking/queries';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Link from 'next/link';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CAMPUS_TIMEZONE } from '@/lib/constants';
import { ArrowLeft, Calendar, Users, Building2, FileText, Clock } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage(props: PageProps) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  let booking;
  try {
    booking = await getBookingById(id);
  } catch {
    notFound();
  }

  // Requesters can only see their own bookings (also enforced by RLS)
  if (booking.requester_id !== user.id) notFound();

  const logs = await getBookingLogs(id);

  function fmt(dt: string) {
    return format(toZonedTime(new Date(dt), CAMPUS_TIMEZONE), 'dd MMM yyyy, HH:mm');
  }

  const facility = booking.facility as { name: string; location: string; capacity: number } | null;

  return (
    <DashboardLayout title="Booking Details">
      <div className="max-w-2xl">
        <Link href="/requester/bookings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#14233B] mb-5">
          <ArrowLeft className="h-4 w-4" /> Back to My Bookings
        </Link>

        {/* Status banner */}
        {booking.status === 'approved' && (
          <Alert variant="success" className="mb-4">Your booking has been <strong>approved</strong>! The facility is confirmed for your activity.</Alert>
        )}
        {booking.status === 'pending' && (
          <Alert variant="info" className="mb-4">Your booking is <strong>pending administrator review</strong>. The time slot is temporarily reserved.</Alert>
        )}
        {booking.status === 'rejected' && (
          <Alert variant="error" className="mb-4">
            Your booking was <strong>rejected</strong>.
            {booking.rejection_reason && <> Reason: <em>{booking.rejection_reason}</em></>}
          </Alert>
        )}

        {/* Main details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#202938]">{booking.activity_title}</h2>
            <Badge status={booking.status} />
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Facility</p>
                <p className="text-sm font-medium text-[#202938] mt-0.5">{facility?.name ?? '—'}</p>
                <p className="text-xs text-gray-500">{facility?.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Participants</p>
                <p className="text-sm font-medium text-[#202938] mt-0.5">{booking.participant_count} people</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Start</p>
                <p className="text-sm font-medium text-[#202938] mt-0.5">{fmt(booking.start_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">End</p>
                <p className="text-sm font-medium text-[#202938] mt-0.5">{fmt(booking.end_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Purpose</p>
                <p className="text-sm text-gray-700 mt-0.5">{booking.purpose}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit log */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-[#202938]">Status History</h3>
          </div>
          <div className="p-4 space-y-3">
            {logs?.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#C6A45C] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#202938]">
                    Status changed {log.old_status ? `from <strong>${log.old_status}</strong> ` : ''}to <strong>{log.new_status}</strong>
                  </p>
                  {log.reason && <p className="text-xs text-gray-500 italic mt-0.5">Reason: {log.reason}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
