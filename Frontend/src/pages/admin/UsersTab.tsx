import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRealtimeSnapshot } from '@/realtime/hooks';
import { UserRow } from '@/realtime/types';
import { Search, Filter } from 'lucide-react';

type UserFilter = 'all' | 'active' | 'pending' | 'banned';

export function UsersTab() {
  const { snapshot, isLoading } = useRealtimeSnapshot();
  const [filter, setFilter] = useState<UserFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading || !snapshot) {
    return <div className="p-6">Loading users...</div>;
  }

  const { users } = snapshot;

  // Apply filters
  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.status === filter;
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: UserRow['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Pending</Badge>;
      case 'banned':
        return <Badge variant="destructive">Banned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
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
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{formatDate(user.joinedAt)}</div>
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
