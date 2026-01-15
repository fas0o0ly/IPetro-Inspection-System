// src/pages/dashboard/Dashboard.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { 
  Container, 
  ClipboardList, 
  Camera, 
  AlertCircle,
  TrendingUp,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isReviewer = user?.role === 'reviewer';
  const isInspector = user?.role === 'inspector';
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentInspections, setRecentInspections] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  
  // Reviewer-specific data
  const [reviewedReports, setReviewedReports] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isReviewer) {
        // Fetch reviewer-specific data (no stats needed)
        const [reviewedRes, pendingRes] = await Promise.all([
          dashboardService.getReviewedReports(5).catch(err => {
            console.error('Error fetching reviewed reports:', err);
            return { data: { data: [] } };
          }),
          dashboardService.getPendingReports(5).catch(err => {
            console.error('Error fetching pending reports:', err);
            return { data: { data: [] } };
          })
        ]);
        
        setReviewedReports(Array.isArray(reviewedRes.data) ? reviewedRes.data : 
                           Array.isArray(reviewedRes.data?.data) ? reviewedRes.data.data : []);
        setPendingReports(Array.isArray(pendingRes.data) ? pendingRes.data : 
                          Array.isArray(pendingRes.data?.data) ? pendingRes.data.data : []);
        
        console.log('✅ Reviewer Data:', {
          reviewed: reviewedRes.data,
          pending: pendingRes.data
        });
      } else {
        // Fetch data for admin/inspector (includes stats)
        const [statsRes, recentRes, upcomingRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentInspections(3),
          dashboardService.getUpcomingTasks(3)
        ]);

        setStats(statsRes.data);
        setRecentInspections(recentRes.data);
        setUpcomingTasks(upcomingRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      setReviewedReports([]);
      setPendingReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-secondary',
      in_progress: 'badge-warning',
      pending_review: 'badge-info',
      completed: 'badge-success',
      pending: 'badge-warning',
      approved: 'badge-success',
      changes_requested: 'badge-warning',
      rejected: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      draft: 'Draft',
      in_progress: 'In Progress',
      pending_review: 'Pending Review',
      completed: 'Completed',
      pending: 'Pending',
      approved: 'Approved',
      changes_requested: 'Changes Requested',
      rejected: 'Rejected'
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      approved: CheckCircle,
      changes_requested: AlertTriangle,
      rejected: XCircle,
      pending: Clock
    };
    return icons[status] || Clock;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Stats cards only for admin and inspector
  const statsCards = [
    { 
      name: 'Total Vessels', 
      value: stats?.vessels?.total || 0, 
      icon: Container, 
      color: 'primary', 
      change: `+${stats?.vessels?.recent || 0} this month`,
      trend: 'up'
    },
    { 
      name: 'Active Inspections', 
      value: stats?.inspections?.active || 0, 
      icon: ClipboardList, 
      color: 'secondary', 
      change: `${stats?.inspections?.pending_review || 0} pending review`,
      trend: 'neutral'
    },
    { 
      name: 'Photos Uploaded', 
      value: stats?.photos?.total || 0, 
      icon: Camera, 
      color: 'accent', 
      change: `+${stats?.photos?.recent || 0} today`,
      trend: 'up'
    },
    { 
      name: 'Observations', 
      value: stats?.observations?.total || 0, 
      icon: AlertCircle, 
      color: 'warning', 
      change: `${stats?.observations?.require_action || 0} require action`,
      trend: 'down'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-primary-100">
          {isReviewer 
            ? "Here's the status of reports under your review."
            : "Here's what's happening with your inspections today."}
        </p>
      </div>

      {/* ✅ Stats Grid - ONLY for Admin and Inspector */}
      {!isReviewer && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-neutral-600 mb-2">{stat.name}</p>
              <p className="text-xs text-neutral-500">{stat.change}</p>
            </div>
          ))}
        </div>
      )}

      {/* ✅ REVIEWER: Show Reports instead of Inspections */}
      {isReviewer ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Reviewed Reports */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">
                Recently Reviewed Reports
              </h2>
              <button
                onClick={() => navigate('/reports')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {reviewedReports.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No reviewed reports yet</p>
              ) : (
                reviewedReports.map((report) => {
                  const StatusIcon = getStatusIcon(report.report_status);
                  return (
                    <div 
                      key={report.inspection_id} 
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/reports`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          report.report_status === 'approved' ? 'bg-green-100' :
                          report.report_status === 'changes_requested' ? 'bg-amber-100' :
                          'bg-red-100'
                        }`}>
                          <StatusIcon className={`w-5 h-5 ${
                            report.report_status === 'approved' ? 'text-green-600' :
                            report.report_status === 'changes_requested' ? 'text-amber-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{report.report_number}</p>
                          <p className="text-sm text-neutral-500">{report.vessel_tag} - {report.vessel_type}</p>
                          <p className="text-xs text-neutral-400">
                            Reviewed {formatDateForDisplay(report.report_reviewed_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`badge ${getStatusBadge(report.report_status)}`}>
                        {getStatusText(report.report_status)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pending Reports for Review */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">
                Pending Reports for Review
              </h2>
              <button
                onClick={() => navigate('/reports')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {pendingReports.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-neutral-500">All caught up! No pending reports.</p>
                </div>
              ) : (
                pendingReports.map((report) => (
                  <div 
                    key={report.inspection_id} 
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer border border-amber-200"
                    onClick={() => navigate(`/reports`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{report.report_number}</p>
                        <p className="text-sm text-neutral-500">{report.vessel_tag} - {report.vessel_type}</p>
                        <p className="text-xs text-neutral-400">
                          Generated {formatDateForDisplay(report.report_generated_at)}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-warning">Pending Review</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ADMIN/INSPECTOR: Show original Recent Activity */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Inspections */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">
                Recent Inspections
              </h2>
              <button
                onClick={() => navigate('/inspections')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {recentInspections.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No recent inspections</p>
              ) : (
                recentInspections.map((inspection) => (
                  <div 
                    key={inspection.inspection_id} 
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/inspections/${inspection.inspection_id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Container className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{inspection.vessel_tag}</p>
                        <p className="text-sm text-neutral-500">{inspection.vessel_type}</p>
                      </div>
                    </div>
                    <span className={`badge ${getStatusBadge(inspection.status)}`}>
                      {getStatusText(inspection.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900">
                Upcoming Inspections
              </h2>
              <button
                onClick={() => navigate('/inspections')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No upcoming inspections</p>
              ) : (
                upcomingTasks.map((task) => (
                  <div 
                    key={task.inspection_id} 
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/inspections/${task.inspection_id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-accent-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{task.vessel_tag}</p>
                        <p className="text-sm text-neutral-500">
                          {task.days_until === 0 ? 'Due today' : `Due in ${task.days_until} day${task.days_until > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                    <span className="badge badge-warning">Due Soon</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Stats - Different for Reviewer */}
      {isReviewer && stats?.reviewer_stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-neutral-600">Reviewed by Me</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.reviewer_stats.reviewed_by_me || 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {stats.reviewer_stats.approved_by_me || 0} approved, {' '}
                  {stats.reviewer_stats.changes_requested_by_me || 0} changes requested
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-sm text-neutral-600">Not Reviewed</p>
                <p className="text-2xl font-bold text-amber-900">
                  {stats.reviewer_stats.not_reviewed || 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Pending your review</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-neutral-600">Total Reports</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {stats.reviewer_stats.total_reports || 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Under your review</p>
              </div>
            </div>
          </div>
        </div>
      ) : stats?.reports && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-neutral-600">Total Reports</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.reports.total || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-sm text-neutral-600">Pending Review</p>
                <p className="text-2xl font-bold text-amber-900">{stats.reports.pending || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-neutral-600">Approved</p>
                <p className="text-2xl font-bold text-green-900">{stats.reports.approved || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-neutral-600">Changes Needed</p>
                <p className="text-2xl font-bold text-orange-900">{stats.reports.changes_requested || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;