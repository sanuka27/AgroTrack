import { Request, Response } from 'express';
import { Plant } from '../models/Plant';
import { User } from '../models/User';
import { Reminder } from '../models/Reminder';
import { UserAnalytics } from '../models/UserAnalytics';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import axios from 'axios';

// Define interfaces for weather data structures
interface WeatherData {
  _id?: mongoose.Types.ObjectId;
  location: {
    city: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    uvIndex: number;
    cloudCover: number;
    condition: string;
    conditionCode: string;
    sunrise: Date;
    sunset: Date;
    feelLike: number;
  };
  forecast: {
    date: Date;
    maxTemp: number;
    minTemp: number;
    avgTemp: number;
    humidity: number;
    chanceOfRain: number;
    rainfall: number;
    windSpeed: number;
    condition: string;
    conditionCode: string;
    uvIndex: number;
  }[];
  lastUpdated: Date;
  source: string;
  cacheExpiry: Date;
}

interface WeatherAlert {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  plantId?: mongoose.Types.ObjectId;
  location: {
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  alertType: 'frost' | 'heat' | 'heavy-rain' | 'drought' | 'wind' | 'hail' | 'uv-high';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  message: string;
  recommendations: string[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  acknowledged: boolean;
  createdAt: Date;
}

interface WeatherBasedRecommendation {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  plantId: mongoose.Types.ObjectId;
  weatherConditions: {
    temperature: number;
    humidity: number;
    rainfall: number;
    uvIndex: number;
    windSpeed: number;
  };
  recommendations: {
    category: 'watering' | 'protection' | 'feeding' | 'pruning' | 'relocation';
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reason: string;
    validUntil: Date;
  }[];
  generatedAt: Date;
}

// Mock collections for weather data (in real implementation, these would be proper Mongoose models)
const WeatherCache: WeatherData[] = [];
const WeatherAlerts: WeatherAlert[] = [];
const WeatherRecommendations: WeatherBasedRecommendation[] = [];

export class WeatherController {
  
  /**
   * Get current weather for a location
   */
  static async getCurrentWeather(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, city } = req.query;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
        return;
      }

      // Check cache first
      const cacheKey = `${latitude}_${longitude}`;
      const cachedWeather = WeatherCache.find(w => 
        w.location.coordinates.latitude === Number(latitude) &&
        w.location.coordinates.longitude === Number(longitude) &&
        w.cacheExpiry > new Date()
      );

      if (cachedWeather) {
        res.status(200).json({
          success: true,
          message: 'Weather data retrieved from cache',
          data: {
            weather: cachedWeather,
            cached: true
          }
        });
        return;
      }

      // Fetch from weather API (mock implementation)
      const weatherData = await this.fetchWeatherFromAPI(Number(latitude), Number(longitude), city as string);
      
      // Cache the data
      const existingIndex = WeatherCache.findIndex(w => 
        w.location.coordinates.latitude === Number(latitude) &&
        w.location.coordinates.longitude === Number(longitude)
      );

      if (existingIndex >= 0) {
        WeatherCache[existingIndex] = weatherData;
      } else {
        WeatherCache.push(weatherData);
      }

      res.status(200).json({
        success: true,
        message: 'Weather data retrieved successfully',
        data: {
          weather: weatherData,
          cached: false
        }
      });

    } catch (error) {
      logger.error('Error getting current weather:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve weather data',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get weather forecast for a location
   */
  static async getWeatherForecast(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, days = 7 } = req.query;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
        return;
      }

      const forecastDays = Math.min(Number(days), 14); // Limit to 14 days

      // Check cache
      const cachedWeather = WeatherCache.find(w => 
        w.location.coordinates.latitude === Number(latitude) &&
        w.location.coordinates.longitude === Number(longitude) &&
        w.cacheExpiry > new Date()
      );

      let forecast;
      if (cachedWeather && cachedWeather.forecast.length >= forecastDays) {
        forecast = cachedWeather.forecast.slice(0, forecastDays);
      } else {
        // Fetch forecast from API
        const weatherData = await this.fetchWeatherFromAPI(Number(latitude), Number(longitude));
        forecast = weatherData.forecast.slice(0, forecastDays);
      }

      res.status(200).json({
        success: true,
        message: 'Weather forecast retrieved successfully',
        data: {
          forecast,
          days: forecastDays
        }
      });

    } catch (error) {
      logger.error('Error getting weather forecast:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve weather forecast',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Generate weather-based plant care recommendations
   */
  static async getWeatherRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { plantId, latitude, longitude } = req.query;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Location coordinates are required'
        });
        return;
      }

      // Get weather data
      const weatherData = await this.fetchWeatherFromAPI(Number(latitude), Number(longitude));

      let plantsToAnalyze: any[] = [];

      if (plantId) {
        // Get specific plant
        const plant = await Plant.findOne({ _id: plantId, userId });
        if (!plant) {
          res.status(404).json({
            success: false,
            message: 'Plant not found'
          });
          return;
        }
        plantsToAnalyze = [plant];
      } else {
        // Get all user's plants
        plantsToAnalyze = await Plant.find({ userId }).limit(50);
      }

      // Generate recommendations for each plant
      const plantRecommendations = await Promise.all(
        plantsToAnalyze.map(async plant => {
          const recommendations = await this.generatePlantRecommendations(
            plant,
            weatherData.current,
            weatherData.forecast[0]
          );

          // Store recommendations
          const weatherRec: WeatherBasedRecommendation = {
            _id: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(userId),
            plantId: plant._id,
            weatherConditions: {
              temperature: weatherData.current.temperature,
              humidity: weatherData.current.humidity,
              rainfall: weatherData.forecast[0]?.rainfall || 0,
              uvIndex: weatherData.current.uvIndex,
              windSpeed: weatherData.current.windSpeed
            },
            recommendations,
            generatedAt: new Date()
          };

          // Remove old recommendations for this plant
          const existingIndex = WeatherRecommendations.findIndex(wr => 
            wr.userId.toString() === userId.toString() && wr.plantId.toString() === plant._id.toString()
          );

          if (existingIndex >= 0) {
            WeatherRecommendations[existingIndex] = weatherRec;
          } else {
            WeatherRecommendations.push(weatherRec);
          }

          return {
            plant: {
              _id: plant._id,
              name: plant.name,
              species: plant.species
            },
            recommendations
          };
        })
      );

      // Update user analytics
      await UserAnalytics.findOneAndUpdate(
        { userId },
        {
          $inc: {
            'weather.recommendationsGenerated': 1,
            'engagement.totalActions': 1
          },
          $set: {
            'weather.lastRecommendationDate': new Date(),
            lastActivityDate: new Date()
          }
        },
        { upsert: true }
      );

      res.status(200).json({
        success: true,
        message: 'Weather-based recommendations generated successfully',
        data: {
          weather: {
            current: weatherData.current,
            forecast: weatherData.forecast[0]
          },
          plantRecommendations,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      logger.error('Error generating weather recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate weather recommendations',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get weather alerts for user's location
   */
  static async getWeatherAlerts(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { latitude, longitude, activeOnly = 'true' } = req.query;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Location coordinates are required'
        });
        return;
      }

      // Generate weather alerts based on current conditions
      const weatherData = await this.fetchWeatherFromAPI(Number(latitude), Number(longitude));
      const alerts = await this.generateWeatherAlerts(
        userId.toString(),
        weatherData,
        Number(latitude),
        Number(longitude)
      );

      // Filter alerts
      const filteredAlerts = alerts.filter(alert => {
        if (activeOnly === 'true' && !alert.isActive) return false;
        return true;
      });

      res.status(200).json({
        success: true,
        message: 'Weather alerts retrieved successfully',
        data: {
          alerts: filteredAlerts,
          alertCount: filteredAlerts.length
        }
      });

    } catch (error) {
      logger.error('Error getting weather alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve weather alerts',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Acknowledge weather alert
   */
  static async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());

      const alert = WeatherAlerts.find(a => 
        a._id?.toString() === alertId && a.userId.toString() === userId.toString()
      );

      if (!alert) {
        res.status(404).json({
          success: false,
          message: 'Weather alert not found'
        });
        return;
      }

      alert.acknowledged = true;

      logger.info(`Weather alert acknowledged: ${alertId} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Weather alert acknowledged successfully',
        data: {
          alert
        }
      });

    } catch (error) {
      logger.error('Error acknowledging weather alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge weather alert',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Update plant care schedules based on weather
   */
  static async updateSchedulesWithWeather(req: Request, res: Response): Promise<void> {
    try {
      const userId = new mongoose.Types.ObjectId((req.user as any)._id!.toString());
      const { latitude, longitude, plantIds } = req.body;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Location coordinates are required'
        });
        return;
      }

      // Get weather forecast
      const weatherData = await this.fetchWeatherFromAPI(latitude, longitude);

      // Get plants to update
      const filter: any = { userId };
      if (plantIds && plantIds.length > 0) {
        filter._id = { $in: plantIds };
      }

      const plants = await Plant.find(filter);
      
      let updatedReminders = 0;
      const scheduleAdjustments: any[] = [];

      // Update reminders based on weather
      for (const plant of plants) {
        const adjustments = await this.adjustPlantSchedule(plant, weatherData);
        
        if (adjustments.length > 0) {
          scheduleAdjustments.push({
            plantId: plant._id,
            plantName: plant.name,
            adjustments
          });
          updatedReminders += adjustments.length;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Plant schedules updated based on weather',
        data: {
          updatedReminders,
          scheduleAdjustments,
          weatherConditions: {
            temperature: weatherData.current.temperature,
            humidity: weatherData.current.humidity,
            forecast: weatherData.forecast.slice(0, 3)
          }
        }
      });

    } catch (error) {
      logger.error('Error updating schedules with weather:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update schedules with weather',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  /**
   * Get weather statistics for user's location
   */
  static async getWeatherStats(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, timeframe = '30d' } = req.query;

      if (!latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: 'Location coordinates are required'
        });
        return;
      }

      // Calculate date range
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 30;
      
      // Mock historical weather data (in production, this would come from weather API)
      const historicalData = this.generateMockHistoricalWeather(days);

      // Calculate statistics
      const temperatures = historicalData.map(d => d.temperature);
      const humidity = historicalData.map(d => d.humidity);
      const rainfall = historicalData.map(d => d.rainfall);

      const stats = {
        temperature: {
          average: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
          min: Math.min(...temperatures),
          max: Math.max(...temperatures)
        },
        humidity: {
          average: humidity.reduce((a, b) => a + b, 0) / humidity.length,
          min: Math.min(...humidity),
          max: Math.max(...humidity)
        },
        rainfall: {
          total: rainfall.reduce((a, b) => a + b, 0),
          average: rainfall.reduce((a, b) => a + b, 0) / rainfall.length,
          rainyDays: rainfall.filter(r => r > 0).length
        },
        optimalPlantingConditions: this.calculateOptimalConditions(historicalData),
        seasonalTrends: this.calculateSeasonalTrends(historicalData)
      };

      res.status(200).json({
        success: true,
        message: 'Weather statistics retrieved successfully',
        data: {
          stats,
          timeframe,
          dataPoints: historicalData.length
        }
      });

    } catch (error) {
      logger.error('Error getting weather stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve weather statistics',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }

  // Helper methods

  /**
   * Fetch weather data from external API (mock implementation)
   */
  private static async fetchWeatherFromAPI(latitude: number, longitude: number, city?: string): Promise<WeatherData> {
    // Mock implementation - in production, this would call actual weather APIs like OpenWeatherMap, WeatherAPI, etc.
    
    const currentWeather = {
      temperature: Math.round(15 + Math.random() * 20), // 15-35°C
      humidity: Math.round(40 + Math.random() * 40), // 40-80%
      pressure: Math.round(1000 + Math.random() * 50), // 1000-1050 hPa
      windSpeed: Math.round(Math.random() * 20), // 0-20 km/h
      windDirection: Math.round(Math.random() * 360), // 0-360°
      visibility: Math.round(5 + Math.random() * 15), // 5-20 km
      uvIndex: Math.round(Math.random() * 11), // 0-11
      cloudCover: Math.round(Math.random() * 100), // 0-100%
      condition: 'Partly Cloudy',
      conditionCode: 'partly-cloudy',
      sunrise: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      sunset: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      feelLike: Math.round(15 + Math.random() * 20)
    };

    // Generate 7-day forecast
    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date,
        maxTemp: currentWeather.temperature + Math.round(Math.random() * 10 - 5),
        minTemp: currentWeather.temperature - Math.round(Math.random() * 10 + 5),
        avgTemp: currentWeather.temperature + Math.round(Math.random() * 6 - 3),
        humidity: currentWeather.humidity + Math.round(Math.random() * 20 - 10),
        chanceOfRain: Math.round(Math.random() * 100),
        rainfall: Math.random() * 20, // 0-20mm
        windSpeed: currentWeather.windSpeed + Math.round(Math.random() * 10 - 5),
        condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Overcast'][Math.floor(Math.random() * 5)] || 'Sunny',
        conditionCode: 'variable',
        uvIndex: Math.round(Math.random() * 11)
      });
    }

    const cacheExpiry = new Date();
    cacheExpiry.setHours(cacheExpiry.getHours() + 1); // Cache for 1 hour

    return {
      _id: new mongoose.Types.ObjectId(),
      location: {
        city: city || 'Unknown City',
        country: 'Unknown Country',
        coordinates: { latitude, longitude }
      },
      current: currentWeather,
      forecast,
      lastUpdated: new Date(),
      source: 'Mock Weather API',
      cacheExpiry
    };
  }

  /**
   * Generate plant-specific recommendations based on weather
   */
  private static async generatePlantRecommendations(plant: any, current: any, forecast: any): Promise<any[]> {
    const recommendations = [];

    // Temperature-based recommendations
    if (current.temperature > 30) {
      recommendations.push({
        category: 'protection',
        action: 'Provide shade during peak hours (10 AM - 4 PM)',
        priority: 'high',
        reason: `High temperature (${current.temperature}°C) can stress plants`,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    } else if (current.temperature < 5) {
      recommendations.push({
        category: 'protection',
        action: 'Move plant indoors or provide frost protection',
        priority: 'urgent',
        reason: `Low temperature (${current.temperature}°C) risk of frost damage`,
        validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000)
      });
    }

    // Humidity-based recommendations
    if (current.humidity < 40) {
      recommendations.push({
        category: 'watering',
        action: 'Increase watering frequency and consider humidity tray',
        priority: 'medium',
        reason: `Low humidity (${current.humidity}%) may cause leaf stress`,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    } else if (current.humidity > 80) {
      recommendations.push({
        category: 'protection',
        action: 'Improve air circulation to prevent fungal issues',
        priority: 'medium',
        reason: `High humidity (${current.humidity}%) increases disease risk`,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    // Rain-based recommendations
    if (forecast && forecast.chanceOfRain > 80) {
      recommendations.push({
        category: 'watering',
        action: 'Skip next watering session due to expected rain',
        priority: 'medium',
        reason: `High chance of rain (${forecast.chanceOfRain}%) will provide natural watering`,
        validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000)
      });
    }

    // UV-based recommendations
    if (current.uvIndex > 8) {
      recommendations.push({
        category: 'protection',
        action: 'Provide UV protection for sensitive plants',
        priority: 'high',
        reason: `Very high UV index (${current.uvIndex}) can damage leaves`,
        validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000)
      });
    }

    // Wind-based recommendations
    if (current.windSpeed > 25) {
      recommendations.push({
        category: 'protection',
        action: 'Secure tall plants and provide wind barrier',
        priority: 'high',
        reason: `Strong winds (${current.windSpeed} km/h) may damage plants`,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    return recommendations;
  }

  /**
   * Generate weather alerts based on conditions
   */
  private static async generateWeatherAlerts(
    userId: string, 
    weatherData: WeatherData, 
    latitude: number, 
    longitude: number
  ): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];

    // Frost alert
    if (weatherData.current.temperature < 2) {
      alerts.push({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(userId),
        location: {
          city: weatherData.location.city,
          coordinates: { latitude, longitude }
        },
        alertType: 'frost',
        severity: 'high',
        message: `Frost warning: Temperature is ${weatherData.current.temperature}°C`,
        recommendations: [
          'Move sensitive plants indoors',
          'Cover outdoor plants with frost cloth',
          'Water plants before sunset to help regulate temperature'
        ],
        startTime: new Date(),
        isActive: true,
        acknowledged: false,
        createdAt: new Date()
      });
    }

    // Heat wave alert
    if (weatherData.current.temperature > 35) {
      alerts.push({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(userId),
        location: {
          city: weatherData.location.city,
          coordinates: { latitude, longitude }
        },
        alertType: 'heat',
        severity: 'high',
        message: `Extreme heat warning: Temperature is ${weatherData.current.temperature}°C`,
        recommendations: [
          'Provide shade for plants during peak hours',
          'Increase watering frequency',
          'Move potted plants to cooler locations'
        ],
        startTime: new Date(),
        isActive: true,
        acknowledged: false,
        createdAt: new Date()
      });
    }

    // Heavy rain alert
    const tomorrowForecast = weatherData.forecast[1];
    if (tomorrowForecast && tomorrowForecast.rainfall > 25) {
      alerts.push({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(userId),
        location: {
          city: weatherData.location.city,
          coordinates: { latitude, longitude }
        },
        alertType: 'heavy-rain',
        severity: 'medium',
        message: `Heavy rain expected: ${tomorrowForecast.rainfall}mm forecast for tomorrow`,
        recommendations: [
          'Ensure proper drainage for potted plants',
          'Skip watering until after the rain',
          'Protect delicate plants from heavy rainfall'
        ],
        startTime: new Date(),
        endTime: tomorrowForecast.date,
        isActive: true,
        acknowledged: false,
        createdAt: new Date()
      });
    }

    // Store alerts
    alerts.forEach(alert => WeatherAlerts.push(alert));

    return alerts;
  }

  /**
   * Adjust plant care schedule based on weather
   */
  private static async adjustPlantSchedule(plant: any, weatherData: WeatherData): Promise<any[]> {
    const adjustments = [];

    // Find plant's reminders
    const reminders = await Reminder.find({ 
      plantId: plant._id,
      status: 'pending',
      scheduledDate: { $gte: new Date() }
    });

    for (const reminder of reminders) {
      let adjustmentMade = false;
      let newDate = new Date(reminder.scheduledDate);

      // Watering adjustments
      if (reminder.careType === 'watering') {
        // Delay watering if heavy rain expected
        const upcomingRain = weatherData.forecast.slice(0, 3).some(day => day.rainfall > 10);
        if (upcomingRain) {
          newDate.setDate(newDate.getDate() + 2);
          adjustmentMade = true;
          adjustments.push({
            reminderId: reminder._id,
            careType: reminder.careType,
            originalDate: reminder.scheduledDate,
            newDate,
            reason: 'Delayed due to expected rainfall'
          });
        }
        
        // Advance watering if very hot and dry
        else if (weatherData.current.temperature > 30 && weatherData.current.humidity < 40) {
          newDate.setHours(newDate.getHours() - 12);
          adjustmentMade = true;
          adjustments.push({
            reminderId: reminder._id,
            careType: reminder.careType,
            originalDate: reminder.scheduledDate,
            newDate,
            reason: 'Advanced due to hot, dry conditions'
          });
        }
      }

      // Update reminder if adjustment was made
      if (adjustmentMade && reminder._id && adjustments.length > 0) {
        await Reminder.findByIdAndUpdate(reminder._id, {
          scheduledDate: newDate,
          weatherAdjusted: true,
          weatherAdjustmentReason: adjustments[adjustments.length - 1]?.reason || 'Weather adjustment'
        });
      }
    }

    return adjustments;
  }

  /**
   * Generate mock historical weather data
   */
  private static generateMockHistoricalWeather(days: number): any[] {
    const data = [];
    const baseTemp = 20;
    const baseHumidity = 60;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date,
        temperature: baseTemp + Math.sin(i * 0.1) * 10 + (Math.random() - 0.5) * 6,
        humidity: baseHumidity + Math.cos(i * 0.15) * 20 + (Math.random() - 0.5) * 10,
        rainfall: Math.random() < 0.3 ? Math.random() * 15 : 0 // 30% chance of rain
      });
    }
    
    return data;
  }

  /**
   * Calculate optimal planting conditions
   */
  private static calculateOptimalConditions(historicalData: any[]): any {
    const avgTemp = historicalData.reduce((sum, d) => sum + d.temperature, 0) / historicalData.length;
    const avgHumidity = historicalData.reduce((sum, d) => sum + d.humidity, 0) / historicalData.length;
    const totalRainfall = historicalData.reduce((sum, d) => sum + d.rainfall, 0);
    
    return {
      temperatureRange: {
        optimal: [18, 25],
        current: Math.round(avgTemp)
      },
      humidityRange: {
        optimal: [50, 70],
        current: Math.round(avgHumidity)
      },
      monthlyRainfall: {
        optimal: [30, 100],
        current: Math.round(totalRainfall * (30 / historicalData.length))
      },
      plantingRecommendation: avgTemp >= 18 && avgTemp <= 25 ? 'Excellent' : 
                            avgTemp >= 15 && avgTemp <= 30 ? 'Good' : 'Fair'
    };
  }

  /**
   * Calculate seasonal trends
   */
  private static calculateSeasonalTrends(historicalData: any[]): any {
    const recentData = historicalData.slice(-7);
    const olderData = historicalData.slice(0, 7);
    
    const recentAvgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
    const olderAvgTemp = olderData.reduce((sum, d) => sum + d.temperature, 0) / olderData.length;
    
    const tempTrend = recentAvgTemp > olderAvgTemp + 2 ? 'warming' : 
                     recentAvgTemp < olderAvgTemp - 2 ? 'cooling' : 'stable';
    
    return {
      temperature: {
        trend: tempTrend,
        change: Math.round((recentAvgTemp - olderAvgTemp) * 10) / 10
      },
      recommendation: tempTrend === 'warming' ? 'Consider heat protection measures' :
                      tempTrend === 'cooling' ? 'Prepare for cooler weather' :
                      'Weather conditions are stable'
    };
  }
}