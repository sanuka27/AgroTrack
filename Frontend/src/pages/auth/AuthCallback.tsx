import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        return;
      }

      if (token && refreshToken) {
        // Store tokens
        localStorage.setItem('agrotrack_token', token);
        localStorage.setItem('agrotrack_refresh_token', refreshToken);
        
        // Redirect to plants page
        navigate('/plants', { replace: true });
      } else {
        console.error('No tokens received from OAuth callback');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const error = searchParams.get('error');

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-center text-destructive">
                Authentication Failed
              </CardTitle>
              <CardDescription className="text-center">
                There was an error signing you in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {error === 'access_denied' 
                    ? 'You cancelled the authentication process.'
                    : 'An error occurred during authentication. Please try again.'
                  }
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto p-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing you in...
            </CardTitle>
            <CardDescription className="text-center">
              Please wait while we complete your authentication
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default AuthCallback;