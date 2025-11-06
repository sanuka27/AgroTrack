import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminApi, CommunityPost } from '@/lib/api/admin';
import { Search, FileText, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';
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

type ContentFilter = 'all' | 'visible' | 'hidden' | 'deleted';

export function ContentTab() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'view' | 'hide' | 'show' | 'delete' | null>(null);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getCommunityPosts({
          status: filter === 'all' ? undefined : filter,
          limit: 100
        });
        setPosts(response.posts);
      } catch (error) {
        console.error('Error loading community posts:', error);
        toast({ title: "Error", description: "Failed to load community posts.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, [toast, filter]);

  const filteredPosts = posts.filter(post => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return post.title.toLowerCase().includes(search) || 
           post.body.toLowerCase().includes(search) || 
           post.authorName.toLowerCase().includes(search);
  });

  const getStatusBadge = (status: CommunityPost['status']) => {
    switch (status) {
      case 'visible': 
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">Visible</Badge>;
      case 'hidden': 
        return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Hidden</Badge>;
      case 'deleted': 
        return <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-rose-200">Deleted</Badge>;
      default: 
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const openDialog = (post: CommunityPost, action: 'view' | 'hide' | 'show' | 'delete') => {
    setSelectedPost(post);
    setDialogAction(action);
    setActionReason('');
    setDialogOpen(true);
  };

  const handleDialogConfirm = async () => {
    if (!selectedPost || !dialogAction) return;
    
    setActionLoading(selectedPost._id);
    try {
      if (dialogAction === 'delete') {
        await adminApi.deleteCommunityPost(selectedPost._id, actionReason);
        setPosts(prev => prev.filter(p => p._id !== selectedPost._id));
        toast({ title: 'Post Deleted', description: 'The post has been permanently deleted.' });
      } else if (dialogAction === 'hide') {
        await adminApi.updateCommunityPostStatus(selectedPost._id, 'hidden', actionReason);
        setPosts(prev => prev.map(p => p._id === selectedPost._id ? { ...p, status: 'hidden' } : p));
        toast({ title: 'Post Hidden', description: 'The post has been hidden from users.' });
      } else if (dialogAction === 'show') {
        await adminApi.updateCommunityPostStatus(selectedPost._id, 'visible', actionReason);
        setPosts(prev => prev.map(p => p._id === selectedPost._id ? { ...p, status: 'visible' } : p));
        toast({ title: 'Post Restored', description: 'The post is now visible to users.' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update post.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
      setDialogOpen(false);
      setSelectedPost(null);
      setDialogAction(null);
      setActionReason('');
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

  const hiddenCount = posts.filter(p => p.status === 'hidden').length;
  const deletedCount = posts.filter(p => p.status === 'deleted').length;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Content Management
              </CardTitle>
              <CardDescription>
                {filteredPosts.length} of {posts.length} content items
                {filter !== 'all' && ` (filtered by ${filter})`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {filteredPosts.length}
              </Badge>
              {hiddenCount > 0 && (
                <Badge variant="secondary" className="text-lg px-3 py-1 bg-amber-100 text-amber-800">
                  {hiddenCount} hidden
                </Badge>
              )}
              {deletedCount > 0 && (
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {deletedCount} deleted
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, content, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'visible', 'hidden', 'deleted'] as ContentFilter[]).map((filterOption) => (
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

      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 dark:bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Title</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Author</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Score</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Comments</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Created</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPosts.map((post) => (
                  <tr
                    key={post._id}
                    className={`hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors ${
                      post.status === 'hidden' ? 'bg-amber-50/30 dark:bg-amber-950/20' : 
                      post.status === 'deleted' ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="font-medium text-foreground max-w-xs truncate" title={post.title}>
                        {post.title}
                      </div>
                      <div className="text-sm text-muted-foreground max-w-xs truncate" title={post.body}>
                        {post.body || 'No content'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-foreground">{post.authorName}</div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-muted-foreground">{post.score}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-muted-foreground">{post.commentsCount}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-muted-foreground text-sm">{formatDate(post.createdAt)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(post, 'view')}
                          title="View Post"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {post.status === 'visible' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog(post, 'hide')}
                            disabled={actionLoading === post._id}
                            className="text-amber-600 hover:text-amber-700"
                            title="Hide from Users"
                          >
                            <EyeOff className="w-4 h-4" />
                          </Button>
                        )}
                        {(post.status === 'hidden' || post.status === 'deleted') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDialog(post, 'show')}
                            disabled={actionLoading === post._id}
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Restore Post"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(post, 'delete')}
                          disabled={actionLoading === post._id}
                          className="text-rose-600 hover:text-rose-700"
                          title="Permanently Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No content found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className={dialogAction === 'view' ? 'max-w-3xl max-h-[80vh] overflow-y-auto' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === 'view' && 'View Post'}
              {dialogAction === 'hide' && 'Hide Post from Users'}
              {dialogAction === 'show' && 'Restore Post'}
              {dialogAction === 'delete' && 'Permanently Delete Post'}
            </AlertDialogTitle>
            {dialogAction === 'view' && selectedPost ? (
              <div className="space-y-4 text-left pt-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{selectedPost.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium">By {selectedPost.authorName}</span>
                    <span>•</span>
                    <span>{formatDate(selectedPost.createdAt)}</span>
                    {selectedPost.isSolved && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">✓ Solved</Badge>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-border pt-4">
                  <h4 className="font-medium text-foreground mb-2">Post Content:</h4>
                  <div className="prose max-w-none text-foreground whitespace-pre-wrap bg-muted/50 dark:bg-muted/30 p-4 rounded-lg min-h-[100px]">
                    {selectedPost.body && selectedPost.body.trim().length > 0 ? (
                      selectedPost.body
                    ) : (
                      <span className="text-muted-foreground italic">This post has no text content. It may contain only a title or images.</span>
                    )}
                  </div>
                </div>

                {selectedPost.images && selectedPost.images.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium text-foreground mb-2">Images ({selectedPost.images.length}):</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedPost.images.map((image, idx) => (
                        <div key={idx} className="border rounded-lg overflow-hidden bg-gray-50">
                          <img 
                            src={image.url} 
                            alt={`Post image ${idx + 1}`}
                            className="w-full h-auto object-cover max-h-48"
                            loading="lazy"
                          />
                          <div className="px-2 py-1 text-xs text-gray-500 bg-white">
                            {image.width} × {image.height}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Score:</span>
                    <Badge variant="secondary" className="text-base">{selectedPost.score}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Comments:</span>
                    <Badge variant="secondary" className="text-base">{selectedPost.commentsCount}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Status:</span>
                    {getStatusBadge(selectedPost.status)}
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Post ID:</span>
                    <p className="text-gray-600 font-mono text-xs mt-1 break-all">{selectedPost._id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Author Username:</span>
                    <p className="text-gray-600 mt-1">{selectedPost.authorUsername || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <p className="text-gray-600 mt-1">{formatDate(selectedPost.createdAt)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <p className="text-gray-600 mt-1">{formatDate(selectedPost.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <AlertDialogDescription>
                {dialogAction === 'hide' && 'This will hide the post from users. You can restore it later.'}
                {dialogAction === 'show' && 'This will make the post visible to users again.'}
                {dialogAction === 'delete' && 'This action cannot be undone. The post will be permanently deleted.'}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {dialogAction !== 'view' && (
            <div className="space-y-2 my-4">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this action..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {dialogAction !== 'view' && (
              <AlertDialogAction
                onClick={handleDialogConfirm}
                className={
                  dialogAction === 'delete' ? 'bg-rose-600 hover:bg-rose-700' :
                  dialogAction === 'hide' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-emerald-600 hover:bg-emerald-700'
                }
              >
                {dialogAction === 'delete' && 'Delete Permanently'}
                {dialogAction === 'hide' && 'Hide Post'}
                {dialogAction === 'show' && 'Restore Post'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
