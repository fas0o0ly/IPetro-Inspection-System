// src/components/ai/AIAnalysisBadge.jsx

import React from 'react';

const AIAnalysisBadge = ({ grade, score, size = 'md' }) => {
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'D':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'F':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getGradeLabel = (grade) => {
    const labels = {
      A: 'Excellent',
      B: 'Good',
      C: 'Satisfactory',
      D: 'Needs Improvement',
      F: 'Inadequate',
    };
    return labels[grade] || 'Not Graded';
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-lg',
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center font-bold border-2 rounded-lg ${getGradeColor(
          grade
        )} ${sizeClasses[size]}`}
      >
        Grade {grade}
      </span>
      <span className="text-gray-600 font-medium">
        {score}/100 - {getGradeLabel(grade)}
      </span>
    </div>
  );
};

export default AIAnalysisBadge;