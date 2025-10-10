import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi, User } from '@/api/admin';
import { Search, Filter, MoreHorizontal, Ban, CheckCircle, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserFilter = 'all' | 'active' | 'pending' | 'banned';

export function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });

  // Load users from real API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getUsers({
          page: 1,
          limit: 50,
          search: searchTerm || undefined,
          status: filter !== 'all' ? filter : undefined,
        });
        setUsers(response.users);
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          totalUsers: response.pagination.totalUsers,
        });
      } catch (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [toast, filter, searchTerm]);

  // Apply filters (now handled by API, but keep for display)
  const filteredUsers = users;

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (!user.isEmailVerified) {
      return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Pending</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Admin</Badge>;
      case 'mod':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Moderator</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'ban' | 'delete') => {
    setActionLoading(userId);
    try {
      if (action === 'delete') {
        await adminApi.deleteUser(userId);
        setUsers(prev => prev.filter(u => u._id !== userId));
        toast({
          title: "User Deleted",
          description: "The user has been permanently removed.",
        });
      } else {
        const isActive = action === 'activate';
        await adminApi.updateUser(userId, { isActive });
        setUsers(prev => prev.map(u =>
          u._id === userId ? { ...u, isActive } : u
        ));
        toast({
          title: isActive ? "User Activated" : "User Banned",
          description: `The user has been ${isActive ? 'activated' : 'banned'} successfully.`,
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} user. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Users Management</CardTitle>
              <CardDescription>
                {filteredUsers.length} of {users.length} users
                {filter !== 'all' && ` (filtered by ${filter})`}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {filteredUsers.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-2">
              {(['all', 'active', 'pending', 'banned'] as UserFilter[]).map((filterOption) => (
                <Button
                  key={filterOption}
                  variant={filter === filterOption ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(filterOption)}
                  className="capitalize"
                >
                  {filterOption}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Role</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Joined</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user._id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      index < 3 ? 'animate-[slideIn_0.3s_ease-out]' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{user.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(user)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{formatDate(user.createdAt)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionLoading === user._id}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!user.isActive && (
                            <DropdownMenuItem onClick={() => handleUserAction(user._id, 'activate')}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {user.isActive && user.role !== 'admin' && (
                            <DropdownMenuItem onClick={() => handleUserAction(user._id, 'ban')}>
                              <Ban className="w-4 h-4 mr-2" />
                              Ban User
                            </DropdownMenuItem>
                          )}
                          {user.role !== 'admin' && (
                            <DropdownMenuItem
                              onClick={() => handleUserAction(user._id, 'delete')}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No users found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
