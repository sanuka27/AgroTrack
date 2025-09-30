import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Reminder, ReminderPreferences, ReminderPriority } from '@/types/reminders';
import { Plant } from '@/types/plant';
import { CareLog } from '@/types/care';
import {
  generateSmartReminders,
  filterRemindersForDisplay,
  getTodaysReminders,
  getOverdueReminders,
  snoozeReminder,
  completeReminder,
  getDefaultReminderPreferences
} from '@/utils/reminderUtils';
import { Bell, Clock, AlertTriangle, CheckCircle, Settings, Calendar, Zap } from 'lucide-react';
import { formatDistanceToNow, isToday, isTomorrow } from 'date-fns';

interface SmartReminderDashboardProps {
  plants: Plant[];
  careLogs: CareLog[];
  onSettingsClick?: () => void;
}

export const SmartReminderDashboard: React.FC<SmartReminderDashboardProps> = ({
  plants,
  careLogs,
  onSettingsClick
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [preferences, setPreferences] = useState<ReminderPreferences>(getDefaultReminderPreferences());
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'overdue'>('all');

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('reminder-preferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading reminder preferences:', error);
    }
  }, []);

  // Generate reminders when plants or care logs change
  useEffect(() => {
    if (plants.length > 0) {
      const generatedReminders = generateSmartReminders(plants, careLogs, preferences);
      const filteredReminders = filterRemindersForDisplay(generatedReminders, preferences);
      setReminders(filteredReminders);
    }
  }, [plants, careLogs, preferences]);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: ReminderPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('reminder-preferences', JSON.stringify(newPreferences));
  };

  const handleSnooze = (reminder: Reminder, days: number) => {
    const snoozedReminder = snoozeReminder(reminder, days);
    setReminders(prev => prev.map(r => r.id === reminder.id ? snoozedReminder : r));
  };

  const handleComplete = (reminder: Reminder) => {
    const completedReminder = completeReminder(reminder);
    setReminders(prev => prev.map(r => r.id === reminder.id ? completedReminder : r));
  };

  const getFilteredReminders = () => {
    switch (activeTab) {
      case 'today':
        return getTodaysReminders(reminders);
      case 'overdue':
        return getOverdueReminders(reminders);
      default:
        return reminders;
    }
  };

  const getPriorityColor = (priority: ReminderPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: ReminderPriority) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <Zap className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <Bell className="w-4 h-4" />;
    }
  };

  const formatDueDate = (dueDate: Date) => {
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    return formatDistanceToNow(dueDate, { addSuffix: true });
  };

  const filteredReminders = getFilteredReminders();
  const overdueCount = getOverdueReminders(reminders).length;
  const todayCount = getTodaysReminders(reminders).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Smart Reminders</h2>
            <p className="text-muted-foreground">Intelligent care scheduling based on your plants' needs</p>
          </div>
        </div>
        {onSettingsClick && (
          <Button variant="outline" onClick={onSettingsClick}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold">{reminders.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={todayCount > 0 ? 'border-blue-200 bg-blue-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-2xl font-bold text-blue-600">{todayCount}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={overdueCount > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : ''}`}>
                  {overdueCount}
                </p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {reminders.filter(r => r.status === 'completed' && isToday(r.updatedAt)).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminder Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All Reminders
            <Badge variant="secondary">{reminders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="today" className="flex items-center gap-2">
            Due Today
            {todayCount > 0 && <Badge variant="default">{todayCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            Overdue
            {overdueCount > 0 && <Badge variant="destructive">{overdueCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredReminders.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-70" />
                  <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                  <p>
                    {activeTab === 'all' && "No active reminders at the moment."}
                    {activeTab === 'today' && "No reminders due today."}
                    {activeTab === 'overdue' && "No overdue reminders!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReminders.map((reminder) => (
                <Card key={reminder.id} className={`border-l-4 ${
                  reminder.priority === 'urgent' ? 'border-l-red-500' :
                  reminder.priority === 'high' ? 'border-l-orange-500' :
                  reminder.priority === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{reminder.title}</h4>
                          <Badge className={getPriorityColor(reminder.priority)}>
                            <div className="flex items-center gap-1">
                              {getPriorityIcon(reminder.priority)}
                              {reminder.priority}
                            </div>
                          </Badge>
                          {reminder.status === 'snoozed' && (
                            <Badge variant="outline">Snoozed</Badge>
                          )}
                        </div>

                        <p className="text-muted-foreground mb-3">{reminder.description}</p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Due: {formatDueDate(reminder.dueDate)}</span>
                          {reminder.lastCareDate && (
                            <span>Last care: {formatDistanceToNow(reminder.lastCareDate, { addSuffix: true })}</span>
                          )}
                          <span>Every ~{reminder.frequency.days} days</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {reminder.status === 'pending' && (
                          <>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSnooze(reminder, 1)}
                              >
                                +1d
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSnooze(reminder, 7)}
                              >
                                +1w
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleComplete(reminder)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Done
                            </Button>
                          </>
                        )}
                        {reminder.status === 'snoozed' && reminder.snoozedUntil && (
                          <div className="text-sm text-muted-foreground">
                            Snoozed until {formatDueDate(reminder.snoozedUntil)}
                          </div>
                        )}
                        {reminder.status === 'completed' && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};