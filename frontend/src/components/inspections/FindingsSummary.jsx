import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import api from '../../services/api';

// Pre-defined options
const POST_INSPECTION_OPTIONS = [
  'All internal attachment and internal nozzles were found securely intact with no visible defect.',
  'Nozzles N-2 and N-15 flange included its gasket seat area found in satisfactory condition.',
  'H-1 and M-1 flange and cover noted with no sign of anomaly. Gasket seat area was found free any significant damage.',
  'Internal top dish head surface noted with discoloration.'
];

const EXTERNAL_OPTIONS = [
  'In general, equipment was found fully coated. All associate parts was noted on its position and in satisfactory condition.',
  'Nameplate, equipment number and PMT number were found securely intact in its place and legible.',
  'Concrete foundation, anchor bolts and support legs were observed in satisfactory condition with no sign of abnormalities.',
  'View of bottom and top dish head was found in satisfactory condition. No sign of abnormalities observed.',
  'View of shell externally observed in satisfactory condition with no sign of abnormalities or permanent physical appearance found. External coating noted intact properly on equipment surface.',
  'All attachment nozzles, pressure gauge and lifting lug were observed in serviceable condition. No sign of anomaly seen.',
  'Generally, equipment was found fully painted. All associate parts noted securely intact in its position.',
  'Nameplate, PMT number and equipment number were found secured in its place and legible.',
  'Concrete foundation, support legs and anchor bolts observed in satisfactory condition with no sign of abnormalities.',
  'Bottom and top dish head noted in satisfactory condition. No significant abnormalities observed.',
  'Equipment shell externally noted in satisfactory condition with external coating noted intact properly on all equipment surfaces.',
  'Davit arm, man hole and its cover were noted in serviceable condition with no evidence of significant damage.',
  'All attachment nozzles, pressure gauge and lifting lug observed in satisfactory condition. No sign of anomaly seen.'
];

const INTERNAL_OPTIONS = [
  'Internal of manhole cover noted with evidence of mechanical mark on gasket seat area at 4 o\'clock position. Result is acceptable as per ASME PCC1, Table D-2M.',
  'Manhole flange was found in serviceable condition except for evidence of dented on gasket seat area at position 1 o\'clock with approx. 3mm of maximum of radial projection.',
  'Manhole weldment was found in serviceable condition except for evidence of pitting at 3 o\'clock position.',
  'Internal view of bottom and top dish head was observed in satisfactory condition with no sign of abnormalities.',
  'View of bottom internal shell wall observed in good profile with no sign of relevant defect except for two locations with presence of mechanical mark and pitting on CW4.',
  'Manhole cover noted with evidence of scratch mark on gasket seat area at 7 o\'clock position.',
  'Manhole flange was found in serviceable condition except for evidence of mechanical mark on gasket seat area at position 1 o\'clock with approx. 3mm of maximum of radial projection. No further defect propagation compared to previous report.',
  'Evidence of mechanical mark with length approx. 40mm and < 0.5mm depth on 6 o\'clock and mechanical mark with length approx. 5mm and < 0.5mm depth on 12 o\'clock section of manhole neck.',
  'Top and bottom dish head observed in satisfactory condition with no sign of deterioration (as seen via bottom head).',
  'Bottom internal shell wall observed in satisfactory with no sign of anomaly. All internal circumferential seam and longitudinal seam observed in good profile with no sign of relevant defect except for two locations of cluster porosity noted at CW1 and LW1B. DPT was performed and found acceptable previously. No further defect propagation compared to previous report.',
  'Middle internal shell wall observed in satisfactory with no sign of anomaly (where seen and accessible).',
  'All attachment nozzles internally observed in serviceable condition. No sign of anomaly observed.'
];

const MultiSelectDropdown = ({ options, selectedItems, onChange, placeholder, label, numberPrefix, onAddCustom }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (option) => {
    const index = selectedItems.findIndex(item => item.text === option);
    if (index > -1) {
      onChange(selectedItems.filter((_, i) => i !== index));
    } else {
      onChange([...selectedItems, { text: option }]);
    }
  };

  const isSelected = (option) => {
    return selectedItems.some(item => item.text === option);
  };

  const handleAddCustom = () => {
    if (customText.trim()) {
      onChange([...selectedItems, { text: customText.trim() }]);
      setCustomText('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      
      {/* Display selected items */}
      {selectedItems.length > 0 && (
        <div className="mb-3 space-y-2">
          {selectedItems.map((item, index) => (
            <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded border border-blue-200">
              <span className="text-sm font-medium text-blue-600 mt-0.5">
                {numberPrefix}.{index + 1}
              </span>
              <p className="flex-1 text-sm text-gray-700">{item.text}</p>
              <button
                type="button"
                onClick={() => onChange(selectedItems.filter((_, i) => i !== index))}
                className="text-red-600 hover:text-red-800 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Custom text input */}
      {showCustomInput && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-300">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Custom Finding
          </label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter custom finding text..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            rows="3"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleAddCustom}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                setCustomText('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Buttons row */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 px-4 py-2 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
        >
          <span className="text-sm text-gray-700">
            {placeholder}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>
        
        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
        >
          Custom Text
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search options..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <label
                  key={index}
                  className="flex items-start px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={isSelected(option)}
                    onChange={() => toggleOption(option)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 flex-1">{option}</span>
                </label>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options found
              </div>
            )}
          </div>

          {/* Close button */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FindingsSummary = ({ inspectionId, vesselId, vesselTag }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    initial_inspection: 'Not applicable',
    post_inspection: '',
    external_findings: [],
    internal_findings: [],
    ndt_testings: '',
    recommendations: [{ text: 'To be monitored on next opportunity.' }]
  });

  useEffect(() => {
    loadFindingsSummary();
  }, [inspectionId]);

  const loadFindingsSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/findings-summary/inspection/${inspectionId}`);
      
      if (response.data.success && response.data.data.findingsSummary) {
        const summary = response.data.data.findingsSummary;
        setFormData({
          initial_inspection: summary.initial_inspection || 'Not applicable',
          post_inspection: summary.post_inspection || '',
          external_findings: summary.external_findings || [],
          internal_findings: summary.internal_findings || [],
          ndt_testings: summary.ndt_testings || '',
          recommendations: summary.recommendations || [{ text: 'To be monitored on next opportunity.' }]
        });
      } else {
        loadDefaultNDT();
      }
    } catch (err) {
      if (err.response?.status === 404) {
        loadDefaultNDT();
      } else {
        setError('Failed to load findings summary');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultNDT = async () => {
    try {
      const response = await api.get(`/findings-summary/default-ndt/${vesselId}`);
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          ndt_testings: response.data.data.defaultNDT
        }));
      }
    } catch (err) {
      console.error('Failed to load default NDT:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await api.post(`/findings-summary/inspection/${inspectionId}`, formData);
      
      setSuccess('Findings summary saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save findings summary');
    } finally {
      setSaving(false);
    }
  };

  const addRecommendation = () => {
    setFormData(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, { text: '' }]
    }));
  };

  const updateRecommendation = (index, value) => {
    setFormData(prev => ({
      ...prev,
      recommendations: prev.recommendations.map((item, i) =>
        i === index ? { ...item, text: value } : item
      )
    }));
  };

  const removeRecommendation = (index) => {
    setFormData(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Initial/Pre-Inspection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Initial/Pre-Inspection
        </label>
        <textarea
          value={formData.initial_inspection}
          onChange={(e) => setFormData(prev => ({ ...prev, initial_inspection: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="2"
        />
      </div>

      {/* Post/Final Inspection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Post/Final Inspection
        </label>
        <textarea
          value={formData.post_inspection}
          onChange={(e) => setFormData(prev => ({ ...prev, post_inspection: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
          rows="3"
          placeholder="Enter custom post/final inspection text or select from predefined options below"
        />
        
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Or select from common findings:</p>
          <div className="space-y-2">
            {POST_INSPECTION_OPTIONS.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  post_inspection: prev.post_inspection 
                    ? `${prev.post_inspection}\n${option}` 
                    : option 
                }))}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* External Findings - 1.x numbering with custom text */}
      <div className="bg-white rounded-lg shadow p-6">
        <MultiSelectDropdown
          options={EXTERNAL_OPTIONS}
          selectedItems={formData.external_findings}
          onChange={(items) => setFormData(prev => ({ ...prev, external_findings: items }))}
          placeholder="Select external findings from list"
          label="External"
          numberPrefix="1"
        />
      </div>

      {/* Internal Findings - 2.x numbering with custom text */}
      <div className="bg-white rounded-lg shadow p-6">
        <MultiSelectDropdown
          options={INTERNAL_OPTIONS}
          selectedItems={formData.internal_findings}
          onChange={(items) => setFormData(prev => ({ ...prev, internal_findings: items }))}
          placeholder="Select internal findings from list"
          label="Internal"
          numberPrefix="2"
        />
      </div>

      {/* Non-Destructive Testings */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Non-Destructive Testings
        </label>
        <textarea
          value={formData.ndt_testings}
          onChange={(e) => setFormData(prev => ({ ...prev, ndt_testings: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
        />
        <p className="mt-2 text-xs text-gray-500">
          Default text is based on vessel tag: {vesselTag}
        </p>
      </div>

      {/* Recommendations - Manual numbering */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium text-gray-700">
            Recommendations <span className="text-gray-500 text-xs">(Type your own numbering)</span>
          </label>
          <button
            type="button"
            onClick={addRecommendation}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <textarea
                value={rec.text}
                onChange={(e) => updateRecommendation(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows="2"
                placeholder="e.g., 1.1 Plan repair for next major turnaround"
              />
              <button
                type="button"
                onClick={() => removeRecommendation(index)}
                className="mt-2 p-1.5 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-0 bg-white py-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : 'Save Findings Summary'}
        </button>
      </div>
    </div>
  );
};

export default FindingsSummary;