import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { askPermissionAndGetToken, listenForMessages } from "@/lib/notifications";
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
const PasswordResetPage = lazy(() => import("./pages/auth/PasswordResetPage"));
const EmailVerificationPage = lazy(() => import("./pages/auth/EmailVerificationPage"));
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
const GuidesPage = lazy(() => import("./pages/GuidesPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const CareTestPage = lazy(() => import("./pages/CareTestPage"));
const ReminderTestPage = lazy(() => import("./pages/ReminderTestPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Community Forum pages
const FeedPage = lazy(() => import("./pages/community/FeedPage"));
const PostEditor = lazy(() => import("./pages/community/PostEditor"));
const PostDetailPage = lazy(() => import("./pages/community/PostDetailPage"));

const queryClient = new QueryClient();

// Component to conditionally render CTA components only on home page
const ConditionalCTAComponents = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  if (!isHomePage) return null;

  return (
    <>
      <GuestCTABanner />
      <GuestFloatingCTA />
    </>
  );
};

const App = () => {
  useEffect(() => {
    askPermissionAndGetToken();
    listenForMessages();
  }, []);

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
              <Route path="/reset-password" element={<PasswordResetPage />} />
              <Route path="/verify-email" element={<EmailVerificationPage />} />
              {/* /dashboard is deprecated - redirect to /plants (plants is the new dashboard) */}
              <Route path="/dashboard" element={<Navigate to="/plants" replace />} />
              <Route path="/my-plants" element={
                <ProtectedRoute>
                  <MyPlants />
                </ProtectedRoute>
              } />
              <Route path="/plants" element={
                <ProtectedRoute>
                  <MyPlants />
                </ProtectedRoute>
              } />
              <Route path="/community" element={<FeedPage />} />
              <Route path="/community/new" element={
                <ProtectedRoute>
                  <PostEditor />
                </ProtectedRoute>
              } />
              <Route path="/community/:postId" element={<PostDetailPage />} />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <SettingsPage />
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
              <Route path="/guides" element={<GuidesPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/care-test" element={<CareTestPage />} />
              <Route path="/reminder-test" element={<ReminderTestPage />} />
              <Route path="/search" element={<SearchPage />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            
            {/* Guest Conversion Components - Only on Home Page */}
            <ConditionalCTAComponents />
            
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
