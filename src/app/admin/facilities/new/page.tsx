'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { createFacility } from '@/lib/facilities/actions';

export default function NewFacilityPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createFacility(formData);
      if (result?.error) setError(result.error);
      else router.push('/admin/facilities');
    });
  }

  return (
    <DashboardLayout title="Add New Facility">
      <div className="max-w-2xl">
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Facility Name *" name="name" placeholder="e.g., Demo Classroom A" required minLength={2} />
            <Select
              label="Facility Type *"
              name="facility_type"
              required
              options={[{ value: 'classroom', label: 'Classroom' }, { value: 'fablab', label: 'FabLab' }]}
              placeholder="Select type…"
            />
            <Input label="Location *" name="location" placeholder="e.g., Building A, Floor 2, Room 201" required minLength={2} />
            <Input label="Capacity *" type="number" name="capacity" placeholder="e.g., 40" required min={1} max={1000} helperText="Maximum number of people" />
            <Textarea label="Description" name="description" placeholder="Describe the facility and its intended uses…" rows={3} />
            <div className="flex gap-3 pt-2">
              <Button type="submit" size="lg" isLoading={isPending}>Create Facility</Button>
              <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
