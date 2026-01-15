// backend/src/utils/reportHelper.js


/**
 * Generate report number based on plant, vessel tag and current date
 * Format: PLANT {identifier}/VI/{tag_no}/TA{year}
 * Example: PLANT 1/VI/V-002/TA2025
 * 
 * @param {string} plantIdentifier - Plant number or identifier (e.g., '1', '2', 'A')
 * @param {string} vesselTag - Vessel tag number (e.g., 'V-002', 'HX-301')
 * @returns {string} Formatted report number
 */
function generateReportNumber(plantIdentifier, vesselTag) {
  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Clean up plant identifier (remove extra spaces)
    const plant = plantIdentifier ? plantIdentifier.trim() : '1';
    
    // Clean up vessel tag (remove extra spaces)
    const tag = vesselTag ? vesselTag.trim() : 'V-001';
    
    // Format: PLANT{identifier}/VI/{tag_no}/TA{year}
    return `PLANT${plant}/VI/${tag}/TA${currentYear}`;
  } catch (err) {
    console.error('Error generating report number:', err);
    // Fallback to default format
    const currentYear = new Date().getFullYear();
    return `PLANT 1/VI/V-001/TA${currentYear}`;
  }
}


/**
 * Format date for report display
 */
const formatReportDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

/**
 * Parse observation description into individual findings
 * Each finding is numbered like "1.1", "1.2", etc.
 */
const parseFindings = (observation) => {
  const findings = [];
  const description = observation.description || '';
  const recommendation = observation.recommendation || '';
  
  // Split by finding numbers (1.1, 1.2, 2.1, etc.)
  const findingPattern = /(\d+\.\d+)\s+([^\n]+(?:\n(?!\d+\.\d+)[^\n]+)*)/g;
  
  let match;
  while ((match = findingPattern.exec(description)) !== null) {
    const findingNumber = match[1]; // e.g., "1.1"
    const findingDesc = match[2].trim();
    
    // Determine section based on keywords
    const section = detectSection(findingDesc);
    
    // Find matching recommendation
    const recPattern = new RegExp(`${findingNumber.replace('.', '\\.')}\\s+([^\\n]+(?:\\n(?!\\d+\\.\\d+)[^\\n]+)*)`, 'g');
    const recMatch = recPattern.exec(recommendation);
    const findingRec = recMatch ? recMatch[1].trim() : '';
    
    findings.push({
      finding_number: findingNumber,
      section: section,
      description: findingDesc,
      recommendation: findingRec,
      severity: observation.severity
    });
  }
  
  // If no findings found (no numbering), treat entire observation as one finding
  if (findings.length === 0) {
    findings.push({
      finding_number: observation.finding_number || '',
      section: detectSection(description),
      description: description,
      recommendation: recommendation,
      severity: observation.severity
    });
  }
  
  return findings;
};

/**
 * Detect if finding is External or Internal based on keywords
 */
const detectSection = (text) => {
  const lowerText = text.toLowerCase();
  
  const externalKeywords = [
    'external', 'exterior', 'shell surface', 'outer', 'outside',
    'shell', 'coating', 'paint', 'insulation'
  ];
  
  const internalKeywords = [
    'internal', 'interior', 'inner', 'inside', 'through-wall',
    'manhole', 'nozzle', 'dish head', 'bottom', 'weld seam'
  ];
  
  const hasExternal = externalKeywords.some(keyword => lowerText.includes(keyword));
  const hasInternal = internalKeywords.some(keyword => lowerText.includes(keyword));
  
  // If explicitly mentions external and not internal, mark as external
  if (hasExternal && !hasInternal) {
    return 'External';
  }
  
  // Default to internal
  return 'Internal';
};

/**
 * Group observations by section (External/Internal)
 */
const groupObservationsBySection = (observations) => {
  const external = [];
  const internal = [];

  observations.forEach(obs => {
    // Parse observation into individual findings
    const findings = parseFindings(obs);
    
    findings.forEach(finding => {
      // Create a finding object with observation data
      const findingData = {
        ...obs,
        finding_number: finding.finding_number,
        description: finding.description,
        recommendation: finding.recommendation,
        section: finding.section,
        severity: finding.severity
      };
      
      if (finding.section === 'External') {
        external.push(findingData);
      } else {
        internal.push(findingData);
      }
    });
  });

  return { external, internal };
};

/**
 * Generate recommendations text from observations
 */
const generateRecommendations = (observations) => {
  if (!observations || observations.length === 0) {
    return 'No recommendations at this time.';
  }

  const recommendations = [];
  
  observations.forEach(obs => {
    // Parse findings to get individual recommendations
    const findings = parseFindings(obs);
    
    findings.forEach(finding => {
      if (finding.recommendation && finding.recommendation.trim()) {
        recommendations.push(`${finding.finding_number} ${finding.recommendation}`);
      }
    });
  });

  return recommendations.length > 0 
    ? recommendations.join('\n\n')
    : 'No specific recommendations at this time.';
};

/**
 * Get NDT summary from inspection data
 */
const getNDTSummary = (inspection) => {
  // Check if inspection has NDT data
  if (inspection.ndt_results) {
    return inspection.ndt_results;
  }

  // Default NDT summary
  return 'UTTM: No significant wall loss detected compared to nominal thickness upon testing. Please refer UTTM report for complete documentation.';
};



module.exports = {
  generateReportNumber,
  formatReportDate,
  parseFindings,
  detectSection,
  groupObservationsBySection,
  generateRecommendations,
  getNDTSummary
};