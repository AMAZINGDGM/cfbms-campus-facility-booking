import DashboardLayout from '@/components/layout/DashboardLayout';
import { getActiveFacilities } from '@/lib/facilities/queries';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import { Building2, MapPin, Users } from 'lucide-react';

export default async function FacilitiesPage() {
  const facilities = await getActiveFacilities();

  return (
    <DashboardLayout title="Facility Catalog">
      <p className="text-sm text-gray-500 mb-6">
        Browse available campus facilities. Select a facility to view details and check availability.
      </p>

      {facilities.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-14 w-14" />}
          title="No facilities available"
          description="There are currently no active facilities. Please check back later."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <Link
              key={facility.id}
              href={`/requester/facilities/${facility.id}`}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#14233B]/30 transition-all group"
            >
              {/* Color header */}
              <div className={`h-3 rounded-t-xl ${facility.facility_type === 'fablab' ? 'bg-purple-500' : 'bg-[#14233B]'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-semibold text-[#202938] group-hover:text-[#14233B] leading-tight">
                    {facility.name}
                  </h3>
                  <Badge status={facility.facility_type} />
                </div>
                {facility.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{facility.description}</p>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{facility.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Capacity: {facility.capacity}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs font-medium text-[#14233B] group-hover:underline">
                    View details &amp; availability →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
