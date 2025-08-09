import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  
  // Check if user is authenticated
  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if user has required permission (if specified)
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Redirect to unauthorized page or home
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
