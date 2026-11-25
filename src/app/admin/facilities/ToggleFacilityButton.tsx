'use client';
import { useTransition } from 'react';
import { toggleFacilityActive } from '@/lib/facilities/actions';

interface Props { facilityId: string; isActive: boolean; }

export default function ToggleFacilityButton({ facilityId, isActive }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleFacilityActive(facilityId, !isActive);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
      }`}
    >
      {isPending ? '…' : isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}
