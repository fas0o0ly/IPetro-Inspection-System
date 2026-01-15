// src/components/vessels/VesselDetails.jsx
import { X, Container, Calendar, MapPin, Settings } from 'lucide-react';

const VesselDetails = ({ isOpen, onClose, vessel }) => {
  if (!isOpen || !vessel) return null;

  const designData = vessel.design_data || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Container className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{vessel.tag_no}</h2>
              <p className="text-sm text-white/80">{vessel.vessel_type}</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Container className="w-5 h-5 text-primary-600" />
              Basic Information
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Tag Number:</span>
                <span className="text-sm font-semibold text-neutral-900">{vessel.tag_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Vessel Type:</span>
                <span className="badge badge-secondary">{vessel.vessel_type}</span>
              </div>
              {vessel.description && (
                <div>
                  <span className="text-sm font-medium text-neutral-600 block mb-1">Description:</span>
                  <p className="text-sm text-neutral-900">{vessel.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Location
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Plant Unit:</span>
                <span className="text-sm text-neutral-900">{vessel.plant_unit || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-600">Location:</span>
                <span className="text-sm text-neutral-900">{vessel.location || '-'}</span>
              </div>
            </div>
          </div>

          {/* Design Data */}
          {Object.keys(designData).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-600" />
                Design Data
              </h3>
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                {designData.design_pressure && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-neutral-600">Design Pressure:</span>
                    <span className="text-sm text-neutral-900">{designData.design_pressure}</span>
                  </div>
                )}
                {designData.design_temperature && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-neutral-600">Design Temperature:</span>
                    <span className="text-sm text-neutral-900">{designData.design_temperature}</span>
                  </div>
                )}
                {designData.material && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-neutral-600">Material:</span>
                    <span className="text-sm text-neutral-900">{designData.material}</span>
                  </div>
                )}
                {designData.manufacturer && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-neutral-600">Manufacturer:</span>
                    <span className="text-sm text-neutral-900">{designData.manufacturer}</span>
                  </div>
                )}
                {designData.year_built && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-neutral-600">Year Built:</span>
                    <span className="text-sm text-neutral-900">{designData.year_built}</span>
                  </div>
                )}
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
                  {new Date(vessel.created_at).toLocaleString()}
                </span>
              </div>
              {vessel.updated_at && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-neutral-600">Last Updated:</span>
                  <span className="text-sm text-neutral-900">
                    {new Date(vessel.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselDetails;