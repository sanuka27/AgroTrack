import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi, User } from '@/api/admin';
import { Search, Filter, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type UserFilter = 'all' | 'active' | 'pending' | 'banned';

interface UserDetails extends User {
  statistics?: {
    plants: number;
    posts: number;
    careLogs: number;
    reminders: number;
  };
}

export function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    isActive: true,
  });

  // Load users from real API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getUsers({
          page: 1,
          limit: 50,
          search: debouncedSearch || undefined,
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
  }, [toast, filter, debouncedSearch]);

  // Debounce searchTerm to avoid firing API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch lightweight suggestions for the dropdown (limit small)
  useEffect(() => {
    let cancelled = false;
    const fetchSuggestions = async () => {
      try {
        if (!debouncedSearch || debouncedSearch.length === 0) {
          setSuggestions([]);
          setShowSuggestions(false);
          setActiveIndex(-1);
          return;
        }

        const resp = await adminApi.getUsers({ search: debouncedSearch, limit: 6 });
        if (cancelled) return;
        setSuggestions(resp.users || []);
        setShowSuggestions((resp.users || []).length > 0);
        setActiveIndex(-1);
      } catch (e) {
        // ignore suggestion failures silently
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  // Keep the input focused while the user is typing so they don't need to click again
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchTerm]);

  // Apply filters (now handled by API, but keep for display)
  const filteredUsers = users;

  // Helper to highlight the matched portion of a string
  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + term.length);
    const after = text.slice(idx + term.length);
    return (
      <>
        {before}
        <span className="bg-yellow-100 text-yellow-800 rounded px-1">{match}</span>
        {after}
      </>
    );
  };

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

  // View user details
  const handleViewUser = async (user: User) => {
    setActionLoading(user._id);
    try {
      const userDetails = await adminApi.getUser(user._id);
      setSelectedUser(userDetails as UserDetails);
      setViewDialogOpen(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "Error",
        description: "Failed to load user details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user as UserDetails);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    setActionLoading(selectedUser._id);
    try {
      const updatedUser = await adminApi.updateUser(selectedUser._id, editForm);
      setUsers(prev => prev.map(u =>
        u._id === selectedUser._id ? updatedUser : u
      ));
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Delete user
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user as UserDetails);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    setActionLoading(selectedUser._id);
    try {
      await adminApi.deleteUser(selectedUser._id);
      setUsers(prev => prev.filter(u => u._id !== selectedUser._id));
      toast({
        title: "User Deleted",
        description: "The user has been permanently removed.",
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
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
                {debouncedSearch && (
                  <span className="ml-3 inline-block text-sm text-gray-600">Searching "{debouncedSearch}"</span>
                )}
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
                ref={inputRef}
                onKeyDown={(e) => {
                  // Prevent Enter from causing focus loss or form submission
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // If a suggestion is active, select it
                    if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
                      const sel = suggestions[activeIndex];
                      setSearchTerm(sel.name);
                      setDebouncedSearch(sel.name);
                      setShowSuggestions(false);
                      setActiveIndex(-1);
                      setTimeout(() => inputRef.current?.focus(), 0);
                      return;
                    }
                    // keep focus in the input so user can continue typing
                    setTimeout(() => inputRef.current?.focus(), 0);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showSuggestions) {
                      setShowSuggestions(true);
                    }
                    setActiveIndex((idx) => Math.min(idx + 1, suggestions.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIndex((idx) => Math.max(idx - 1, 0));
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    setActiveIndex(-1);
                  }
                }}
              />
              {/* Suggestion dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  role="listbox"
                  aria-label="User suggestions"
                  className="absolute z-50 mt-1 w-full rounded-md bg-white ring-1 ring-black/5 shadow-lg overflow-hidden"
                >
                  {suggestions.map((s, i) => (
                    <div
                      key={s._id}
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseDown={(ev) => {
                        // Use mouseDown to avoid losing focus before click
                        ev.preventDefault();
                        setSearchTerm(s.name);
                        setDebouncedSearch(s.name);
                        setShowSuggestions(false);
                        setActiveIndex(-1);
                        setTimeout(() => inputRef.current?.focus(), 0);
                      }}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-50 flex flex-col ${i === activeIndex ? 'bg-gray-50' : ''}`}
                    >
                      <span className="font-medium text-sm text-gray-900">{highlightMatch(s.name, debouncedSearch)}</span>
                      <span className="text-xs text-gray-500">{highlightMatch(s.email, debouncedSearch)}</span>
                    </div>
                  ))}
                </div>
              )}
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
                      <div className="font-medium text-gray-900">{highlightMatch(user.name, debouncedSearch)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{highlightMatch(user.email, debouncedSearch)}</div>
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          disabled={actionLoading === user._id}
                          title="View Details"
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          {actionLoading === user._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={actionLoading === user._id}
                          title="Edit User"
                          className="hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionLoading === user._id || user.role === 'admin'}
                          title={user.role === 'admin' ? 'Cannot delete admin' : 'Delete User'}
                          className="hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="mt-1 text-sm font-semibold">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="mt-1 text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Role</Label>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">User ID</Label>
                  <p className="mt-1 text-xs font-mono text-gray-600">{selectedUser._id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Firebase UID</Label>
                  <p className="mt-1 text-xs font-mono text-gray-600">{selectedUser.uid || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Auth Provider</Label>
                  <p className="mt-1 text-sm capitalize">{selectedUser.authProvider || 'local'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email Verified</Label>
                  <p className="mt-1 text-sm">{selectedUser.isEmailVerified ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Joined</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="mt-1 text-sm">{formatDate(selectedUser.updatedAt)}</p>
                </div>
              </div>

              {/* Statistics */}
              {selectedUser.statistics && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-3 block">Activity Statistics</Label>
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{selectedUser.statistics.plants}</p>
                        <p className="text-xs text-gray-500 mt-1">Plants</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{selectedUser.statistics.posts}</p>
                        <p className="text-xs text-gray-500 mt-1">Posts</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">{selectedUser.statistics.careLogs}</p>
                        <p className="text-xs text-gray-500 mt-1">Care Logs</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-orange-600">{selectedUser.statistics.reminders}</p>
                        <p className="text-xs text-gray-500 mt-1">Reminders</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="mod">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-active" className="cursor-pointer">
                Account Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading === selectedUser?._id}>
              {actionLoading === selectedUser?._id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{selectedUser?.name}</strong>'s account
              and remove all their data from the database, including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>User profile and authentication</li>
                <li>All plants and care logs</li>
                <li>Community posts and comments</li>
                <li>Reminders and notifications</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading === selectedUser?._id}
            >
              {actionLoading === selectedUser?._id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
