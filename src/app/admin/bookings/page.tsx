import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllBookings } from '@/lib/booking/queries';
import { getAllFacilities } from '@/lib/facilities/queries';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CAMPUS_TIMEZONE } from '@/lib/constants';
import type { BookingStatus, BookingFilters } from '@/types';

interface SearchParams {
  status?: string;
  facility_id?: string;
  search?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminBookingsPage(props: PageProps) {
  const sp = await props.searchParams;

  const filters: BookingFilters = {
    status: sp.status as BookingStatus | undefined,
    facility_id: sp.facility_id,
    search: sp.search,
  };

  const [bookings, facilities] = await Promise.all([
    getAllBookings(filters),
    getAllFacilities(),
  ]);

  function fmt(dt: string) {
    return format(toZonedTime(new Date(dt), CAMPUS_TIMEZONE), 'dd MMM yyyy, HH:mm');
  }

  return (
    <DashboardLayout title="Booking Requests">
      {/* Filter bar */}
      <form method="GET" className="flex flex-wrap gap-3 mb-5">
        <select name="status" defaultValue={sp.status ?? ''}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#202938] bg-white focus:outline-none focus:ring-2 focus:ring-[#14233B]">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select name="facility_id" defaultValue={sp.facility_id ?? ''}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#202938] bg-white focus:outline-none focus:ring-2 focus:ring-[#14233B]">
          <option value="">All Facilities</option>
          {facilities?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <input name="search" type="text" defaultValue={sp.search ?? ''}
          placeholder="Search activity or purpose…"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#202938] bg-white focus:outline-none focus:ring-2 focus:ring-[#14233B] w-64" />
        <button type="submit" className="px-4 py-2 bg-[#14233B] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d4d] transition-colors">
          Filter
        </button>
        {(sp.status || sp.facility_id || sp.search) && (
          <Link href="/admin/bookings" className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
            Clear
          </Link>
        )}
      </form>

      {!bookings || bookings.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-14 w-14" />}
          title="No bookings found"
          description="No booking requests match the current filters."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
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
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#202938]">{b.activity_title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{b.purpose}</p>
                  </td>
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
      )}
    </DashboardLayout>
  );
}
