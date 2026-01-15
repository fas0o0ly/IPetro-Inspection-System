// src/pages/observations/ObservationList.jsx
import { useState, useEffect } from 'react';
import { observationService } from '../../services/observationService';
import { 
  FileText,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ObservationForm from '../../components/observations/ObservationForm';
import ObservationDetails from '../../components/observations/ObservationDetails';

const ObservationList = () => {
  const { user, isAdmin, isInspector } = useAuth();
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [stats, setStats] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
const [selectedObservationForView, setSelectedObservationForView] = useState(null);
  const statusOptions = ['Open', 'Acceptable', 'Monitoring Required', 'Repair Required', 'Closed'];
  const severityOptions = ['Minor', 'Moderate', 'Major', 'Critical'];


  const handleEdit = (observation) => {
  setSelectedObservation(observation);
  setShowEditModal(true);
};

const handleFormSuccess = () => {
  fetchObservations();
  fetchStats();
};

const handleViewDetails = (observation) => {
  setSelectedObservationForView(observation);
  setShowDetailsModal(true);
};
  // Fetch observations
  const fetchObservations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterSeverity) params.severity = filterSeverity;
      
      const response = await observationService.getAll(params);
      setObservations(response.data.observations || []);
    } catch (error) {
      console.error('Error fetching observations:', error);
      toast.error('Failed to load observations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await observationService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchObservations();
    fetchStats();
  }, [search, filterStatus, filterSeverity]);

  // Delete observation
  const handleDelete = async (id, findingNumber) => {
    if (!window.confirm(`Are you sure you want to delete observation ${findingNumber}?`)) {
      return;
    }

    try {
      await observationService.delete(id);
      toast.success('Observation deleted successfully');
      fetchObservations();
      fetchStats();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete observation';
      toast.error(errorMsg);
    }
  };

  // Get severity badge color
  const getSeverityBadge = (severity) => {
    const colors = {
      'Minor': 'bg-green-100 text-green-800',
      'Moderate': 'bg-yellow-100 text-yellow-800',
      'Major': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[severity] || 'bg-neutral-100 text-neutral-800'}`}>
        {severity}
      </span>
    );
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const colors = {
      'Open': 'bg-blue-100 text-blue-800',
      'Acceptable': 'bg-green-100 text-green-800',
      'Monitoring Required': 'bg-yellow-100 text-yellow-800',
      'Repair Required': 'bg-orange-100 text-orange-800',
      'Closed': 'bg-neutral-100 text-neutral-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-neutral-100 text-neutral-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Observations</h1>
          <p className="text-neutral-600 mt-1">Inspection findings and defects tracking</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.total || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          {severityOptions.map((severity, index) => {
            const count = stats.by_severity?.find(s => s.severity === severity)?.count || 0;
            const colors = {
              'Minor': 'bg-green-100 text-green-600',
              'Moderate': 'bg-yellow-100 text-yellow-600',
              'Major': 'bg-orange-100 text-orange-600',
              'Critical': 'bg-red-100 text-red-600'
            };
            return (
              <div key={index} className="bg-white rounded-lg p-4 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{severity}</p>
                    <p className="text-2xl font-bold text-neutral-900">{count}</p>
                  </div>
                  <div className={`w-12 h-12 ${colors[severity]} rounded-lg flex items-center justify-center`}>
                    <span className="text-lg font-bold">{count}</span>
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
              placeholder="Search by finding number, component, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter by Severity */}
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">All Severities</option>
              {severityOptions.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Observations Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading observations...</p>
          </div>
        ) : observations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No observations found</h3>
            <p className="text-neutral-600 mb-4">
              {search || filterStatus || filterSeverity
                ? 'Try adjusting your search or filters'
                : 'Observations are created within inspections'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Finding No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Component
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Photos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {observations.map((observation) => (
                  <tr key={observation.observation_id} className="hover:bg-neutral-50 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap">
  <div className="flex items-center">
    <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mr-3">
      <FileText className="w-5 h-5 text-accent-600" />
    </div>
    <div className="font-medium text-neutral-900">
      {observation.finding_number ? observation.finding_number.split('.')[0] : '-'}
    </div>
  </div>
</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-neutral-900">{observation.component || '-'}</div>
                      <div className="text-xs text-neutral-500">{observation.location || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-neutral-900">{observation.observation_type || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSeverityBadge(observation.severity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(observation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-neutral-600">
                        <Camera className="w-4 h-4 mr-1" />
                        {observation.photo_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(observation)}
                          className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(isAdmin || observation.created_by === user.user_id) && (
                          <>
                            <button
                                onClick={() => handleEdit(observation)}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(observation.observation_id, observation.finding_number)}
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
      {observations.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Showing {observations.length} observation(s)
          </p>
        </div>
      )}

      {/* Modals */}
      <ObservationForm
        isOpen={showEditModal}
        onClose={() => {
            setShowEditModal(false);
            setSelectedObservation(null);
        }}
        observation={selectedObservation}
        inspectionId={selectedObservation?.inspection_id}
        vesselId={selectedObservation?.vessel_id}
        onSuccess={handleFormSuccess}
        />

        <ObservationDetails
  isOpen={showDetailsModal}
  onClose={() => {
    setShowDetailsModal(false);
    setSelectedObservationForView(null);
  }}
  observation={selectedObservationForView}
  onUpdate={() => {
    fetchObservations();
    fetchStats();
  }}
  
/>
    </div>
  );
};

export default ObservationList;