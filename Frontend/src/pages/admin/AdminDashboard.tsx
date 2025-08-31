import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RoleGuard } from '@/components/RoleGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, BarChart3, Users, AlertTriangle, FileText } from 'lucide-react';

// Import the new admin components
import { Overview } from './Overview';
import { UsersTab } from './UsersTab';
import { ReportsTab } from './ReportsTab';
import { ContentTab } from './ContentTab';

export function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <RoleGuard 
      roles={['admin']} 
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center p-8">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">Real-time monitoring and management</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-muted rounded-2xl p-1">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
              <TabsTrigger 
                value="content"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Overview />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <UsersTab />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <ReportsTab />
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <ContentTab />
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>
    </RoleGuard>
  );
}
