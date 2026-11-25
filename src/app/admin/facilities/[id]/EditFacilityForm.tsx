'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { updateFacility } from '@/lib/facilities/actions';

interface Facility {
  id: string; name: string; facility_type: string;
  location: string; capacity: number; description: string | null; is_active: boolean;
}

export default function EditFacilityForm({ facility }: { facility: Facility }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateFacility(facility.id, formData);
      if (result?.error) setError(result.error);
      else router.push('/admin/facilities');
    });
  }

  return (
    <>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Facility Name *" name="name" defaultValue={facility.name} required minLength={2} />
          <Select
            label="Facility Type *"
            name="facility_type"
            required
            defaultValue={facility.facility_type}
            options={[{ value: 'classroom', label: 'Classroom' }, { value: 'fablab', label: 'FabLab' }]}
          />
          <Input label="Location *" name="location" defaultValue={facility.location} required minLength={2} />
          <Input label="Capacity *" type="number" name="capacity" defaultValue={facility.capacity} required min={1} max={1000} />
          <Textarea label="Description" name="description" defaultValue={facility.description ?? ''} rows={3} />
          <div>
            <label className="block text-sm font-medium text-[#202938] mb-1">Status</label>
            <select name="is_active" defaultValue={facility.is_active ? 'true' : 'false'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[#202938] bg-white focus:outline-none focus:ring-2 focus:ring-[#14233B]">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" isLoading={isPending}>Save Changes</Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </div>
    </>
  );
}
