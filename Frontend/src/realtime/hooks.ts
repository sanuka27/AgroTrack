import { useState, useEffect, useRef, useCallback } from 'react';
import { realtime } from './index';
import { RealtimeSnapshot, RealtimeEvent } from './types';

export function useRealtimeSnapshot() {
  const [snapshot, setSnapshot] = useState<RealtimeSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const debouncedUpdate = useCallback((updater: (prev: RealtimeSnapshot | null) => RealtimeSnapshot | null) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setSnapshot(updater);
    }, 200);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initial snapshot
    realtime.requestSnapshot().then(initialSnapshot => {
      if (mounted) {
        setSnapshot(initialSnapshot);
        setIsLoading(false);
      }
    });

    // Subscribe to updates
    const unsubscribe = realtime.subscribe((event: RealtimeEvent) => {
      if (!mounted) return;

      debouncedUpdate((prevSnapshot) => {
        if (!prevSnapshot) return prevSnapshot;

        const newSnapshot = { ...prevSnapshot };

        switch (event.type) {
          case 'metrics':
            newSnapshot.metrics = event.data;
            break;

          case 'users:add':
            newSnapshot.users = [event.data, ...newSnapshot.users];
            break;

          case 'users:update':
            newSnapshot.users = newSnapshot.users.map(user =>
              user.id === event.data.id ? event.data : user
            );
            break;

          case 'users:remove':
            newSnapshot.users = newSnapshot.users.filter(user => user.id !== event.data.id);
            break;

          case 'reports:add':
            newSnapshot.reports = [event.data, ...newSnapshot.reports];
            break;

          case 'reports:update':
            newSnapshot.reports = newSnapshot.reports.map(report =>
              report.id === event.data.id ? event.data : report
            );
            break;

          case 'content:add':
            newSnapshot.content = [event.data, ...newSnapshot.content];
            break;

          case 'content:update':
            newSnapshot.content = newSnapshot.content.map(content =>
              content.id === event.data.id ? event.data : content
            );
            break;

          case 'content:remove':
            newSnapshot.content = newSnapshot.content.filter(content => content.id !== event.data.id);
            break;

          case 'activity':
            newSnapshot.activity = [event.data, ...newSnapshot.activity.slice(0, 49)]; // Keep last 50
            break;
        }

        return newSnapshot;
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [debouncedUpdate]);

  return { snapshot, isLoading };
}

export function useStream<T>(selector: (snapshot: RealtimeSnapshot) => T) {
  const { snapshot } = useRealtimeSnapshot();
  const [selectedData, setSelectedData] = useState<T | null>(null);
  const previousSelectorRef = useRef(selector);
  const previousResultRef = useRef<T>();

  useEffect(() => {
    if (!snapshot) return;

    const currentSelector = selector;
    const result = currentSelector(snapshot);

    // Only update if the result actually changed or selector changed
    if (
      previousSelectorRef.current !== currentSelector ||
      JSON.stringify(previousResultRef.current) !== JSON.stringify(result)
    ) {
      setSelectedData(result);
      previousSelectorRef.current = currentSelector;
      previousResultRef.current = result;
    }
  }, [snapshot, selector]);

  return selectedData;
}
