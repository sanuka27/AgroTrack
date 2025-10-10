import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  open: boolean;
  initialReason?: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  title?: string;
}

export const ModerationModal: React.FC<Props> = ({ open, initialReason = '', onClose, onSubmit, title = 'Moderation Reason' }) => {
  const [reason, setReason] = useState(initialReason);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!reason || reason.trim().length < 5) {
      setError('Reason must be at least 5 characters.');
      return;
    }
    try {
      setLoading(true);
      await onSubmit(reason.trim());
      onClose();
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for moderation..."
                className="w-full border rounded p-2 h-28"
              />
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModerationModal;
