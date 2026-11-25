import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import Badge from '@/components/ui/Badge';
import { getRequesterDashboardStats, getBookingsForRequester } from '@/lib/booking/queries';
import { CalendarDays, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CAMPUS_TIMEZONE } from '@/lib/constants';
import { toZonedTime } from 'date-fns-tz';

export default async function RequesterDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [stats, recentBookings] = await Promise.all([
    getRequesterDashboardStats(user.id),
    getBookingsForRequester(user.id),
  ]);

  const upcoming = recentBookings
    ?.filter((b) => b.status === 'approved' && new Date(b.start_at) > new Date())
    .slice(0, 3) ?? [];

  const recent = recentBookings?.slice(0, 5) ?? [];

  function formatJakarta(dt: string) {
    return format(toZonedTime(new Date(dt), CAMPUS_TIMEZONE), 'dd MMM yyyy, HH:mm');
  }

  return (
    <DashboardLayout title="My Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Bookings" value={stats.totalBookings} icon={<CalendarDays className="h-6 w-6" />} />
        <StatsCard label="Pending"  value={stats.pendingRequests}  icon={<Clock         className="h-6 w-6" />} highlight />
        <StatsCard label="Approved" value={stats.approvedBookings} icon={<CheckCircle   className="h-6 w-6" />} />
        <StatsCard label="Rejected" value={stats.rejectedBookings} icon={<XCircle       className="h-6 w-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming reservations */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#202938]">Upcoming Reservations</h2>
            <Link href="/requester/bookings" className="text-sm text-[#14233B] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">No upcoming reservations</p>
            ) : upcoming.map((b) => (
              <div key={b.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#202938]">{b.activity_title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{(b.facility as {name:string})?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatJakarta(b.start_at)} – {format(toZonedTime(new Date(b.end_at), CAMPUS_TIMEZONE), 'HH:mm')}</p>
                  </div>
                  <Badge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#202938]">Recent Bookings</h2>
            <Link href="/requester/bookings/new" className="text-sm font-medium bg-[#14233B] text-white px-3 py-1.5 rounded-lg hover:bg-[#1a2d4d] transition-colors">
              + New Booking
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">No bookings yet</p>
            ) : recent.map((b) => (
              <Link key={b.id} href={`/requester/bookings/${b.id}`} className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[#202938]">{b.activity_title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatJakarta(b.start_at)}</p>
                  </div>
                  <Badge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
