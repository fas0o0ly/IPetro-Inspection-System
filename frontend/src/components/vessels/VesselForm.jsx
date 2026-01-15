// src/components/vessels/VesselForm.jsx
import { useState, useEffect } from 'react';
import { X, Container, Loader } from 'lucide-react';
import { vesselService } from '../../services/vesselService';
import toast from 'react-hot-toast';

const VesselForm = ({ isOpen, onClose, vessel = null, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [vesselTypes, setVesselTypes] = useState([]);
  const [formData, setFormData] = useState({
    tag_no: '',
    vessel_type: '',
    description: '',
    plant_unit: '',
    location: '',
    design_data: {
      design_pressure: '',
      design_temperature: '',
      material: '',
      manufacturer: '',
      year_built: '',
    }
  });

  // Fetch vessel types on mount
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await vesselService.getTypes();
        setVesselTypes(response.data.types);
      } catch (error) {
        console.error('Error fetching types:', error);
      }
    };
    fetchTypes();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (vessel) {
      setFormData({
        tag_no: vessel.tag_no || '',
        vessel_type: vessel.vessel_type || '',
        description: vessel.description || '',
        plant_unit: vessel.plant_unit || '',
        location: vessel.location || '',
        design_data: vessel.design_data || {
          design_pressure: '',
          design_temperature: '',
          material: '',
          manufacturer: '',
          year_built: '',
        }
      });
    }
  }, [vessel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDesignDataChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      design_data: {
        ...prev.design_data,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (vessel) {
        // Update existing vessel
        await vesselService.update(vessel.vessel_id, formData);
        toast.success('Vessel updated successfully');
      } else {
        // Create new vessel
        await vesselService.create(formData);
        toast.success('Vessel created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to save vessel';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Container className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {vessel ? 'Edit Vessel' : 'Add New Vessel'}
              </h2>
              <p className="text-sm text-white/80">
                {vessel ? 'Update vessel information' : 'Enter vessel details below'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-200">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tag Number */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tag Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tag_no"
                    value={formData.tag_no}
                    onChange={handleChange}
                    placeholder="e.g., V-101"
                    required
                    disabled={loading}
                    className="input"
                  />
                </div>

                {/* Vessel Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Vessel Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vessel_type"
                    value={formData.vessel_type}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="input"
                  >
                    <option value="">Select Type</option>
                    {vesselTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div className="form-group">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Plant Identifier <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    name="plant_identifier"
    value={formData.plant_identifier || '1'}
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="e.g., 1, 2, A, B"
    required
  />
  <p className="mt-1 text-xs text-gray-500">
    Used in report numbering: PLANT {formData.plant_identifier || '1'}/VI/{formData.tag_no || 'V-XXX'}/TA2026
  </p>
</div> */}

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Main Distillation Column"
                    rows="3"
                    disabled={loading}
                    className="input resize-none"
                  />
                </div>

                {/* Plant Unit */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Plant Unit
                  </label>
                  <input
                    type="text"
                    name="plant_unit"
                    value={formData.plant_unit}
                    onChange={handleChange}
                    placeholder="e.g., Distillation Unit 1"
                    disabled={loading}
                    className="input"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Area A - Block 1"
                    disabled={loading}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Design Data */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-200">
                Design Data (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Design Pressure */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Design Pressure
                  </label>
                  <input
                    type="text"
                    name="design_pressure"
                    value={formData.design_data.design_pressure}
                    onChange={handleDesignDataChange}
                    placeholder="e.g., 150 psi"
                    disabled={loading}
                    className="input"
                  />
                </div>

                {/* Design Temperature */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Design Temperature
                  </label>
                  <input
                    type="text"
                    name="design_temperature"
                    value={formData.design_data.design_temperature}
                    onChange={handleDesignDataChange}
                    placeholder="e.g., 450°F"
                    disabled={loading}
                    className="input"
                  />
                </div>

                {/* Material */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    name="material"
                    value={formData.design_data.material}
                    onChange={handleDesignDataChange}
                    placeholder="e.g., Carbon Steel SA-516 Grade 70"
                    disabled={loading}
                    className="input"
                  />
                </div>

                {/* Year Built */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Year Built
                  </label>
                  <input
                    type="number"
                    name="year_built"
                    value={formData.design_data.year_built}
                    onChange={handleDesignDataChange}
                    placeholder="e.g., 2015"
                    min="1900"
                    max={new Date().getFullYear()}
                    disabled={loading}
                    className="input"
                  />
                </div>

                {/* Manufacturer */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.design_data.manufacturer}
                    onChange={handleDesignDataChange}
                    placeholder="e.g., ABC Fabricators"
                    disabled={loading}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2.5 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {vessel ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{vessel ? 'Update Vessel' : 'Create Vessel'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VesselForm;