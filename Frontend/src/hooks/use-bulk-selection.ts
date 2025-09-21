import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing bulk selection of items
 * @param items - Array of items that can be selected
 * @param getId - Function to get unique ID from an item
 * @returns Selection state and management functions
 */
export const useBulkSelection = <T extends { id: string }>(
  items: T[],
  getId: (item: T) => string = (item) => item.id
) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Check if an item is selected
  const isSelected = useCallback(
    (itemId: string): boolean => {
      return selectedIds.has(itemId);
    },
    [selectedIds]
  );

  // Toggle selection of a single item
  const toggleSelection = useCallback((itemId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Select all items
  const selectAll = useCallback(() => {
    const allIds = items.map(getId);
    setSelectedIds(new Set(allIds));
  }, [items, getId]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Select multiple items by IDs
  const selectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.add(id));
      return newSet;
    });
  }, []);

  // Deselect multiple items by IDs
  const deselectMultiple = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.delete(id));
      return newSet;
    });
  }, []);

  // Get selected items
  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(getId(item)));
  }, [items, selectedIds, getId]);

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedIds.size === items.length;
  }, [items.length, selectedIds.size]);

  // Check if some items are selected (for indeterminate state)
  const isSomeSelected = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < items.length;
  }, [items.length, selectedIds.size]);

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    selectedItems,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectMultiple,
    deselectMultiple,
    isAllSelected,
    isSomeSelected
  };
};