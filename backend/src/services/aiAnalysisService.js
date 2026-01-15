// backend/src/services/aiAnalysisService.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse'); //  CHANGED: Better variable name
const fs = require('fs').promises;
const fsSync = require('fs'); // ADDED: For sync operations
const path = require('path');
const { INSPECTION_REPORT_RUBRIC } = require('../config/analysisRubric');
//const logger = require('../utils/logger');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIAnalysisService {
  
  constructor() {
    // Use model from env or default to gemini-pro
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    console.log('🤖 Initializing Gemini model:', modelName);
    this.model = genAI.getGenerativeModel({ 
        model: modelName, 
        generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192, // ✅ INCREASED from 2048 to 8192
      }
    });
  }

  /**
   * Analyze inspection report
   */
  async analyzeReport(reportPath, reportData) {
    try {
      //logger.info('Starting AI report analysis with Gemini', { reportPath });

      // 1. Extract PDF text
      const pdfText = await this.extractPDFText(reportPath);

      // 2. Build analysis prompt
      const prompt = this.buildAnalysisPrompt(pdfText, reportData);

      // 3. Call Gemini API
      const analysis = await this.callGemini(prompt);

      // 4. Parse and structure results
      const results = this.parseAnalysisResults(analysis);

      //logger.success('AI analysis completed', { 
    //     score: results.overall_score 
    //   });

      return results;

    } catch (err) {
      //logger.error('AI analysis error:', err);
      throw err;
    }
  }

  /**
   * Extract text from PDF
   */
  async extractPDFText(pdfPath) {
    try {
      console.log('📄 Attempting to read PDF from:', pdfPath);
      
      // Check if file exists
      const exists = fsSync.existsSync(pdfPath);
      console.log('📄 File exists:', exists);
      
      if (!exists) {
        throw new Error('PDF file not found');
      }

      // Read PDF buffer
      const dataBuffer = await fs.readFile(pdfPath);
      console.log('📄 PDF buffer size:', dataBuffer.length, 'bytes');
      
      //  FIXED: Correct way to call pdf-parse
      const data = await pdfParse(dataBuffer);
      
      console.log('📄 PDF pages:', data.numpages);
      console.log('📄 Extracted text length:', data.text.length, 'characters');
      
      if (data.text.length < 100) {
        console.warn('⚠️ Warning: Very short text extracted. PDF might be image-based or corrupted.');
        console.log('📄 Full extracted text:', data.text);
      } else {
        console.log('📄 First 200 characters:', data.text.substring(0, 200));
      }
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text could be extracted from PDF. It might be an image-based PDF.');
      }
      
      return data.text;
      
    } catch (err) {
      console.error('❌ PDF extraction error details:', {
        message: err.message,
        code: err.code,
        path: pdfPath
      });
      //logger.error('PDF extraction error:', err);
      throw new Error(`Failed to extract PDF text: ${err.message}`);
    }
  }

  /**
   * Build analysis prompt for Gemini
   */
  buildAnalysisPrompt(pdfText, reportData) {
    const rubricText = JSON.stringify(INSPECTION_REPORT_RUBRIC, null, 2);

    return `You are an expert vessel inspection report reviewer. Analyze the following inspection report and provide a detailed quality assessment.

REPORT CONTENT:
${pdfText}

ADDITIONAL CONTEXT:
- Vessel Type: ${reportData.vessel_type || 'N/A'}
- Inspection Date: ${reportData.inspection_date || 'N/A'}
- Total Photos: ${reportData.photo_count || 0}
- Total Observations: ${reportData.observation_count || 0}

EVALUATION RUBRIC:
${rubricText}

INSTRUCTIONS:
1. Evaluate the report against each category in the rubric
2. Assign a score (0-max points) for each category based on the criteria
3. Provide specific, constructive feedback for each category
4. Identify 3-5 key strengths of the report
5. Identify 3-5 areas that need improvement
6. Provide an overall assessment comment
7. Calculate the total score and assign a grade

IMPORTANT: You must respond with ONLY valid JSON. Do not include any text before or after the JSON.

JSON FORMAT:
{
  "overall_score": <number between 0-100>,
  "grade": "<A/B/C/D/F>",
  "breakdown": {
    "completeness": {
      "score": <number>,
      "max_score": 25,
      "feedback": "<specific feedback on completeness>",
      "met_criteria": ["<criterion met>", "..."],
      "missed_criteria": ["<criterion missed>", "..."]
    },
    "technical_accuracy": {
      "score": <number>,
      "max_score": 30,
      "feedback": "<specific feedback>",
      "met_criteria": ["..."],
      "missed_criteria": ["..."]
    },
    "photo_documentation": {
      "score": <number>,
      "max_score": 20,
      "feedback": "<specific feedback>",
      "met_criteria": ["..."],
      "missed_criteria": ["..."]
    },
    "clarity": {
      "score": <number>,
      "max_score": 15,
      "feedback": "<specific feedback>",
      "met_criteria": ["..."],
      "missed_criteria": ["..."]
    },
    "actionability": {
      "score": <number>,
      "max_score": 10,
      "feedback": "<specific feedback>",
      "met_criteria": ["..."],
      "missed_criteria": ["..."]
    }
  },
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "improvements": [
    "<specific improvement 1>",
    "<specific improvement 2>",
    "<specific improvement 3>"
  ],
  "overall_comment": "<comprehensive assessment paragraph>"
}`;
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt) {
    try {
      console.log('🤖 Calling Gemini API...');
      console.log('🤖 Prompt length:', prompt.length, 'characters');
      
      // Generate content with Gemini
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Gemini API response received');
      console.log('📊 Response length:', text.length, 'characters');
      
      return text;

    } catch (err) {
      console.error('❌ Gemini API error:', err);
      //logger.error('Gemini API error:', err);
      
      if (err.message && err.message.includes('quota')) {
        throw new Error('AI service quota exceeded. Please try again later.');
      }
      
      if (err.message && err.message.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API configuration.');
      }
      
      throw new Error('AI service unavailable');
    }
  }

  /**
   * Parse analysis results from Gemini
   */
  parseAnalysisResults(rawResponse) {
    try {
      console.log('📝 Parsing AI response...');
      
      // Clean response (remove markdown code blocks if present)
      let cleanResponse = rawResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanResponse);
      
      // Validate structure
      if (!parsed.overall_score || !parsed.breakdown) {
        throw new Error('Invalid response structure');
      }

      // Ensure score is within range
      const score = Math.min(Math.max(parsed.overall_score, 0), 100);

      console.log('✅ AI analysis parsed successfully');
      console.log('📊 Overall score:', score);

      return {
        overall_score: score,
        grade: parsed.grade || this.calculateGrade(score),
        breakdown: parsed.breakdown,
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        overall_comment: parsed.overall_comment || '',
        analyzed_at: new Date().toISOString()
      };

    } catch (err) {
      console.error('❌ Failed to parse AI response:', err.message);
      console.error('📄 Raw response:', rawResponse);
      //logger.error('Failed to parse AI response:', err);
      throw new Error('Failed to parse AI analysis');
    }
  }

  /**
   * Calculate grade from score
   */
  calculateGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

module.exports = new AIAnalysisService();


