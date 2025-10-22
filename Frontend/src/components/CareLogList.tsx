import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import { CareLog } from '../lib/api/careLogs';
import { formatCareType, getCareTypeIcon, formatRelativeTime } from '../utils/careUtils';
import { Button } from './ui/button';

interface CareLogListProps {
  careLogs: CareLog[];
  onEdit: (careLog: CareLog) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export const CareLogList: React.FC<CareLogListProps> = ({
  careLogs,
  onEdit,
  onDelete,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading care logs...</div>
      </div>
    );
  }

  if (careLogs.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No care logs yet.</p>
        <p className="text-sm mt-2">Start tracking your plant care activities!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {careLogs.map((log) => (
        <div
          key={log._id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="text-2xl">{getCareTypeIcon(log.careType)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {formatCareType(log.careType)}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(log.date)}
                  </span>
                </div>
                {log.notes && (
                  <p className="text-sm text-gray-600 mt-1">{log.notes}</p>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(log.date).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(log)}
                className="text-gray-600 hover:text-blue-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(log._id)}
                className="text-gray-600 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
