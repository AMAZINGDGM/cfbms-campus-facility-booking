import DashboardLayout from '@/components/layout/DashboardLayout';
import { getAllFacilities } from '@/lib/facilities/queries';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { Building2, MapPin, Users, Pencil } from 'lucide-react';
import ToggleFacilityButton from './ToggleFacilityButton';

export default async function AdminFacilitiesPage() {
  const facilities = await getAllFacilities();

  return (
    <DashboardLayout title="Facility Management">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{facilities?.length ?? 0} facilit{facilities?.length !== 1 ? 'ies' : 'y'} total</p>
        <Link
          href="/admin/facilities/new"
          className="inline-flex items-center px-4 py-2 bg-[#14233B] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d4d] transition-colors"
        >
          + Add Facility
        </Link>
      </div>

      {!facilities || facilities.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-14 w-14" />}
          title="No facilities"
          description="Add facilities to allow users to make booking requests."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {facilities.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#202938]">{f.name}</p>
                    {f.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{f.description}</p>}
                  </td>
                  <td className="px-6 py-4"><Badge status={f.facility_type} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {f.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      {f.capacity}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={f.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/facilities/${f.id}/edit`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <ToggleFacilityButton facilityId={f.id} isActive={f.is_active} />
                    </div>
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
