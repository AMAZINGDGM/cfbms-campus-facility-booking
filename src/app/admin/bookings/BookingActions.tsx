'use client';
import { useState, useTransition } from 'react';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import { approveBooking, rejectBooking } from '@/lib/booking/actions';
import { useRouter } from 'next/navigation';

interface BookingActionsProps { bookingId: string; }

export default function BookingActions({ bookingId }: BookingActionsProps) {
  const router = useRouter();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isApprovePending, startApprove] = useTransition();
  const [isRejectPending, startReject] = useTransition();

  function handleApprove() {
    setError(null);
    startApprove(async () => {
      const result = await approveBooking(bookingId);
      if (result?.error) setError(result.error);
      else { setSuccess('Booking approved successfully.'); router.refresh(); }
    });
  }

  function handleRejectSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startReject(async () => {
      const result = await rejectBooking(bookingId, formData);
      if (result?.error) setError(result.error);
      else { setShowRejectModal(false); setSuccess('Booking rejected.'); router.refresh(); }
    });
  }

  return (
    <div>
      {error && <Alert variant="error" className="mb-3">{error}</Alert>}
      {success && <Alert variant="success" className="mb-3">{success}</Alert>}
      {!success && (
        <div className="flex gap-3">
          <Button onClick={handleApprove} isLoading={isApprovePending} size="lg">
            ✓ Approve
          </Button>
          <Button variant="danger" size="lg" onClick={() => setShowRejectModal(true)}>
            ✕ Reject
          </Button>
        </div>
      )}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Booking">
        <p className="text-sm text-gray-600 mb-4">
          Provide a clear reason for rejecting this booking request. The requester will see this reason.
        </p>
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <Textarea
            label="Rejection Reason *"
            name="rejection_reason"
            placeholder="e.g., The facility is unavailable for maintenance during this time…"
            required
            minLength={5}
            maxLength={500}
            rows={4}
          />
          <div className="flex gap-3">
            <Button type="submit" variant="danger" isLoading={isRejectPending}>Confirm Rejection</Button>
            <Button type="button" variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
