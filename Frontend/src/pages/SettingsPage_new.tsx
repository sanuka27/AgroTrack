import React from 'react';
import { Navigate } from 'react-router-dom';

// This duplicate settings page was removed and now redirects to the canonical settings page.
const SettingsPageRedirect: React.FC = () => <Navigate to="/settings" replace />;

export default SettingsPageRedirect;
