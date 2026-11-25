import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllBookings } from '@/lib/booking/queries';
import { getAllFacilities } from '@/lib/facilities/queries';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { History, Calendar, ArrowLeft } from 'lucide-react';
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
  searchParams?: Promise<SearchParams>;
}

export default async function AdminBookingHistoryPage(props: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'administrator') {
    redirect('/requester/dashboard');
  }

  const sp = (await props.searchParams) ?? {};

  // Status can be filtered to 'approved' or 'rejected'; if not specified, query both
  const selectedStatus = sp.status === 'approved' || sp.status === 'rejected' ? sp.status : undefined;

  const filters: BookingFilters = {
    status: selectedStatus as BookingStatus | undefined,
    facility_id: sp.facility_id || undefined,
    search: sp.search || undefined,
  };

  const [rawBookings, facilities] = await Promise.all([
    getAllBookings(filters),
    getAllFacilities(),
  ]);

  // History includes only Approved and Rejected bookings (excludes pending)
  const historyBookings = (rawBookings ?? []).filter((b) => b.status === 'approved' || b.status === 'rejected');

  function fmt(dt: string) {
    return format(toZonedTime(new Date(dt), CAMPUS_TIMEZONE), 'dd MMM yyyy, HH:mm');
  }

  return (
    <DashboardLayout title="Booking History">
      {/* Back navigation & summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#14233B] transition-colors mb-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Active Requests
          </Link>
          <p className="text-sm text-gray-500">
            Archived record of all decided booking requests (Approved and Rejected).
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg">
          {historyBookings.length} total historical record{historyBookings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter bar */}
      <form method="GET" className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <select
          name="status"
          defaultValue={sp.status ?? ''}
          aria-label="Filter by Status"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#202938] bg-white focus:outline-none focus:ring-2 focus:ring-[#14233B]"
        >
          <option value="">All Historical (Approved &amp; Rejected)</option>
          <option value="approved">Approved Only</option>
          <option value="rejected">Rejected Only</option>
        </select>

        <select
          name="facility_id"
          defaultValue={sp.facility_id ?? ''}
          aria-label="Filter by Facility"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#202938] bg-white focus:outline-none focus:ring-2 focus:ring-[#14233B]"
        >
          <option value="">All Facilities</option>
          {facilities?.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <input
          name="search"
          type="text"
          defaultValue={sp.search ?? ''}
          placeholder="Search activity or purpose…"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-[#202938] bg-white focus:outline-none focus:ring-2 focus:ring-[#14233B] w-64"
        />

        <button
          type="submit"
          className="px-4 py-2 bg-[#14233B] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d4d] transition-colors"
        >
          Filter
        </button>

        {(sp.status || sp.facility_id || sp.search) && (
          <Link
            href="/admin/bookings/history"
            className="px-4 py-2 border border-gray-300 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </Link>
        )}
      </form>

      {/* Bookings table or empty state */}
      {historyBookings.length === 0 ? (
        <EmptyState
          icon={<History className="h-14 w-14" />}
          title="No booking history found"
          description={
            sp.status || sp.facility_id || sp.search
              ? 'No historical bookings match your current filter criteria.'
              : 'There are no finalized (approved or rejected) bookings recorded in the system yet.'
          }
          action={
            sp.status || sp.facility_id || sp.search ? (
              <Link
                href="/admin/bookings/history"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#14233B] border border-[#14233B] rounded-lg hover:bg-gray-50"
              >
                Reset Filters
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facility</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date &amp; Time</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {historyBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-[#202938]">{b.activity_title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-sm">{b.purpose}</p>
                    {b.status === 'rejected' && b.rejection_reason && (
                      <p className="text-xs text-red-600 italic mt-1">
                        Reason: {b.rejection_reason}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#202938]">{(b.requester as { full_name?: string })?.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{(b.requester as { email?: string })?.email ?? ''}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#202938]">{(b.facility as { name?: string })?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400 capitalize">{(b.facility as { facility_type?: string })?.facility_type ?? ''}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>{fmt(b.start_at)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 pl-5">
                      to {format(toZonedTime(new Date(b.end_at), CAMPUS_TIMEZONE), 'HH:mm')} WIB
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={b.status} />
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="text-sm text-[#14233B] hover:underline font-medium"
                    >
                      View Details →
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
