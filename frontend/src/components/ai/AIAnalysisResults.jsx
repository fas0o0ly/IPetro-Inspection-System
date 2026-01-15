// src/components/ai/AIAnalysisResults.jsx

import React, { useState, useEffect } from 'react';
import { Clock, User, Calendar } from 'lucide-react';
import { aiAnalysisService } from '../../services/aiAnalysisService';
import AIAnalysisBadge from './AIAnalysisBadge';
import AIAnalysisCard from './AIAnalysisCard';
import AIAnalysisButton from './AIAnalysisButton';

const AIAnalysisResults = ({ inspectionId, userRole, canAnalyze }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalysis();
  }, [inspectionId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await aiAnalysisService.getAnalysis(inspectionId);
      setAnalysis(response.data.analysis);
    } catch (err) {
      if (err.response?.status === 404) {
        setAnalysis(null);
      } else {
        setError('Failed to load AI analysis');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisComplete = (newAnalysis) => {
    setAnalysis(newAnalysis);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading AI analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                AI Quality Analysis
              </span>
            </h2>
            <p className="text-gray-600 mt-1">
              Automated report quality assessment and recommendations
            </p>
          </div>
          {canAnalyze && (
            <AIAnalysisButton
              inspectionId={inspectionId}
              onAnalysisComplete={handleAnalysisComplete}
              disabled={false}
            />
          )}
        </div>

        {analysis ? (
          <div className="space-y-4">
            {/* Score Display */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <AIAnalysisBadge
                grade={analysis.grade}
                score={analysis.overall_score}
                size="xl"
              />
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(analysis.analyzed_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {analysis.analyzed_by_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Analyzed by {analysis.analyzed_by_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No AI Analysis Available
                </h3>
                <p className="text-gray-600">
                  {canAnalyze
                    ? 'Click the button above to analyze this report with AI'
                    : 'This report has not been analyzed yet'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Analysis */}
      {analysis && <AIAnalysisCard analysis={analysis} />}
    </div>
  );
};

export default AIAnalysisResults;