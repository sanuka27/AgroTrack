import { useAuth, UserRole } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles = [],
  permissions = [],
  fallback = null,
  requireAll = false
}) => {
  const { role, hasPermission } = useAuth();

  // Check role-based access
  const hasRoleAccess = roles.length === 0 || roles.includes(role);

  // Check permission-based access
  const permissionChecks = permissions.map(permission => hasPermission(permission));
  const hasPermissionAccess = permissions.length === 0 || 
    (requireAll ? permissionChecks.every(Boolean) : permissionChecks.some(Boolean));

  if (hasRoleAccess && hasPermissionAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

interface PermissionCheckProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionCheck: React.FC<PermissionCheckProps> = ({
  permission,
  children,
  fallback = null
}) => {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

interface GuestPromptProps {
  message?: string;
  showRegisterButton?: boolean;
}

export const GuestPrompt: React.FC<GuestPromptProps> = ({
  message = "Please sign in to access this feature",
  showRegisterButton = true
}) => {
  return (
    <div className="text-center py-8 px-4 bg-muted/30 rounded-lg border border-border">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-muted-foreground">
          <p>{message}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a 
            href="/login" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
          {showRegisterButton && (
            <a 
              href="/register" 
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              Create Account
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleGuard;
