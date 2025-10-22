import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect duplicate/old settings page to the canonical /settings route
const SettingsPageRedirect: React.FC = () => <Navigate to="/settings" replace />;

export default SettingsPageRedirect;
