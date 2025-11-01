import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GeminiLogo } from "@/components/ui/gemini-logo";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Image as ImageIcon, Send, Sparkles, Bot, Loader2, Leaf, AlertTriangle, Lock, Users, TrendingUp, X } from "lucide-react";
import api, { analyzePlant } from "@/lib/api";
import { remindersApi } from '@/lib/api/reminders';
import plantsApi from "@/lib/api/plants";
import { useToast } from '@/hooks/use-toast';
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
  // When the page is opened with a `rec` query param we prefill results from DB.
  // Use a separate flag so we don't show the "AI is analyzing" spinner (which is reserved for live analysis).
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fullRec, setFullRec] = useState<any | null>(null);
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
          formData.append('plantName', plantName || (plants.find((p: any) => p.id === plantId)?.name || ''));
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

  const { toast } = useToast();

  // Read query params to show details when navigated from "View details"
  const location = useLocation();
  const recParam = (() => new URLSearchParams(location.search).get('rec'))();
  const viewingRec = Boolean(recParam);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const recId = params.get('rec');
  if (!recId) return;

    (async () => {
      setPrefillLoading(true);
      try {
        if (recId.startsWith('note-')) {
          const plantId = recId.replace('note-', '');
          try {
            const plant = await plantsApi.getPlantById(plantId);
            // Derive a structured recommendation from plant.notes
            const notes: string = (plant as any).notes || '';
            // Attempt to parse lines after 'AI Analysis' marker
            const markerIndex = notes.indexOf('AI Analysis');
            const after = markerIndex >= 0 ? notes.slice(markerIndex) : notes;
            const lines = after.split('\n').map(l => l.trim()).filter(Boolean);

            const description = lines.join('\n');
            // Prefer an analysis image saved in the notes (ANALYSIS_IMAGE:<url>) — fallback to plant.imageUrl
            const rawNotes = (plant as any).notes || '';
            const IMAGE_MARKER = 'ANALYSIS_IMAGE:';
            let analysisImageUrl = '';
            const markerIdx = rawNotes.indexOf(IMAGE_MARKER);
            if (markerIdx >= 0) {
              const afterMarker = rawNotes.slice(markerIdx + IMAGE_MARKER.length).trim();
              analysisImageUrl = afterMarker.split('\n')[0].trim();
            }

            const derived = {
              _id: recId,
              plantId: plant._id || (plant as any).id,
              plantName: plant.name,
              imageUrl: analysisImageUrl || plant.imageUrl || '',
              description,
              recommendations: { immediateActions: lines.slice(0, 5), preventionMeasures: [] },
              detectionResults: undefined,
              status: 'saved',
              createdAt: (plant as any)._updatedAt || new Date().toISOString(),
            };

            setFullRec(derived);
            // Also populate the simpler result slot so the existing card renders
            setResult({
              likelyDiseases: [],
              urgency: 'low',
              careSteps: derived.recommendations.immediateActions || [],
              prevention: derived.recommendations.preventionMeasures || [],
            } as AnalysisResult);
            setPreview(plant.imageUrl || null); // Show the saved analysis image
          } catch (err) {
            console.warn('[AIAssistant] failed to load plant for note rec', err);
            setFullRec(null);
          }
        } else {
          // Try to fetch AI recommendation from backend
          try {
            const resp = await api.get(`/ai-recommendations/${recId}`);
            const rec = resp.data?.data || resp.data || null;
            if (rec) {
              setFullRec(rec);
              // Map detectionResults/recommendations into result for the summary card
              setResult({
                likelyDiseases: (rec.detectionResults?.diseases || []).map((d:any) => ({ name: d.name, confidence: d.confidence || 'medium', why: d.reason || '' })),
                urgency: rec.recommendations?.urgency || 'medium',
                careSteps: rec.recommendations?.immediateActions || [],
                prevention: rec.recommendations?.preventionMeasures || [],
                detectionResults: rec.detectionResults
              } as any);
              setPreview(rec.imageUrl || null);
            }
          } catch (err) {
            console.warn('[AIAssistant] failed to fetch ai recommendation', err);
          }
        }
      } finally {
        setPrefillLoading(false);
      }
    })();
  }, [location.search]);

  const saveResults = async () => {
    if (!result) return;
    // Require a selected plant to attach the analysis to
    if (!plantId) {
      // Ask user to pick a plant or create one
      toast({ title: 'Select a plant', description: 'Please select a plant from the dropdown to save analysis results.' });
      return;
    }

    try {
      const summaryLines: string[] = [];
      if (result.likelyDiseases && result.likelyDiseases.length) {
        summaryLines.push('Likely diseases: ' + result.likelyDiseases.map(d => `${d.name} (${d.confidence})`).join('; '));
      }
      summaryLines.push('Urgency: ' + result.urgency);
      if (result.careSteps && result.careSteps.length) {
        summaryLines.push('Care Steps: ' + result.careSteps.join(' | '));
      }
      if (result.prevention && result.prevention.length) {
        summaryLines.push('Prevention: ' + result.prevention.join(' | '));
      }

      const notes = summaryLines.join('\n');

      // Patch plant notes with AI summary (non-destructive: prepend timestamp)
      const timestamp = new Date().toLocaleString();
      const NOTES_MARKER = 'ANALYSIS_IMAGE:';
  const payload: any = { notes: `${timestamp} - AI Analysis:\n${notes}` };
      // Optionally set healthStatus based on urgency
      if (result.urgency === 'high') payload.healthStatus = 'Poor';

      // If there's an uploaded file, upload it as the plant's image so it will be shown for saved analysis
      if (file) {
        try {
          const updatedPlant = await plantsApi.uploadImage(plantId, file);
          const imageUrl = (updatedPlant as any).imageUrl || '';
          // Append a marker to notes so note-based recommendations can reference the uploaded image
          payload.notes = `${payload.notes}\n${NOTES_MARKER}${imageUrl}`;
          await plantsApi.updatePlant(plantId, payload);
          setPreview(imageUrl || preview);
        } catch (uploadErr) {
          console.warn('Failed to upload analysis image, saving notes only', uploadErr);
          await plantsApi.updatePlant(plantId, payload);
        }
      } else {
        await plantsApi.updatePlant(plantId, payload);
      }

      toast({ title: 'Saved', description: 'AI analysis and image saved to the selected plant.' });
      // Optionally navigate to plants page so the user sees it immediately
      // Keep UX simple: open plants page in same tab
      window.location.href = '/plants';
    } catch (err: any) {
      console.error('Failed to save AI results to plant:', err);
      toast({ title: 'Save failed', description: err?.response?.data?.message || err?.message || 'Failed to save results. Please try again.' });
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
            <span>AI</span>
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

        <div className={viewingRec ? "grid grid-cols-1 gap-8" : "grid grid-cols-1 lg:grid-cols-2 gap-8"}>
          {/* Input Panel - hidden when viewing a saved recommendation */}
          {!viewingRec && (
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
                        const found = plants.find((p: any) => p.id === val);
                        setPlantName(found?.name || "");
                      }}
                    >
                      <SelectTrigger id="plant-select" className="w-full">
                        <SelectValue placeholder="Choose a plant to analyze" />
                      </SelectTrigger>
                      <SelectContent>
                        {plants.map((p: any) => (
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
          )}

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
                  {/* Analysis Result - hide the compact summary when viewing a saved recommendation */}
                  {!viewingRec && (
                    <PlantAnalysisCard
                      data={result}
                      imageUrl={preview}
                      description={prompt}
                    />
                  )}

                  {/* Full Recommendation Details (when opened via View details) */}
                  {fullRec && (() => {
                    // Parse the description field to extract structured data
                    const desc = fullRec.description || '';
                    const lines = desc.split('\n').map((l: string) => l.trim()).filter(Boolean);
                    
                    let diseases = '';
                    let urgency = '';
                    let careSteps: string[] = [];
                    let prevention: string[] = [];
                    
                    lines.forEach((line: string) => {
                      if (line.startsWith('Likely diseases:')) {
                        diseases = line.replace('Likely diseases:', '').trim();
                      } else if (line.startsWith('Urgency:')) {
                        urgency = line.replace('Urgency:', '').trim();
                      } else if (line.startsWith('Care Steps:')) {
                        const stepsStr = line.replace('Care Steps:', '').trim();
                        careSteps = stepsStr.split('|').map(s => s.trim()).filter(Boolean);
                      } else if (line.startsWith('Prevention:')) {
                        const prevStr = line.replace('Prevention:', '').trim();
                        prevention = prevStr.split('|').map(s => s.trim()).filter(Boolean);
                      }
                    });

                    return (
                      <div className="bg-white border border-green-100 shadow-sm rounded-lg overflow-hidden">
                        {/* Header with plant name and badges */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-green-100">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-green-900 flex items-center gap-2">
                                <Leaf className="w-5 h-5 text-green-600" />
                                {fullRec.plantName || 'Saved Analysis'}
                              </h3>
                              <p className="text-sm text-green-600 mt-1">{new Date(fullRec.createdAt || Date.now()).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {urgency && (
                                <Badge className={
                                  urgency.toLowerCase() === 'high' ? 'bg-red-100 text-red-700 border-red-200' : 
                                  urgency.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                  'bg-green-100 text-green-700 border-green-200'
                                }>
                                  {urgency.toUpperCase()}
                                </Badge>
                              )}
                              <Badge className="bg-green-100 text-green-800 border-green-200">Saved</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Image - smaller and rounded */}
                          {fullRec.imageUrl && (
                            <div className="flex justify-center">
                              <img 
                                src={fullRec.imageUrl} 
                                alt={fullRec.plantName || 'plant'} 
                                className="w-40 h-40 object-cover rounded-lg shadow-md border-2 border-green-100" 
                              />
                            </div>
                          )}

                          {/* Diagnosis Section */}
                          {diseases && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5" />
                                Detected Issue
                              </h4>
                              <p className="text-red-700">{diseases}</p>
                            </div>
                          )}

                          {/* Care Steps Section */}
                          {careSteps.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5" />
                                Immediate Care Steps
                              </h4>
                              <ul className="space-y-2">
                                {careSteps.map((step: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-blue-700">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span className="text-sm">{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Prevention Section */}
                          {prevention.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                                <Leaf className="w-5 h-5" />
                                Prevention Measures
                              </h4>
                              <ul className="space-y-2">
                                {prevention.map((measure: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-green-700">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    <span className="text-sm">{measure}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Backend structured data removed - using parsed sections above instead */}
                        </div>
                      </div>
                    );
                  })()}



                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    {!viewingRec && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={saveResults}>
                        Save Results
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1" onClick={async () => {
                      // Create a reminder based on the saved analysis
                      if (!fullRec) {
                        toast({ title: 'No analysis', description: 'Nothing to create a reminder from.' });
                        return;
                      }
                      try {
                        const title = fullRec.plantName ? `Care: ${fullRec.plantName}` : (fullRec.title || 'Plant care reminder');
                        const notes = fullRec.description || fullRec.recommendations?.immediateActions?.join('\n') || 'Care reminder';
                        const dueAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // default 3 days
                        const payload: any = { title, notes, dueAt };
                        if (fullRec.plantId) payload.plantId = fullRec.plantId;

                        const created = await remindersApi.createReminder(payload);
                        toast({ title: 'Reminder created', description: `Reminder scheduled for ${new Date(created.dueAt).toLocaleString()}` });
                        // Navigate to Reminders page so user sees it immediately
                        window.location.href = '/reminder-test';
                      } catch (err: any) {
                        console.error('Failed to create reminder', err);
                        toast({ title: 'Failed', description: err?.response?.data?.message || err?.message || 'Could not create reminder' });
                      }
                    }}>
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
