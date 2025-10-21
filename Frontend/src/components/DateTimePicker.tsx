import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

type Props = {
  value?: string | Date | null;
  onChange: (isoString: string) => void;
  className?: string;
  placeholder?: string;
  minuteStep?: 1 | 5 | 10 | 15;
};

function pad2(n: number) { return n.toString().padStart(2, '0'); }

function toISOFromLocal(y: number, m: number, d: number, hours24: number, minutes: number) {
  // Note: month in Date constructor is 0-based
  const date = new Date(y, m - 1, d, hours24, minutes, 0, 0);
  return date.toISOString();
}

export default function DateTimePicker({ value, onChange, className, placeholder, minuteStep = 5 }: Props) {
  // Parse initial
  const initial = useMemo(() => {
    if (!value) return new Date();
    const dt = typeof value === 'string' ? new Date(value) : value;
    return isNaN(dt.getTime()) ? new Date() : dt;
  }, [value]);

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(initial);

  // Local time parts
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const isPM = hours >= 12;
  const hour12 = ((hours + 11) % 12) + 1; // 1-12

  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
  const minutesList = useMemo(() => {
    const step = Math.max(1, Math.min(15, minuteStep));
    const arr: number[] = [];
    for (let i = 0; i < 60; i += step) arr.push(i);
    return arr;
  }, [minuteStep]);

  const applyChange = (newDate: Date, newHour12: number, newMinutes: number, newIsPM: boolean) => {
    const h24 = (newHour12 % 12) + (newIsPM ? 12 : 0);
    const iso = toISOFromLocal(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate(), h24, newMinutes);
    onChange(iso);
    setDate(new Date(iso));
  };

  const display = useMemo(() => {
    try { return date.toLocaleString(); } catch { return placeholder || 'Select date & time'; }
  }, [date, placeholder]);

  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Scroll hour list to current selection
    const hContainer = hoursRef.current;
    const mContainer = minutesRef.current;
    if (hContainer) {
      const active = hContainer.querySelector('button.bg-accent');
      if (active instanceof HTMLElement) active.scrollIntoView({ block: 'center' });
    }
    if (mContainer) {
      const active = mContainer.querySelector('button.bg-accent');
      if (active instanceof HTMLElement) active.scrollIntoView({ block: 'center' });
    }
  }, [open, hour12, minutes]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-between text-left font-normal', className)}
        >
          <span className="truncate">{display}</span>
          <CalendarIcon className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
  <PopoverContent className="w-[320px] p-0 max-h-[75vh] overflow-auto" align="start">
        <div className="grid grid-cols-1">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (!d) return;
              applyChange(d, hour12, minutes - (minutes % 5), isPM);
            }}
            initialFocus
          />
          <div className="border-t p-3">
            <div className="text-xs font-medium mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Pick time</div>
            <div className="flex items-center gap-2">
              <div ref={hoursRef} className="flex-1 max-h-48 overflow-y-auto rounded border">
                {hoursList.map(h => (
                  <button
                    key={h}
                    className={cn('w-full text-left px-2 py-1 hover:bg-accent', h === hour12 && 'bg-accent')}
                    onClick={() => applyChange(date, h, minutes - (minutes % 5), isPM)}
                  >
                    {pad2(h)}
                  </button>
                ))}
              </div>
              <div ref={minutesRef} className="flex-1 max-h-48 overflow-y-auto rounded border">
                {minutesList.map(mi => (
                  <button
                    key={mi}
                    className={cn('w-full text-left px-2 py-1 hover:bg-accent', mi === (minutes - (minutes % 5)) && 'bg-accent')}
                    onClick={() => applyChange(date, hour12, mi, isPM)}
                  >
                    {pad2(mi)}
                  </button>
                ))}
              </div>
              <div className="flex flex-col rounded border overflow-hidden">
                <button
                  className={cn('px-3 py-1 hover:bg-accent', !isPM && 'bg-accent')}
                  onClick={() => applyChange(date, hour12, minutes - (minutes % 5), false)}
                >AM</button>
                <button
                  className={cn('px-3 py-1 hover:bg-accent', isPM && 'bg-accent')}
                  onClick={() => applyChange(date, hour12, minutes - (minutes % 5), true)}
                >PM</button>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
              <Button size="sm" onClick={() => setOpen(false)}>Apply</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
