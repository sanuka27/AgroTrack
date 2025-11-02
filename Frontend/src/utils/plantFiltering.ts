import { Plant } from '@/types/plant';
import { PlantFilters } from '@/components/PlantFilters';
import { fuzzyMatch, calculateSearchRelevance } from '@/hooks/use-search';

// Calculate days since last care activity
export const daysSinceLastWatered = (lastWatered: string | null): number => {
  if (!lastWatered) return Infinity;
  const lastWateredDate = new Date(lastWatered);
  const now = new Date();
  return Math.floor((now.getTime() - lastWateredDate.getTime()) / (1000 * 60 * 60 * 24));
};

// Check if plant needs watering based on schedule
export const needsWatering = (plant: Plant): boolean => {
  const daysSince = daysSinceLastWatered(plant.lastWatered);
  return daysSince >= plant.wateringEveryDays;
};

// Check if plant needs fertilizer (mock logic - assuming monthly fertilizing)
export const needsFertilizer = (plant: Plant): boolean => {
  if (!plant.fertilizerEveryWeeks) return false;
  // For simplicity, using lastWatered as proxy for last fertilizer date
  const daysSince = daysSinceLastWatered(plant.lastWatered);
  const fertilizerDays = plant.fertilizerEveryWeeks * 7;
  return daysSince >= fertilizerDays;
};

// Check if plant care is overdue
export const isCareOverdue = (plant: Plant): boolean => {
  const waterOverdue = needsWatering(plant) && daysSinceLastWatered(plant.lastWatered) > plant.wateringEveryDays + 2;
  const fertilizerOverdue = needsFertilizer(plant) && plant.fertilizerEveryWeeks && 
    daysSinceLastWatered(plant.lastWatered) > (plant.fertilizerEveryWeeks * 7) + 7;
  return waterOverdue || fertilizerOverdue;
};

// Filter plants based on criteria
export const filterPlants = (plants: Plant[], filters: PlantFilters): Plant[] => {
  return plants.filter(plant => {
    // Enhanced search filter with fuzzy matching
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase().trim();
      
      // Use fuzzy matching for better search results
      const matchesName = fuzzyMatch(searchTerm, plant.name);
      const matchesCategory = fuzzyMatch(searchTerm, plant.category);
      const matchesNotes = plant.notes ? fuzzyMatch(searchTerm, plant.notes) : false;
      const matchesSunlight = fuzzyMatch(searchTerm, plant.sunlight);
      const matchesSoil = plant.soil ? fuzzyMatch(searchTerm, plant.soil) : false;
      
      if (!matchesName && !matchesCategory && !matchesNotes && !matchesSunlight && !matchesSoil) {
        return false;
      }
    }

    // Health status filter
    if (filters.healthStatus !== 'all' && plant.health !== filters.healthStatus) {
      return false;
    }

    // Category filter
    if (filters.category !== 'all' && plant.category !== filters.category) {
      return false;
    }

    // Care needs filter
    if (filters.careNeeds !== 'all') {
      switch (filters.careNeeds) {
        case 'needs-water':
          if (!needsWatering(plant)) return false;
          break;
        case 'needs-fertilizer':
          if (!needsFertilizer(plant)) return false;
          break;
        case 'overdue':
          if (!isCareOverdue(plant)) return false;
          break;
      }
    }

    return true;
  });
};

// Sort plants based on criteria
export const sortPlants = (plants: Plant[], sortBy: PlantFilters['sortBy'], sortOrder: PlantFilters['sortOrder'], searchTerm?: string): Plant[] => {
  const sorted = [...plants].sort((a, b) => {
    let comparison = 0;
    
    // If there's a search term and sorting by relevance, prioritize search relevance
    if (searchTerm && sortBy === 'relevance') {
      const aRelevance = calculateSearchRelevance(searchTerm, a);
      const bRelevance = calculateSearchRelevance(searchTerm, b);
      comparison = bRelevance - aRelevance; // Higher relevance first
    } else {
      switch (sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      
      case 'lastWatered': {
        const aDate = a.lastWatered ? new Date(a.lastWatered).getTime() : 0;
        const bDate = b.lastWatered ? new Date(b.lastWatered).getTime() : 0;
        comparison = aDate - bDate;
        break;
      }
      
      case 'health': {
        // Define health priority order
        const healthOrder = {
          'Excellent': 5,
          'Good': 4,
          'Needs light': 3,
          'Needs water': 2,
          'Attention': 1
        };
        comparison = (healthOrder[a.health] || 0) - (healthOrder[b.health] || 0);
        break;
      }
      
        case 'age': {
          const aAge = a.ageYears || 0;
          const bAge = b.ageYears || 0;
          comparison = aAge - bAge;
          break;
        }
        
        case 'dateAdded':
          // Sort by ID as a proxy for date added (assuming newer IDs are later)
          comparison = (a.id || '').localeCompare(b.id || '');
          break;
          
        case 'careUrgency': {
          const aOverdue = isCareOverdue(a) ? 1 : 0;
          const bOverdue = isCareOverdue(b) ? 1 : 0;
          const aNeedsWater = needsWatering(a) ? 1 : 0;
          const bNeedsWater = needsWatering(b) ? 1 : 0;
          comparison = (bOverdue + bNeedsWater) - (aOverdue + aNeedsWater);
          break;
        }
      }
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

// Apply both filtering and sorting
export const filterAndSortPlants = (plants: Plant[], filters: PlantFilters): Plant[] => {
  const filtered = filterPlants(plants, filters);
  return sortPlants(filtered, filters.sortBy, filters.sortOrder, filters.search);
};