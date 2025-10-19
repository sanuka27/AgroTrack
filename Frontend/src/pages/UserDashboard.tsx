import React from 'react';
import { Navigate } from 'react-router-dom';

// Deprecated: UserDashboard page removed. Frontend now uses /plants as the canonical dashboard.
// This stub keeps any lingering imports safe by redirecting to /plants.
export default function UserDashboardRedirect() {
  return <Navigate to="/plants" replace />;
}