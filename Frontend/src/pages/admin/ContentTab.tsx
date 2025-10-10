import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { adminApi, Content } from '@/api/admin';
import ModerationModal from '@/components/admin/ModerationModal';
import { Search, FileText, Eye, EyeOff, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ContentFilter = 'all' | 'visible' | 'flagged' | 'removed';

export function ContentTab() {
  const { toast } = useToast();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContentId, setModalContentId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<'hide' | 'remove' | 'approve' | 'delete' | null>(null);
  const [modalContentType, setModalContentType] = useState<'post' | 'comment' | null>(null);

  // Load content from admin API
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getContent();
        setContent(response.content);
      } catch (error) {
        console.error('Error loading content:', error);
        toast({
          title: "Error",
          description: "Failed to load content. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [toast]);

  // Apply filters
  const filteredContent = content.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: Content['status']) => {
    switch (status) {
      case 'visible':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">Visible</Badge>;
      case 'flagged':
        return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Flagged</Badge>;
      case 'removed':
        return <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-rose-200">Removed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // We'll use a modal for reasons instead of prompt

  const openModerationModal = (contentId: string, uiAction: 'hide' | 'remove' | 'approve' | 'delete', contentType: 'post' | 'comment' = 'post') => {
    setModalContentId(contentId);
    setModalAction(uiAction);
    setModalContentType(contentType);
    setModalOpen(true);
  };

  const handleModalSubmit = async (reason: string) => {
    if (!modalContentId || !modalAction) return;
    const contentId = modalContentId;
    const uiAction = modalAction;
    setActionLoading(contentId);

    try {
      if (uiAction === 'delete') {
        const ok = window.confirm('Permanently delete this content? This action cannot be undone.');
        if (!ok) return;
        await adminApi.deleteContent(contentId, modalContentType || 'post');
        setContent(prev => prev.filter(c => c._id !== contentId));
        toast({ title: 'Content Deleted', description: 'Content has been permanently deleted.' });
        return;
      }

      let backendAction: 'approve' | 'reject' | 'delete' = 'reject';
      if (uiAction === 'approve') backendAction = 'approve';
      if (uiAction === 'remove') backendAction = 'delete';
      if (uiAction === 'hide') backendAction = 'reject';

  await adminApi.moderateContent(contentId, backendAction, reason, modalContentType || 'post');

      setContent(prev => prev.map(c =>
        c._id === contentId
          ? { ...c, status: uiAction === 'hide' ? 'flagged' : uiAction === 'remove' ? 'removed' : 'visible' }
          : c
      ));

      toast({ title: 'Content Updated', description: 'Content moderation action completed.' });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({ title: 'Error', description: 'Failed to moderate content. Please try again.', variant: 'destructive' });
    } finally {
      setActionLoading(null);
      setModalOpen(false);
      setModalContentId(null);
      setModalAction(null);
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

  const flaggedCount = content.filter(c => c.status === 'flagged').length;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Content Management
              </CardTitle>
              <CardDescription>
                {filteredContent.length} of {content.length} content items
                {filter !== 'all' && ` (filtered by ${filter})`}
                • {flaggedCount} flagged for review
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {filteredContent.length}
              </Badge>
              {flaggedCount > 0 && (
                <Badge variant="secondary" className="text-lg px-3 py-1 bg-amber-100 text-amber-800">
                  {flaggedCount} flagged
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search content by title, author, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-2">
              {(['all', 'visible', 'flagged', 'removed'] as ContentFilter[]).map((filterOption) => (
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

      {/* Content Table */}
      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Title</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Author</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Reports</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Created</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContent.map((item, index) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index < 3 ? 'animate-[slideIn_0.3s_ease-out]' : ''
                    } ${item.status === 'flagged' ? 'bg-amber-50/30' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900 max-w-xs truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate" title={item.content}>
                        {item.content}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-800">{item.author}</div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.type}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600">{item.reports}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600 text-sm">{formatDate(item.createdAt)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={actionLoading === item._id}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.status === 'visible' && (
                            <DropdownMenuItem
                              onClick={() => openModerationModal(item._id, 'hide', item.type)}
                              className="text-amber-600"
                            >
                              <EyeOff className="w-4 h-4 mr-2" />
                              Hide Content
                            </DropdownMenuItem>
                          )}
                          {item.status === 'flagged' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => openModerationModal(item._id, 'approve', item.type)}
                                className="text-emerald-600"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Approve Content
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openModerationModal(item._id, 'remove', item.type)}
                                className="text-rose-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Content
                              </DropdownMenuItem>
                            </>
                          )}
                          {item.status === 'removed' && (
                            <DropdownMenuItem
                              onClick={() => openModerationModal(item._id, 'approve', item.type)}
                              className="text-emerald-600"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Restore Content
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredContent.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No content found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <ModerationModal
        open={modalOpen}
        initialReason=""
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        title={modalAction === 'remove' ? 'Remove Content' : modalAction === 'hide' ? 'Hide Content' : modalAction === 'approve' ? 'Approve Content' : 'Moderation'}
      />
    </div>
  );
}
