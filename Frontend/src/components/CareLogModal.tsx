import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CareLog, CreateCareLogData, UpdateCareLogData } from '../lib/api/careLogs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface CareLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCareLogData | UpdateCareLogData) => Promise<void>;
  careLog?: CareLog | null;
  plantId: string;
}

export const CareLogModal: React.FC<CareLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  careLog,
  plantId,
}) => {
  const [formData, setFormData] = useState<CreateCareLogData>({
    plantId,
    careType: 'watering',
    notes: '',
    date: new Date(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (careLog) {
      setFormData({
        plantId: careLog.plantId,
        careType: careLog.careType,
        notes: careLog.notes || '',
        photos: careLog.photos,
        careData: careLog.careData,
        date: new Date(careLog.date),
      });
    } else {
      setFormData({
        plantId,
        careType: 'watering',
        notes: '',
        date: new Date(),
      });
    }
  }, [careLog, plantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving care log:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {careLog ? 'Edit Care Log' : 'Add Care Log'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <Label htmlFor="careType">Care Type</Label>
            <select
              id="careType"
              value={formData.careType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  careType: e.target.value as any,
                })
              }
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="watering">Watering</option>
              <option value="fertilizing">Fertilizing</option>
              <option value="pruning">Pruning</option>
              <option value="repotting">Repotting</option>
              <option value="pestControl">Pest Control</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date: new Date(e.target.value),
                })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any notes about this care activity..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
