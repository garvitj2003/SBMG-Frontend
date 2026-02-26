import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight, List, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX, DollarSign, Target, TrendingUp, Database, BarChart3, ArrowUpDown, Calendar } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient, { annualSurveysAPI } from '../../../services/api';
import { useVDOLocation } from '../../../context/VDOLocationContext';
import NoDataFound from '../common/NoDataFound';
import { InfoTooltip } from '../../common/Tooltip';
import { generateAnnualSurveysPDF } from '../../../utils/annualSurveysPdf';
import EditGPMasterModal from '../EditGPMasterModal';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { HINDI_FONT } from '../../../utils/font';

const VDOVillageMasterContent = () => {
  // Refs to prevent duplicate API calls
  const hasFetchedInitialData = useRef(false);

  // VDO: Location context - fixed district, block, and GP
  const {
    vdoDistrictId,
    vdoDistrictName,
    vdoBlockId,
    vdoBlockName,
    vdoGPId,
    vdoGPName,
    loadingVDOData,
    getLocationPath,
  } = useVDOLocation();

  // VDO: Always works at villages level (no geo tabs)
  const activeScope = 'GPs';
  const selectedLocation = vdoGPName || 'Village';
  const selectedLocationId = vdoGPId;
  const selectedGPId = vdoGPId;
  const selectedDistrictId = vdoDistrictId;
  const selectedBlockId = vdoBlockId;
  const selectedDistrictForHierarchy = vdoDistrictId ? { id: vdoDistrictId, name: vdoDistrictName } : null;
  const selectedBlockForHierarchy = vdoBlockId ? { id: vdoBlockId, name: vdoBlockName } : null;
  const selectedGPForHierarchy = vdoGPId ? { id: vdoGPId, name: vdoGPName } : null;
  const dropdownLevel = 'villages';

  // No-op functions for VDO
  const setActiveScope = () => { };
  const setSelectedLocation = () => { };
  const setSelectedLocationId = () => { };
  const setSelectedGPId = () => { };
  const setDropdownLevel = () => { };
  const setSelectedGPForHierarchy = () => { };
  const setSelectedDistrictForHierarchy = () => { };
  const setSelectedBlockForHierarchy = () => { };
  const setSelectedDistrictId = () => { };
  const setSelectedBlockId = () => { };
  const contextUpdateLocationSelection = undefined;
  const contextTrackTabChange = undefined;
  const contextTrackDropdownChange = undefined;
  const contextGetCurrentLocationInfo = () => ({ vdoDistrictId, vdoBlockId, vdoGPId, vdoDistrictName, vdoBlockName, vdoGPName });

  // UI controls state
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);

  // Existing state
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePerformance, setActivePerformance] = useState('Time');


  // Year / FY state for master data (current and previous years)
  const [fyList, setFyList] = useState([]);
  const [selectedFyId, setSelectedFyId] = useState(null);
  const [loadingFy, setLoadingFy] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // GP Report: surveys for selected GP + FY, and edit modal
  const [gpSurveyList, setGpSurveyList] = useState([]);
  const [loadingGpSurvey, setLoadingGpSurvey] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSurveyId, setEditSurveyId] = useState(null);

  const scopeButtons = ['GPs']; // BDO can only view GPs
  const performanceButtons = ['Time', 'Location'];


  // Helper functions for location management
  const trackTabChange = useCallback((scope) => {
    console.log('Tab changed to:', scope);
    if (typeof contextTrackTabChange === 'function') {
      contextTrackTabChange(scope);
    }
  }, [contextTrackTabChange]);

  const trackDropdownChange = useCallback((location, locationId, districtId, blockId, gpId) => {
    console.log('Dropdown changed to:', location);
    if (typeof contextTrackDropdownChange === 'function') {
      contextTrackDropdownChange(location, locationId, districtId, blockId, gpId);
    }
  }, [contextTrackDropdownChange]);

  const updateLocationSelection = useCallback((scope, location, locationId, districtId, blockId, gpId, changeType) => {
    console.log('🔄 updateLocationSelection called:', { scope, location, locationId, districtId, blockId, gpId, changeType });
    if (typeof contextUpdateLocationSelection === 'function') {
      contextUpdateLocationSelection(scope, location, locationId, districtId, blockId, gpId, changeType);
    }
  }, [contextUpdateLocationSelection]);

  // Handler for downloading PDF with master data
  const handleDownloadPDF = useCallback(async (surveyId = 1) => {
    try {
      console.log('📥 Downloading PDF for survey ID:', surveyId);

      // Fetch annual survey data
      const response = await apiClient.get(`/annual-surveys/${surveyId}`);
      const surveyData = response.data;

      console.log('✅ Survey data fetched:', surveyData);

      // Generate PDF
      generatePDF(surveyData);

    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  }, []);

  // Function to generate PDF from survey data
  // Function to generate PDF from survey data
  const generatePDF = (data) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // --- Date Formatting Helper ---
    const formatDate = (dateStr) => {
      if (!dateStr || dateStr === "N/A") return "N/A";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // 1. FONT REGISTRATION (Hindi Support ke liye)
    try {
      // Base64 ko clean kar rahe hain taaki 'atob' error na aaye
      const fontContent = HINDI_FONT.includes(",") ? HINDI_FONT.split(",")[1] : HINDI_FONT;
      const cleanFont = fontContent.replace(/\s/g, "");

      doc.addFileToVFS("HindiFont.ttf", cleanFont);
      doc.addFont("HindiFont.ttf", "HindiFont", "normal");
    } catch (error) {
      console.error("Font Load Error:", error);
    }

    const formatCurrency = (amount) =>
      "Rs. " + (amount || 0).toLocaleString("en-IN");

    const checkPageBreak = (neededHeight = 10) => {
      if (y + neededHeight > 275) {
        doc.addPage();
        y = 20;
      }
    };

    const secureString = (val) => (val === null || val === undefined || val === "" ? "N/A" : String(val));

    // ===== HEADER =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text("GP Master Data", pageWidth / 2, y, { align: "center" });
    y += 4;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.line(20, y, pageWidth - 20, y);

    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Survey Date: ${formatDate(data.survey_date)}`, pageWidth / 2, y, { align: "center" });
    y += 15;

    // ===== Section Helper (Updated for Hindi Support) =====
    const addSection = (title, fields) => {
      checkPageBreak(25);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(55, 65, 81);
      doc.text(title, 20, y);

      y += 3;
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(20, y, pageWidth - 20, y);

      y += 8;

      fields.forEach(([label, value]) => {
        checkPageBreak(8);

        // Label English (Helvetica) mein hi rahega
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128);
        doc.text(label, 20, y);

        // Value (HindiFont) use karega jo Hindi aur English dono dikhayega
        doc.setFont("HindiFont", "normal");
        doc.setTextColor(17, 24, 39);
        doc.text(secureString(value), 70, y);

        y += 7;
      });

      y += 5;
    };

    // ===== SABHI SECTIONS (Aapka Sara Data) =====

    addSection(data.gp_name || "GP Details", [
      ["GP Name:", data.gp_name],
      ["Block Name:", data.block_name],
      ["District Name:", data.district_name],
      ["Sarpanch Name:", data.sarpanch_name],
      ["Sarpanch Contact:", data.sarpanch_contact],
      ["Number of Ward Panchs:", data.num_ward_panchs],
    ]);

    if (data.vdo) {
      addSection("VDO Details", [
        ["Name:", data.vdo_name],
        ["Username:", data.vdo.username],
      ]);
    }

    if (data.work_order) {
      addSection("Work Order", [
        ["Dispatch No:", data.work_order.work_order_no],
        ["Date:", formatDate(data.work_order.work_order_date)],
        ["Amount:", formatCurrency(data.work_order.work_order_amount)],
      ]);
    }

    if (data.fund_sanctioned) {
      addSection("Fund Sanctioned", [
        ["Head:", data.fund_sanctioned.head],
        ["Amount:", formatCurrency(data.fund_sanctioned.amount)],
      ]);
    }

    if (data.door_to_door_collection) {
      addSection("Door to Door Collection", [
        ["Households:", data.door_to_door_collection.num_households],
        ["Shops:", data.door_to_door_collection.num_shops],
        ["Frequency:", data.door_to_door_collection.collection_frequency],
      ]);
    }

    if (data.csc_details) {
      addSection("CSC Details", [
        ["Numbers:", data.csc_details.numbers],
        ["Frequency:", data.csc_details.cleaning_frequency],
      ]);
    }


    if (data.drain_cleaning) {
      addSection("Drain Cleaning", [
        ["Length:", data.drain_cleaning.length + " m"],
        ["Frequency:", data.drain_cleaning.cleaning_frequency],
      ]);
    }

    if (data.road_sweeping) {
      addSection("Road Sweeping", [
        ["Width:", data.road_sweeping.width + " m"],
        ["Length:", data.road_sweeping.length + " m"],
        ["Frequency:", data.road_sweeping.cleaning_frequency],
      ]);
    }




    if (data.swm_assets) {
      addSection("SLWM Assets", [
        ["RRC:", data.swm_assets.rrc],
        ["PWMU:", data.swm_assets.pwmu],
        ["Compost Pit:", data.swm_assets.compost_pit],
        ["Collection Vehicle:", data.swm_assets.collection_vehicle],
      ]);
    }

    if (data.sbmg_targets) {
      addSection("SBMG Targets", [
        ["IHHL:", data.sbmg_targets.ihhl],
        ["CSC:", data.sbmg_targets.csc],
        ["Soak Pit:", data.sbmg_targets.soak_pit],
        ["Magic Pit:", data.sbmg_targets.magic_pit],
      ]);
    }

    // ===== Village Table (Full Hindi Support) =====
    if (data.village_data?.length) {
      checkPageBreak(30);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(55, 65, 81);
      doc.text("Village Details", 20, y);

      y += 5;

      autoTable(doc, {
        startY: y,
        head: [[
          "Village", "Population", "Households", "IHHL", "CSC",
          "Soak Pit", "Magic pit", "Leach pit", "WSP", "DEWATS"
        ]],
        body: data.village_data.map((v) => [
          secureString(v.village_name),
          v.population,
          v.num_households,
          v.sbmg_assets?.ihhl || 0,
          v.sbmg_assets?.csc || 0,
          v.gwm_assets?.soak_pit || 0,
          v.gwm_assets?.magic_pit || 0,
          v.gwm_assets?.leach_pit || 0,
          v.gwm_assets?.leach_pit || 0, // Aapke code mein repeat tha, maine rehne diya
          v.gwm_assets?.wsp || 0,
          v.gwm_assets?.dewats || 0,
        ]),
        theme: "grid",
        styles: {
          font: "HindiFont", // Table ke andar Hindi support
          fontSize: 8
        },
        headStyles: { font: "helvetica", fontStyle: "bold" }
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    // ===== Footer =====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);

      const now = new Date();
      const formattedNow = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${now.toLocaleTimeString()}`;
      doc.text(`Generated on: ${formattedNow}`, 20, 285);
      doc.text(`Page ${i} of ${pageCount}`, 170, 285);
    }

    doc.save(`Survey-${data.gp_name}.pdf`);
  };




  // Handler for downloading annual surveys by district as PDF (District Wise Coverage table)
  const handleDownloadAnnualSurveys = useCallback(async (item) => {
    const districtId = item.district_id ?? (activeScope === 'State' ? item.geography_id : (selectedDistrictId || selectedDistrictForHierarchy?.id));
    if (!districtId) {
      alert('District information not available for download.');
      return;
    }
    try {
      setDownloadingId(item.geography_id);
      const response = await apiClient.get(`/annual-surveys/?skip=0&limit=100&district_id=${districtId}`);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? raw?.results ?? []);
      const title = `Annual Surveys — ${item.geography_name || 'District ' + districtId}`;
      const filename = `annual-surveys-${(item.geography_name || 'data').replace(/\s+/g, '-')}-district-${districtId}.pdf`;
      generateAnnualSurveysPDF(list, title, filename);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  }, [activeScope, selectedDistrictId, selectedDistrictForHierarchy]);

  // BDO: Districts are not fetched - district is fixed from /me API
  const fetchDistricts = () => {
    // No-op for CEO - district ID comes from /me API (vdoDistrictId)
    console.log('BDO: Skipping fetchDistricts - using vdoDistrictId:', vdoDistrictId);
  };

  // Fetch blocks from API for a specific district
  const fetchBlocks = useCallback(async (districtId) => {
    if (!districtId) {
      setBlocks([]);
      return;
    }

    try {
      setLoadingBlocks(true);
      const response = await apiClient.get('/geography/blocks', {
        params: {
          district_id: districtId,
          skip: 0,
          limit: 100
        }
      });
      console.log('Blocks API Response:', response.data);
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  // Fetch gram panchayats from API for a specific district & block
  const fetchGramPanchayats = useCallback(async (districtId, blockId) => {
    if (!districtId || !blockId) {
      setGramPanchayats([]);
      return;
    }

    try {
      setLoadingGPs(true);
      console.log('🔄 Fetching GPs...');
      const response = await apiClient.get('/geography/grampanchayats', {
        params: {
          district_id: districtId,
          block_id: blockId,
          skip: 0,
          limit: 100
        }
      });
      console.log('✅ GPs API Response:', response.data);
      console.log('📊 Number of GPs fetched:', response.data?.length || 0);
      setGramPanchayats(response.data);
    } catch (error) {
      console.error('❌ Error fetching gram panchayats:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  }, []);

  // Fetch FYs (years) for master data from /annual-surveys/fy/active
  // Response: [{"id":1,"fy":"2025-26","active":true}, ...]
  const fetchFyList = async () => {
    try {
      setLoadingFy(true);
      const res = await apiClient.get('/annual-surveys/fy/active');
      const raw = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.data || []);
      const list = raw.filter((x) => x && (x.id != null) && (x.fy != null));
      const sorted = [...list].sort((a, b) => String(b.fy || '').localeCompare(String(a.fy || '')));
      setFyList(sorted);
    } catch (error) {
      console.error('❌ Error fetching FY list from /annual-surveys/fy/active:', error);
      setFyList([]);
    } finally {
      setLoadingFy(false);
    }
  };

  // Fetch annual surveys for the selected GP and FY (for Report table and Edit)
  const fetchGpSurveys = useCallback(async () => {
    if (activeScope !== 'GPs' || !selectedGPId || !selectedFyId) {
      setGpSurveyList([]);
      return;
    }
    try {
      setLoadingGpSurvey(true);
      const res = await annualSurveysAPI.listSurveys({ gp_id: selectedGPId, fy_id: selectedFyId, limit: 10 });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.items ?? []);
      const list = (raw || []).filter((x) => x && x.id != null);
      const filtered = list.filter((x) =>
        (x.gp_id == null || Number(x.gp_id) === Number(selectedGPId)) &&
        (x.fy_id == null || Number(x.fy_id) === Number(selectedFyId))
      );
      setGpSurveyList(filtered.length > 0 ? filtered : list);
    } catch (err) {
      console.error('Error fetching GP surveys:', err);
      setGpSurveyList([]);
    } finally {
      setLoadingGpSurvey(false);
    }
  }, [activeScope, selectedGPId, selectedFyId]);

  // Fetch analytics data (state or district level)
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      console.log('🔄 ===== ANALYTICS API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        selectedFyId
      });

      const fyId = selectedFyId;

      if (!fyId) {
        console.log('⚠️ No year selected, skipping analytics call');
        setAnalyticsError('No year selected');
        return;
      }

      let url = '';

      // Build URL based on active scope
      if (activeScope === 'State') {
        url = `/annual-surveys/analytics/state?fy_id=${fyId}`;
        console.log('🏛️ Calling STATE analytics API');
      } else if (activeScope === 'Districts' && selectedDistrictId) {
        url = `/annual-surveys/analytics/district/${selectedDistrictId}?fy_id=${fyId}`;
        console.log('🏙️ Calling DISTRICT analytics API');
      } else if (activeScope === 'Blocks' && selectedBlockId) {
        url = `/annual-surveys/analytics/block/${selectedBlockId}?fy_id=${fyId}`;
        console.log('🏘️ Calling BLOCK analytics API');
      } else if (activeScope === 'GPs' && selectedGPId) {
        url = `/annual-surveys/analytics/gp/${selectedGPId}?fy_id=${fyId}`;
        console.log('🏡 Calling GP analytics API');
      } else {
        console.log('⏸️ Waiting for location selection or FY data');
        return;
      }

      console.log('🌐 Analytics API URL:', url);
      console.log('📅 FY ID:', fyId);

      const response = await apiClient.get(url);

      console.log('✅ Analytics API Response:', {
        status: response.status,
        data: response.data
      });

      // Log annual_overview specifically
      if (response.data) {
        console.log('📊 Annual Overview Data:', response.data.annual_overview);
        console.log('📈 Scheme Data:', response.data.scheme_wise_target_achievement);
      }

      setAnalyticsData(response.data);
      console.log('🔄 ===== END ANALYTICS API CALL =====\n');

    } catch (error) {
      console.error('❌ ===== ANALYTICS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END ANALYTICS API ERROR =====\n');

      setAnalyticsError(error.message || 'Failed to fetch analytics data');
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, selectedFyId]);


  useEffect(() => {
    if (!showLocationDropdown) {
      return;
    }

    if ((activeScope === 'Blocks' || activeScope === 'GPs') && districts.length > 0) {
      if (!selectedDistrictForHierarchy) {
        const presetDistrict = (selectedDistrictId && districts.find(d => d.id === selectedDistrictId)) || districts[0];
        if (presetDistrict) {
          setSelectedDistrictForHierarchy(presetDistrict);
          setDropdownLevel(activeScope === 'GPs' && selectedBlockId ? 'gps' : 'blocks');
          fetchBlocks(presetDistrict.id);
        }
      }
    }

    if (activeScope === 'GPs' && selectedDistrictForHierarchy && blocks.length > 0) {
      if (!selectedBlockForHierarchy) {
        const presetBlock = (selectedBlockId && blocks.find(b => b.id === selectedBlockId && b.district_id === selectedDistrictForHierarchy.id))
          || blocks.find(b => b.district_id === selectedDistrictForHierarchy.id);
        if (presetBlock) {
          setSelectedBlockForHierarchy(presetBlock);
          setDropdownLevel('gps');
          fetchGramPanchayats(selectedDistrictForHierarchy.id, presetBlock.id);
        }
      }
    }
  }, [
    showLocationDropdown,
    activeScope,
    districts,
    blocks,
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    selectedDistrictId,
    selectedBlockId,
    fetchBlocks,
    fetchGramPanchayats
  ]);

  useEffect(() => {
    if ((activeScope === 'Districts' || activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId) {
      fetchBlocks(selectedDistrictId);
    }
  }, [activeScope, selectedDistrictId, fetchBlocks]);

  useEffect(() => {
    if ((activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId && selectedBlockId) {
      fetchGramPanchayats(selectedDistrictId, selectedBlockId);
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, fetchGramPanchayats]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-location-dropdown]')) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch districts and active FY data immediately when component loads
  useEffect(() => {
    if (hasFetchedInitialData.current) {
      console.log('⏸️ Initial data already fetched, skipping...');
      return;
    }
    console.log('🔄 Fetching initial data (FY list)...');
    hasFetchedInitialData.current = true;
    fetchFyList();
  }, []);

  // Set default selected year when fyList loads or selection becomes invalid
  useEffect(() => {
    if (fyList.length > 0 && (selectedFyId == null || !fyList.some((f) => f.id === selectedFyId))) {
      setSelectedFyId(fyList[0].id);
    }
  }, [fyList, selectedFyId]);

  // Fetch analytics data when scope, location, or selected year changes
  useEffect(() => {
    console.log('🔄 Analytics useEffect triggered:', {
      activeScope,
      selectedDistrictId,
      selectedBlockId,
      selectedGPId,
      selectedFyId,
      loadingAnalytics
    });

    if (activeScope === 'State' && selectedFyId) {
      console.log('📡 Calling state analytics API');
      fetchAnalytics();
    } else if (activeScope === 'GPs' && selectedGPId && selectedFyId) {
      console.log('📡 Calling GP analytics API');
      fetchAnalytics();
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, selectedFyId, fetchAnalytics]);

  // Fetch GP surveys when in GP scope with selected GP and FY
  useEffect(() => {
    if (activeScope === 'GPs' && selectedGPId && selectedFyId) {
      fetchGpSurveys();
    } else {
      setGpSurveyList([]);
    }
  }, [activeScope, selectedGPId, selectedFyId, fetchGpSurveys]);

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return num.toLocaleString('en-IN');
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Helper function to get analytics data with defaults
  const getAnalyticsValue = (key, defaultValue = 0) => {
    if (!analyticsData) return defaultValue;
    const value = analyticsData[key];
    return value !== null && value !== undefined ? value : defaultValue;
  };

  console.log('VillageMasterContent rendering...');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      {/* Header Section */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '5px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* VDO: Title and Year dropdown - no geo tabs or location selection */}
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            GP Master Data
          </h1>
        </div>
      </div>

      {/* Location Indicator - VDO fixed location, no generic "District DISTRICT" / "Block" / "Village" */}
      <div style={{ padding: '10px 0px 0px 16px' }}>
        <span style={{ fontSize: '14px', color: '#6B7280', fontWeight: '600' }}>
          {getLocationPath ? getLocationPath() : 'Rajasthan'}
        </span>
      </div>

      {/* Overview Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '6px',
        borderRadius: '8px',
        border: '1px solid lightgray'
      }}>
        {/* Overview Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Overview
            </h2>
          </div>
          {/* Year dropdown - view previous years' master data */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
            <Calendar style={{ width: '16px', height: '16px', color: '#9ca3af', flexShrink: 0 }} />
            <select
              aria-label="Select year"
              value={selectedFyId ?? ''}
              onChange={(e) => setSelectedFyId(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingFy || fyList.length === 0}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '5px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '14px',
                color: fyList.length === 0 ? '#9ca3af' : '#374151',
                backgroundColor: loadingFy || fyList.length === 0 ? '#f9fafb' : 'white',
                cursor: loadingFy || fyList.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {loadingFy ? (
                <option value="">Loading...</option>
              ) : fyList.length === 0 ? (
                <option value="">No years</option>
              ) : (
                fyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.fy}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeScope === 'GPs' ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
          gap: '16px'
        }}>
          {/* Total funds sanctioned */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Total funds sanctioned
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <InfoTooltip tooltipKey="TOTAL_FUNDS_SANCTIONED" size={16} color="#6b7280" />
                <DollarSign style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : formatCurrency(getAnalyticsValue('total_funds_sanctioned', 0))}
            </div>
          </div>

          {/* Total work order Amount */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                Total work order Amount
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <InfoTooltip tooltipKey="TOTAL_WORK_ORDER_AMOUNT" size={16} color="#6b7280" />
                <DollarSign style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : formatCurrency(getAnalyticsValue('total_work_order_amount', 0))}
            </div>
          </div>

          {/* SBMG Target Achievement Rate */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#6b7280',
                margin: 0
              }}>
                SBMG Target Achievement Rate
              </h3>
              <InfoTooltip tooltipKey="SBMG_TARGET_ACHIEVEMENT_RATE" size={16} color="#6b7280" />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : `${getAnalyticsValue('sbmg_target_achievement_rate', 0)}%`}
            </div>
          </div>
        </div>

        {/* SBMG Target vs Achievement and Annual Overview Section */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '16px'
        }}>
          <divider />

          {/* Annual Overview */}
          <div style={{
            flex: activeScope === 'GPs' ? 'none' : 1,
            width: activeScope === 'GPs' ? '100%' : 'auto',
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              marginBottom: '2px'
            }}>
              Annual Overview
            </h3>
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>
            <divider />

            {/* Metrics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Fund Utilization rate */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', color: '#6b7280' }}>Fund Utilization rate</span>
                  <InfoTooltip tooltipKey="FUND_UTILIZATION_RATE" size={14} color="#6b7280" />
                </div>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                  {loadingAnalytics ? '...' : (analyticsData?.annual_overview?.fund_utilization_rate !== undefined && analyticsData?.annual_overview?.fund_utilization_rate !== null ? `${analyticsData.annual_overview.fund_utilization_rate}%` : analyticsData?.fund_utilization_rate !== undefined && analyticsData?.fund_utilization_rate !== null ? `${analyticsData.fund_utilization_rate}%` : '0%')}
                </span>
              </div>

              {/* Average Cost Per Household */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', color: '#6b7280' }}>Average Cost Per Household(D2D)</span>
                  <InfoTooltip tooltipKey="AVERAGE_COST_PER_HOUSEHOLD_D2D" size={14} color="#6b7280" />
                </div>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                  {loadingAnalytics ? '...' : (analyticsData?.annual_overview?.average_cost_per_household_d2d !== undefined && analyticsData?.annual_overview?.average_cost_per_household_d2d !== null ? `₹${formatNumber(analyticsData.annual_overview.average_cost_per_household_d2d)}` : '₹0')}
                </span>
              </div>

              {/* Active Sanitation Bidders - Hidden in GP view */}
              {activeScope !== 'GPs' && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', color: '#6b7280' }}>Active Sanitation Bidders</span>
                    <InfoTooltip tooltipKey="ACTIVE_SANITATION_BIDDERS" size={14} color="#6b7280" />
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                    {loadingAnalytics ? '...' : (analyticsData?.annual_overview?.active_sanitation_bidders !== undefined && analyticsData?.annual_overview?.active_sanitation_bidders !== null ? formatNumber(analyticsData.annual_overview.active_sanitation_bidders) : '0')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>

      {/* Report Section - Only for GP view */}
      {activeScope === 'GPs' && (
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          marginLeft: '16px',
          marginRight: '16px',
          marginTop: '16px',
          borderRadius: '8px',
          border: '1px solid lightgray'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 16px 0'
          }}>
            Report
          </h3>

          {/* Table */}
          <div style={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 200px',
              backgroundColor: '#f9fafb',
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Year
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Master Data
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Action
              </div>
            </div>

            {/* Table Body */}
            {(() => {
              const survey = gpSurveyList[0];
              const fyLabel = fyList.find((f) => f.id === selectedFyId)?.fy || selectedFyId || '—';
              const hasData = !!survey;
              const masterDataLabel = loadingGpSurvey ? '...' : (hasData ? 'Available' : 'Not Available');
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 200px',
                  padding: '12px 16px',
                  alignItems: 'center',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {fyLabel}
                  </div>
                  <div style={{ fontSize: '14px', color: hasData ? '#10b981' : '#6b7280', fontWeight: '600' }}>
                    {masterDataLabel}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>

                    {hasData ? (
                      <>
                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => {
                            setEditSurveyId(survey.id);
                            setShowEditModal(true);
                          }}
                          title="Edit GP Master Data"
                          style={{
                            padding: '6px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit style={{ width: '16px', height: '16px', color: '#374151' }} />
                        </button>

                        {/* DOWNLOAD BUTTON */}
                        <button
                          onClick={() => handleDownloadPDF(survey.id)}
                          title="Download PDF"
                          style={{
                            padding: '6px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <Download style={{ width: '16px', height: '16px', color: '#374151' }} />
                        </button>
                      </>
                    ) : (
                      /* ADD BUTTON */
                      <button
                        onClick={() => {
                          setEditSurveyId(null); // IMPORTANT
                          setShowEditModal(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        + Add GP Master Data
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit GP Master Data modal */}
      <EditGPMasterModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditSurveyId(null); }}
        surveyId={editSurveyId}
        gpName={selectedLocation}
        onSuccess={() => { fetchGpSurveys(); fetchAnalytics(); }}
        vdoGPId={vdoGPId}
        fy_id={selectedFyId}

      />
    </div>
  );
};

export default VDOVillageMasterContent;