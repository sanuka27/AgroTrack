import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Activity, 
  Shield, 
  Database, 
  Zap,
  Calendar,
  ArrowRight,
  Wifi,
  Server,
  LucideIcon
} from 'lucide-react';

interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  status: 'operational' | 'degraded' | 'down';
  icon: LucideIcon;
  lastChecked: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'resolved' | 'investigating' | 'monitoring';
  severity: 'minor' | 'major' | 'critical';
  date: string;
  duration: string;
  affectedServices: string[];
}

const StatusPage = () => {
  useEffect(() => {
    document.title = 'System Status - AgroTrack Smart Gardening';
    
    // Focus on main content for accessibility
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.focus();
    }
  }, []);

  const services: ServiceStatus[] = [
    {
      id: 'app',
      name: 'Application',
      description: 'Main AgroTrack web application and user interface',
      status: 'operational',
      icon: Activity,
      lastChecked: '2 minutes ago'
    },
    {
      id: 'auth',
      name: 'Authentication',
      description: 'User login, registration, and session management',
      status: 'operational',
      icon: Shield,
      lastChecked: '1 minute ago'
    },
    {
      id: 'realtime',
      name: 'Real-time Services',
      description: 'Live notifications, updates, and admin dashboard data',
      status: 'degraded',
      icon: Zap,
      lastChecked: '3 minutes ago'
    },
    {
      id: 'storage',
      name: 'Storage & Database',
      description: 'Plant data, user content, and file storage systems',
      status: 'operational',
      icon: Database,
      lastChecked: '1 minute ago'
    }
  ];

  const pastIncidents: Incident[] = [
    {
      id: '1',
      title: 'Real-time Dashboard Performance Issues',
      description: 'Users experienced slower loading times in the admin dashboard due to increased data processing loads. We optimized our real-time data aggregation system and improved caching.',
      status: 'resolved',
      severity: 'minor',
      date: '2025-09-07',
      duration: '2 hours 15 minutes',
      affectedServices: ['Real-time Services', 'Application']
    },
    {
      id: '2',
      title: 'Scheduled Maintenance - Database Optimization',
      description: 'Planned maintenance to optimize database performance and improve query response times. All services were temporarily unavailable during the maintenance window.',
      status: 'resolved',
      severity: 'major',
      date: '2025-09-01',
      duration: '45 minutes',
      affectedServices: ['Storage & Database', 'Application', 'Authentication']
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return {
          icon: CheckCircle,
          text: 'Operational',
          className: 'bg-green-100 text-green-800'
        };
      case 'degraded':
        return {
          icon: AlertTriangle,
          text: 'Degraded Performance',
          className: 'bg-yellow-100 text-yellow-800'
        };
      case 'down':
        return {
          icon: XCircle,
          text: 'Service Down',
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'bg-blue-100 text-blue-800';
      case 'major':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const overallStatus = services.some(s => s.status === 'down') 
    ? 'down' 
    : services.some(s => s.status === 'degraded') 
    ? 'degraded' 
    : 'operational';

  const overallStatusConfig = getStatusBadge(overallStatus);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8" tabIndex={-1}>
        {/* Hero Section */}
        <section className="text-center space-y-6" role="banner">
          <div className="space-y-4">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
              <Server className="w-4 h-4 mr-2" />
              System Status
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              AgroTrack System Status
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Real-time monitoring of all AgroTrack services and systems.
            </p>
          </div>

          {/* Overall Status */}
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-2xl ring-1 ring-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <overallStatusConfig.icon className={`w-6 h-6 ${
                    overallStatus === 'operational' ? 'text-green-600' :
                    overallStatus === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <span className="text-2xl font-semibold text-gray-900">
                    All Systems {overallStatus === 'operational' ? 'Operational' : 
                                overallStatus === 'degraded' ? 'Partially Degraded' : 'Experiencing Issues'}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mt-2 text-center">
                Last updated: {new Date().toLocaleTimeString()} UTC
              </p>
            </Card>
          </div>
        </section>

        {/* Service Status Grid */}
        <section className="space-y-6" role="main">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Service Status
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Monitor the status of individual AgroTrack services and components.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => {
              const statusConfig = getStatusBadge(service.status);
              return (
                <Card key={service.id} className="rounded-2xl ring-1 ring-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${
                          service.status === 'operational' ? 'bg-green-100' :
                          service.status === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <service.icon className={`w-6 h-6 ${
                            service.status === 'operational' ? 'text-green-600' :
                            service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {service.name}
                          </CardTitle>
                          <CardDescription className="text-gray-600 text-sm">
                            {service.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`${statusConfig.className} flex items-center space-x-1`}>
                        <statusConfig.icon className="w-4 h-4" />
                        <span>{statusConfig.text}</span>
                      </Badge>
                      <div className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Checked {service.lastChecked}</span>
                      </div>
                    </div>
                    
                    {service.status === 'degraded' && service.id === 'realtime' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 text-sm">
                          <strong>Performance Notice:</strong> Real-time updates may experience delays of 10-30 seconds. 
                          We're working to restore full performance.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Past Incidents */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Incident History
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Recent incidents and maintenance activities affecting AgroTrack services.
            </p>
          </div>

          <div className="space-y-4">
            {pastIncidents.map((incident) => (
              <Card key={incident.id} className="rounded-2xl ring-1 ring-gray-200 shadow-sm p-6">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {incident.title}
                        </CardTitle>
                        <Badge className={getSeverityBadge(incident.severity)}>
                          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-800">
                          {incident.status === 'resolved' ? 'Resolved' : incident.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(incident.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Duration: {incident.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-gray-700 leading-relaxed">
                    {incident.description}
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      Affected Services:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {incident.affectedServices.map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Subscribe to Updates */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Wifi className="w-6 h-6 text-blue-300" />
              <h2 className="text-3xl font-bold">
                Stay Informed
              </h2>
            </div>
            <p className="text-blue-100 max-w-2xl mx-auto text-lg">
              Subscribe to status updates and get notified about incidents and maintenance windows.
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email for status updates"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                disabled
              />
              <Button 
                disabled
                className="bg-white text-blue-600 hover:bg-gray-100 font-medium px-6 py-3 rounded-xl cursor-not-allowed opacity-50"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-blue-200 text-sm mt-2 text-center">
              Status notifications coming soon!
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Need Help?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              If you're experiencing issues not reflected on this status page, please contact our support team.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white font-medium">
              <Link to="/contact">
                Contact Support
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/help">
                Help Center
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StatusPage;
