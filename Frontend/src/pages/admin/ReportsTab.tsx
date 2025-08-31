import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRealtimeSnapshot } from '@/realtime/hooks';
import { ReportRow } from '@/realtime/types';
import { Search, AlertTriangle } from 'lucide-react';

type ReportFilter = 'all' | 'open' | 'resolved' | 'dismissed';

export function ReportsTab() {
  const { snapshot, isLoading } = useRealtimeSnapshot();
  const [filter, setFilter] = useState<ReportFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading || !snapshot) {
    return <div className="p-6">Loading reports...</div>;
  }

  const { reports } = snapshot;

  // Apply filters
  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = searchTerm === '' || 
      report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.targetId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: ReportRow['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Open</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="border-slate-300 text-slate-700">Dismissed</Badge>;
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

  const openReportsCount = reports.filter(r => r.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Reports Management
              </CardTitle>
              <CardDescription>
                {filteredReports.length} of {reports.length} reports
                {filter !== 'all' && ` (filtered by ${filter})`}
                • {openReportsCount} pending review
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {filteredReports.length}
              </Badge>
              {openReportsCount > 0 && (
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {openReportsCount} open
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
                placeholder="Search reports by reporter, reason, or target..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-2">
              {(['all', 'open', 'resolved', 'dismissed'] as ReportFilter[]).map((filterOption) => (
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

      {/* Reports Table */}
      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">ID</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Reporter</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Target</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Reason</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report, index) => (
                  <tr 
                    key={report.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      index < 3 ? 'animate-[slideIn_0.3s_ease-out]' : ''
                    } ${report.status === 'open' ? 'bg-amber-50/30' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="font-mono text-sm text-gray-600">#{report.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{report.reporter}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-mono text-sm text-blue-600">{report.targetId}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-800 max-w-xs truncate" title={report.reason}>
                        {report.reason}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600 text-sm">{formatDate(report.createdAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No reports found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
