// src/components/inspections/InspectionForm.jsx
import { useState, useEffect } from 'react';
import { X, ClipboardList, Loader } from 'lucide-react';
import { inspectionService } from '../../services/inspectionService';
import { vesselService } from '../../services/vesselService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatDateForInput, getTodayForInput } from '../../utils/dateUtils';



const InspectionForm = ({ isOpen, onClose, inspection = null, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vessels, setVessels] = useState([]);
  const [formData, setFormData] = useState({
    vessel_id: '',
    inspection_date: new Date().toISOString().split('T')[0],
    next_inspection_date: '',
    scheduled_date: '',
    due_date: '',
    inspection_type: 'Periodic',
    priority: 'Medium',
    status: 'draft',
    findings_summary: '',
    remarks: '',
    dosh_registration: inspection ? '' : 'MK PMT'
  });

  

  // Match backend exactly
  const inspectionTypes = [
    { value: 'Initial', label: 'Initial Inspection' },
    { value: 'Periodic', label: 'Periodic Inspection' },
    { value: 'Emergency', label: 'Emergency Inspection' },
    { value: 'Pre-Shutdown', label: 'Pre-Shutdown Inspection' },
    { value: 'Post-Repair', label: 'Post-Repair Inspection' }
  ];

  const priorities = [
    { value: 'Critical', label: 'Critical', color: 'text-red-600' },
    { value: 'High', label: 'High', color: 'text-orange-600' },
    { value: 'Medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'Low', label: 'Low', color: 'text-green-600' }
  ];

  const statuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'changes_requested', label: 'Changes Requested' },
    { value: 'approved', label: 'Approved' },
    { value: 'archived', label: 'Archived' }
  ];

  // Fetch vessels
  useEffect(() => {
    const fetchVessels = async () => {
      try {
        const response = await vesselService.getAll();
        setVessels(response.data.vessels);
      } catch (error) {
        console.error('Error fetching vessels:', error);
        toast.error('Failed to load vessels');
      }
    };
    if (isOpen) {
      fetchVessels();
    }
  }, [isOpen]);

  // Populate form when editing
useEffect(() => {
  if (inspection) {
    setFormData({
      vessel_id: inspection.vessel_id || '',
      inspection_date: formatDateForInput(inspection.inspection_date),
      next_inspection_date: formatDateForInput(inspection.next_inspection_date),
      scheduled_date: formatDateForInput(inspection.scheduled_date),
      due_date: formatDateForInput(inspection.due_date),
      inspection_type: inspection.inspection_type || 'Periodic',
      priority: inspection.priority || 'Medium',
      status: inspection.status || 'draft',
      findings_summary: inspection.findings_summary || '',
      remarks: inspection.remarks || '',
      dosh_registration: inspection.dosh_registration || ''
    });
  } else {
    setFormData({
      vessel_id: '',
      inspection_date: getTodayForInput(),
      next_inspection_date: '',
      scheduled_date: '',
      due_date: '',
      inspection_type: 'Periodic',
      priority: 'Medium',
      status: 'draft',
      findings_summary: '',
      remarks: ''
    });
  }
}, [inspection, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      const submitData = {
        ...formData,
        vessel_id: parseInt(formData.vessel_id),
        inspector_id: formData.inspector_id ? parseInt(formData.inspector_id) : null,
        reviewer_id: formData.reviewer_id ? parseInt(formData.reviewer_id) : null,
        scope: formData.scope || null,
        dosh_registration: formData.dosh_registration || null
      };

      if (inspection) {
        await inspectionService.update(inspection.inspection_id, submitData);
        toast.success('Inspection updated successfully');
      } else {
        await inspectionService.create(submitData);
        toast.success('Inspection created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving inspection:', error);
      const errorMsg = error.response?.data?.error || 'Failed to save inspection';
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
        <div className="bg-gradient-to-r from-secondary-600 to-accent-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {inspection ? 'Edit Inspection' : 'New Inspection'}
              </h2>
              <p className="text-sm text-white/80">
                {inspection ? 'Update inspection details' : 'Create a new vessel inspection'}
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
            {/* Vessel Selection */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-200">
                Vessel Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Vessel <span className="text-red-500">*</span>
                </label>
                <select
                  name="vessel_id"
                  value={formData.vessel_id}
                  onChange={handleChange}
                  required
                  disabled={loading || !!inspection}
                  className="input"
                >
                  <option value="">Select Vessel</option>
                  {vessels.map((vessel) => (
                    <option key={vessel.vessel_id} value={vessel.vessel_id}>
                      {vessel.tag_no} - {vessel.vessel_type} {vessel.description && `(${vessel.description})`}
                    </option>
                  ))}
                </select>
                {inspection && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Vessel cannot be changed after creation
                  </p>
                )}
              </div>
            </div>

            {/* Inspection Details */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-200">
                Inspection Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/*  DOSH Registration Number */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              DOSH Registration No.
            </label>
            <input
              type="text"
              name="dosh_registration"
              value={formData.dosh_registration}
              onChange={handleChange}
              placeholder="e.g., MK PMT 1001"
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Enter the DOSH registration number for this specific inspection
            </p>
          </div>

                {/* Inspection Type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Inspection Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="inspection_type"
                    value={formData.inspection_type}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="input"
                  >
                    {inspectionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="input"
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="input"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inspection Date */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Inspection Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="inspection_date"
                    value={formData.inspection_date}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="input"
                  />
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    disabled={loading}
                    className="input"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    disabled={loading}
                    min={formData.inspection_date}
                    className="input"
                  />
                </div>

                {/* Next Inspection Date */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Next Inspection Date
                  </label>
                  <input
                    type="date"
                    name="next_inspection_date"
                    value={formData.next_inspection_date}
                    onChange={handleChange}
                    disabled={loading}
                    min={formData.inspection_date}
                    className="input"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Recommended date for next inspection
                  </p>
                </div>
              </div>
            </div>

            {/* Findings and Remarks */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-200">
                Summary & Remarks
              </h3>
              <div className="space-y-4">
                {/* Findings Summary */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Overall Findings Summary
                  </label>
                  <textarea
                    name="findings_summary"
                    value={formData.findings_summary}
                    onChange={handleChange}
                    placeholder="Overall summary of inspection findings..."
                    rows="4"
                    disabled={loading}
                    className="input resize-none"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    High-level summary of all findings (detailed observations will be added separately)
                  </p>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    General Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Additional notes, weather conditions, special considerations..."
                    rows="4"
                    disabled={loading}
                    className="input resize-none"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    General notes about the inspection context
                  </p>
                </div>
              </div>
            </div>

            {/* Inspector Info */}
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">Inspector: {user?.name}</p>
                  <p className="text-xs text-neutral-600">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong> After creating this inspection, you can add detailed observations with photos, measurements, and specific recommendations.
              </p>
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
                  {inspection ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{inspection ? 'Update Inspection' : 'Create Inspection'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InspectionForm;