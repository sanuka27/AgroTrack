import React, { useEffect, useState, useCallback } from 'react';
import { Bug, Mail, Send, CheckCircle, AlertCircle, Loader2, Clock, Trash2, Eye } from 'lucide-react';
import { bugReportsApi, CreateBugReportData, BugReport } from '../api/bugReports';
import { getErrorMessage, getCurrentUser } from '../lib/api';

const BugReportsPage = () => {
  const [formData, setFormData] = useState<CreateBugReportData>({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // User's bug reports state
  const [userReports, setUserReports] = useState<BugReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const loadUserReports = useCallback(async () => {
    try {
      console.log('🔍 Loading bug reports...');
      setIsLoadingReports(true);
      setReportsError(null);
      
      // Try to use current user's email if available (helps in dev when auth middleware isn't used)
      const currentUser = getCurrentUser();
      console.log('👤 Current user from localStorage:', currentUser);
      
      const email = currentUser?.email || formData.email || undefined;
      console.log('📧 Email to fetch reports for:', email);
      
      if (!email) {
        console.warn('⚠️ No email available to fetch reports');
        setReportsError('Please enter your email in the form above to view your bug reports.');
        setIsLoadingReports(false);
        return;
      }
      
      const reports = await bugReportsApi.getMyReports(email);
      console.log('✅ Bug reports loaded:', reports);
      setUserReports(reports);
    } catch (error) {
      console.error('❌ Error loading bug reports:', error);
      setReportsError(getErrorMessage(error));
    } finally {
      setIsLoadingReports(false);
    }
  }, [formData.email]);

  useEffect(() => {
    document.title = 'Bug Reports - AgroTrack';
    loadUserReports();
  }, [loadUserReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await bugReportsApi.submit(formData);

      if (response.success) {
        setSubmitStatus({
          type: 'success',
          message: response.message || 'Bug report submitted successfully! We will review it and get back to you.'
        });
        setFormData({ name: '', email: '', message: '' });
        // Reload reports to show the new one
        loadUserReports();
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.message || 'Failed to submit bug report. Please try again.'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: getErrorMessage(error)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this bug report?')) {
      return;
    }

    try {
      await bugReportsApi.delete(reportId);
      setUserReports(prev => prev.filter(report => report._id !== reportId));
    } catch (error) {
      alert('Failed to delete bug report: ' + getErrorMessage(error));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main role="main" className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Bug Reports</h1>

      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            Found a bug or technical issue with AgroTrack? We appreciate your help in making our app better!
            Report bugs using the methods below, and our development team will investigate promptly.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              <strong>For urgent issues affecting plant safety:</strong> Please call our support line at
              <a href="tel:+94771234567" className="font-medium"> +94 77 123 4567</a> immediately.
            </p>
          </div>
        </section>

        {/* Quick Email Report */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Email Report</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            For fastest processing, email us directly with your bug report:
          </p>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <Mail className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Email Bug Report</h3>
                <p className="text-gray-600 text-sm">Direct line to our development team</p>
              </div>
            </div>

            <a
              href="mailto:bugs@agrotrack.lk?subject=Bug%20Report&body=Please%20describe%20the%20issue%3A%0A%0ASteps%20to%20reproduce%3A%0A1.%20%0A2.%20%0A3.%20%0A%0ADevice%20information%3A%0A-%20Device%20type%3A%20%0A-%20Operating%20system%3A%20%0A-%20App%20version%3A%20%0A%0AScreenshots%20(if%20applicable)%3A%20Please%20attach"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Bug Report Email
            </a>

            <p className="text-gray-500 text-sm mt-3">
              This will open your email client with a pre-filled template to help you provide all necessary details.
            </p>
          </div>
        </section>

        {/* Bug Report Guidelines */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">What to Include in Your Report</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">📝 Essential Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                <li>Clear description of what went wrong</li>
                <li>What you were trying to do when the bug occurred</li>
                <li>What you expected to happen vs. what actually happened</li>
                <li>Whether the issue happens consistently or randomly</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">📱 Technical Details</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                <li>Device type (iPhone, Android, etc.)</li>
                <li>Operating system version</li>
                <li>AgroTrack app version</li>
                <li>Screenshots or screen recordings if possible</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Web Form */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Web Form Submission</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Fill out the form below and we'll receive your bug report directly through our system:
          </p>

          {/* Status Messages */}
          {submitStatus.type && (
            <div className={`mb-6 p-4 rounded-lg border ${
              submitStatus.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {submitStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                <p className="text-sm font-medium">{submitStatus.message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Bug Description *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Please describe the bug in detail, including steps to reproduce it and any error messages you saw..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
              </button>
            </div>
          </form>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> Your bug report will be stored securely and reviewed by our development team.
              We'll send you updates on the status of your report via email.
            </p>
          </div>
        </section>

        {/* Your Bug Reports */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Bug Reports</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            View all the bug reports you've submitted. Track their status and see our progress on resolving them.
          </p>

          {isLoadingReports ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
              <span className="text-gray-600">Loading your reports...</span>
            </div>
          ) : reportsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800 text-sm">Failed to load your reports: {reportsError}</p>
              </div>
              <button
                onClick={loadUserReports}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          ) : userReports.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Bug Reports Yet</h3>
              <p className="text-gray-600 text-sm">
                You haven't submitted any bug reports yet. Use the form above to report any issues you encounter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userReports.map((report) => (
                <div key={report._id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Report #{report._id.slice(-8)}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                          {report.priority.charAt(0).toUpperCase() + report.priority.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Clock className="w-4 h-4 mr-1" />
                        Submitted on {formatDate(report.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReport(report._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete this report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Name:</span>
                      <span className="text-sm text-gray-600 ml-2">{report.name}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Email:</span>
                      <span className="text-sm text-gray-600 ml-2">{report.email}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 block mb-1">Description:</span>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded p-3 whitespace-pre-wrap">
                        {report.message}
                      </p>
                    </div>

                    {report.resolution && (
                      <div className="border-t pt-3">
                        <span className="text-sm font-medium text-green-700 block mb-1">Resolution:</span>
                        <p className="text-sm text-green-600 bg-green-50 rounded p-3">
                          {report.resolution}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Common Issues */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Common Issues & Quick Fixes</h2>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">🐛 App Won't Load or Crashes</h3>
              <p className="text-gray-600 text-sm">
                Try restarting the app, checking your internet connection, or updating to the latest version.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">📷 Camera/Photo Upload Issues</h3>
              <p className="text-gray-600 text-sm">
                Ensure AgroTrack has camera permissions and try taking photos in good lighting conditions.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">🔐 Login Problems</h3>
              <p className="text-gray-600 text-sm">
                Check your email/password, ensure caps lock is off, or try the "Forgot Password" option.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Alternative */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Bug className="w-6 h-6 text-emerald-600 mr-3" />
            <h3 className="text-lg font-semibold text-emerald-800">Need Immediate Help?</h3>
          </div>
          <p className="text-emerald-700 mb-4">
            For urgent issues or if you're unable to use the bug reporting methods above,
            contact our support team directly:
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-emerald-700">
              📞 Phone: <a href="tel:+94771234567" className="font-medium hover:text-emerald-800">+94 77 123 4567</a>
            </p>
            <p className="text-emerald-700">
              📧 General Support: <a href="mailto:support@agrotrack.lk" className="font-medium hover:text-emerald-800">support@agrotrack.lk</a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default BugReportsPage;
