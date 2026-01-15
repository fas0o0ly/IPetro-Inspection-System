// backend/src/config/analysisRubric.js

const INSPECTION_REPORT_RUBRIC = {
  version: "1.0",
  total_points: 100,
  categories: [
    {
      id: "completeness",
      name: "Completeness",
      weight: 25,
      criteria: [
        "All required sections are present (vessel details, findings, observations)",
        "Equipment specifications documented",
        "All findings have descriptions",
        "Photos are linked to relevant observations",
        "Recommendations provided for critical/major findings"
      ]
    },
    {
      id: "technical_accuracy",
      name: "Technical Accuracy",
      weight: 30,
      criteria: [
        "Correct technical terminology used",
        "Severity levels appropriately assigned",
        "Measurements and data properly recorded",
        "Compliance references accurate",
        "NDT/inspection methods correctly documented"
      ]
    },
    {
      id: "photo_documentation",
      name: "Photo Documentation",
      weight: 20,
      criteria: [
        "Photos are clear and well-lit",
        "Relevant areas properly annotated",
        "Photos support the findings described",
        "Adequate photo coverage of equipment",
        "Photo tags/numbers properly referenced"
      ]
    },
    {
      id: "clarity",
      name: "Clarity & Organization",
      weight: 15,
      criteria: [
        "Findings clearly described",
        "Report follows logical structure",
        "No ambiguous statements",
        "Professional language used",
        "Proper formatting maintained"
      ]
    },
    {
      id: "actionability",
      name: "Actionability",
      weight: 10,
      criteria: [
        "Specific recommendations provided",
        "Priority levels clearly assigned",
        "Next inspection date specified",
        "Action items clearly stated",
        "Responsible parties identifiable"
      ]
    }
  ],
  grade_scale: {
    "A": { min: 90, label: "Excellent" },
    "B": { min: 80, label: "Good" },
    "C": { min: 70, label: "Satisfactory" },
    "D": { min: 60, label: "Needs Improvement" },
    "F": { min: 0, label: "Inadequate" }
  }
};

module.exports = { INSPECTION_REPORT_RUBRIC };