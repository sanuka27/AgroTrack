import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CareLog, CareType } from '@/types/care';
import { formatCareType, getCareTypeColor } from '@/utils/careUtils';
import { formatDistance } from 'date-fns';
import { Calendar, Camera, FileText, MoreHorizontal } from 'lucide-react';

interface CareTimelineProps {
  careLogs: CareLog[];
  onEditCareLog?: (careLog: CareLog) => void;
  onDeleteCareLog?: (careLogId: string) => void;
  showPlantName?: boolean;
  maxEntries?: number;
}

export const CareTimeline: React.FC<CareTimelineProps> = ({
  careLogs,
  onEditCareLog,
  onDeleteCareLog,
  showPlantName = false,
  maxEntries
}) => {
  const displayLogs = maxEntries ? careLogs.slice(0, maxEntries) : careLogs;

  if (displayLogs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No care activities logged yet</p>
            <p className="text-sm">Start logging care activities to track your plant's health</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCareDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderMetadataDetails = (careLog: CareLog): React.ReactNode => {
    if (!careLog.metadata) return null;

    const { metadata } = careLog;
    const details: string[] = [];

    switch (careLog.careType) {
      case 'watering':
        if (metadata.waterAmount) details.push(`${metadata.waterAmount}ml`);
        if (metadata.wateringMethod) details.push(metadata.wateringMethod.replace('-', ' '));
        break;
      
      case 'fertilizing':
        if (metadata.fertilizerType) details.push(metadata.fertilizerType);
        if (metadata.concentration) details.push(metadata.concentration.replace('-', ' '));
        break;
      
      case 'pruning':
        if (metadata.pruningType) details.push(metadata.pruningType);
        if (metadata.partsRemoved?.length) details.push(`${metadata.partsRemoved.length} parts removed`);
        break;
      
      case 'health-check':
        if (metadata.overallHealth) details.push(`Health: ${metadata.overallHealth}`);
        if (metadata.measurements?.height) details.push(`${metadata.measurements.height}cm tall`);
        break;
      
      case 'repotting':
        if (metadata.oldPotSize && metadata.newPotSize) {
          details.push(`${metadata.oldPotSize} → ${metadata.newPotSize}`);
        }
        if (metadata.rootCondition) details.push(`Roots: ${metadata.rootCondition.replace('-', ' ')}`);
        break;
    }

    if (details.length === 0) return null;

    return (
      <div className="text-xs text-muted-foreground mt-1">
        {details.join(' • ')}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {displayLogs.map((careLog, index) => (
        <Card key={careLog.id} className="relative">
          {/* Timeline connector */}
          {index < displayLogs.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-px bg-border z-0" />
          )}
          
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              {/* Care type icon/badge */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border ${getCareTypeColor(careLog.careType)} z-10`}>
                {formatCareType(careLog.careType).split(' ')[0]}
              </div>
              
              {/* Care log content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={getCareTypeColor(careLog.careType)}>
                        {formatCareType(careLog.careType)}
                      </Badge>
                      {showPlantName && (
                        <Badge variant="outline">
                          Plant ID: {careLog.plantId}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      {formatCareDate(careLog.date)}
                      {' • '}
                      {formatDistance(new Date(careLog.date), new Date(), { addSuffix: true })}
                    </div>
                    
                    {renderMetadataDetails(careLog)}
                    
                    {careLog.notes && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p>{careLog.notes}</p>
                        </div>
                      </div>
                    )}
                    
                    {careLog.photos && careLog.photos.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Camera className="w-4 h-4" />
                        <span>{careLog.photos.length} photo{careLog.photos.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {(onEditCareLog || onDeleteCareLog) && (
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          // For now, just show that actions are available
                          // In a full implementation, this would open a dropdown menu
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {maxEntries && careLogs.length > maxEntries && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">
                Showing {maxEntries} of {careLogs.length} care activities
              </p>
              <Button variant="link" size="sm" className="mt-2">
                View All Care History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};