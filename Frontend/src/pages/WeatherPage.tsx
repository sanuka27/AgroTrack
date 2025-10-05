import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeatherData } from '@/types/api';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, MapPin, RefreshCw, Loader2 } from 'lucide-react';
import mockApi from '@/lib/mockApi';

const WeatherPage = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch weather data from mock API
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const weatherData = await mockApi.weather.getCurrent();
        setWeather(weatherData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('storm')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    } else if (lowerCondition.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    }
    return <Cloud className="w-8 h-8 text-gray-400" />;
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 30) return 'text-red-500';
    if (temp >= 25) return 'text-orange-500';
    if (temp >= 15) return 'text-green-500';
    return 'text-blue-500';
  };

  const refreshWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const weatherData = await mockApi.weather.getCurrent();
      setWeather(weatherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh weather data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Weather Data</h2>
              <p className="text-gray-600">Fetching current weather conditions...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <Cloud className="w-12 h-12 mx-auto mb-2" />
                <h2 className="text-xl font-semibold">Weather Data Unavailable</h2>
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refreshWeather} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Cloud className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Weather & Climate</h1>
                <p className="text-gray-600">Current conditions and forecasts for optimal plant care</p>
              </div>
            </div>
            <Button onClick={refreshWeather} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Weather */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Current Weather - {weather.location}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getWeatherIcon(weather.conditions)}
                  <div>
                    <div className={`text-4xl font-bold ${getTemperatureColor(weather.temperature)}`}>
                      {weather.temperature}°C
                    </div>
                    <div className="text-lg text-gray-600 capitalize">{weather.conditions}</div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Humidity: {weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Wind: Light</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-red-600" />
                Plant Care Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Watering:</span>
                <Badge variant={weather.temperature > 25 ? "destructive" : "secondary"}>
                  {weather.temperature > 25 ? "More Frequent" : "Normal"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Humidity:</span>
                <Badge variant={weather.humidity > 70 ? "default" : "outline"}>
                  {weather.humidity > 70 ? "High" : "Normal"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Growth Rate:</span>
                <Badge variant="outline">
                  {weather.temperature > 20 && weather.temperature < 30 ? "Optimal" : "Moderate"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3-Day Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>3-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {weather.forecast.map((day, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    {index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 'Day After'}
                  </div>
                  <div className="flex justify-center mb-2">
                    {getWeatherIcon(day.conditions)}
                  </div>
                  <div className={`text-2xl font-bold ${getTemperatureColor(day.temp)} mb-1`}>
                    {day.temp}°C
                  </div>
                  <div className="text-sm text-gray-600 capitalize">{day.conditions}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gardening Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Gardening Tips for Current Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700">🌡️ Temperature Considerations</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• {weather.temperature > 25 ? 'Water more frequently due to heat' : 'Normal watering schedule'}</li>
                  <li>• {weather.temperature < 15 ? 'Protect sensitive plants from cold' : 'Good conditions for most plants'}</li>
                  <li>• Optimal growth temperature range: 18-25°C</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-700">💧 Humidity & Watering</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Current humidity: {weather.humidity}%</li>
                  <li>• {weather.humidity > 70 ? 'Reduce watering frequency' : 'Monitor soil moisture closely'}</li>
                  <li>• {weather.conditions.toLowerCase().includes('rain') ? 'Skip watering if rain expected' : 'Water as scheduled'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default WeatherPage;