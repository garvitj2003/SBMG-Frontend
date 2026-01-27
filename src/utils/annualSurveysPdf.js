import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const FONT_BASE = 10;
const FONT_TITLE = 16;
const FONT_SECTION = 12;
const MARGIN = 14;
const PAGE_HEIGHT = 297;
const FOOTER_SPACE = 20;

function addSection(doc, title, rows, startY) {
  let y = startY;
  if (y > PAGE_HEIGHT - 50) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFontSize(FONT_SECTION);
  doc.setTextColor(55, 65, 81);
  doc.setFont(undefined, 'bold');
  doc.text(title, MARGIN, y);
  y += 6;

  if (!rows || rows.length === 0) {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(FONT_BASE);
    doc.text('—', MARGIN + 4, y);
    return y + 8;
  }

  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: rows,
    theme: 'plain',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [249, 250, 251], textColor: [55, 65, 81], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: 'bold', textColor: [107, 114, 128] },
      1: { cellWidth: 'auto', textColor: [17, 24, 39] }
    },
    margin: { left: MARGIN },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.1
  });
  return doc.lastAutoTable.finalY + 10;
}

function addSurveyBlock(doc, data, startY) {
  let y = startY;

  // Survey header
  if (y > PAGE_HEIGHT - 40) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFontSize(FONT_SECTION);
  doc.setTextColor(16, 185, 129);
  doc.setFont(undefined, 'bold');
  doc.text(`Survey: ${data.gp_name || 'N/A'} — ${data.survey_date || 'N/A'}`, MARGIN, y);
  y += 10;
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);

  // Basic Information
  y = addSection(doc, 'Basic Information', [
    ['GP Name', data.gp_name || 'N/A'],
    ['Block Name', data.block_name || 'N/A'],
    ['District Name', data.district_name || 'N/A'],
    ['Sarpanch Name', data.sarpanch_name || 'N/A'],
    ['Sarpanch Contact', data.sarpanch_contact || 'N/A'],
    ['Number of Ward Panchs', String(data.num_ward_panchs ?? 0)]
  ], y);

  // VDO Details
  if (data.vdo) {
    y = addSection(doc, 'VDO Details', [
      ['Name', [data.vdo.first_name, data.vdo.middle_name, data.vdo.last_name].filter(Boolean).join(' ') || 'N/A'],
      ['Username', data.vdo.username || 'N/A'],
      ['Email', data.vdo.email || 'N/A'],
      ['Date of Joining', data.vdo.date_of_joining || 'N/A'],
      ['Role', data.vdo.role_name || 'N/A']
    ], y);
  }

  // Work Order
  if (data.work_order) {
    y = addSection(doc, 'Work Order', [
      ['Work Order No', data.work_order.work_order_no || 'N/A'],
      ['Date', data.work_order.work_order_date || 'N/A'],
      ['Amount', `₹${Number(data.work_order.work_order_amount || 0).toLocaleString()}`]
    ], y);
  }

  // Fund Sanctioned
  if (data.fund_sanctioned) {
    y = addSection(doc, 'Fund Sanctioned', [
      ['Head', data.fund_sanctioned.head || 'N/A'],
      ['Amount', `₹${Number(data.fund_sanctioned.amount || 0).toLocaleString()}`]
    ], y);
  }

  // Door to Door Collection
  if (data.door_to_door_collection) {
    y = addSection(doc, 'Door to Door Collection', [
      ['Number of Households', String(data.door_to_door_collection.num_households ?? 0)],
      ['Number of Shops', String(data.door_to_door_collection.num_shops ?? 0)],
      ['Collection Frequency', data.door_to_door_collection.collection_frequency || 'N/A']
    ], y);
  }

  // Road Sweeping
  if (data.road_sweeping) {
    y = addSection(doc, 'Road Sweeping', [
      ['Width', `${data.road_sweeping.width ?? 0} m`],
      ['Length', `${data.road_sweeping.length ?? 0} m`],
      ['Cleaning Frequency', data.road_sweeping.cleaning_frequency || 'N/A']
    ], y);
  }

  // Drain Cleaning
  if (data.drain_cleaning) {
    y = addSection(doc, 'Drain Cleaning', [
      ['Length', `${data.drain_cleaning.length ?? 0} m`],
      ['Cleaning Frequency', data.drain_cleaning.cleaning_frequency || 'N/A']
    ], y);
  }

  // CSC Details
  if (data.csc_details) {
    y = addSection(doc, 'CSC Details', [
      ['Numbers', String(data.csc_details.numbers ?? 0)],
      ['Cleaning Frequency', data.csc_details.cleaning_frequency || 'N/A']
    ], y);
  }

  // SWM Assets
  if (data.swm_assets) {
    y = addSection(doc, 'SWM Assets', [
      ['RRC', String(data.swm_assets.rrc ?? 0)],
      ['PWMU', String(data.swm_assets.pwmu ?? 0)],
      ['Compost Pit', String(data.swm_assets.compost_pit ?? 0)],
      ['Collection Vehicle', String(data.swm_assets.collection_vehicle ?? 0)]
    ], y);
  }

  // SBMG Targets
  if (data.sbmg_targets) {
    y = addSection(doc, 'SBMG Targets', [
      ['IHHL', String(data.sbmg_targets.ihhl ?? 0)],
      ['CSC', String(data.sbmg_targets.csc ?? 0)],
      ['RRC', String(data.sbmg_targets.rrc ?? 0)],
      ['PWMU', String(data.sbmg_targets.pwmu ?? 0)],
      ['Soak Pit', String(data.sbmg_targets.soak_pit ?? 0)],
      ['Magic Pit', String(data.sbmg_targets.magic_pit ?? 0)],
      ['Leach Pit', String(data.sbmg_targets.leach_pit ?? 0)],
      ['WSP', String(data.sbmg_targets.wsp ?? 0)],
      ['DEWATS', String(data.sbmg_targets.dewats ?? 0)]
    ], y);
  }

  return y;
}

/**
 * Generates a nicely formatted PDF from a list of annual survey objects and triggers download.
 * @param {Array} surveyList - Array of survey objects (from /annual-surveys/?district_id=...)
 * @param {string} reportTitle - e.g. "Annual Surveys - AJMER"
 * @param {string} filename - e.g. "annual-surveys-AJMER-district-1.pdf"
 */
export function generateAnnualSurveysPDF(surveyList, reportTitle, filename) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN;

  // Title
  doc.setFontSize(FONT_TITLE);
  doc.setTextColor(16, 185, 129);
  doc.setFont(undefined, 'bold');
  doc.text(reportTitle, MARGIN, y);
  y += 10;

  doc.setFontSize(FONT_BASE);
  doc.setTextColor(107, 114, 128);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, MARGIN, y);
  y += 6;
  doc.text(`Total surveys: ${surveyList.length}`, MARGIN, y);
  y += 14;

  if (surveyList.length === 0) {
    doc.setTextColor(17, 24, 39);
    doc.text('No survey data available for this selection.', MARGIN, y);
    doc.save(filename);
    return;
  }

  doc.setTextColor(0, 0, 0);

  for (let i = 0; i < surveyList.length; i++) {
    y = addSurveyBlock(doc, surveyList[i], y);
    // Extra spacing between surveys (except after the last)
    if (i < surveyList.length - 1) {
      y += 8;
      if (y > PAGE_HEIGHT - FOOTER_SPACE) {
        doc.addPage();
        y = MARGIN;
      }
    }
  }

  doc.save(filename);
}
