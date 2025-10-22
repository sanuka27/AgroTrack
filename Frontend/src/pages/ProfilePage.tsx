import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect the old profile page to the canonical settings page
const ProfileRedirect: React.FC = () => <Navigate to="/settings" replace />;

export default ProfileRedirect;
