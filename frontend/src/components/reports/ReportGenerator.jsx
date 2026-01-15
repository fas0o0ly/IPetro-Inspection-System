// src/components/reports/ReportGenerator.jsx

import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Loader, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ReportGenerator = ({ inspection }) => {
  const { isAdmin } = useAuth();
  const [reportInfo, setReportInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchReportInfo();
  }, [inspection?.inspection_id]);

  const fetchReportInfo = async () => {
    if (!inspection?.inspection_id) return;

    try {
      setLoading(true);
      const response = await reportService.getInfo(inspection.inspection_id);
      setReportInfo(response.data);
    } catch (error) {
      console.error('Error fetching report info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await reportService.generate(inspection.inspection_id);
      toast.success('Report generated successfully!');
      
      // Refresh report info
      await fetchReportInfo();
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to generate report';
      toast.error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await reportService.download(inspection.inspection_id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Visual_Inspection_Report_${inspection.vessel_tag}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to download report';
      toast.error(errorMsg);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await reportService.delete(inspection.inspection_id);
      toast.success('Report deleted successfully');
      
      // Refresh report info
      await fetchReportInfo();
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete report';
      toast.error(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-neutral-600">Loading report info...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Inspection Report</h3>
            <p className="text-sm text-neutral-600">Generate and download PDF report</p>
          </div>
        </div>
      </div>

      {/* Report Status */}
      {reportInfo?.report_exists ? (
        <div className="space-y-4">
          {/* Report Info Card */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 mb-2">Report Generated</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Report Number:</span>
                    <span className="font-medium text-green-900">{reportInfo.report_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Generated:</span>
                    <span className="font-medium text-green-900">
                      {formatDateForDisplay(reportInfo.report_generated_at)}
                    </span>
                  </div>
                  {reportInfo.generated_by_name && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Generated By:</span>
                      <span className="font-medium text-green-900">{reportInfo.generated_by_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Report
            </button>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 px-4 py-2.5 bg-accent-600 text-white font-medium rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Regenerate
                </>
              )}
            </button>

            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Delete Report"
              >
                {deleting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                Regenerating the report will create a new version with the latest data. The previous report will be replaced.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* No Report Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">No Report Generated Yet</h4>
                <p className="text-sm text-amber-700">
                  Generate a PDF report for this inspection to document findings, observations, and recommendations.
                </p>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            {generating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>

          {/* What's Included */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h5 className="font-semibold text-neutral-900 mb-3">Report will include:</h5>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Vessel information and specifications
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                All observations and findings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Inspection photos with captions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Recommendations and NDT results
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Inspector and reviewer signatures
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;