import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import GuestCTABanner from "@/components/GuestCTABanner";
import GuestFloatingCTA from "@/components/GuestFloatingCTA";
import BackToTop from "@/components/BackToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

// Dynamic imports with proper typing
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const MyPlants = lazy(() => import("./pages/MyPlants"));
const Community = lazy(() => import("./pages/Community"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AllFeatures = lazy(() => import("./pages/AllFeatures"));
const PlantAnalysis = lazy(() => import("./pages/PlantAnalysis"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// New static pages
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const BugReportsPage = lazy(() => import("./pages/BugReportsPage"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const queryClient = new QueryClient();

const App = () => {
  return (
  <AuthProvider>
    <DemoProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MyPlants />
                </ProtectedRoute>
              } />
              <Route path="/my-plants" element={
                <ProtectedRoute>
                  <MyPlants />
                </ProtectedRoute>
              } />
              <Route path="/community" element={<Community />} />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requiredPermission="moderate_content">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/plant-analysis" element={<PlantAnalysis />} />
              <Route path="/features" element={<AllFeatures />} />
              
              {/* Content Pages */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/help" element={<HelpCenterPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/bug-reports" element={<BugReportsPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
            {/* Guest Conversion Components */}
            <GuestCTABanner />
            <GuestFloatingCTA />
            
            {/* Global Navigation Components */}
            <BackToTop />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </DemoProvider>
  </AuthProvider>
  );
};

export default App;
