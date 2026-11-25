import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/StatsCard';
import Badge from '@/components/ui/Badge';
import { getDashboardStats, getRecentBookings } from '@/lib/booking/queries';
import { Building2, ClipboardList, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CAMPUS_TIMEZONE } from '@/lib/constants';

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    getRecentBookings(8),
  ]);

  function fmt(dt: string) {
    return format(toZonedTime(new Date(dt), CAMPUS_TIMEZONE), 'dd MMM yyyy, HH:mm');
  }

  return (
    <DashboardLayout title="Administrator Dashboard">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard label="Active Facilities" value={stats.totalFacilities} icon={<Building2 className="h-6 w-6" />} />
        <StatsCard label="Total Bookings" value={stats.totalBookings} icon={<ClipboardList className="h-6 w-6" />} />
        <StatsCard label="Pending"  value={stats.pendingRequests}  icon={<Clock       className="h-6 w-6" />} highlight />
        <StatsCard label="Approved" value={stats.approvedBookings} icon={<CheckCircle className="h-6 w-6" />} />
        <StatsCard label="Rejected" value={stats.rejectedBookings} icon={<XCircle     className="h-6 w-6" />} />
      </div>

      {/* Quick actions */}
      {stats.pendingRequests > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {stats.pendingRequests} pending booking request{stats.pendingRequests !== 1 ? 's' : ''} awaiting review
              </p>
              <p className="text-xs text-amber-600">Review and approve or reject requests promptly</p>
            </div>
          </div>
          <Link
            href="/admin/bookings?status=pending"
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#202938]">Recent Booking Activity</h2>
          <Link href="/admin/bookings" className="text-sm text-[#14233B] hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facility</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {recent?.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#202938]">{b.activity_title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{(b.requester as {full_name:string})?.full_name ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{(b.facility as {name:string})?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{fmt(b.start_at)}</td>
                  <td className="px-6 py-4"><Badge status={b.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/bookings/${b.id}`} className="text-sm text-[#14233B] hover:underline font-medium">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
