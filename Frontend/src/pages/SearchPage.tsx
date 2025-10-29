import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plant, Category, Sunlight, Health } from '@/types/plant';
import { Search, Filter, Leaf, Sun, Droplets, Thermometer, Loader2, X } from 'lucide-react';
import apiService from '@/lib/apiService';
import type { Plant as APIPlant } from '@/types/api';

// Helper function to convert API Plant to component Plant
const convertAPIPlantToPlant = (apiPlant: APIPlant): Plant => {
  return {
    id: apiPlant._id,
    name: apiPlant.name,
    category: (apiPlant.category || 'Indoor') as Category,
    sunlight: 'Full Sun' as Sunlight,
    wateringEveryDays: apiPlant.wateringFrequency || 7,
    ageYears: 0,
    health: 'Good' as Health,
    imageUrl: apiPlant.imageUrl,
    notes: apiPlant.description,
    soil: apiPlant.soilType || 'Standard potting mix',
  };
};

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    sunlight: 'all',
    watering: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

  try {
  setLoading(true);
  setError(null);
  const results = await (apiService as any).search.plants(searchQuery);
        const convertedResults = results.map(convertAPIPlantToPlant);
        setSearchResults(convertedResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Apply filters to results
  const filteredResults = searchResults.filter(plant => {
    if (filters.category !== 'all' && plant.category !== filters.category) return false;
    if (filters.sunlight !== 'all' && !plant.sunlight?.toLowerCase().includes(filters.sunlight.toLowerCase())) return false;
    if (filters.watering !== 'all') {
      const wateringMatch = filters.watering === 'low' ? plant.wateringEveryDays >= 10 :
                           filters.watering === 'medium' ? plant.wateringEveryDays >= 5 && plant.wateringEveryDays < 10 :
                           plant.wateringEveryDays < 5;
      if (!wateringMatch) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setFilters({ category: 'all', sunlight: 'all', watering: 'all' });
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'indoor': return 'bg-green-100 text-green-800';
      case 'outdoor': return 'bg-blue-100 text-blue-800';
      case 'succulent': return 'bg-yellow-100 text-yellow-800';
      case 'flower': return 'bg-pink-100 text-pink-800';
      case 'herb': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSunlightIcon = (sunlight: string) => {
    if (sunlight.toLowerCase().includes('full')) return <Sun className="w-4 h-4 text-yellow-600" />;
    if (sunlight.toLowerCase().includes('partial')) return <Sun className="w-4 h-4 text-orange-600" />;
    return <Sun className="w-4 h-4 text-gray-600" />;
  };

  const getWateringIcon = (days: number) => {
    if (days <= 3) return <Droplets className="w-4 h-4 text-blue-600" />;
    if (days <= 7) return <Droplets className="w-4 h-4 text-blue-400" />;
    return <Droplets className="w-4 h-4 text-blue-300" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plant Search</h1>
              <p className="text-gray-600">Discover and explore plants in our database</p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search for plants by name, scientific name, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Filter Results</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Indoor">Indoor</SelectItem>
                        <SelectItem value="Outdoor">Outdoor</SelectItem>
                        <SelectItem value="Succulent">Succulent</SelectItem>
                        <SelectItem value="Flower">Flower</SelectItem>
                        <SelectItem value="Herb">Herb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Sunlight</label>
                    <Select value={filters.sunlight} onValueChange={(value) => setFilters(prev => ({ ...prev, sunlight: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sunlight</SelectItem>
                        <SelectItem value="full sun">Full Sun</SelectItem>
                        <SelectItem value="partial sun">Partial Sun</SelectItem>
                        <SelectItem value="low light">Low Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Watering Frequency</label>
                    <Select value={filters.watering} onValueChange={(value) => setFilters(prev => ({ ...prev, watering: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Frequencies</SelectItem>
                        <SelectItem value="high">High (Every 1-3 days)</SelectItem>
                        <SelectItem value="medium">Medium (Every 4-7 days)</SelectItem>
                        <SelectItem value="low">Low (Every 8+ days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
            <span>Searching...</span>
          </div>
        )}

        {error && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && searchQuery && (
          <div className="mb-4">
            <p className="text-gray-600">
              Found {filteredResults.length} plant{filteredResults.length !== 1 ? 's' : ''} matching "{searchQuery}"
              {filteredResults.length !== searchResults.length && ` (filtered from ${searchResults.length})`}
            </p>
          </div>
        )}

        {!loading && !error && filteredResults.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((plant) => (
              <Card key={plant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{plant.name}</CardTitle>
                      <Badge className={getCategoryColor(plant.category)}>
                        {plant.category}
                      </Badge>
                    </div>
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Leaf className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{plant.notes}</p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {getSunlightIcon(plant.sunlight)}
                        <span>{plant.sunlight}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getWateringIcon(plant.wateringEveryDays)}
                        <span>Every {plant.wateringEveryDays} days</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Thermometer className="w-4 h-4 text-red-500" />
                      <span>Soil: {plant.soil}</span>
                    </div>

                    {plant.health && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Health Status:</span>
                        <Badge variant={plant.health === 'Good' ? 'default' : 'secondary'}>
                          {plant.health}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && searchQuery && filteredResults.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No plants found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or filters to find more plants.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!searchQuery && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Search for Plants</h3>
                <p className="text-gray-600 mb-4">
                  Enter a plant name, scientific name, or description to discover plants in our database.
                </p>
                <div className="text-sm text-gray-500">
                  <p className="mb-2">Popular searches:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Monstera', 'Snake Plant', 'Peace Lily', 'Pothos', 'Succulent'].map((term) => (
                      <Button
                        key={term}
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery(term)}
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;