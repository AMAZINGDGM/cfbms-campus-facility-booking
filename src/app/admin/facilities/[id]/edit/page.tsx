import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFacilityById } from '@/lib/facilities/queries';
import EditFacilityForm from '../EditFacilityForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFacilityPage(props: PageProps) {
  const { id } = await props.params;

  let facility;
  try {
    facility = await getFacilityById(id);
  } catch {
    notFound();
  }

  return (
    <DashboardLayout title={`Edit: ${facility.name}`}>
      <div className="max-w-2xl">
        <EditFacilityForm facility={facility} />
      </div>
    </DashboardLayout>
  );
}
