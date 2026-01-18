// Tooltip texts for dashboard metrics
export const TOOLTIP_TEXTS = {
  // GP Master Data Metrics
  "COVERAGE_PERCENTAGE": "Shows what percentage of Gram Panchayats (GPs) have data available. Formula: (GPs with Data / Total GPs) × 100. Example: If 800 out of 1000 GPs have data, coverage = 80%.",
  "TOTAL_GP_MASTER_DATA": "Total count of Gram Panchayats that have master data records available in the system.",
  "VILLAGE_GP_DATA_COVERAGE": "Percentage of GPs with available master data. Formula: (GPs with Data / Total GPs) × 100",
  "TOTAL_FUNDS_SANCTIONED": "Total amount of funds sanctioned across all GPs for SBMG schemes and sanitation projects.",
  "TOTAL_WORK_ORDER_AMOUNT": "Total monetary value of all work orders issued for sanitation and waste management projects.",
  "SBMG_TARGET_ACHIEVEMENT_RATE": "Overall achievement rate for SBMG schemes. Formula: (Total Achievement / Total Target) × 100. Example: 8,500 achieved out of 10,000 = 85%.",
  "SCHEME_ACHIEVEMENT_PERCENTAGE": "Achievement percentage for individual SBMG schemes (IHHL, CSC, RRC, PWMU, Soak pit, Magic pit, Leach pit, WSP, DEWATS). Formula: (Scheme Achievement / Scheme Target) × 100",
  "FUND_UTILIZATION_RATE": "Percentage of sanctioned funds utilized through work orders. Formula: (Total Work Order Amount / Total Funds Sanctioned) × 100. Example: ₹75 Cr used out of ₹100 Cr = 75%.",
  "AVERAGE_COST_PER_HOUSEHOLD_D2D": "Average cost per household for door-to-door waste collection services. Formula: Total Work Order Amount / Total Households Covered. Example: ₹50,00,000 ÷ 10,000 = ₹500 per household.",
  "HOUSEHOLDS_COVERED_D2D": "Total number of households covered under door-to-door waste collection services.",
  "GPS_WITH_ASSET_GAPS": "Number of Gram Panchayats where asset gaps have been identified (missing or insufficient sanitation infrastructure).",
  "ACTIVE_SANITATION_BIDDERS": "Number of active bidders/contractors participating in sanitation and waste management tenders.",
  "AMOUNT_IN_CRORES_CONVERSION": "Converts monetary amounts from Rupees to Crores for better readability. Formula: Amount / 10,000,000. Example: ₹15 Cr = ₹150,000,000.",
  "TOTAL_SCHEME_TARGET": "Sum of all individual SBMG scheme targets (IHHL + CSC + RRC + PWMU + Soak pit + Magic pit + Leach pit + WSP + DEWATS).",
  "TOTAL_SCHEME_ACHIEVEMENT": "Sum of all individual SBMG scheme achievements across all schemes.",
  
  // District Wise Coverage Metrics
  "TOTAL_GPS": "At State/District level: Total count of Gram Panchayats (GPs). At Block level: Total count of Villages. This represents the complete number of geographical entities in the selected scope.",
  "GPS_WITH_DATA": "At State/District level: Number of GPs that have master data available. At Block level: Number of Villages that have master data available. This indicates how many entities have completed their master data entries.",
  
  // Inspection Metrics
  "INSPECTION_OVERALL_SCORE": "Overall inspection performance score (0-100%). Formula: (Total Points Earned / 180) × 100. Maximum Points = 180 (Household Waste: 50, Road: 10, Drain: 30, Community Sanitation: 40, Other: 50).",
  "INSPECTION_HOUSEHOLD_WASTE_SCORE": "Score for household waste management (out of 50 points). Covers: collection frequency (10), vehicle segregation (10), covered collection (10), disposal at RRC (10), functional vehicle (10). Formula: (Points Earned / 50) × 100",
  "INSPECTION_ROAD_CLEANING_SCORE": "Score for road cleaning frequency (out of 10 points). Weekly = 10, Fortnightly = 5, Monthly = 2, Other = 0. Formula: (Points Earned / 10) × 100",
  "INSPECTION_DRAIN_CLEANING_SCORE": "Score for drain cleaning and maintenance (out of 30 points). Covers: cleaning frequency (10), sludge disposal (10), no roadside waste (10). Formula: (Points Earned / 30) × 100",
  "INSPECTION_COMMUNITY_SANITATION_SCORE": "Score for community sanitation complex management (out of 40 points). Covers: CSC cleaning frequency (10), electricity & water (10), community usage (10), pink toilets cleaned (10). Formula: (Points Earned / 40) × 100",
  "INSPECTION_OTHER_SCORE": "Score for other inspection factors (out of 50 points). Covers: firm paid regularly (10), staff paid (10), safety equipment (10), village cleanliness (10), rate chart displayed (10). Formula: (Points Earned / 50) × 100",
  "INSPECTION_COVERAGE_PERCENTAGE": "Percentage of entities inspected. Formula: (Number of Inspected Entities / Total Entities) × 100. Example: 45 out of 60 inspected = 75% coverage. For individual village: Inspected = 100%, Not inspected = 0%.",
  "TOTAL_INSPECTIONS": "Total number of inspections conducted across all selected geographies.",
  "AVERAGE_INSPECTION_SCORE": "Average score across all inspections conducted, representing overall inspection quality.",
  "CRITICAL_ISSUES": "Number of critical sanitation or waste management issues identified during inspections that require immediate attention.",
  
  // Complaint Metrics
  "COMPLAINT_SCORE": "Performance score (0-100) for complaint management. Score1 (50 points max): Rewards faster resolution within 7-day SLA. Score2 (50 points max): Rewards higher resolution rate. Formula: Score1 + Score2. Example: 3.5 days avg resolution + 85% resolved = 67.5 total score.",
  "AVERAGE_RESOLUTION_TIME": "Average time taken to resolve complaints (in seconds, convertible to days). Lower time = faster handling. Formula: Average((Resolved_At - Created_At) in seconds). Example: 288,000 seconds = 3.33 days. If unresolved, uses current time as reference.",
  "TOTAL_COMPLAINTS": "Total number of complaints registered in the system.",
  "RESOLVED_COMPLAINTS": "Number of complaints that have been successfully resolved.",
  "PENDING_COMPLAINTS": "Number of complaints that are still pending or under review.",
  
  // Notice Metrics
  "TOTAL_NOTICES_SENT": "Total count of notices that have been sent by the current user/authority to other recipients. This includes all notices dispatched from your account.",
  "TOTAL_NOTICES_RECEIVED": "Total count of notices that have been received by the current user/authority from other senders. This includes all notices sent to your account.",
  
  // Additional common tooltips
  "AVERAGE_RATING": "Average rating given by users based on their feedback and experience with the app.",
  "TOTAL_RATINGS": "Total number of feedback ratings submitted by users (both authority users and public users).",
  "PERFORMANCE_TREND": "Shows the trend in performance metrics over time, indicating improvement or decline.",
  "DEFAULT": "Hover for more information about this metric."
};

// Get tooltip text by key, with fallback
export const getTooltipText = (key) => {
  return TOOLTIP_TEXTS[key] || TOOLTIP_TEXTS.DEFAULT;
};

