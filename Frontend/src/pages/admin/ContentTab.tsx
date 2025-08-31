import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRealtimeSnapshot } from '@/realtime/hooks';
import { ContentRow } from '@/realtime/types';
import { Search, FileText } from 'lucide-react';

type ContentFilter = 'all' | 'visible' | 'flagged' | 'removed';

export function ContentTab() {
  const { snapshot, isLoading } = useRealtimeSnapshot();
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading || !snapshot) {
    return <div className="p-6">Loading content...</div>;
  }

  const { content } = snapshot;

  // Apply filters
  const filteredContent = content.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: ContentRow['status']) => {
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                placeholder="Search content by title, author, or category..."
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
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Category</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContent.map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      index < 3 ? 'animate-[slideIn_0.3s_ease-out]' : ''
                    } ${item.status === 'flagged' ? 'bg-amber-50/30' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900 max-w-xs truncate" title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-800">{item.author}</div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600 text-sm">{formatDate(item.createdAt)}</div>
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
    </div>
  );
}
