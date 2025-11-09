import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Mail } from "lucide-react";

const EmailVerificationPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Mail className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Coming Soon!</CardTitle>
            <CardDescription className="text-base">
              Email verification functionality is currently under development.
              <br />
              <strong className="text-foreground mt-2 block">We&apos;ll notify you when it&apos;s ready!</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                For now, please contact support if you need help with your account verification.
                This feature will be available soon!
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <Button variant="default" className="w-full" asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default EmailVerificationPage;