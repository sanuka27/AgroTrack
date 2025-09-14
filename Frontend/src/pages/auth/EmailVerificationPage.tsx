import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isResending, setIsResending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  
  // Get email from auth state or location state (from registration)
  const email = user?.email || location.state?.email || "";
  
  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "No email address found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);

    try {
      // Simulate Firebase auth resend verification email
      // In a real app, this would be: await sendEmailVerification(currentUser)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLastSentTime(new Date());
      
      toast({
        title: "Verification email sent!",
        description: `A new verification link has been sent to ${email}`,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Show different content if no email is available
  if (!email) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Email Required</CardTitle>
              <CardDescription>
                We need your email address to send verification instructions.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Please log in to your account to verify your email address.
                </AlertDescription>
              </Alert>

              <Button className="w-full" asChild>
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to your email address. 
              Click the link in the email to verify your account.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Email Display */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Verification Instructions */}
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Next steps:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Check your email inbox</li>
                  <li>Click the verification link in the email</li>
                  <li>Return here and log in to your account</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Resend Button */}
            <div className="space-y-3">
              <Button 
                onClick={handleResendVerification}
                disabled={isResending}
                variant="outline"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              
              {lastSentTime && (
                <p className="text-center text-sm text-muted-foreground">
                  Last sent {getTimeAgo(lastSentTime)}
                </p>
              )}
            </div>

            {/* Additional Help */}
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <strong>Didn't receive the email?</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Check your spam/junk folder</li>
                  <li>Make sure {email} is correct</li>
                  <li>Try resending the verification email</li>
                  <li>Contact support if you continue having issues</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Navigation Links */}
            <div className="flex flex-col space-y-2 text-center">
              <Link 
                to="/login" 
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                Already verified? Sign in here
              </Link>
              
              <Link 
                to="/contact" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Need help? Contact support
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default EmailVerificationPage;
