// src/components/observations/ObservationDetails.jsx
import { useState, useEffect } from 'react';
import { X, FileText, Camera, MapPin, AlertCircle, Calendar, User, Trash2, Plus, Link as LinkIcon } from 'lucide-react';
import { observationService } from '../../services/observationService';
import { photoService } from '../../services/photoService';
import { formatDateForDisplay } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const ObservationDetails = ({ isOpen, onClose, observation, onUpdate }) => {
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!observation?.observation_id) return;

      try {
        setLoadingPhotos(true);
        const response = await photoService.getByObservation(observation.observation_id);
        setPhotos(response.data.photos || []);
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    if (isOpen && observation) {
      fetchPhotos();
    }
  }, [isOpen, observation]);

  const handleUnlinkPhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to unlink this photo?')) {
      return;
    }

    try {
      await photoService.unlinkFromObservation(observation.observation_id, photoId);
      toast.success('Photo unlinked successfully');
      // Refresh photos
      const response = await photoService.getByObservation(observation.observation_id);
      setPhotos(response.data.photos || []);
      if (onUpdate) onUpdate();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to unlink photo';
      toast.error(errorMsg);
    }
  };

  if (!isOpen || !observation) return null;

  const API_BASE_URL = 'http://localhost:5000';

  // Parse findings from description
  const findings = observation.description 
    ? observation.description.split('\n\n').filter(f => f.trim())
    : [];

  // Parse recommendations
  const recommendations = observation.recommendation
    ? observation.recommendation.split('\n\n').filter(r => r.trim())
    : [];

  const getSeverityColor = (severity) => {
    const colors = {
      'Minor': 'bg-green-100 text-green-800',
      'Moderate': 'bg-yellow-100 text-yellow-800',
      'Major': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-neutral-100 text-neutral-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': 'bg-blue-100 text-blue-800',
      'Acceptable': 'bg-green-100 text-green-800',
      'Monitoring Required': 'bg-yellow-100 text-yellow-800',
      'Repair Required': 'bg-orange-100 text-orange-800',
      'Closed': 'bg-neutral-100 text-neutral-800'
    };
    return colors[status] || 'bg-neutral-100 text-neutral-800';
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent-600 to-primary-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Finding {observation.finding_number ? observation.finding_number.split('.')[0] : '-'}
                </h2>
                <p className="text-sm text-white/80">{observation.component} - {observation.observation_type}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary-600" />
                    Observation Details
                  </h3>
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-600">Finding Number:</span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {observation.finding_number || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-600">Component:</span>
                      <span className="text-sm text-neutral-900">{observation.component}</span>
                    </div>
                    {observation.location && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-neutral-600">Location:</span>
                        <span className="text-sm text-neutral-900">{observation.location}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-600">Type:</span>
                      <span className="text-sm text-neutral-900">{observation.observation_type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-600">Severity:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(observation.severity)}`}>
                        {observation.severity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(observation.status)}`}>
                        {observation.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-600">Priority:</span>
                      <span className="text-sm text-neutral-900">{observation.priority}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-600">Action Required:</span>
                      <span className="text-sm text-neutral-900">{observation.action_required}</span>
                    </div>
                  </div>
                </div>

                {/* Findings */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    Findings
                  </h3>
                  <div className="space-y-3">
                    {findings.map((finding, index) => (
                      <div key={index} className="bg-neutral-50 rounded-lg p-4 border-l-4 border-accent-600">
                        <p className="text-sm text-neutral-900">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-primary-600" />
                      Recommendations
                    </h3>
                    <div className="space-y-3">
                      {recommendations.map((recommendation, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                          <p className="text-sm text-blue-900">{recommendation}</p>
                        </div>
                      ))}
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
                        {formatDateForDisplay(observation.created_at)}
                      </span>
                    </div>
                    {observation.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-neutral-600">Last Updated:</span>
                        <span className="text-sm text-neutral-900">
                          {formatDateForDisplay(observation.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Photos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary-600" />
                    Photos ({photos.length})
                  </h3>
                </div>

                {loadingPhotos ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-neutral-600">Loading photos...</p>
                  </div>
                ) : photos.length === 0 ? (
                  <div className="bg-neutral-50 rounded-lg p-8 text-center border-2 border-dashed border-neutral-300">
                    <Camera className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <p className="text-sm text-neutral-600">No photos linked</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {photos.map((photo) => (
                      <div key={photo.photo_id} className="relative group">
                        <img
                          src={`${API_BASE_URL}${photo.file_uri}`}
                          alt={photo.original_filename}
                          className="w-full h-40 object-cover rounded-lg border border-neutral-200 cursor-pointer"
                          onClick={() => setSelectedPhoto(photo)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-lg flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUnlinkPhoto(photo.photo_id)}
                            className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                            title="Unlink Photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {photo.tag_number}.{photo.sequence_no}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-neutral-100"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-5xl max-h-[90vh] overflow-auto">
            <img
              src={`${API_BASE_URL}${selectedPhoto.file_uri}`}
              alt={selectedPhoto.original_filename}
              className="w-full h-auto rounded-lg"
            />
            <div className="bg-white p-4 rounded-b-lg">
              <p className="font-medium text-neutral-900">
                Photo {selectedPhoto.tag_number}.{selectedPhoto.sequence_no}
              </p>
              {selectedPhoto.caption && (
                <p className="text-sm text-neutral-600 mt-1">{selectedPhoto.caption}</p>
              )}
              <p className="text-xs text-neutral-400 mt-2">
                {selectedPhoto.original_filename}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ObservationDetails;