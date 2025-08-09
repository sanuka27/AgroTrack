import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoleGuard } from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  MessageSquare, 
  Flag, 
  TrendingUp, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Edit
} from "lucide-react";

const AdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");

  const mockUsers = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "user", status: "active", joinDate: "2024-01-15", posts: 23 },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user", status: "active", joinDate: "2024-02-01", posts: 45 },
    { id: 3, name: "Bob Wilson", email: "bob@example.com", role: "user", status: "suspended", joinDate: "2024-01-20", posts: 12 },
  ];

  const mockReports = [
    { id: 1, type: "Spam", postId: 123, reporter: "user123", reason: "Promotional content", status: "pending", date: "2024-03-15" },
    { id: 2, type: "Inappropriate", postId: 124, reporter: "user456", reason: "Off-topic discussion", status: "resolved", date: "2024-03-14" },
    { id: 3, type: "Harassment", postId: 125, reporter: "user789", reason: "Personal attack", status: "pending", date: "2024-03-13" },
  ];

  const mockStats = {
    totalUsers: 2847,
    activeUsers: 1234,
    totalPosts: 5432,
    pendingReports: 8,
    monthlyGrowth: 15.2,
    engagementRate: 68.5
  };

  return (
    <RoleGuard roles={['admin']} fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-6 h-6 text-orange-500" />
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage users, content, and community moderation</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500">+{mockStats.monthlyGrowth}%</span>
                  <span className="text-muted-foreground ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{mockStats.activeUsers.toLocaleString()}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-muted-foreground">
                    {((mockStats.activeUsers / mockStats.totalUsers) * 100).toFixed(1)}% of total users
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Reports</p>
                    <p className="text-2xl font-bold">{mockStats.pendingReports}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
                <div className="mt-2">
                  <Badge variant={mockStats.pendingReports > 10 ? "destructive" : "secondary"}>
                    {mockStats.pendingReports > 10 ? "High Priority" : "Normal"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest administrative actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Report resolved</p>
                          <p className="text-xs text-muted-foreground">Spam post removed - 2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">New user registered</p>
                          <p className="text-xs text-muted-foreground">PlantLover2024 joined - 3 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Flag className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">New report submitted</p>
                          <p className="text-xs text-muted-foreground">Inappropriate content - 5 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Community Health</CardTitle>
                    <CardDescription>Key metrics and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Engagement Rate</span>
                        <span className="font-medium">{mockStats.engagementRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Daily Active Users</span>
                        <span className="font-medium">892</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Posts per Day</span>
                        <span className="font-medium">156</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Report Rate</span>
                        <span className="font-medium text-green-600">0.3%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">{user.role}</Badge>
                              <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                                {user.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Content Reports</CardTitle>
                  <CardDescription>Review and moderate reported content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Flag className="w-4 h-4 text-orange-500" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{report.type}</p>
                              <Badge variant={report.status === 'pending' ? 'destructive' : 'default'}>
                                {report.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Post #{report.postId}</p>
                            <p className="text-sm text-muted-foreground">Reason: {report.reason}</p>
                            <p className="text-xs text-muted-foreground">Reported by {report.reporter} on {report.date}</p>
                          </div>
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                            <Button variant="ghost" size="sm">
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Analytics</CardTitle>
                    <CardDescription>Content performance and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Posts</span>
                        <span className="font-medium">{mockStats.totalPosts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Posts Today</span>
                        <span className="font-medium">42</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Most Active Tag</span>
                        <span className="font-medium">#TomatoTips</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Average Engagement</span>
                        <span className="font-medium">12.5 interactions/post</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common moderation tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Create Announcement
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Flag className="w-4 h-4 mr-2" />
                      Review Flagged Content
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Bulk User Actions
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Export Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </RoleGuard>
  );
};

export default AdminDashboard;
