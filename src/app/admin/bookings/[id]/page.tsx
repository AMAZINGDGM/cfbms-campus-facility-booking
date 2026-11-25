import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getBookingById, getBookingLogs } from '@/lib/booking/queries';
import Badge from '@/components/ui/Badge';
import BookingActions from '../BookingActions';
import Link from 'next/link';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CAMPUS_TIMEZONE } from '@/lib/constants';
import { ArrowLeft, Building2, Users, Calendar, Clock, FileText, User } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBookingDetailPage(props: PageProps) {
  const { id } = await props.params;

  let booking;
  try {
    booking = await getBookingById(id);
  } catch {
    notFound();
  }

  const logs = await getBookingLogs(id);

  function fmt(dt: string) {
    return format(toZonedTime(new Date(dt), CAMPUS_TIMEZONE), 'dd MMM yyyy, HH:mm');
  }

  const facility = booking.facility as { name: string; location: string; capacity: number; facility_type: string } | null;
  const requester = booking.requester as { full_name: string; email: string } | null;

  return (
    <DashboardLayout title="Booking Review">
      <div className="max-w-2xl">
        <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#14233B] mb-5">
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
        </Link>

        {/* Booking details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#202938]">{booking.activity_title}</h2>
            <Badge status={booking.status} />
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Requester</p>
                <p className="text-sm font-medium text-[#202938] mt-0.5">{requester?.full_name ?? '—'}</p>
                <p className="text-xs text-gray-500">{requester?.email}</p>
              </div>
            </div>
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
                <p className="text-sm font-medium text-[#202938] mt-0.5">{booking.participant_count} / {facility?.capacity ?? '?'} max</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Date</p>
                <p className="text-sm font-medium text-[#202938] mt-0.5">{format(toZonedTime(new Date(booking.start_at), CAMPUS_TIMEZONE), 'dd MMM yyyy')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Time</p>
                <p className="text-sm font-medium text-[#202938] mt-0.5">
                  {format(toZonedTime(new Date(booking.start_at), CAMPUS_TIMEZONE), 'HH:mm')} – {format(toZonedTime(new Date(booking.end_at), CAMPUS_TIMEZONE), 'HH:mm')} (WIB)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Purpose</p>
                <p className="text-sm text-gray-700 mt-0.5">{booking.purpose}</p>
              </div>
            </div>
            {booking.rejection_reason && (
              <div className="sm:col-span-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-600 uppercase tracking-wider font-medium">Rejection Reason</p>
                <p className="text-sm text-red-700 mt-1">{booking.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin actions (only for pending) */}
        {booking.status === 'pending' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
            <h3 className="text-base font-semibold text-[#202938] mb-4">Administrative Action</h3>
            <BookingActions bookingId={booking.id} />
          </div>
        )}

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
                    {log.old_status ? `${log.old_status} → ${log.new_status}` : `Created as ${log.new_status}`}
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
