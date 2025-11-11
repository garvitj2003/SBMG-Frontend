// Tooltip texts for dashboard metrics
export const TOOLTIP_TEXTS = {
  "COVERAGE_PERCENTAGE": "Shows what percentage of Gram Panchayats (GPs) have data available. Example: If 800 out of 1000 GPs have data, coverage = 80%.",
  "SBMG_TARGET_ACHIEVEMENT_RATE": "Tells how much of the total SBMG target has been completed across all schemes. Example: 8,500 achieved out of 10,000 = 85% achieved.",
  "SCHEME_ACHIEVEMENT_PERCENTAGE": "Shows how much of each individual scheme's target is completed (like IHHL, CSC, etc.). Example: IHHL 4,200 achieved out of 5,000 = 84%.",
  "FUND_UTILIZATION_RATE": "Shows how much of the sanctioned money has actually been used in work orders. Example: ₹75 Cr used out of ₹100 Cr = 75% utilization.",
  "AVERAGE_COST_PER_HOUSEHOLD_D2D": "Average cost spent per household for door-to-door waste collection. Example: ₹50,00,000 spent for 10,000 houses = ₹500 per house.",
  "AMOUNT_IN_CRORES_CONVERSION": "Converts any rupee value into crores for easy display. Example: ₹1.5 Cr = 150,000,000 ÷ 10,000,000.",
  "COMPLAINT_SCORE": "Rates how well complaints are managed (0–100). Half the score is for fast resolution, and half for how many were resolved. Faster and more resolutions = higher score.",
  "INSPECTION_OVERALL_SCORE": "Shows the overall inspection performance out of 100%. Calculated from all inspection areas like waste, roads, drains, etc.",
  "INSPECTION_HOUSEHOLD_WASTE_SCORE": "Measures how well household waste is managed — like collection frequency, segregation, covered vehicles, and proper disposal. All good practices = 100%.",
  "INSPECTION_ROAD_CLEANING_SCORE": "Shows how often roads are cleaned. Weekly = best score (100%), monthly = lower score.",
  "INSPECTION_DRAIN_CLEANING_SCORE": "Checks how regularly drains are cleaned and whether waste is properly disposed of. Weekly cleaning and proper disposal = higher score.",
  "INSPECTION_COMMUNITY_SANITATION_SCORE": "Measures cleanliness and usability of public toilets (CSC). Daily cleaning, working utilities, and community use = high score.",
  "INSPECTION_OTHER_SCORE": "Shows other inspection factors like staff payment, equipment, and visible village cleanliness. More 'YES' answers = higher score.",
  "INSPECTION_COVERAGE_PERCENTAGE": "Shows what percentage of villages or GPs were inspected. Example: 45 out of 60 inspected = 75% coverage.",
  "AVERAGE_RESOLUTION_TIME": "Average time taken to resolve complaints. Lower time = faster complaint handling. Example: 3.3 days average resolution time.",
  "TOTAL_SCHEME_TARGET": "Total number of units planned (targets) across all SBMG schemes combined.",
  "TOTAL_SCHEME_ACHIEVEMENT": "Total number of completed units across all SBMG schemes combined.",
  
  // Additional common tooltips
  "AVERAGE_RATING": "Average rating given by users based on their feedback and experience with the app.",
  "TOTAL_RATINGS": "Total number of feedback ratings submitted by users (both authority users and public users).",
  "DEFAULT": "Hover for more information about this metric."
};

// Get tooltip text by key, with fallback
export const getTooltipText = (key) => {
  return TOOLTIP_TEXTS[key] || TOOLTIP_TEXTS.DEFAULT;
};

