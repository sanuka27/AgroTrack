// AI Smart Suggestions Component
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle, X, Sparkles } from 'lucide-react';
import { getAISuggestions, dismissSuggestion, actionSuggestion, generateAISuggestions, AISmartSuggestion } from '@/api/aiSuggestions';
import { useToast } from '@/hooks/use-toast';

export const AISmartSuggestionsCard: React.FC = () => {
  const [suggestions, setSuggestions] = useState<AISmartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await getAISuggestions({ limit: 3 });
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await generateAISuggestions();
      toast({
        title: '✨ AI Analysis Complete',
        description: `Generated ${response.data.count} new suggestions`,
      });
      await loadSuggestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to generate suggestions',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDismiss = async (suggestionId: string) => {
    try {
      await dismissSuggestion(suggestionId);
      setSuggestions(suggestions.filter(s => s._id !== suggestionId));
      toast({
        title: 'Suggestion dismissed',
      });
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  const handleAction = async (suggestionId: string) => {
    try {
      await actionSuggestion(suggestionId);
      setSuggestions(suggestions.filter(s => s._id !== suggestionId));
      toast({
        title: '✓ Marked as done',
      });
    } catch (error) {
      console.error('Error actioning suggestion:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pro_tip':
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case 'growth_insight':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'alert':
      case 'health_warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pro_tip':
        return 'Pro Tip';
      case 'growth_insight':
        return 'Growth Insight';
      case 'alert':
        return 'Alert';
      case 'care_reminder':
        return 'Care Reminder';
      case 'health_warning':
        return 'Health Warning';
      default:
        return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            AI Smart Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading personalized care tips...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              AI Smart Suggestions
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Personalized care tips</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 border-none"
          >
            {generating ? 'Analyzing...' : 'Generate'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">No suggestions yet</p>
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              Generate AI Suggestions
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion._id}
                className={`p-4 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(suggestion.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(suggestion.type)}
                      </Badge>
                      {suggestion.plantId && (
                        <span className="text-xs text-gray-600">
                          {suggestion.plantId.name}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-gray-700">{suggestion.message}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction(suggestion._id)}
                      className="h-7 px-2 text-xs"
                    >
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(suggestion._id)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
