import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFacilityById } from '@/lib/facilities/queries';
import { getBookingsForFacility } from '@/lib/booking/queries';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { MapPin, Users, Info, Calendar, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CAMPUS_TIMEZONE } from '@/lib/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FacilityDetailPage(props: PageProps) {
  const { id } = await props.params;

  let facility;
  try {
    facility = await getFacilityById(id);
  } catch {
    notFound();
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(addMonths(now, 1));
  const bookings = await getBookingsForFacility(id, monthStart.toISOString(), monthEnd.toISOString());

  function fmt(dt: string) {
    return format(toZonedTime(new Date(dt), CAMPUS_TIMEZONE), 'dd MMM yyyy');
  }
  function fmtTime(dt: string) {
    return format(toZonedTime(new Date(dt), CAMPUS_TIMEZONE), 'HH:mm');
  }

  return (
    <DashboardLayout title={facility.name}>
      <div className="max-w-4xl">
        {/* Facility details */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className={`h-2 rounded-t-xl ${facility.facility_type === 'fablab' ? 'bg-purple-500' : 'bg-[#14233B]'}`} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#202938]">{facility.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{facility.description}</p>
              </div>
              <Badge status={facility.facility_type} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{facility.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-gray-400" />
                <span>Capacity: <strong>{facility.capacity}</strong> people</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                This is demonstration data for the CFBMS academic project. Facility details are simulated.
              </p>
            </div>
          </div>
        </div>

        {/* Existing bookings (availability) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#14233B]" />
            <h3 className="text-base font-semibold text-[#202938]">Existing Reservations (Next 2 Months)</h3>
          </div>
          <div className="p-4">
            {bookings && bookings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No existing reservations — this facility is fully available!</p>
            ) : (
              <div className="space-y-2">
                {bookings?.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-[#202938]">{b.activity_title}</p>
                        <p className="text-xs text-gray-500">
                          {fmt(b.start_at)} · {fmtTime(b.start_at)} – {fmtTime(b.end_at)}
                        </p>
                      </div>
                    </div>
                    <Badge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Book Now CTA */}
        <div className="flex gap-3">
          <Link
            href={`/requester/bookings/new?facility_id=${facility.id}`}
            className="inline-flex items-center px-6 py-3 bg-[#14233B] text-white text-sm font-medium rounded-lg hover:bg-[#1a2d4d] transition-colors"
          >
            Book This Facility
          </Link>
          <Link
            href="/requester/facilities"
            className="inline-flex items-center px-6 py-3 border-2 border-[#14233B] text-[#14233B] text-sm font-medium rounded-lg hover:bg-[#14233B] hover:text-white transition-colors"
          >
            Back to Catalog
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
