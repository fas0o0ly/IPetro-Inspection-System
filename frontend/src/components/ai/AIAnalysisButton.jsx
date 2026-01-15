// src/components/ai/AIAnalysisButton.jsx

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiAnalysisService } from '../../services/aiAnalysisService';
import { toast } from 'react-hot-toast';

const AIAnalysisButton = ({ inspectionId, onAnalysisComplete, disabled }) => {
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      toast.loading('AI is analyzing the report...', { id: 'ai-analysis' });

      const response = await aiAnalysisService.analyzeReport(inspectionId);

      toast.success('Analysis completed successfully!', { id: 'ai-analysis' });

      if (onAnalysisComplete) {
        onAnalysisComplete(response.data.analysis);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const message = err.response?.data?.error || 'Failed to analyze report';
      toast.error(message, { id: 'ai-analysis' });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <button
      onClick={handleAnalyze}
      disabled={disabled || analyzing}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${
          disabled || analyzing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
        }`}
    >
      {analyzing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          <span>Analyze with AI</span>
        </>
      )}
    </button>
  );
};

export default AIAnalysisButton;