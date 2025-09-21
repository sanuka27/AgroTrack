import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debounced search input
 * @param value - Current search value
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for search functionality with debouncing
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds
 * @returns Object with search value, debounced value, and setter function
 */
export const useSearchDebounce = (initialValue: string = '', delay: number = 300) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const debouncedSearchValue = useDebounce(searchValue, delay);

  return {
    searchValue,
    debouncedSearchValue,
    setSearchValue
  };
};

/**
 * Advanced plant search function with fuzzy matching capabilities
 * @param searchTerm - The search term to match against
 * @param text - The text to search within
 * @returns Boolean indicating if there's a match
 */
export const fuzzyMatch = (searchTerm: string, text: string): boolean => {
  if (!searchTerm || !text) return true;
  
  const search = searchTerm.toLowerCase().trim();
  const target = text.toLowerCase();
  
  // Exact match
  if (target.includes(search)) return true;
  
  // Word boundary match (e.g., "fern" matches "Boston Fern")
  const words = search.split(' ').filter(word => word.length > 0);
  return words.every(word => target.includes(word));
};

/**
 * Calculate search relevance score for sorting results
 * @param searchTerm - The search term
 * @param plant - The plant object to score
 * @returns Number representing relevance (higher = more relevant)
 */
export const calculateSearchRelevance = (searchTerm: string, plant: { name: string; category: string; notes?: string; scientificName?: string }): number => {
  if (!searchTerm) return 0;
  
  const search = searchTerm.toLowerCase().trim();
  let score = 0;
  
  // Name matches get highest priority
  if (plant.name.toLowerCase().includes(search)) {
    score += 100;
    // Exact name match gets bonus
    if (plant.name.toLowerCase() === search) score += 50;
    // Name starts with search term gets bonus
    if (plant.name.toLowerCase().startsWith(search)) score += 25;
  }
  
  // Category matches get medium priority
  if (plant.category.toLowerCase().includes(search)) {
    score += 50;
  }
  
  // Notes/description matches get lower priority
  if (plant.notes && plant.notes.toLowerCase().includes(search)) {
    score += 25;
  }
  
  // Scientific name matches (if available) get high priority
  if (plant.scientificName && plant.scientificName.toLowerCase().includes(search)) {
    score += 75;
  }
  
  return score;
};