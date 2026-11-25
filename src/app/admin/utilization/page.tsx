import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFacilityUtilization } from '@/lib/facilities/queries';
import { getDashboardStats } from '@/lib/booking/queries';
import StatsCard from '@/components/ui/StatsCard';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { BarChart3, Building2, CheckCircle2, Clock, ArrowRight, Layers } from 'lucide-react';

export default async function AdminUtilizationPage() {
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

  const [utilizationData, overallStats] = await Promise.all([
    getFacilityUtilization(),
    getDashboardStats(),
  ]);

  const totalFacilities = utilizationData.length;
  const totalBookingsSum = utilizationData.reduce((acc, curr) => acc + curr.totalBookings, 0);
  const totalApprovedSum = utilizationData.reduce((acc, curr) => acc + curr.approvedBookings, 0);
  const totalPendingSum = utilizationData.reduce((acc, curr) => acc + curr.pendingBookings, 0);

  const overallApprovalRate =
    totalBookingsSum > 0 ? Math.round((totalApprovedSum / totalBookingsSum) * 100) : 0;

  return (
    <DashboardLayout title="Facility Utilization">
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Booking volume and allocation breakdown across all active campus facilities. Data is computed live from the database.
        </p>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Active Facilities"
          value={totalFacilities}
          icon={<Building2 className="h-6 w-6" />}
        />
        <StatsCard
          label="Total Reservations Logged"
          value={totalBookingsSum}
          icon={<Layers className="h-6 w-6" />}
        />
        <StatsCard
          label="Approved Reservations"
          value={totalApprovedSum}
          icon={<CheckCircle2 className="h-6 w-6" />}
          highlight
        />
        <StatsCard
          label="Pending In-Queue"
          value={totalPendingSum}
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      {/* Utilization breakdown list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
          <div>
            <h2 className="text-base font-semibold text-[#202938]">Facility Breakdown</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Cumulative booking metrics per registered room/laboratory
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" /> Other/Rejected
            </span>
          </div>
        </div>

        {utilizationData.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-14 w-14" />}
            title="No active facilities found"
            description="Add active facilities to begin tracking utilization metrics."
            action={
              <Link
                href="/admin/facilities/new"
                className="inline-flex items-center px-4 py-2 bg-[#14233B] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d4d]"
              >
                + Add Facility
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {utilizationData.map((facility) => {
              const approvalRate =
                facility.totalBookings > 0
                  ? Math.round((facility.approvedBookings / facility.totalBookings) * 100)
                  : 0;

              const approvedPct =
                facility.totalBookings > 0
                  ? (facility.approvedBookings / facility.totalBookings) * 100
                  : 0;
              const pendingPct =
                facility.totalBookings > 0
                  ? (facility.pendingBookings / facility.totalBookings) * 100
                  : 0;
              const otherPct = Math.max(0, 100 - approvedPct - pendingPct);

              return (
                <div
                  key={facility.id}
                  className="p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-[#202938]">{facility.name}</h3>
                      <Badge status={facility.facility_type} />
                    </div>
                    <Link
                      href={`/admin/facilities/${facility.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#14233B] hover:underline"
                    >
                      Manage Facility <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Utilization bar */}
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex mb-3">
                    {approvedPct > 0 && (
                      <div
                        style={{ width: `${approvedPct}%` }}
                        className="bg-green-500 h-full"
                        title={`Approved: ${facility.approvedBookings}`}
                      />
                    )}
                    {pendingPct > 0 && (
                      <div
                        style={{ width: `${pendingPct}%` }}
                        className="bg-yellow-400 h-full"
                        title={`Pending: ${facility.pendingBookings}`}
                      />
                    )}
                    {otherPct > 0 && (
                      <div
                        style={{ width: `${otherPct}%` }}
                        className="bg-gray-300 h-full"
                        title="Other / Rejected"
                      />
                    )}
                  </div>

                  {/* Stat numbers */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400">Total Bookings</p>
                      <p className="font-semibold text-gray-800 text-sm mt-0.5">
                        {facility.totalBookings}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Approved Bookings</p>
                      <p className="font-semibold text-green-700 text-sm mt-0.5">
                        {facility.approvedBookings}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Pending Review</p>
                      <p className="font-semibold text-amber-700 text-sm mt-0.5">
                        {facility.pendingBookings}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Approval Rate</p>
                      <p className="font-semibold text-[#14233B] text-sm mt-0.5">
                        {approvalRate}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aggregate System Metrics Card */}
      <div className="bg-[#14233B] text-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#C6A45C]">Overall System Approval Rate</h3>
            <p className="text-xs text-white/70 mt-1 max-w-md">
              Percentage of total campus reservation requests that have transitioned from pending review to approved status.
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-extrabold text-white">{overallApprovalRate}%</span>
            <p className="text-xs text-white/60 mt-1">
              {overallStats.approvedBookings} approved of {overallStats.totalBookings} total
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
