import { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter, CheckCircle, XCircle, Clock, AlertCircle, Edit } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import ReportStatusModal from './ReportStatusModal';
import toast from 'react-hot-toast';

const ReportsList = () => {
  const { user, isAdmin, isInspector } = useAuth();
  const isReviewer = user?.role === 'reviewer';
  const canUpdateStatus = isAdmin || isReviewer;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    changes_requested: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await reportService.getAll(params);
      const reportsData = response.data.reports || [];
      setReports(reportsData);

      // Calculate stats
      const statsData = {
        total: reportsData.length,
        approved: reportsData.filter(r => r.report_status === 'approved').length,
        pending: reportsData.filter(r => r.report_status === 'pending').length,
        changes_requested: reportsData.filter(r => r.report_status === 'changes_requested').length,
        rejected: reportsData.filter(r => r.report_status === 'rejected').length
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report) => {
    try {
      const blob = await reportService.download(report.inspection_id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.vessel_tag}_${report.report_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const handleUpdateStatus = (report) => {
    setSelectedReport(report);
    setShowStatusModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-4 h-4" />
      },
      pending: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        icon: <Clock className="w-4 h-4" />
      },
      changes_requested: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        icon: <AlertCircle className="w-4 h-4" />
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle className="w-4 h-4" />
      }
    };

    const badge = badges[status] || badges.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
      </span>
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.report_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.vessel_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.vessel_description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Total Reports</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-neutral-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Changes Needed</p>
              <p className="text-2xl font-bold text-orange-600">{stats.changes_requested}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by report number, vessel tag, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No reports found</h3>
          <p className="text-neutral-600">
            {searchTerm ? 'Try adjusting your search or filters' : 'No reports have been generated yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Report Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Vessel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Generated
                </th>
                {!isInspector && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Generated By
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Review Info
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredReports.map((report) => (
                <tr key={report.inspection_id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-neutral-900">
                          {report.report_number}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {formatDateForDisplay(report.inspection_date)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">{report.vessel_tag}</div>
                    <div className="text-sm text-neutral-500">{report.vessel_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDateForDisplay(report.report_generated_at)}
                  </td>
                  {!isInspector && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {report.generated_by_name || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.report_status)}
                  </td>
                  <td className="px-6 py-4">
                    {report.reviewed_by_name ? (
                      <div className="text-sm">
                        <div className="text-neutral-900">By: {report.reviewed_by_name}</div>
                        <div className="text-neutral-500">
                          {formatDateForDisplay(report.report_reviewed_at)}
                        </div>
                        {report.report_review_comments && (
                          <div className="text-xs text-neutral-600 mt-1 italic">
                            "{report.report_review_comments.substring(0, 50)}
                            {report.report_review_comments.length > 50 ? '...' : ''}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-500">Not reviewed</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(report)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Download Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {canUpdateStatus && (
                        <button
                          onClick={() => handleUpdateStatus(report)}
                          className="p-2 text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                          title="Update Status"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Modal */}
      <ReportStatusModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onSuccess={fetchReports}
      />
    </div>
  );
};

export default ReportsList;