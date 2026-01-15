// src/pages/vessels/VesselList.jsx
import { useState, useEffect } from 'react';
import { vesselService } from '../../services/vesselService';
import { 
  Container, 
  Search, 
  Plus, 
  Filter,
  Edit2,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import VesselForm from '../../components/vessels/VesselForm';
import VesselDetails from '../../components/vessels/VesselDetails';

const VesselList = () => {
  const { isAdmin } = useAuth();
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [vesselTypes, setVesselTypes] = useState([]);
  const [stats, setStats] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);

  // Fetch vessels
  const fetchVessels = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (filterType) params.vessel_type = filterType;
      
      const response = await vesselService.getAll(params);
      setVessels(response.data.vessels);
    } catch (error) {
      console.error('Error fetching vessels:', error);
      toast.error('Failed to load vessels');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vessel types
  const fetchVesselTypes = async () => {
    try {
      const response = await vesselService.getTypes();
      setVesselTypes(response.data.types);
    } catch (error) {
      console.error('Error fetching vessel types:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await vesselService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchVessels();
    fetchVesselTypes();
    fetchStats();
  }, [search, filterType]);

  // Handle view details
  const handleViewDetails = (vessel) => {
    setSelectedVessel(vessel);
    setShowDetailsModal(true);
  };

  // Handle edit
  const handleEdit = (vessel) => {
    setSelectedVessel(vessel);
    setShowEditModal(true);
  };

  // Handle delete
  const handleDelete = async (id, tagNo) => {
    if (!window.confirm(`Are you sure you want to delete vessel ${tagNo}?`)) {
      return;
    }

    try {
      await vesselService.delete(id);
      toast.success('Vessel deleted successfully');
      fetchVessels();
      fetchStats();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete vessel';
      toast.error(errorMsg);
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    fetchVessels();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Vessels</h1>
          <p className="text-neutral-600 mt-1">Manage pressure vessels and equipment</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Vessel
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Vessels</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Container className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>

          {stats.by_type?.slice(0, 3).map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-neutral-200">
              <p className="text-sm text-neutral-600">{item.vessel_type}</p>
              <p className="text-2xl font-bold text-neutral-900">{item.count}</p>
            </div>
          ))}
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
              placeholder="Search by tag number, description, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter by Type */}
          <div className="w-full md:w-64 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">All Types</option>
              {vesselTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vessels Table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading vessels...</p>
          </div>
        ) : vessels.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No vessels found</h3>
            <p className="text-neutral-600 mb-4">
              {search || filterType
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first vessel'}
            </p>
            {isAdmin && !search && !filterType && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Add First Vessel
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Tag Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Plant Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {vessels.map((vessel) => (
                  <tr key={vessel.vessel_id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                          <Container className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="font-medium text-neutral-900">{vessel.tag_no}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="badge badge-secondary">
                        {vessel.vessel_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900 max-w-xs truncate">
                        {vessel.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {vessel.plant_unit || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {vessel.location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(vessel)}
                          className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(vessel)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Edit"
                            
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(vessel.vessel_id, vessel.tag_no)}
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
      {vessels.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Showing {vessels.length} vessel(s)
          </p>
        </div>
      )}

      {/* Modals */}
      <VesselForm
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedVessel(null);
        }}
        vessel={null}
        onSuccess={handleFormSuccess}
      />

      <VesselForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedVessel(null);
        }}
        vessel={selectedVessel}
        onSuccess={handleFormSuccess}
      />

      <VesselDetails
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedVessel(null);
        }}
        vessel={selectedVessel}
      />
    </div>
  );
};

export default VesselList;