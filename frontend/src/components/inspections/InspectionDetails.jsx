// src/components/inspections/InspectionDetails.jsx
import { useState, useEffect } from 'react';
import { X, ClipboardList, Container, Calendar, User, FileText, AlertCircle, Plus, Edit2, Trash2, FileCheck ,  Camera, Eye, Upload } from 'lucide-react';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { observationService } from '../../services/observationService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ObservationForm from '../observations/ObservationForm';
import ObservationDetails from '../observations/ObservationDetails';
import PhotoUpload from '../photos/PhotoUpload';
import PhotoGallery from '../photos/PhotoGallery';
import ReportGenerator from '../reports/ReportGenerator';
import FindingsSummary from '../inspections/FindingsSummary';


const InspectionDetails = ({ isOpen, onClose, inspection }) => {
  const { user, isAdmin, isInspector } = useAuth();
  const [observations, setObservations] = useState([]);
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'observations'
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [currentPhotoGroup, setCurrentPhotoGroup] = useState('1');
  const [showObservationDetails, setShowObservationDetails] = useState(false);
const [selectedObservationForView, setSelectedObservationForView] = useState(null);

  // Fetch observations for this inspection
  useEffect(() => {
    const fetchObservations = async () => {
      if (!inspection?.inspection_id) return;
      
      try {
        setLoadingObservations(true);
        const response = await observationService.getByInspection(inspection.inspection_id);
        setObservations(response.data.observations || []);
      } catch (error) {
        console.error('Error fetching observations:', error);
      } finally {
        setLoadingObservations(false);
      }
    };

    if (isOpen && inspection) {
      fetchObservations();
    }
  }, [isOpen, inspection]);

  const handleViewObservationDetails = (observation) => {
  setSelectedObservationForView(observation);
  setShowObservationDetails(true);
};

  const handleDeleteObservation = async (id, findingNumber) => {
    if (!window.confirm(`Are you sure you want to delete observation ${findingNumber}?`)) {
      return;
    }

    try {
      await observationService.delete(id);
      toast.success('Observation deleted successfully');
      // Refresh observations
      const response = await observationService.getByInspection(inspection.inspection_id);
      setObservations(response.data.observations || []);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete observation';
      toast.error(errorMsg);
    }
  };

  const handleEditObservation = (observation) => {
    setSelectedObservation(observation);
    setShowObservationForm(true);
  };

  const handleObservationSuccess = async () => {
    // Refresh observations after create/update
    const response = await observationService.getByInspection(inspection.inspection_id);
    setObservations(response.data.observations || []);
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-neutral-100 text-neutral-800',
      'submitted': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'changes_requested': 'bg-orange-100 text-orange-800',
      'approved': 'bg-green-100 text-green-800',
      'archived': 'bg-neutral-100 text-neutral-800'
    };
    return colors[status] || colors.draft;
  };

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

  const getObservationStatusBadge = (status) => {
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

  if (!isOpen || !inspection) return null;

  const canEdit = isAdmin || isInspector || inspection.inspector_id === user?.user_id;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-secondary-600 to-accent-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{inspection.report_number || 'Inspection Details'}</h2>
                <p className="text-sm text-white/80">{inspection.vessel_tag} - {inspection.vessel_type}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200 px-6 flex-shrink-0">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('findings-summary')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'findings-summary'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <FileCheck /> 
                Findings Summary
                
              </button>
              <button
                onClick={() => setActiveTab('observations')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'observations'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Observations
                {observations.length > 0 && (
                  <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {observations.length}
                  </span>
                )}
              </button>
              <button
  onClick={() => setActiveTab('photos')}
  className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
    activeTab === 'photos'
      ? 'border-primary-600 text-primary-600'
      : 'border-transparent text-neutral-600 hover:text-neutral-900'
  }`}
>
  <Camera className="w-4 h-4" />
  Photos
</button>

<button
  onClick={() => setActiveTab('report')}
  className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
    activeTab === 'report'
      ? 'border-primary-600 text-primary-600'
      : 'border-transparent text-neutral-600 hover:text-neutral-900'
  }`}
>
  <FileText className="w-4 h-4" />
  Report
</button>
            </div>
          </div>

          {/* Content */}
<div className="p-6 overflow-y-auto flex-1">
  {activeTab === 'overview' && (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Vessel Information */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Container className="w-5 h-5 text-primary-600" />
            Vessel Information
          </h3>
          <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600">Tag Number:</span>
              <span className="text-sm font-semibold text-neutral-900">{inspection.vessel_tag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600">Vessel Type:</span>
              <span className="badge badge-secondary">{inspection.vessel_type}</span>
            </div>
            {inspection.vessel_location && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Location:</span>
                <span className="text-sm text-neutral-900">{inspection.vessel_location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Inspection Information */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Inspection Information
          </h3>
          <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
            {inspection.report_number && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Report Number:</span>
                <span className="text-sm font-semibold text-neutral-900">{inspection.report_number}</span>
              </div>
            )}

            {/* <div>
              <p className="text-sm text-neutral-500">DOSH Registration No.</p>
              <p className="font-medium">{inspection.dosh_registration || 'N/A'}</p>
            </div> */}

            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600">DOSH Registration No.</span>
              <span className="text-sm text-neutral-900">
                {inspection.dosh_registration || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600">Inspection Date:</span>
              <span className="text-sm text-neutral-900">
                {formatDateForDisplay(inspection.inspection_date)}
              </span>
            </div>
            {inspection.next_inspection_date && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Next Inspection:</span>
                <span className="text-sm text-neutral-900">
                  {formatDateForDisplay(inspection.next_inspection_date)}
                </span>
              </div>
            )}
            {inspection.scheduled_date && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Scheduled Date:</span>
                <span className="text-sm text-neutral-900">
                  {formatDateForDisplay(inspection.scheduled_date)}
                </span>
              </div>
            )}
            {inspection.due_date && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Due Date:</span>
                <span className="text-sm text-neutral-900">
                  {formatDateForDisplay(inspection.due_date)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600">Inspection Type:</span>
              <span className="text-sm text-neutral-900 capitalize">
                {inspection.inspection_type?.replace('-', ' ')}
              </span>
            </div>
            {inspection.priority && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Priority:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  inspection.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                  inspection.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                  inspection.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {inspection.priority}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                {inspection.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Inspector Information */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            Inspector Information
          </h3>
          <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600">Inspector:</span>
              <span className="text-sm text-neutral-900">{inspection.inspector_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600">Email:</span>
              <span className="text-sm text-neutral-900">{inspection.inspector_email || '-'}</span>
            </div>
            {inspection.reviewer_name && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-neutral-600">Reviewer:</span>
                  <span className="text-sm text-neutral-900">{inspection.reviewer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-neutral-600">Reviewer Email:</span>
                  <span className="text-sm text-neutral-900">{inspection.reviewer_email || '-'}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Findings Summary */}
        {inspection.findings_summary && (
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Overall Findings Summary
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-900 whitespace-pre-wrap">
                {inspection.findings_summary}
              </p>
            </div>
          </div>
        )}

        {/* Remarks */}
        {inspection.remarks && (
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary-600" />
              General Remarks
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-900 whitespace-pre-wrap">
                {inspection.remarks}
              </p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Record Information
          </h3>
          <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600">Created:</span>
              <span className="text-sm text-neutral-900">
                {formatDateForDisplay(inspection.created_at)}
              </span>
            </div>
            {inspection.updated_at && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Last Updated:</span>
                <span className="text-sm text-neutral-900">
                  {formatDateForDisplay(inspection.updated_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Observations Summary */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Observations Summary
          </h3>
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-neutral-900">{observations.length}</p>
                <p className="text-sm text-neutral-600">Total Observations</p>
              </div>
              <button
                onClick={() => setActiveTab('observations')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

{activeTab === 'findings-summary' && (
  <FindingsSummary 
    inspectionId={inspection.inspection_id}
    vesselId={inspection.vessel_id}
    vesselTag={inspection.vessel?.vessel_tag}
  />
)}

  {activeTab === 'observations' && (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Inspection Observations</h3>
          <p className="text-sm text-neutral-600 mt-1">
            Detailed findings and recommendations for this inspection
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setSelectedObservation(null);
              setShowObservationForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Observation
          </button>
        )}
      </div>

      {/* Observations List */}
      {loadingObservations ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading observations...</p>
        </div>
      ) : observations.length === 0 ? (
        <div className="bg-neutral-50 rounded-lg p-12 text-center border-2 border-dashed border-neutral-300">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-neutral-400" />
          </div>
          <h4 className="text-lg font-semibold text-neutral-900 mb-2">No observations yet</h4>
          <p className="text-neutral-600 mb-4">
            Start documenting findings by adding your first observation
          </p>
          {canEdit && (
            <button
              onClick={() => {
                setSelectedObservation(null);
                setShowObservationForm(true);
              }}
              className="btn-primary"
            >
              Add First Observation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {observations.map((obs) => (
            <div key={obs.observation_id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-accent-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-neutral-900">
                        Finding {obs.finding_number ? obs.finding_number.split('.')[0] : '-'}
                      </span>
                      {getSeverityBadge(obs.severity)}
                      {getObservationStatusBadge(obs.status)}
                    </div>
                    <div className="text-sm text-neutral-600">
                      <span className="font-medium">{obs.component}</span>
                      {obs.location && <span className="text-neutral-400"> • {obs.location}</span>}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {obs.observation_type}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {obs.photo_count > 0 && (
                    <div className="flex items-center gap-1 text-sm text-neutral-600 bg-neutral-100 px-2 py-1 rounded">
                      <Camera className="w-4 h-4" />
                      <span>{obs.photo_count}</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleViewObservationDetails(obs)}
                    className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {canEdit && (
                    <>
                      <button
                        onClick={() => handleEditObservation(obs)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteObservation(obs.observation_id, obs.finding_number)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Description Preview */}
              {obs.description && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <p className="text-sm text-neutral-700 line-clamp-3">
                    {obs.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )}

{activeTab === 'photos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">Inspection Photos</h3>
                    <p className="text-sm text-neutral-600 mt-1">
                      Upload and manage photos for this inspection
                    </p>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-neutral-700">
                        Photo Group:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={currentPhotoGroup}
                        onChange={(e) => setCurrentPhotoGroup(e.target.value)}
                        className="w-20 px-3 py-2 border border-neutral-300 rounded-lg"
                      />
                      <button
                        onClick={() => {
                          console.log('Upload button clicked!');
                          setShowPhotoUpload(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Upload className="w-5 h-5" />
                        Upload Photos
                      </button>
                    </div>
                  )}
                </div>

                {/* Show upload or gallery */}
                {showPhotoUpload ? (
                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <PhotoUpload
                      inspectionId={inspection.inspection_id}
                      photoGroup={currentPhotoGroup}
                      onSuccess={() => {
                        console.log('Photo upload success!');
                        setShowPhotoUpload(false);
                      }}
                      onClose={() => {
                        console.log('Photo upload closed!');
                        setShowPhotoUpload(false);
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <PhotoGallery
                      inspectionId={inspection.inspection_id}
                      onLinkToObservation={(photoIds) => {
                        console.log('Link photos to observation:', photoIds);
                        toast.info('Please select an observation to link these photos');
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'report' && (
  <div className="space-y-4">
    <ReportGenerator inspection={inspection} />
  </div>
)}
          </div>


          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Close
            </button>
            {inspection.status === 'approved' && (
              <button className="btn-primary px-6 py-2.5">
                Generate Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Observation Form Modal */}
      <ObservationForm
        isOpen={showObservationForm}
        onClose={() => {
          setShowObservationForm(false);
          setSelectedObservation(null);
        }}
        observation={selectedObservation}
        inspectionId={inspection?.inspection_id}
        vesselId={inspection?.vessel_id}
        onSuccess={handleObservationSuccess}
      />


        <ObservationDetails
  isOpen={showObservationDetails}
  onClose={() => {
    setShowObservationDetails(false);
    setSelectedObservationForView(null);
  }}
  observation={selectedObservationForView}
  onUpdate={handleObservationSuccess}
/>
    
    </>
  );
};

export default InspectionDetails;