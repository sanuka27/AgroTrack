import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GeminiLogo } from "@/components/ui/gemini-logo";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Image as ImageIcon, Send, Sparkles, Bot, Loader2, Leaf, AlertTriangle, Lock, Users, TrendingUp, X } from "lucide-react";
import api, { analyzePlant } from "@/lib/api";
import plantsApi from "@/lib/api/plants";
import { PlantAnalysis } from "@/types/plant";
import PlantAnalysisCard from "./PlantAnalysisCard";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface AnalysisResult extends PlantAnalysis {
  error?: string;
  validationError?: {
    reason: string;
    category: string;
    confidence: number;
  };
}

export function AIAssistant() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [plantId, setPlantId] = useState<string>("");
  const [plantName, setPlantName] = useState<string>("");
  const [plants, setPlants] = useState<Array<{ id: string; name: string }>>([]);
  const commonSymptoms = [
    'Yellowing leaves',
    'Brown spots',
    'Wilting',
    'Powdery white coating',
    'Black mold',
    'Leaf curling',
    'Holes in leaves',
    'Stunted growth',
  ];
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guestUsageCount, setGuestUsageCount] = useState(() => {
    return parseInt(sessionStorage.getItem('guest_ai_usage') || '0');
  });

  const GUEST_USAGE_LIMIT = 2;

  // Load user's plants for selection
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await plantsApi.getPlants({ limit: 100 });
        if (cancelled) return;
        const mapped = list.map((p: any) => ({ id: p._id || p.id, name: p.name || 'Unnamed plant' })).filter((p: any) => p.id);
        setPlants(mapped);
      } catch (e) {
        // Silently ignore in guest mode or if not authenticated
        setPlants([]);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleFile = (f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const canAnalyze = useMemo(() => {
    if (!user && guestUsageCount >= GUEST_USAGE_LIMIT) return false;
    return !!file || prompt.trim().length > 5;
  }, [file, prompt, user, guestUsageCount]);

  const analyze = async () => {
    if (!canAnalyze) return;

    // Track guest usage
    if (!user) {
      const newCount = guestUsageCount + 1;
      setGuestUsageCount(newCount);
      sessionStorage.setItem('guest_ai_usage', newCount.toString());
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Handle text-only analysis (no image)
      if (!file && prompt.trim()) {
        // Call AI chat endpoint for text analysis
        const response = await api.post('/ai/chat', {
          content: `Please analyze this plant care question and provide helpful advice: ${prompt}`,
          careType: 'general'
        });

        const data = response.data;
        if (data.success && data.data) {
          setResult({
            likelyDiseases: [{ name: "General Plant Care Question", confidence: "medium" as const, why: "User inquiry about plant care" }],
            urgency: "low" as const,
            careSteps: [data.data.response?.content || "Please consult with a local gardening expert for specific advice"],
            prevention: ["Monitor your plant's response", "Adjust care based on specific plant needs"]
          });
        } else {
          throw new Error('AI analysis failed');
        }
        return;
      }

      // Handle image analysis
      if (file) {
        const formData = new FormData();
        formData.append('photo', file);
        if (prompt.trim()) formData.append('description', prompt);
        if (selectedSymptoms.length) selectedSymptoms.forEach(s => formData.append('selectedSymptoms', s));
        // Pass along selected plant context if available
        if (plantId) {
          formData.append('plantId', plantId);
          formData.append('plantName', plantName || (plants.find(p => p.id === plantId)?.name || ''));
        }

        const analysis: PlantAnalysis = await analyzePlant(formData);
        setResult(analysis);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);

      // Handle validation errors specifically
      if (err.response?.status === 400 && err.response?.data?.message?.includes('Invalid image content')) {
        setError(`Please upload a photo of plants, trees, crops, or agricultural content only. Images of cars, people, buildings, or other objects are not accepted.`);
        setResult({
          likelyDiseases: [],
          urgency: "low" as const,
          careSteps: ["Please upload a photo showing plants, trees, crops, or agricultural scenes"],
          prevention: [],
          validationError: err.response.data.details
        });
      } else if (err.response?.status === 429) {
        setError("Our plant AI is getting a lot of love right now 🌱. Please try again in a bit.");
      } else {
        setError(err.response?.data?.message || err.message || 'Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ai" className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-semibold">Live AI Assistant</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
            Diagnose • Plan • Grow
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a photo of plants, trees, or crops for AI-powered disease detection and care advice. Only plant-related images are accepted.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Powered by</span>
            <GeminiLogo className="h-4" />
            <span>— demo simulation</span>
          </div>
        </div>

        {/* Guest Limitations Banner */}
        {!user && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">
                  🌱 Guest Mode: Limited AI Analysis ({GUEST_USAGE_LIMIT - guestUsageCount} remaining)
                </h3>
                <p className="text-amber-800 mb-4">
                  You're using our AI as a guest. Join AgroTrack for unlimited plant analysis, personalized care plans, and smart reminders!
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-amber-700">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Unlimited AI analysis</span>
                  </div>
                  <div className="flex items-center space-x-2 text-amber-700">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Plant growth tracking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-amber-700">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Community support</span>
                  </div>
                </div>
                
                {guestUsageCount >= GUEST_USAGE_LIMIT ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800 font-medium mb-2">🚫 Guest limit reached!</p>
                    <p className="text-red-700 text-sm">You've used all guest analyses. Sign up for unlimited access!</p>
                  </div>
                ) : null}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    <Link to="/register">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Unlimited Access - Free!
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/login">Already a member? Sign In</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card className="hover-scale border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Plant Analysis
              </CardTitle>
              <CardDescription>
                Upload a photo or describe your plant's symptoms for AI analysis
                <span className="text-xs text-muted-foreground block mt-1">
                  Only images of plants, trees, crops, or agricultural content accepted
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plant Selector (optional) */}
              {user && plants.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="plant-select">Select your plant (optional)</Label>
                  <Select
                    value={plantId}
                    onValueChange={(val) => {
                      setPlantId(val);
                      const found = plants.find(p => p.id === val);
                      setPlantName(found?.name || "");
                    }}
                  >
                    <SelectTrigger id="plant-select" className="w-full">
                      <SelectValue placeholder="Choose a plant to analyze" />
                    </SelectTrigger>
                    <SelectContent>
                      {plants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* File Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Drag and drop or click to upload
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                    className="text-sm file:mr-4 file:py-1 file:px-2 file:border-0 file:rounded file:bg-primary file:text-primary-foreground file:hover:bg-primary/90"
                  />
                </div>
                
                {preview && (
                  <div className="mt-4">
                    <img 
                      src={preview} 
                      alt="Plant preview" 
                      className="max-h-32 mx-auto rounded object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Predefined Symptoms */}
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-foreground">Common symptoms (optional)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {commonSymptoms.map(sym => (
                    <label key={sym} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedSymptoms.includes(sym)}
                        onChange={(e) => {
                          setSelectedSymptoms(prev => e.target.checked ? [...prev, sym] : prev.filter(s => s !== sym));
                        }}
                      />
                      <span>{sym}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Text Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Describe the issue (optional)
                </label>
                <Textarea
                  placeholder="Describe any symptoms you've noticed: yellowing leaves, brown spots, wilting, etc."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-20 resize-none"
                />
              </div>

              {/* Analyze Button */}
              <Button 
                onClick={analyze}
                disabled={!canAnalyze || loading}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : !user && guestUsageCount >= GUEST_USAGE_LIMIT ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign Up for Unlimited Access
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {!user ? `Analyze Plant (${GUEST_USAGE_LIMIT - guestUsageCount} left)` : 'Analyze Plant'}
                  </>
                )}
              </Button>
              
              {!user && guestUsageCount >= GUEST_USAGE_LIMIT && (
                <div className="mt-3 text-center">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/register">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Continue with Free Account
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="hover-scale border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                AI Analysis Results
              </CardTitle>
              <CardDescription>
                Detailed diagnosis and treatment recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-destructive mb-1">Analysis Error</h3>
                      <p className="text-sm text-destructive/80">{error}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setError(null)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
                    <Bot className="w-8 h-8 text-primary absolute top-4 left-4 animate-bounce" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    AI is analyzing your plant...
                  </p>
                </div>
              )}

              {!loading && !result && (
                <div className="text-center py-12 space-y-4">
                  <Leaf className="w-16 h-16 text-muted-foreground/40 mx-auto" />
                  <div>
                    <p className="font-medium text-muted-foreground">Ready to help!</p>
                    <p className="text-sm text-muted-foreground">
                      Upload a photo of plants, trees, or crops to get started
                    </p>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Analysis Result */}
                  <PlantAnalysisCard
                    data={result}
                    imageUrl={preview}
                    description={prompt}
                  />



                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      Save Results
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Set Reminders
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
