import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getBookingsForRequester } from '@/lib/booking/queries';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CAMPUS_TIMEZONE } from '@/lib/constants';

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const bookings = await getBookingsForRequester(user.id);

  function fmt(dt: string) {
    return format(toZonedTime(new Date(dt), CAMPUS_TIMEZONE), 'dd MMM yyyy, HH:mm');
  }

  return (
    <DashboardLayout title="My Bookings">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{bookings?.length ?? 0} booking{bookings?.length !== 1 ? 's' : ''} total</p>
        <Link
          href="/requester/bookings/new"
          className="inline-flex items-center px-4 py-2 bg-[#14233B] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d4d] transition-colors"
        >
          + New Booking
        </Link>
      </div>

      {!bookings || bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-14 w-14" />}
          title="No bookings yet"
          description="You haven't submitted any booking requests. Browse facilities to get started."
          action={
            <Link href="/requester/facilities" className="inline-flex items-center px-4 py-2 bg-[#14233B] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d4d]">
              Browse Facilities
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facility</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">End</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#202938]">{b.activity_title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{b.purpose}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{(b.facility as {name:string})?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{fmt(b.start_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{format(toZonedTime(new Date(b.end_at), CAMPUS_TIMEZONE), 'HH:mm')}</td>
                  <td className="px-6 py-4"><Badge status={b.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/requester/bookings/${b.id}`} className="text-sm text-[#14233B] hover:underline font-medium">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
