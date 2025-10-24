import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications';
import { useToast } from '@/hooks/use-toast';

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const Notifications: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const unreadCount = items.reduce((acc, it) => acc + (it.isRead ? 0 : 1), 0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications({ page: 1, limit: 50 });
      setItems(data.notifications || []);
    } catch (err: any) {
      toast({ title: 'Failed to load notifications', description: err?.message || 'Try again later', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setItems(prev => prev.map(p => p._id === id ? { ...p, isRead: true } : p));
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.message || 'Could not mark read', variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      setItems(prev => prev.filter(p => p._id !== id));
      toast({ title: 'Deleted', description: 'Notification removed' });
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.message || 'Could not delete', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <div className="relative inline-flex items-center">
            <span className="block">Notifications</span>
            {unreadCount > 0 && (
              <span
                aria-live="polite"
                className="absolute -top-2 -right-4 bg-red-600 text-white text-[10px] font-semibold rounded-full px-2 leading-none"
                title={`${unreadCount} unread notifications`}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">Your recent notifications</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={fetchNotifications} disabled={loading}>Refresh</Button>
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                await notificationsApi.markAllRead();
                setItems(prev => prev.map(i => ({ ...i, isRead: true })));
                toast({ title: 'Marked all read' });
              } catch (err: any) { toast({ title: 'Failed', description: err?.message || 'Could not mark all', variant: 'destructive' }); }
            }}>Mark all read</Button>
            <Button size="sm" onClick={() => { setItems([]); toast({ title: 'Cleared (local)', description: 'Cleared notifications locally' }); }}>Clear</Button>
          </div>
        </div>

        {items.length === 0 && <div className="text-sm text-muted-foreground">No notifications</div>}

        <div className="space-y-3">
          {items.map(n => (
            <div key={n._id} className={`p-3 rounded border ${n.isRead ? 'bg-white' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{n.title}</div>
                  <div className="text-sm text-muted-foreground">{n.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!n.isRead && <Button size="sm" variant="outline" onClick={() => markRead(n._id)}>Mark read</Button>}
                  <Button size="sm" variant="ghost" onClick={() => remove(n._id)}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Notifications;
