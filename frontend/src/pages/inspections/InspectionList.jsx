// src/pages/inspections/InspectionList.jsx
import { useState, useEffect } from 'react';
import { inspectionService } from '../../services/inspectionService';
import InspectionForm from '../../components/inspections/InspectionForm';
import InspectionDetails from '../../components/inspections/InspectionDetails';
import { 
  ClipboardList,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { formatDateForDisplay } from '../../utils/dateUtils';

const InspectionList = () => {
  const { user, isAdmin, isInspector } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Status options
  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'neutral' },
    { value: 'submitted', label: 'Submitted', color: 'secondary' },
    { value: 'under_review', label: 'Under Review', color: 'accent' },
    { value: 'changes_requested', label: 'Changes Requested', color: 'accent' },

    { value: 'approved', label: 'Approved', color: 'primary' },
    { value: 'archived', label: 'Archived', color: 'red' }
  ];

  // Fetch inspections
  const fetchInspections = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      
      const response = await inspectionService.getAll(params);
      setInspections(response.data.inspections);
    } catch (error) {
      console.error('Error fetching inspections:', error);
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await inspectionService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewDetails = (inspection) => {
  setSelectedInspection(inspection);
  setShowDetailsModal(true);
};

const handleEdit = (inspection) => {
  setSelectedInspection(inspection);
  setShowEditModal(true);
};

const handleFormSuccess = () => {
  fetchInspections();
  fetchStats();
};

  useEffect(() => {
    fetchInspections();
    fetchStats();
  }, [search, filterStatus]);

  // Delete inspection
  const handleDelete = async (id, reportNo) => {
    if (!window.confirm(`Are you sure you want to delete inspection ${reportNo}?`)) {
      return;
    }

    try {
      await inspectionService.delete(id);
      toast.success('Inspection deleted successfully');
      fetchInspections();
      fetchStats();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete inspection';
      toast.error(errorMsg);
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    if (!statusConfig) return <span className="badge badge-primary">{status}</span>;
    
    const colorClasses = {
      neutral: 'bg-neutral-100 text-neutral-800',
      secondary: 'bg-secondary-100 text-secondary-800',
      accent: 'bg-accent-100 text-accent-800',
      primary: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[statusConfig.color]}`}>
        {statusConfig.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Inspections</h1>
          <p className="text-neutral-600 mt-1">Track and manage vessel inspections</p>
        </div>
        {(isAdmin || isInspector) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Inspection
          </button>

        )}
        
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          {stats.by_status?.slice(0, 4).map((item, index) => {
            const statusConfig = statusOptions.find(s => s.value === item.status);
            const colors = {
              neutral: 'bg-neutral-100 text-neutral-600',
              secondary: 'bg-secondary-100 text-secondary-600',
              accent: 'bg-accent-100 text-accent-600',
              primary: 'bg-green-100 text-green-600',
              red: 'bg-red-100 text-red-600'
            };
            const bgColor = colors[statusConfig?.color] || colors.neutral;

            return (
              <div key={index} className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{statusConfig?.label || item.status}</p>
                    <p className="text-2xl font-bold text-neutral-900">{item.count}</p>
                  </div>
                  <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
                    <span className="text-lg font-bold">{item.count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg p-4 border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by report number, vessel tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter by Status */}
          <div className="w-full md:w-64 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading inspections...</p>
          </div>
        ) : inspections.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No inspections found</h3>
            <p className="text-neutral-600 mb-4">
              {search || filterStatus
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first inspection'}
            </p>
            {(isAdmin || isInspector) && !search && !filterStatus && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create First Inspection
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Report No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Vessel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Inspection Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {inspections.map((inspection) => (
                  <tr key={inspection.inspection_id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center mr-3">
                          <ClipboardList className="w-5 h-5 text-secondary-600" />
                        </div>
                        <div className="font-medium text-neutral-900">{inspection.report_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{inspection.vessel_tag}</div>
                      <div className="text-xs text-neutral-500">{inspection.vessel_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-neutral-900">
                            <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
                            {formatDateForDisplay(inspection.inspection_date)}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-neutral-900">
                        <User className="w-4 h-4 mr-2 text-neutral-400" />
                        {inspection.inspector_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                        const priorityColors = {
                        'Critical': 'bg-red-100 text-red-800',
                        'High': 'bg-orange-100 text-orange-800',
                        'Medium': 'bg-yellow-100 text-yellow-800',
                        'Low': 'bg-green-100 text-green-800'
                         };
                    return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[inspection.priority] || 'bg-neutral-100 text-neutral-800'}`}>
                          {inspection.priority}
                        </span>
                    );
                    })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(inspection.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => handleViewDetails(inspection)}
                            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        {(isAdmin || inspection.inspector_id === user.user_id) && (
                          <>
                            <button
                                onClick={() => handleEdit(inspection)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(inspection.inspection_id, inspection.report_no)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {inspections.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Showing {inspections.length} inspection(s)
          </p>
        </div>
      )}

      {/* Modals */}
    <InspectionForm
        isOpen={showCreateModal}
        onClose={() => {
        setShowCreateModal(false);
        setSelectedInspection(null);
        }}
        inspection={null}
        onSuccess={handleFormSuccess}
    />

    <InspectionForm
        isOpen={showEditModal}
        onClose={() => {
        setShowEditModal(false);
        setSelectedInspection(null);
        }}
        inspection={selectedInspection}
        onSuccess={handleFormSuccess}
    />

    <InspectionDetails
        isOpen={showDetailsModal}
        onClose={() => {
        setShowDetailsModal(false);
        setSelectedInspection(null);
        }}
        inspection={selectedInspection}
    />
    </div>
  );
};

export default InspectionList;