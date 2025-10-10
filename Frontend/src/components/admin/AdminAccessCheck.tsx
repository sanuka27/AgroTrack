import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function AdminAccessCheck() {
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    tokenPreview?: string;
    role?: string;
  }>({ hasToken: false });

  useEffect(() => {
    const token = localStorage.getItem('agrotrack_token');
    if (token) {
      try {
        // Decode JWT to check role (basic decode, not verification)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTokenInfo({
          hasToken: true,
          tokenPreview: token.substring(0, 20) + '...',
          role: payload.role || 'unknown'
        });
      } catch (e) {
        setTokenInfo({ hasToken: true, tokenPreview: 'Invalid token' });
      }
    }
  }, []);

  const handleRelogin = () => {
    // Clear all auth data
    localStorage.removeItem('agrotrack_token');
    localStorage.removeItem('agrotrack_refresh_token');
    // Redirect to login
    window.location.href = '/';
  };

  if (!tokenInfo.hasToken) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Authentication Token</AlertTitle>
        <AlertDescription>
          You are not logged in. Please log in to access the admin dashboard.
          <Button onClick={handleRelogin} className="mt-2" variant="outline" size="sm">
            Go to Login
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (tokenInfo.role !== 'admin') {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Admin Access Required</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Your current role is: <strong>{tokenInfo.role}</strong></p>
          <p>You need to log out and log back in to refresh your session with admin permissions.</p>
          <Button onClick={handleRelogin} className="mt-2" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Logout and Refresh
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
