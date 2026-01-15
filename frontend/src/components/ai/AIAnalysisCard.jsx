// src/components/ai/AIAnalysisCard.jsx

import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  AlertTriangle,
  FileText
} from 'lucide-react';

const AIAnalysisCard = ({ analysis }) => {
  if (!analysis) return null;

  const { breakdown, strengths, improvements, overall_comment, overall_score, grade } = analysis;

  const getCategoryColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getProgressColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall Comment */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Overall Assessment
            </h3>
            <p className="text-gray-700 leading-relaxed">{overall_comment}</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Category Breakdown
        </h3>
        <div className="space-y-4">
          {Object.entries(breakdown).map(([category, data]) => {
            const percentage = (data.score / data.max_score) * 100;
            return (
              <div key={category} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 capitalize">
                    {category.replace(/_/g, ' ')}
                  </span>
                  <span className={`font-bold px-3 py-1 rounded-full ${getCategoryColor(data.score, data.max_score)}`}>
                    {data.score}/{data.max_score}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(
                      data.score,
                      data.max_score
                    )}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                {/* Feedback */}
                <p className="text-sm text-gray-600 mt-2">{data.feedback}</p>

                {/* Criteria */}
                {data.met_criteria && data.met_criteria.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">
                      ✓ Met Criteria:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {data.met_criteria.map((criterion, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.missed_criteria && data.missed_criteria.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-red-700 mb-1">
                      ✗ Missed Criteria:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {data.missed_criteria.map((criterion, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">
              Areas for Improvement
            </h3>
          </div>
          <ul className="space-y-2">
            {improvements.map((improvement, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-orange-800">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisCard;