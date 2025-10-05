import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { mockApi } from '@/lib/mockApi';
import { Search, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface Report {
  _id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetType: 'post' | 'comment';
  reason: string;
  description: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}

type ReportFilter = 'all' | 'open' | 'resolved' | 'dismissed';

export function ReportsTab() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load reports from mock API
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await mockApi.admin.getReports();
        // Ensure dates are Date objects and types are correct
        const reportsWithDates: Report[] = response.reports.map(report => ({
          ...report,
          targetType: report.targetType as 'post' | 'comment',
          status: report.status as 'open' | 'resolved' | 'dismissed',
          createdAt: new Date(report.createdAt),
          resolvedAt: report.resolvedAt ? new Date(report.resolvedAt) : null,
          resolvedBy: report.resolvedBy,
        }));
        setReports(reportsWithDates);
      } catch (error) {
        console.error('Error loading reports:', error);
        toast({
          title: "Error",
          description: "Failed to load reports. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [toast]);

  // Apply filters
  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = searchTerm === '' ||
      report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.targetId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: Report['status']) => {
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    setActionLoading(reportId);
    try {
      await mockApi.admin.resolveReport(reportId, action);
      setReports(prev => prev.map(r =>
        r._id === reportId
          ? { ...r, status: action === 'resolve' ? 'resolved' : 'dismissed', resolvedAt: new Date(), resolvedBy: 'admin1' }
          : r
      ));
      toast({
        title: "Report Updated",
        description: `Report has been ${action}d successfully.`,
      });
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} report. Please try again.`,
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
                  <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.map((report, index) => (
                  <tr
                    key={report._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index < 3 ? 'animate-[slideIn_0.3s_ease-out]' : ''
                    } ${report.status === 'open' ? 'bg-amber-50/30' : ''}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="font-mono text-sm text-gray-600">#{report._id.slice(-6)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{report.reporterName}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        <div className="font-mono text-blue-600">{report.targetId.slice(-6)}</div>
                        <div className="text-xs text-gray-500 capitalize">{report.targetType}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-800 max-w-xs truncate" title={report.description}>
                        {report.reason}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-600 text-sm">{formatDate(report.createdAt)}</div>
                    </td>
                    <td className="py-4 px-6">
                      {report.status === 'open' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReportAction(report._id, 'resolve')}
                            disabled={actionLoading === report._id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReportAction(report._id, 'dismiss')}
                            disabled={actionLoading === report._id}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                      {report.status !== 'open' && (
                        <Badge variant="outline" className="text-gray-500">
                          {report.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                        </Badge>
                      )}
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
