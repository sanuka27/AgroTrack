import { Plant } from '@/types/plant';

/**
 * Export plants data to CSV format
 * @param plants - Array of plants to export
 * @param filename - Optional filename for the export
 */
export const exportPlantsToCSV = (plants: Plant[], filename: string = 'plants-export.csv') => {
  if (plants.length === 0) {
    return;
  }

  // Define CSV headers
  const headers = [
    'Name',
    'Category',
    'Sunlight',
    'Age (Years)',
    'Watering Every (Days)',
    'Fertilizer Every (Weeks)',
    'Soil Type',
    'Notes',
    'Last Watered',
    'Health'
  ];

  // Convert plants to CSV rows
  const rows = plants.map(plant => [
    plant.name || '',
    plant.category || '',
    plant.sunlight || '',
    plant.ageYears?.toString() || '',
    plant.wateringEveryDays?.toString() || '',
    plant.fertilizerEveryWeeks?.toString() || '',
    plant.soil || '',
    plant.notes || '',
    plant.lastWatered || '',
    plant.health || ''
  ]);

  // Escape CSV values that contain commas or quotes
  const escapeCsvValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(','))
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Export plants data to JSON format
 * @param plants - Array of plants to export
 * @param filename - Optional filename for the export
 */
export const exportPlantsToJSON = (plants: Plant[], filename: string = 'plants-export.json') => {
  if (plants.length === 0) {
    return;
  }

  const jsonContent = JSON.stringify(plants, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Generate export summary with plant statistics
 * @param plants - Array of plants to analyze
 * @returns Export summary object
 */
export const generateExportSummary = (plants: Plant[]) => {
  if (plants.length === 0) {
    return null;
  }

  const summary = {
    totalPlants: plants.length,
    categories: {} as Record<string, number>,
    healthStatus: {} as Record<string, number>,
    sunlightRequirements: {} as Record<string, number>,
    averageAge: 0,
    plantsNeedingWater: 0,
    plantsNeedingFertilizer: 0,
    exportDate: new Date().toISOString()
  };

  let totalAge = 0;
  let plantsWithAge = 0;

  plants.forEach(plant => {
    // Count by category
    summary.categories[plant.category] = (summary.categories[plant.category] || 0) + 1;
    
    // Count by health status
    summary.healthStatus[plant.health] = (summary.healthStatus[plant.health] || 0) + 1;
    
    // Count by sunlight requirements
    summary.sunlightRequirements[plant.sunlight] = (summary.sunlightRequirements[plant.sunlight] || 0) + 1;
    
    // Calculate average age
    if (plant.ageYears) {
      totalAge += plant.ageYears;
      plantsWithAge++;
    }
    
    // Check care needs (simplified logic)
    if (plant.lastWatered) {
      const daysSinceWatered = Math.floor(
        (Date.now() - new Date(plant.lastWatered).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceWatered >= plant.wateringEveryDays) {
        summary.plantsNeedingWater++;
      }
    }
  });

  summary.averageAge = plantsWithAge > 0 ? Math.round(totalAge / plantsWithAge * 10) / 10 : 0;

  return summary;
};