import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import { Health, Category } from '@/types/plant';
import { useSearchDebounce } from '@/hooks/use-search';

export interface PlantFilters {
  search: string;
  healthStatus: Health | 'all';
  category: Category | 'all';
  careNeeds: 'all' | 'needs-water' | 'needs-fertilizer' | 'overdue';
  sortBy: 'name' | 'lastWatered' | 'health' | 'age' | 'dateAdded' | 'careUrgency' | 'relevance';
  sortOrder: 'asc' | 'desc';
}

interface PlantFiltersComponentProps {
  filters: PlantFilters;
  onFiltersChange: (filters: PlantFilters) => void;
  plantsCount: number;
  filteredCount: number;
}

export const PlantFiltersComponent: React.FC<PlantFiltersComponentProps> = ({
  filters,
  onFiltersChange,
  plantsCount,
  filteredCount
}) => {
  // Use debounced search for better performance
  const { searchValue, debouncedSearchValue, setSearchValue } = useSearchDebounce(filters.search, 300);

  const updateFilter = useCallback((key: keyof PlantFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  // Update filters when debounced search value changes
  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      updateFilter('search', debouncedSearchValue);
    }
  }, [debouncedSearchValue, filters.search, updateFilter]);

  // Update search value when filters change externally
  useEffect(() => {
    if (filters.search !== searchValue) {
      setSearchValue(filters.search);
    }
  }, [filters.search, searchValue, setSearchValue]);

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      healthStatus: 'all',
      category: 'all',
      careNeeds: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.healthStatus !== 'all' ||
    filters.category !== 'all' ||
    filters.careNeeds !== 'all';

  const getSortDisplayName = () => {
    switch (filters.sortBy) {
      case 'name': return 'Name';
      case 'lastWatered': return 'Last Watered';
      case 'health': return 'Health Status';
      case 'age': return 'Age';
      case 'dateAdded': return 'Date Added';
      case 'careUrgency': return 'Care Urgency';
      case 'relevance': return 'Relevance';
      default: return 'Name';
    }
  };

  const toggleSortOrder = () => {
    updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-4">
      {/* Search and Main Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search plants by name, category, sunlight, or soil..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">📝 Name</SelectItem>
              <SelectItem value="lastWatered">💧 Last Watered</SelectItem>
              <SelectItem value="health">❤️ Health Status</SelectItem>
              <SelectItem value="age">🕰️ Age</SelectItem>
              <SelectItem value="dateAdded">📅 Date Added</SelectItem>
              <SelectItem value="careUrgency">⚠️ Care Urgency</SelectItem>
              {filters.search && <SelectItem value="relevance">🎯 Relevance</SelectItem>}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="px-3 min-w-[44px]"
            title={`Sort ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Health Status Filter */}
        <Select value={filters.healthStatus} onValueChange={(value) => updateFilter('healthStatus', value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Health Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            <SelectItem value="Excellent">Excellent</SelectItem>
            <SelectItem value="Good">Good</SelectItem>
            <SelectItem value="Needs light">Needs Light</SelectItem>
            <SelectItem value="Needs water">Needs Water</SelectItem>
            <SelectItem value="Attention">Attention</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Indoor">Indoor</SelectItem>
            <SelectItem value="Outdoor">Outdoor</SelectItem>
            <SelectItem value="Succulent">Succulent</SelectItem>
            <SelectItem value="Herb">Herb</SelectItem>
            <SelectItem value="Flower">Flower</SelectItem>
            <SelectItem value="Tree">Tree</SelectItem>
          </SelectContent>
        </Select>

        {/* Care Needs Filter */}
        <Select value={filters.careNeeds} onValueChange={(value) => updateFilter('careNeeds', value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Care Needs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plants</SelectItem>
            <SelectItem value="needs-water">Needs Water</SelectItem>
            <SelectItem value="needs-fertilizer">Needs Fertilizer</SelectItem>
            <SelectItem value="overdue">Overdue Care</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilter('search', '')} 
              />
            </Badge>
          )}
          {filters.healthStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Health: {filters.healthStatus}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilter('healthStatus', 'all')} 
              />
            </Badge>
          )}
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.category}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilter('category', 'all')} 
              />
            </Badge>
          )}
          {filters.careNeeds !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Care: {filters.careNeeds.replace('-', ' ')}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateFilter('careNeeds', 'all')} 
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Showing <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
            <span className="font-medium text-foreground">{plantsCount}</span> plants
          </span>
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Searching: "{filters.search}"
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">
            Sorted by <span className="font-medium">{getSortDisplayName()}</span>
            <span className="ml-1">
              {filters.sortOrder === 'asc' ? '↗️' : '↘️'}
            </span>
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs hover:text-destructive ml-2"
            >
              <X className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};