// src/pages/ai/AIAnalysisPage.jsx

import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Filter, TrendingUp, AlertCircle, FileText } from 'lucide-react';
import { inspectionService } from '../../services/inspectionService';
import { aiAnalysisService } from '../../services/aiAnalysisService';
import AIAnalysisBadge from '../../components/ai/AIAnalysisBadge';
import AIAnalysisResults from '../../components/ai/AIAnalysisResults';
import AIAnalysisButton from '../../components/ai/AIAnalysisButton';
import { toast } from 'react-hot-toast';

const AIAnalysisPage = () => {
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, analyzed, not_analyzed, has_report

  const user = JSON.parse(localStorage.getItem('user'));
  const canAnalyze = user?.role === 'admin' || user?.role === 'reviewer';

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const response = await inspectionService.getAll();
      let inspectionsList = response.data.inspections || [];

      console.log('📊 Total inspections fetched:', inspectionsList.length);

      // ✅ ADD: Log the first inspection to see its structure
    if (inspectionsList.length > 0) {
      console.log('📊 First inspection data:', inspectionsList[0]);
      console.log('📊 Report file URL field:', inspectionsList[0].report_file_url);
    }
      // Filter for inspectors (only their own inspections)
      if (user?.role === 'inspector') {
        inspectionsList = inspectionsList.filter(
          (inspection) => inspection.inspector_id === user.user_id
        );
        console.log('📊 Inspector inspections:', inspectionsList.length);
      }

      // ✅ CHANGED: Don't filter by report_file_url, show all inspections
      console.log('📊 Inspections with reports:', 
        inspectionsList.filter(i => i.report_file_url).length
      );

      setInspections(inspectionsList);

      // Fetch analyses for all inspections
      fetchAllAnalyses(inspectionsList);
    } catch (err) {
      console.error('❌ Error fetching inspections:', err);
      toast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAnalyses = async (inspectionsList) => {
    const analysisMap = {};

    for (const inspection of inspectionsList) {
      try {
        const response = await aiAnalysisService.getAnalysis(inspection.inspection_id);
        analysisMap[inspection.inspection_id] = response.data.analysis;
      } catch (err) {
        // Analysis doesn't exist yet
        analysisMap[inspection.inspection_id] = null;
      }
    }

    setAnalyses(analysisMap);
  };

  const handleAnalysisComplete = (inspectionId, newAnalysis) => {
    setAnalyses((prev) => ({
      ...prev,
      [inspectionId]: newAnalysis,
    }));

    // Refresh the selected inspection's analysis
    if (selectedInspection?.inspection_id === inspectionId) {
      setSelectedInspection({ ...selectedInspection });
    }
  };

  // Filter and search
  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      inspection.report_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.vessel_tag_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const hasAnalysis = analyses[inspection.inspection_id] !== null;
    const hasReport = Boolean(inspection.report_file_url);

    let matchesFilter = true;
    
    if (filterStatus === 'analyzed') {
      matchesFilter = hasAnalysis;
    } else if (filterStatus === 'not_analyzed') {
      matchesFilter = !hasAnalysis && hasReport;
    } else if (filterStatus === 'has_report') {
      matchesFilter = hasReport;
    }

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const totalInspections = inspections.length;
  const withReports = inspections.filter(i => i.report_file_url).length;
  const analyzedCount = Object.values(analyses).filter((a) => a !== null).length;
  const notAnalyzedCount = withReports - analyzedCount;

  const averageScore =
    analyzedCount > 0
      ? Object.values(analyses)
          .filter((a) => a !== null)
          .reduce((sum, a) => sum + a.overall_score, 0) / analyzedCount
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-3xl font-bold">AI Quality Analysis</h1>
          </div>
          <p className="text-purple-100">
            Automated report quality assessment powered by AI
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 -mt-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900">{withReports}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalInspections} total inspections
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Analyzed</p>
                <p className="text-3xl font-bold text-green-600">{analyzedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Not Analyzed</p>
                <p className="text-3xl font-bold text-orange-600">{notAnalyzedCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Score</p>
                <p className="text-3xl font-bold text-purple-600">
                  {averageScore.toFixed(0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Inspection List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              {/* Search and Filter */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      filterStatus === 'all'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All ({totalInspections})
                  </button>
                  <button
                    onClick={() => setFilterStatus('has_report')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      filterStatus === 'has_report'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Reports ({withReports})
                  </button>
                  <button
                    onClick={() => setFilterStatus('analyzed')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      filterStatus === 'analyzed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Analyzed ({analyzedCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus('not_analyzed')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      filterStatus === 'not_analyzed'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Pending ({notAnalyzedCount})
                  </button>
                </div>
              </div>

              {/* Inspection List */}
              <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
                {filteredInspections.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium">No {filterStatus !== 'all' ? filterStatus.replace('_', ' ') : ''} reports found</p>
                    <p className="text-sm mt-1">
                      {totalInspections === 0 
                        ? 'Create some inspections first' 
                        : withReports === 0
                        ? 'Generate reports for your inspections'
                        : 'Try adjusting your filters'}
                    </p>
                  </div>
                ) : (
                  filteredInspections.map((inspection) => {
                    const analysis = analyses[inspection.inspection_id];
                    const hasReport = Boolean(inspection.report_file_url);
                    const isSelected =
                      selectedInspection?.inspection_id === inspection.inspection_id;

                    return (
                      <div
                        key={inspection.inspection_id}
                        onClick={() => setSelectedInspection(inspection)}
                        className={`p-4 border-b border-gray-200 cursor-pointer transition ${
                          isSelected
                            ? 'bg-purple-50 border-l-4 border-l-purple-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {inspection.report_number || `Inspection #${inspection.inspection_id}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {inspection.vessel_tag_no || 'Unknown Vessel'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(inspection.inspection_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-2 flex flex-col gap-1 items-end">
                            {!hasReport && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                No Report
                              </span>
                            )}
                            {hasReport && analysis && (
                              <AIAnalysisBadge
                                grade={analysis.grade}
                                score={analysis.overall_score}
                                size="sm"
                              />
                            )}
                            {hasReport && !analysis && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                Not Analyzed
                              </span>
                            )}
                          </div>
                        </div>

                        {canAnalyze && hasReport && !analysis && (
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <AIAnalysisButton
                              inspectionId={inspection.inspection_id}
                              onAnalysisComplete={(newAnalysis) =>
                                handleAnalysisComplete(inspection.inspection_id, newAnalysis)
                              }
                              disabled={false}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Analysis Details */}
          <div className="lg:col-span-2">
            {selectedInspection ? (
              selectedInspection.report_file_url ? (
                <AIAnalysisResults
                  inspectionId={selectedInspection.inspection_id}
                  userRole={user?.role}
                  canAnalyze={canAnalyze}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No Report Generated
                  </h3>
                  <p className="text-gray-600 mb-4">
                    This inspection doesn't have a report yet.
                  </p>
                  <p className="text-sm text-gray-500">
                    Generate a report first before analyzing with AI.
                  </p>
                </div>
              )
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Select a Report
                </h3>
                <p className="text-gray-600">
                  Choose a report from the list to view its AI quality analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPage;