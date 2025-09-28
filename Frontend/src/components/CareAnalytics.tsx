import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CareLog, CareType, PlantCareHistory } from '@/types/care';
import { getCareStatistics, formatCareType, getCareTypeColor } from '@/utils/careUtils';
import { TrendingUp, Calendar, Activity, Target, AlertTriangle } from 'lucide-react';

interface CareAnalyticsProps {
  careLogs: CareLog[];
  plantCareHistory?: PlantCareHistory;
  showOverallStats?: boolean;
}

export const CareAnalytics: React.FC<CareAnalyticsProps> = ({
  careLogs,
  plantCareHistory,
  showOverallStats = true
}) => {
  const stats = getCareStatistics(careLogs);
  
  const getHealthTrendIcon = (trend: PlantCareHistory['healthTrend']) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'stable':
        return <Target className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHealthTrendColor = (trend: PlantCareHistory['healthTrend']) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'stable':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (careLogs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No care data available</p>
            <p className="text-sm">Start logging care activities to see analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      {showOverallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Care Events</p>
                  <p className="text-2xl font-bold">{stats.totalCareEvents}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{stats.careFrequencyLast30Days}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Per Week Avg</p>
                  <p className="text-2xl font-bold">{stats.averageCarePerWeek}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Most Common</p>
                  <p className="text-sm font-semibold">
                    {formatCareType(stats.mostCommonCareType)}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getCareTypeColor(stats.mostCommonCareType)}`}>
                  {formatCareType(stats.mostCommonCareType).split(' ')[0]}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Care Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Care Activity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.careTypeCount)
              .filter(([, count]) => count > 0)
              .sort(([,a], [,b]) => b - a)
              .map(([careType, count]) => {
                const percentage = Math.round((count / stats.totalCareEvents) * 100);
                return (
                  <div key={careType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getCareTypeColor(careType as CareType)}>
                          {formatCareType(careType as CareType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {count} event{count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Plant-specific analytics */}
      {plantCareHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Plant Health & Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Health Trend */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {getHealthTrendIcon(plantCareHistory.healthTrend)}
                  <div>
                    <p className="font-medium">Health Trend</p>
                    <p className="text-sm text-muted-foreground">Based on recent health checks</p>
                  </div>
                </div>
                <Badge className={getHealthTrendColor(plantCareHistory.healthTrend)}>
                  {plantCareHistory.healthTrend}
                </Badge>
              </div>

              {/* Care Patterns */}
              {plantCareHistory.patterns.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Care Patterns</h4>
                  {plantCareHistory.patterns.map((pattern) => (
                    <div key={pattern.careType} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getCareTypeColor(pattern.careType)}>
                          {formatCareType(pattern.careType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Every ~{pattern.averageFrequency} days
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {pattern.frequency}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Next Care Suggestions */}
              {plantCareHistory.patterns.some(p => p.nextSuggestedDate) && (
                <div className="space-y-2">
                  <h4 className="font-medium">Upcoming Care</h4>
                  {plantCareHistory.patterns
                    .filter(p => p.nextSuggestedDate)
                    .sort((a, b) => new Date(a.nextSuggestedDate!).getTime() - new Date(b.nextSuggestedDate!).getTime())
                    .slice(0, 3)
                    .map((pattern) => {
                      const nextDate = new Date(pattern.nextSuggestedDate!);
                      const daysUntil = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysUntil < 0;
                      
                      return (
                        <div key={pattern.careType} className={`flex items-center justify-between p-2 rounded border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex items-center gap-2">
                            <Badge className={getCareTypeColor(pattern.careType)}>
                              {formatCareType(pattern.careType)}
                            </Badge>
                          </div>
                          <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                            {isOverdue ? `${Math.abs(daysUntil)} days overdue` : 
                             daysUntil === 0 ? 'Due today' : 
                             daysUntil === 1 ? 'Due tomorrow' : 
                             `Due in ${daysUntil} days`}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};