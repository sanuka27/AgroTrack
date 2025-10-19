import React, { useState, useEffect } from 'react';
import { CheckCircle, UserPlus, Flag, FileText } from 'lucide-react';
import { adminApi } from '@/api/admin';

type ActivityKind = 'user_joined' | 'report_resolved' | 'report_submitted' | 'post_created';

interface Activity {
  id: string;
  kind: ActivityKind;
  message: string;
  ts: number;
}

const getActivityIcon = (kind: ActivityKind) => {
  switch (kind) {
    case 'report_resolved':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'user_joined':
      return <UserPlus className="w-4 h-4 text-blue-600" />;
    case 'report_submitted':
      return <Flag className="w-4 h-4 text-orange-600" />;
    case 'post_created':
      return <FileText className="w-4 h-4 text-purple-600" />;
    default:
      return <CheckCircle className="w-4 h-4 text-gray-600" />;
  }
};

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setIsLoading(true);
        const data = await adminApi.getRecentActivity(10);
        setActivities(data.activities);
      } catch (error) {
        console.error('Error loading recent activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();

    // Refresh activity every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 max-h-96 overflow-y-auto">
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div 
            key={activity.id} 
            className={`flex items-start space-x-3 p-2 rounded-lg transition-all duration-300 ${
              index === 0 ? 'bg-green-50 border border-green-200 animate-[slideIn_0.3s_ease-out]' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.kind)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 leading-tight">
                {activity.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimeAgo(activity.ts)}
              </p>
            </div>
          </div>
        ))}
        
        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Flag className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
