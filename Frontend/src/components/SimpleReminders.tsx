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
  // Helper: extract actionable steps from analyzer text
  const parseActionableNotes = (raw?: string | null): string[] => {
    if (!raw) return [];
    const text = raw.replace(/\r/g, '\n');
    // Look for common markers
    const markers = ['Care Steps:', 'Immediate actions', 'Immediate Care Steps', 'Care steps:'];
    for (const marker of markers) {
      const idx = text.indexOf(marker);
      if (idx >= 0) {
        const after = text.slice(idx + marker.length).trim();
        // split on | or line breaks or bullets
        let parts = after.split('|').map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) {
          parts = after.split(/\n|•|\u2022|-|\*+/).map(s => s.trim()).filter(Boolean);
        }
        // stop at next section marker if present
        const stopIdx = parts.findIndex(p => /^(Prevention|Prevention Measures|Recommendations|Detected Issue)/i.test(p));
        if (stopIdx >= 0) parts = parts.slice(0, stopIdx);
        return parts.map(p => p.replace(/^[:\-\s]+/, '').trim()).filter(Boolean);
      }
    }
    // fallback: if text contains "AI Analysis" then try to grab lines after it
    if (text.includes('AI Analysis')) {
      const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
      // find likely Care Steps line
      const careLine = lines.find(l => /Care Steps:|Immediate actions/i.test(l));
      if (careLine) {
        const parts = careLine.replace(/.*?:/, '').split('|').map(s => s.trim()).filter(Boolean);
        return parts;
      }
    }
    return [];
  };
  const [loading, setLoading] = useState(false);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<Record<string, boolean>>({});
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
      // If notes look like AI analysis, store only actionable steps
      const actionable = parseActionableNotes(notes);
      const payloadNotes = actionable.length ? actionable.join(' | ') : (notes.trim() || undefined);

      const created = await remindersApi.createReminder({
        title: title.trim() || 'Reminder',
        dueAt: new Date(dueAt).toISOString(),
        notes: payloadNotes,
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
    // optimistic update: show the new due date immediately, revert on failure
    const newDue = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    const prev = reminders;
    try {
      setBusyIds(prevIds => [...prevIds, id]);
  // apply optimistic change locally and highlight the changed due date
  setReminders(curr => curr.map(r => r._id === id ? { ...r, dueAt: newDue } : r).sort((a,b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()));
  setHighlighted(prev => ({ ...prev, [id]: true }));
  // remove highlight after a moment (visual confirmation)
  setTimeout(() => setHighlighted(prev => { const copy = { ...prev }; delete copy[id]; return copy; }), 2500);

      const updated = await remindersApi.updateReminder(id, { dueAt: newDue });
      // replace with server canonical reminder (in case server adjusted)
      setReminders(curr => curr.map(r => r._id === id ? updated : r).sort((a,b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()));
      toast({ title: 'Reminder snoozed', description: `Snoozed for ${hours} hours` });
    } catch (e: any) {
      console.error('Error snoozing reminder:', e);
      setError(e?.message || 'Failed to snooze reminder');
      // revert optimistic update
      setReminders(prev);
      toast({ title: 'Error', description: 'Failed to snooze reminder', variant: 'destructive' });
    } finally {
      setBusyIds(prevIds => prevIds.filter(x => x !== id));
    }
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
            {upcoming.map(r => {
              const plant = plants.find(p => p.id === r.plantId);
              const shortNotes = r.notes ? (r.notes.length > 120 ? r.notes.slice(0, 117) + '…' : r.notes) : '';
              return (
                <div key={r._id} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                  <div className="flex items-center gap-3">
                    {plant?.imageUrl ? (
                      <img src={plant.imageUrl} alt={plant.name} className="w-12 h-12 rounded-md object-cover border" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-green-50 flex items-center justify-center text-green-600 border">
                        <Bell className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <div className="font-medium text-sm">{r.title}{plant ? ` — ${plant.name}` : ''}</div>
                      {shortNotes ? (
                        // Prefer to show parsed actionable steps when available
                        (() => {
                          const actions = parseActionableNotes(r.notes);
                          if (actions.length) {
                            return (
                              <div className="text-xs text-muted-foreground mt-1">
                                {actions.slice(0, 2).map((a, i) => (
                                  <span key={i} className="inline-block mr-2">• {a}</span>
                                ))}
                                {actions.length > 2 ? <span className="text-muted-foreground">…</span> : null}
                              </div>
                            );
                          }
                          return <div className="text-xs text-muted-foreground mt-1">{shortNotes}</div>;
                        })()
                      ) : null}
                      <div className={"text-xs mt-1 " + (highlighted[r._id] ? 'bg-yellow-50 px-1 rounded' : 'text-gray-500')}>Due: {new Date(r.dueAt).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => snooze(r._id, 24)} title="Snooze 1 day" disabled={busyIds.includes(r._id)}>
                      +1d
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => snooze(r._id, 24*7)} title="Snooze 1 week" disabled={busyIds.includes(r._id)}>
                      +1w
                    </Button>
                    <Button size="sm" onClick={() => complete(r._id)} className="bg-green-600 hover:bg-green-700 text-white" title="Mark done">
                      ✓
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r._id)} title="Delete">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
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
            {overdue.map(r => {
              const plant = plants.find(p => p.id === r.plantId);
              const shortNotes = r.notes ? (r.notes.length > 100 ? r.notes.slice(0, 97) + '…' : r.notes) : '';
              return (
                <div key={r._id} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                  <div className="flex items-center gap-3">
                    {plant?.imageUrl ? (
                      <img src={plant.imageUrl} alt={plant.name} className="w-12 h-12 rounded-md object-cover border" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-amber-50 flex items-center justify-center text-amber-700 border">
                        <Bell className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <div className="font-medium text-sm">{r.title}{plant ? ` — ${plant.name}` : ''}</div>
                      {shortNotes ? <div className="text-xs text-amber-700 mt-1">{shortNotes}</div> : null}
                      <div className="text-xs text-gray-500 mt-1">Overdue since: {new Date(r.dueAt).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => snooze(r._id, 24)} title="Snooze 1 day" disabled={busyIds.includes(r._id)}>+1d</Button>
                    <Button size="sm" onClick={() => complete(r._id)} className="bg-green-600 hover:bg-green-700 text-white" title="Mark done">✓</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r._id)} title="Delete"><Trash className="w-4 h-4" /></Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
