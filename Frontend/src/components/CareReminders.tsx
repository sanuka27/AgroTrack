import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CareType, PlantCareHistory } from '@/types/care';
import { Plant } from '@/types/plant';
import { formatCareType, getCareTypeColor } from '@/utils/careUtils';
import { Bell, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

interface CareReminder {
  plantId: string;
  plantName: string;
  careType: CareType;
  dueDate: Date;
  isOverdue: boolean;
  priority: 'low' | 'medium' | 'high';
  lastCareDate?: Date;
}

interface CareRemindersProps {
  plants: Plant[];
  plantCareHistories: Record<string, PlantCareHistory>;
  onMarkComplete?: (plantId: string, careType: CareType) => void;
  onSnooze?: (plantId: string, careType: CareType, days: number) => void;
  showOnlyOverdue?: boolean;
}

export const CareReminders: React.FC<CareRemindersProps> = ({
  plants,
  plantCareHistories,
  onMarkComplete,
  onSnooze,
  showOnlyOverdue = false
}) => {
  const generateReminders = (): CareReminder[] => {
    const reminders: CareReminder[] = [];

    plants.forEach(plant => {
      const careHistory = plantCareHistories[plant.id];
      if (!careHistory) return;

      careHistory.patterns.forEach(pattern => {
        if (!pattern.nextSuggestedDate) return;

        const dueDate = new Date(pattern.nextSuggestedDate);
        const isOverdue = isPast(dueDate) && !isToday(dueDate);
        
        if (showOnlyOverdue && !isOverdue) return;

        // Calculate priority based on how overdue and care type importance
        let priority: 'low' | 'medium' | 'high' = 'medium';
        const daysOverdue = Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (pattern.careType === 'watering' || pattern.careType === 'health-check') {
          priority = daysOverdue > 2 ? 'high' : daysOverdue > 0 ? 'medium' : 'low';
        } else if (pattern.careType === 'pest-treatment') {
          priority = daysOverdue > 0 ? 'high' : 'medium';
        } else {
          priority = daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low';
        }

        reminders.push({
          plantId: plant.id,
          plantName: plant.name,
          careType: pattern.careType,
          dueDate,
          isOverdue,
          priority,
          lastCareDate: pattern.lastCareDate ? new Date(pattern.lastCareDate) : undefined
        });
      });
    });

    // Sort by priority and due date
    return reminders.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  };

  const reminders = generateReminders();

  const getPriorityColor = (priority: CareReminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: CareReminder['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDueDate = (dueDate: Date, isOverdue: boolean) => {
    if (isOverdue) {
      return `${formatDistanceToNow(dueDate)} overdue`;
    }
    if (isToday(dueDate)) {
      return 'Due today';
    }
    if (isTomorrow(dueDate)) {
      return 'Due tomorrow';
    }
    return `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`;
  };

  if (reminders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-70" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">No care reminders at the moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Care Reminders</h3>
          <Badge variant="secondary">{reminders.length}</Badge>
        </div>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder, index) => (
          <Card key={`${reminder.plantId}-${reminder.careType}-${index}`} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{reminder.plantName}</h4>
                    <Badge className={getCareTypeColor(reminder.careType)}>
                      {formatCareType(reminder.careType)}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(reminder.priority)}>
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(reminder.priority)}
                        {reminder.priority}
                      </div>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className={reminder.isOverdue ? 'text-red-600 font-medium' : ''}>
                      {formatDueDate(reminder.dueDate, reminder.isOverdue)}
                    </span>
                    {reminder.lastCareDate && (
                      <span>
                        Last care: {formatDistanceToNow(reminder.lastCareDate, { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {onSnooze && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSnooze(reminder.plantId, reminder.careType, 1)}
                        className="text-xs"
                      >
                        +1d
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSnooze(reminder.plantId, reminder.careType, 7)}
                        className="text-xs"
                      >
                        +1w
                      </Button>
                    </div>
                  )}
                  {onMarkComplete && (
                    <Button
                      size="sm"
                      onClick={() => onMarkComplete(reminder.plantId, reminder.careType)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};