import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { remindersApi, Reminder } from '@/lib/api/reminders';
import { notificationsApi } from '@/lib/api/notifications';
import { useToast } from '@/hooks/use-toast';
import { Plant } from '@/types/plant';
import { Bell, CheckCircle, Plus, RefreshCw, Clock, Trash } from 'lucide-react';
import DateTimePicker from '@/components/DateTimePicker';

type Props = {
  plants: Plant[];
};

export default function SimpleReminders({ plants }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('Water plants');
  const [dueAt, setDueAt] = useState<string>(() => {
    const dt = new Date(Date.now() + 60 * 60 * 1000); // +1h default
    dt.setSeconds(0); dt.setMilliseconds(0);
    return dt.toISOString();
  });
  const [notes, setNotes] = useState('');
  const [plantId, setPlantId] = useState<string | ''>('');

  const refresh = async () => {
    setLoading(true); setError(null);
    try {
      // Fetch all pending reminders (not limited to 7-day window) so user-visible reminders stored in DB appear
      const allPending = await remindersApi.getReminders({ status: 'pending' });
      const sorted = (allPending || []).sort((a,b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
      setReminders(sorted);
    } catch (e: any) {
      setError(e?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);
  // Auto-refresh periodically so items naturally move between Upcoming/Overdue
  useEffect(() => {
    const id = setInterval(() => { refresh(); }, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const created = await remindersApi.createReminder({
        title: title.trim() || 'Reminder',
        dueAt: new Date(dueAt).toISOString(),
        notes: notes.trim() || undefined,
        plantId: plantId || undefined,
      });
      setReminders(prev => [...prev, created].sort((a,b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()));
      setNotes('');
  // Ensure server-state is synced (and any server-side changes are reflected)
  await refresh();
      // Create server-side notification and show in-app toast
      try {
        await notificationsApi.createNotification({
          type: 'reminder',
          title: `Reminder: ${created.title}`,
          message: `Scheduled for ${new Date(created.dueAt).toLocaleString()}`,
          data: { reminderId: created._id }
        });
      } catch (err) {
        // ignore server-side notification failures
      }
      toast({ title: 'Reminder created', description: `We'll remind you at ${new Date(created.dueAt).toLocaleString()}` });
    } catch (e: any) {
      setError(e?.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const complete = async (id: string) => {
    try {
      const updated = await remindersApi.completeReminder(id);
      setReminders(prev => prev.filter(r => r._id !== id));
      return updated;
    } catch (e) { /* ignore */ }
  };

  const remove = async (id: string) => {
    try {
      await remindersApi.deleteReminder(id);
      setReminders(prev => prev.filter(r => r._id !== id));
    } catch (e) { /* ignore */ }
  };

  const snooze = async (id: string, hours: number) => {
    try {
      const newDue = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      const updated = await remindersApi.snoozeReminder(id, newDue);
      setReminders(prev => prev.map(r => r._id === id ? updated : r).sort((a,b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()));
    } catch (e) { /* ignore */ }
  };

  const upcoming = useMemo(() => reminders.filter(r => new Date(r.dueAt).getTime() >= Date.now()), [reminders]);
  const overdue = useMemo(() => reminders.filter(r => new Date(r.dueAt).getTime() < Date.now()), [reminders]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Simple Reminders
          </CardTitle>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Water basil" />
            </div>
            <div>
              <Label htmlFor="dueAt">Due at</Label>
              <DateTimePicker value={dueAt} onChange={setDueAt} />
            </div>
            <div>
              <Label htmlFor="plant">Plant (optional)</Label>
              <select id="plant" className="w-full h-9 border rounded px-2" value={plantId} onChange={e => setPlantId(e.target.value)}>
                <option value="">None</option>
                {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="~300ml, avoid leaves" />
          </div>
          <div>
            <Button onClick={handleCreate} disabled={loading}>
              <Plus className="w-4 h-4 mr-2" /> Add Reminder
            </Button>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Upcoming{upcoming.length ? ` (${upcoming.length})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && <div className="text-sm text-muted-foreground">No upcoming reminders</div>}
            {upcoming.map(r => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-blue-50 rounded border">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-muted-foreground">{r.notes || '—'}</div>
                  <div className="text-xs text-gray-500">Due: {new Date(r.dueAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => snooze(r._id, 24)}>
                    <Clock className="w-4 h-4 mr-1" /> +1d
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => snooze(r._id, 24*7)}>
                    <Clock className="w-4 h-4 mr-1" /> +1w
                  </Button>
                  <Button size="sm" onClick={() => complete(r._id)} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-1" /> Done
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r._id)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Overdue{overdue.length ? ` (${overdue.length})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdue.length === 0 && <div className="text-sm text-muted-foreground">No overdue reminders</div>}
            {overdue.map(r => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-yellow-700">{r.notes || '—'}</div>
                  <div className="text-xs text-gray-500">Overdue since: {new Date(r.dueAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => snooze(r._id, 24)}>
                    <Clock className="w-4 h-4 mr-1" /> +1d
                  </Button>
                  <Button size="sm" onClick={() => complete(r._id)} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-1" /> Done
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r._id)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
