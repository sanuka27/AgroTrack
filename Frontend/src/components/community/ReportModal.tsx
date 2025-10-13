import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { communityForumApi } from '../../api/communityForum';
import { ReportData } from '../../types/community';

interface ReportModalProps {
  targetType: 'post' | 'comment';
  targetId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or Advertisement' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'inappropriate-content', label: 'Inappropriate Content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'off-topic', label: 'Off-Topic' },
  { value: 'duplicate', label: 'Duplicate Content' },
  { value: 'other', label: 'Other' },
] as const;

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<ReportData['reason']>('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      await communityForumApi.createReport({
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Report Submitted
          </h3>
          <p className="text-sm text-muted-foreground">
            Thank you for helping keep our community safe. We'll review this report shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
  <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-foreground">
              Report {targetType === 'post' ? 'Post' : 'Comment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-muted-foreground mb-2">
              Reason for reporting
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportData['reason'])}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-card text-card-foreground"
              required
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">
              Additional details (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-card text-card-foreground resize-none"
              rows={3}
              placeholder="Provide any additional context..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground">
              Your report will be reviewed by our moderation team. False reports may result in account restrictions.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:bg-card-foreground/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-muted text-white rounded-lg transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
