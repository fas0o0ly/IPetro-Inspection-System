// src/components/observations/ObservationForm.jsx
import { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, Loader, AlertCircle } from 'lucide-react';
import { observationService } from '../../services/observationService';
import { findingTemplateService } from '../../services/findingTemplateService';
import { recommendationTemplateService } from '../../services/recommendationTemplateService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ObservationForm = ({ isOpen, onClose, observation = null, inspectionId, vesselId, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // Template data
  const [findingTemplates, setFindingTemplates] = useState([]);
  const [recommendationTemplates, setRecommendationTemplates] = useState([]);
  const [observationTypes, setObservationTypes] = useState([]);
  const [severities, setSeverities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [actionOptions, setActionOptions] = useState([]);
  const [priorities, setPriorities] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    inspection_id: inspectionId || '',
    vessel_id: vesselId || '',
    finding_number: '',
    component: '',
    location: '',
    observation_type: 'General Wear',
    severity: 'Minor',
    status: 'Open',
    action_required: 'No Action',
    priority: 'Low',
    section: 'Internal',
    findings: [{ text: '', isCustom: false }],
    recommendations: [{ text: '', isCustom: false }]
  });

  // Fetch all dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingTemplates(true);
        
        // Fetch templates
        const [findingRes, recRes] = await Promise.all([
          findingTemplateService.getAll(),
          recommendationTemplateService.getAll()
        ]);

        setFindingTemplates(findingRes.data.templates || []);
        setRecommendationTemplates(recRes.data.templates || []);

        // Fetch dropdown options
        const typesRes = await observationService.getTypes();
        const severitiesRes = await observationService.getSeverities();
        const statusesRes = await observationService.getStatuses();
        const actionsRes = await observationService.getActionRequired();
        const prioritiesRes = await observationService.getPriorities();

        setObservationTypes(typesRes.data.types || []);
        setSeverities(severitiesRes.data.severities || []);
        setStatuses(statusesRes.data.statuses || []);
        setActionOptions(actionsRes.data.actions || []);
        setPriorities(prioritiesRes.data.priorities || []);

      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoadingTemplates(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (observation) {
      // Parse existing description into findings array
      const existingFindings = observation.description 
        ? observation.description.split('\n\n').map(text => ({ text: text.trim(), isCustom: true }))
        : [{ text: '', isCustom: false }];

      // Parse existing recommendation into recommendations array
      const existingRecommendations = observation.recommendation
        ? observation.recommendation.split('\n\n').map(text => ({ text: text.trim(), isCustom: true }))
        : [{ text: '', isCustom: false }];

      setFormData({
        inspection_id: observation.inspection_id || inspectionId || '',
        vessel_id: observation.vessel_id || vesselId || '',
        finding_number: observation.finding_number || '',
        component: observation.component || '',
        location: observation.location || '',
        observation_type: observation.observation_type || 'General Wear',
        severity: observation.severity || 'Minor',
        status: observation.status || 'Open',
        action_required: observation.action_required || 'No Action',
        priority: observation.priority || 'Low',
        findings: existingFindings,
        recommendations: existingRecommendations
      });
    } else {
      // Reset for new observation
      setFormData({
        inspection_id: inspectionId || '',
        vessel_id: vesselId || '',
        finding_number: '',
        component: '',
        location: '',
        observation_type: 'General Wear',
        severity: 'Minor',
        status: 'Open',
        action_required: 'No Action',
        priority: 'Low',
        findings: [{ text: '', isCustom: false }],
        recommendations: [{ text: '', isCustom: false }]
      });
    }
  }, [observation, inspectionId, vesselId, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new finding
  const addFinding = () => {
    setFormData(prev => ({
      ...prev,
      findings: [...prev.findings, { text: '', isCustom: false }]
    }));
  };

  // Remove finding
  const removeFinding = (index) => {
    setFormData(prev => ({
      ...prev,
      findings: prev.findings.filter((_, i) => i !== index)
    }));
  };

  // Update finding
  const updateFinding = (index, value, isTemplate = false) => {
    setFormData(prev => {
      const newFindings = [...prev.findings];
      newFindings[index] = { 
        text: value, 
        isCustom: !isTemplate 
      };
      return { ...prev, findings: newFindings };
    });
  };

  // Add new recommendation
  const addRecommendation = () => {
    setFormData(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, { text: '', isCustom: false }]
    }));
  };

  // Remove recommendation
  const removeRecommendation = (index) => {
    setFormData(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  // Update recommendation
  const updateRecommendation = (index, value, isTemplate = false) => {
    setFormData(prev => {
      const newRecommendations = [...prev.recommendations];
      newRecommendations[index] = { 
        text: value, 
        isCustom: !isTemplate 
      };
      return { ...prev, recommendations: newRecommendations };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate findings
    const validFindings = formData.findings.filter(f => f.text.trim());
    if (validFindings.length === 0) {
      toast.error('Please add at least one finding');
      setLoading(false);
      return;
    }

    // Combine findings into description
    const description = validFindings.map((f, i) => 
      `${formData.finding_number}.${i + 1} ${f.text}`
    ).join('\n\n');

    // Combine recommendations
    const validRecommendations = formData.recommendations.filter(r => r.text.trim());
    const recommendation = validRecommendations.map((r, i) => 
      `${formData.finding_number}.${i + 1} ${r.text}`
    ).join('\n\n');

    const submitData = {
      inspection_id: formData.inspection_id,
      vessel_id: formData.vessel_id,
      finding_number: formData.finding_number,
      component: formData.component,
      location: formData.location,
      observation_type: formData.observation_type,
      severity: formData.severity,
      status: formData.status,
      action_required: formData.action_required,
      priority: formData.priority,
      description,
      recommendation: recommendation || null
    };

    try {
      if (observation) {
        await observationService.update(observation.observation_id, submitData);
        toast.success('Observation updated successfully');
      } else {
        await observationService.create(submitData);
        toast.success('Observation created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving observation:', error);
      const errorMsg = error.response?.data?.error || 'Failed to save observation';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter templates based on observation type and severity
  const filteredFindingTemplates = findingTemplates.filter(
    t => t.observation_type === formData.observation_type
  );

  const filteredRecommendationTemplates = recommendationTemplates.filter(
    t => t.action_required === formData.action_required
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-600 to-primary-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {observation ? 'Edit Observation' : 'New Observation'}
              </h2>
              <p className="text-sm text-white/80">
                {observation ? 'Update observation details' : 'Create a new inspection observation'}
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
          {loadingTemplates ? (
            <div className="py-12 text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
              <p className="text-neutral-600">Loading templates...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 pb-2 border-b border-neutral-200">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Finding Number */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Finding Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="finding_number"
                      value={formData.finding_number}
                      onChange={handleChange}
                      placeholder="e.g., 1, 2.1, 3.2"
                      required
                      disabled={loading}
                      className="input"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Reference number from inspection (e.g., 2.1, 2.2)
                    </p>
                  </div>

                  {/* Component */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Component <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="component"
                      value={formData.component}
                      onChange={handleChange}
                      placeholder="e.g., Manhole, Shell, Nozzle"
                      required
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
                      placeholder="e.g., 4 o'clock position, Top head"
                      disabled={loading}
                      className="input"
                    />
                  </div>

                  {/* Observation Type */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Observation Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="observation_type"
                      value={formData.observation_type}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="input"
                    >
                      {observationTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Severity <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="severity"
                      value={formData.severity}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="input"
                    >
                      {severities.map((severity) => (
                        <option key={severity} value={severity}>
                          {severity}
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
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Required */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Action Required <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="action_required"
                      value={formData.action_required}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="input"
                    >
                      {actionOptions.map((action) => (
                        <option key={action} value={action}>
                          {action}
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
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Findings Section */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Findings <span className="text-red-500">*</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addFinding}
                    disabled={loading}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Finding
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.findings.map((finding, index) => (
                    <div key={index} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                      <div className="flex items-start justify-between mb-3">
                        <label className="text-sm font-medium text-neutral-700">
                          Finding {formData.finding_number}.{index + 1}
                        </label>
                        {formData.findings.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFinding(index)}
                            disabled={loading}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Template Selector */}
                      {filteredFindingTemplates.length > 0 && (
                        <div className="mb-3">
                          <label className="text-xs text-neutral-600 mb-1 block">
                            Use Template (or write custom below)
                          </label>
                          <select
                            value=""
                            onChange={(e) => updateFinding(index, e.target.value, true)}
                            disabled={loading}
                            className="input text-sm"
                          >
                            <option value="">-- Select Template --</option>
                            {filteredFindingTemplates.map((template) => (
                              <option key={template.template_id} value={template.template_text}>
                                {template.template_text.substring(0, 80)}...
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Custom Text */}
                      <textarea
                        value={finding.text}
                        onChange={(e) => updateFinding(index, e.target.value)}
                        placeholder="Enter finding description or select from template above..."
                        rows="3"
                        disabled={loading}
                        className="input resize-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations Section */}
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Recommendations
                  </h3>
                  <button
                    type="button"
                    onClick={addRecommendation}
                    disabled={loading}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Recommendation
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.recommendations.map((recommendation, index) => (
                    <div key={index} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                      <div className="flex items-start justify-between mb-3">
                        <label className="text-sm font-medium text-neutral-700">
                          Recommendation {formData.finding_number}.{index + 1}
                        </label>
                        {formData.recommendations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecommendation(index)}
                            disabled={loading}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Template Selector */}
                      {filteredRecommendationTemplates.length > 0 && (
                        <div className="mb-3">
                          <label className="text-xs text-neutral-600 mb-1 block">
                            Use Template (or write custom below)
                          </label>
                          <select
                            value=""
                            onChange={(e) => updateRecommendation(index, e.target.value, true)}
                            disabled={loading}
                            className="input text-sm"
                          >
                            <option value="">-- Select Template --</option>
                            {filteredRecommendationTemplates.map((template) => (
                              <option key={template.template_id} value={template.template_text}>
                                {template.template_text}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Custom Text */}
                      <textarea
                        value={recommendation.text}
                        onChange={(e) => updateRecommendation(index, e.target.value)}
                        placeholder="Enter recommendation or select from template above..."
                        rows="2"
                        disabled={loading}
                        className="input resize-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Photo Linking</p>
                  <p>After creating this observation, you'll be able to upload and link photos to it.</p>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || loadingTemplates}
              className="btn-primary px-6 py-2.5 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {observation ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{observation ? 'Update Observation' : 'Create Observation'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ObservationForm;