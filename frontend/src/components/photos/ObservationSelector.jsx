// src/components/photos/ObservationSelector.jsx
import { useState, useEffect } from 'react';
import { X, FileText, Loader, Link as LinkIcon } from 'lucide-react';
import { observationService } from '../../services/observationService';
import toast from 'react-hot-toast';

const ObservationSelector = ({ isOpen, onClose, inspectionId, selectedPhotoIds, onLink }) => {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState(null);

  useEffect(() => {
    const fetchObservations = async () => {
      if (!isOpen || !inspectionId) return;

      try {
        setLoading(true);
        const response = await observationService.getByInspection(inspectionId);
        setObservations(response.data.observations || []);
      } catch (error) {
        console.error('Error fetching observations:', error);
        toast.error('Failed to load observations');
      } finally {
        setLoading(false);
      }
    };

    fetchObservations();
  }, [isOpen, inspectionId]);

  const handleLink = () => {
    if (!selectedObservation) {
      toast.error('Please select an observation');
      return;
    }

    onLink(selectedObservation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Link Photos to Observation</h2>
              <p className="text-sm text-white/80">
                Select an observation to link {selectedPhotoIds.length} photo(s)
              </p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="py-12 text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
              <p className="text-neutral-600">Loading observations...</p>
            </div>
          ) : observations.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-neutral-900 mb-2">No observations found</h4>
              <p className="text-neutral-600">Create an observation first before linking photos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {observations.map((obs) => (
                <button
                  key={obs.observation_id}
                  onClick={() => setSelectedObservation(obs.observation_id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedObservation === obs.observation_id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                      selectedObservation === obs.observation_id
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-neutral-300'
                    }`}>
                      {selectedObservation === obs.observation_id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-neutral-900">
                          Finding {obs.finding_number ? obs.finding_number.split('.')[0] : '-'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          obs.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          obs.severity === 'Major' ? 'bg-orange-100 text-orange-800' :
                          obs.severity === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {obs.severity}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">
                        <span className="font-medium">{obs.component}</span>
                        {obs.location && <span className="text-neutral-400"> • {obs.location}</span>}
                      </p>
                      {obs.description && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                          {obs.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedObservation}
            className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LinkIcon className="w-5 h-5" />
            Link Photos
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObservationSelector;