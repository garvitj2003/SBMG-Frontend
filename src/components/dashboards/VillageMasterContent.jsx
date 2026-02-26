import { ArrowUpDown, Calendar, ChevronDown, ChevronRight, Database, Download, Edit, Filter, MapPin, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Chart from 'react-apexcharts';
import { useLocation } from '../../context/LocationContext';
import apiClient, { annualSurveysAPI } from '../../services/api';
import NoDataFound from './common/NoDataFound';
import EditGPMasterModal from './EditGPMasterModal';
import { generateAnnualSurveysPDF } from '../../utils/annualSurveysPdf';
import { InfoTooltip } from '../common/Tooltip';
import { Link } from 'react-router-dom';
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { HINDI_FONT } from '../../utils/font';



const VillageMasterContent = () => {
  // Refs to prevent duplicate API calls
  const hasFetchedInitialData = useRef(false);

  // Location state management via shared context
  const {
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedDistrictId,
    selectedBlockId,
    selectedGPId,

    dropdownLevel,
    selectedDistrictForHierarchy,
    selectedBlockForHierarchy,
    setActiveScope,
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedDistrictId,
    setSelectedBlockId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy,
    updateLocationSelection: contextUpdateLocationSelection,
    trackTabChange: contextTrackTabChange,
    trackDropdownChange: contextTrackDropdownChange,
    getCurrentLocationInfo: contextGetCurrentLocationInfo
  } = useLocation();

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

  const scopeButtons = ['State', 'Districts', 'Blocks', 'GPs'];
  const performanceButtons = ['Time', 'Location'];

  // Sorting 
  const [historySortOrder, setHistorySortOrder] = useState('asc'); // 'asc' or 'desc'
  const [sortConfig, setSortConfig] = useState({
    key: 'geography_name',
    direction: 'asc' // 'asc' | 'desc'
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          key,
          direction: 'asc'
        };
      }
    });
  };


  // const sortedCoverageData = [...coverageData].sort((a, b) => {
  //   const { key, direction } = sortConfig;

  //   let valueA = a[key];
  //   let valueB = b[key];

  //   // Handle undefined/null
  //   if (valueA === null || valueA === undefined) valueA = '';
  //   if (valueB === null || valueB === undefined) valueB = '';

  //   // String sorting
  //   if (typeof valueA === 'string') {
  //     const result = valueA.localeCompare(valueB);
  //     return direction === 'asc' ? result : -result;
  //   }

  //   // Number sorting
  //   const result = Number(valueA) - Number(valueB);
  //   return direction === 'asc' ? result : -result;
  // });

  const toggleHistorySortOrder = () => {
    setHistorySortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

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
        ["Username:", data.vdo.username]
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
  const handleDownloadAnnualSurveys = async (item) => {
    try {
      if (!selectedFyId) {
        alert("Please select a Financial Year.");
        return;
      }

      const geoId = item.geography_id;
      const geoName = item.geography_name;

      // ==========================================
      // CASE 1: STATE SCOPE -> District's Blocks
      // ==========================================
      if (activeScope === "State") {
        const res = await apiClient.get(`/annual-surveys/analytics/district/${geoId}?fy_id=${selectedFyId}`);
        const blocksData = res.data?.block_wise_coverage || [];

        if (!blocksData.length) {
          alert("No block data available for this district.");
          return;
        }

        // ✅ Sr. No. yahan add ho raha hai
        const formatted = blocksData.map((row, index) => ({
          "Sr. No.": index + 1,
          "Block Name": row.geography_name,
          "Total GPs": row.total_gps,
          "GPs with Data": row.gps_with_data,
          "Coverage %": `${row.coverage_percentage}%`,
          "Status": row.master_data_status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(formatted);

        // ✅ Width yahan set ho rahi hai (Characters mein)
        worksheet['!cols'] = [
          { wch: 8 },  // Sr. No.
          { wch: 25 }, // Block Name
          { wch: 15 }, // Total GPs
          { wch: 15 }, // GPs with Data
          { wch: 15 }, // Coverage %
          { wch: 15 }  // Status
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Blocks List");
        XLSX.writeFile(workbook, `Blocks_of_${geoName}.xlsx`);
      }

      // ==========================================
      // CASE 2: DISTRICTS SCOPE -> Block's GPs
      // ==========================================
      else if (activeScope === "Districts") {
        const res = await apiClient.get(`/annual-surveys/analytics/block/${geoId}?fy_id=${selectedFyId}`);
        const gpsData = res.data?.gp_wise_coverage || [];

        if (!gpsData.length) {
          alert("No GP data available for this block.");
          return;
        }

        // ✅ Sr. No. yahan add ho raha hai
        const formatted = gpsData.map((row, index) => ({
          "Sr. No.": index + 1,
          "GP Name": row.geography_name,
          "Status": row.master_data_status,
          "Coverage %": `${row.coverage_percentage}%`,
        }));

        const worksheet = XLSX.utils.json_to_sheet(formatted);

        // ✅ Width yahan set ho rahi hai
        worksheet['!cols'] = [
          { wch: 8 },  // Sr. No.
          { wch: 30 }, // GP Name
          { wch: 15 }, // Status
          { wch: 15 }  // Coverage %
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "GPs List");
        XLSX.writeFile(workbook, `GPs_of_${geoName}.xlsx`);
      }

      // ==========================================
      // CASE 3: BLOCKS SCOPE -> Generate PDF
      // ==========================================
      else if (activeScope === "Blocks") {
        const surveyListRes = await apiClient.get(
          `/annual-surveys?gp_id=${geoId}&fy_id=${selectedFyId}`
        );
        const surveyList = surveyListRes.data;

        if (!surveyList || !surveyList.length) {
          alert("No survey found for this GP.");
          return;
        }

        const surveyId = surveyList[0].id;
        const surveyRes = await apiClient.get(`/annual-surveys/${surveyId}`);
        generatePDF(surveyRes.data);
      }

    } catch (error) {
      console.error("Download Error:", error);
      alert("Download failed. Check console.");
    }
  };

  const tableDataDownload = () => {
    try {
      // 1. Pehle data identify karo activeScope ke hisaab se
      const coverageData = activeScope === 'State'
        ? analyticsData?.district_wise_coverage || []
        : activeScope === 'Districts'
          ? analyticsData?.block_wise_coverage || []
          : analyticsData?.gp_wise_coverage || [];

      if (!coverageData.length) {
        alert("No data available to download");
        return;
      }

      // 2. Data ko Excel format (JSON) mein taiyar karo
      // Hum labels dynamic rakhenge scope ke basis par
      const geoLabel = activeScope === 'State' ? 'District' : activeScope === 'Districts' ? 'Block' : 'GP';

      const formattedData = coverageData.map((item, index) => {
        // Base object jo sab mein common hai
        const row = {
          "Sr. No.": index + 1,
          [`${geoLabel} Name`]: item.geography_name,
        };

        // Agar State ya Districts scope hai toh extra columns add karo
        if (activeScope !== 'Blocks') {
          row["Total GPs"] = item.total_gps || 0;
          row["GPs with Data"] = item.gps_with_data || 0;
          row["Coverage %"] = `${item.coverage_percentage || 0}%`;
        }

        // Status column sabke liye
        row["Status"] = item.master_data_status || 'Not Available';

        return row;
      });

      // 3. Excel Worksheet taiyar karo
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // 4. Column ki width set karo taaki Excel saaf dikhe
      const columnsConfig = [
        { wch: 8 },  // Sr. No.
        { wch: 30 }, // Geography Name
      ];

      if (activeScope !== 'Blocks') {
        columnsConfig.push({ wch: 15 }, { wch: 15 }, { wch: 15 });
      }
      columnsConfig.push({ wch: 18 }); // Status

      worksheet['!cols'] = columnsConfig;

      // 5. Workbook banao aur save karo
      const workbook = XLSX.utils.book_new();
      const fileName = `${geoLabel}_Wise_Coverage_Report`;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Coverage Report");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);

    } catch (error) {
      console.error("Excel Download Error:", error);
      alert("Failed to download excel.");
    }
  };

  // Fetch districts from API
  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      const response = await apiClient.get('/geography/districts?skip=0&limit=100');
      console.log('Districts API Response:', response.data);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
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
      // If backend doesn't filter by gp_id/fy_id, filter client-side when present
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

  // Handle scope change
  const handleScopeChange = async (scope) => {
    console.log('Scope changed to:', scope);
    trackTabChange(scope);
    setActiveScope(scope);
    setShowLocationDropdown(false);

    // Use updateLocationSelection for proper state management
    if (scope === 'State') {
      // State tab selected - will trigger state analytics API in useEffect
      updateLocationSelection('State', 'Rajasthan', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
      // Don't clear analytics data yet - let the useEffect handle it
    } else if (scope === 'Districts') {
      // Districts tab selected - ensure districts loaded then set first district
      if (districts.length === 0) {
        console.log('⏳ Loading districts first...');
        await fetchDistricts();
      }
      if (districts.length > 0) {
        const firstDistrict = districts[0];
        updateLocationSelection('Districts', firstDistrict.name, firstDistrict.id, firstDistrict.id, null, null, 'tab_change');
        fetchBlocks(firstDistrict.id);
      }
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Blocks') {
      // Blocks tab selected - wait for district selection before fetching blocks
      if (districts.length === 0) {
        console.log('⏳ Loading districts first...');
        await fetchDistricts();
      }
      setBlocks([]);
      setGramPanchayats([]);
      updateLocationSelection('Blocks', 'Select District', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'GPs') {
      // GPs tab selected - wait for district/block selection before fetching GPs
      if (districts.length === 0) {
        console.log('⏳ Loading districts first...');
        await fetchDistricts();
      }
      setBlocks([]);
      setGramPanchayats([]);
      updateLocationSelection('GPs', 'Select District', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    }
  };

  // Get location options based on current scope and dropdown level
  const getLocationOptions = () => {
    if (activeScope === 'Districts') {
      return districts;
    } else if (activeScope === 'Blocks') {
      if (dropdownLevel === 'districts') {
        return districts;
      } else if (dropdownLevel === 'blocks') {
        return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id);
      }
    } else if (activeScope === 'GPs') {
      if (dropdownLevel === 'districts') {
        return districts;
      } else if (dropdownLevel === 'blocks') {
        return blocks.filter(block => block.district_id === selectedDistrictForHierarchy?.id);
      } else if (dropdownLevel === 'gps') {
        const filteredGPs = gramPanchayats.filter(gp => gp.block_id === selectedBlockForHierarchy?.id);
        console.log('🔍 Filtering GPs:', {
          totalGPs: gramPanchayats.length,
          selectedBlockId: selectedBlockForHierarchy?.id,
          filteredGPsCount: filteredGPs.length
        });
        return filteredGPs;
      }
    }
    return [];
  };

  // Handle hierarchical selection for blocks and GPs
  const activeHierarchyDistrict = selectedDistrictForHierarchy ||
    (selectedDistrictId ? districts.find(d => d.id === selectedDistrictId) : null);

  const blocksForActiveDistrict = activeHierarchyDistrict
    ? blocks.filter(block => block.district_id === activeHierarchyDistrict.id)
    : [];

  const activeHierarchyBlock = selectedBlockForHierarchy ||
    (selectedBlockId ? blocks.find(block => block.id === selectedBlockId) : null);

  const gpsForActiveBlock = activeHierarchyBlock
    ? gramPanchayats.filter(gp => gp.block_id === activeHierarchyBlock.id)
    : [];

  const getMenuItemStyles = (isActive) => ({
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    color: isActive ? '#047857' : '#374151',
    backgroundColor: isActive ? '#ecfdf5' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background-color 0.15s ease, color 0.15s ease'
  });

  const handleDistrictHover = (district) => {
    if (activeScope === 'Blocks' || activeScope === 'GPs') {
      if (!selectedDistrictForHierarchy || selectedDistrictForHierarchy.id !== district.id) {
        setSelectedDistrictForHierarchy(district);
        setSelectedBlockForHierarchy(null);
        setDropdownLevel('blocks');
        fetchBlocks(district.id);
      }
    }
  };

  const handleDistrictClick = (district) => {
    if (activeScope === 'Districts') {
      trackDropdownChange(district.name);
      updateLocationSelection('Districts', district.name, district.id, district.id, null, null, 'dropdown_change');
      fetchBlocks(district.id);
      setShowLocationDropdown(false);
    } else if (activeScope === 'Blocks') {
      setSelectedDistrictForHierarchy(district);
      setSelectedBlockForHierarchy(null);
      setSelectedLocation('Select Block');
      setDropdownLevel('blocks');
      fetchBlocks(district.id);
    } else if (activeScope === 'GPs') {
      setSelectedDistrictForHierarchy(district);
      setSelectedBlockForHierarchy(null);
      setSelectedLocation('Select Block');
      setDropdownLevel('blocks');
      fetchBlocks(district.id);
    }
  };

  const handleBlockHover = (block) => {
    if (activeScope === 'GPs') {
      if (!selectedBlockForHierarchy || selectedBlockForHierarchy.id !== block.id) {
        setSelectedBlockForHierarchy(block);
        setDropdownLevel('gps');
        fetchGramPanchayats(selectedDistrictForHierarchy?.id || selectedDistrictId, block.id);
      }
    }
  };

  const handleBlockClick = (block) => {
    if (activeScope === 'Blocks') {
      const district = districts.find(d => d.id === (block.district_id || selectedDistrictForHierarchy?.id)) || selectedDistrictForHierarchy;
      const districtId = district?.id || null;
      trackDropdownChange(block.name);
      updateLocationSelection('Blocks', block.name, block.id, districtId, block.id, null, 'dropdown_change');
      if (district) {
        setSelectedDistrictForHierarchy(district);
      }
      setSelectedBlockForHierarchy(block);
      fetchGramPanchayats(districtId, block.id);
      setShowLocationDropdown(false);
    } else if (activeScope === 'GPs') {
      setSelectedBlockForHierarchy(block);
      setSelectedLocation('Select GP');
      setDropdownLevel('gps');
      fetchGramPanchayats(selectedDistrictForHierarchy?.id || selectedDistrictId, block.id);
    }
  };

  const handleGPClick = (gp) => {
    const block = blocks.find(b => b.id === (gp.block_id || selectedBlockForHierarchy?.id || selectedBlockId)) || selectedBlockForHierarchy;
    const blockId = block?.id || gp.block_id || null;
    const district = districts.find(d => d.id === (block?.district_id || selectedDistrictForHierarchy?.id || selectedDistrictId)) || selectedDistrictForHierarchy;
    const districtId = district?.id || null;

    trackDropdownChange(gp.name);
    updateLocationSelection('GPs', gp.name, gp.id, districtId, blockId, gp.id, 'dropdown_change');
    if (district) {
      setSelectedDistrictForHierarchy(district);
    }
    if (block) {
      setSelectedBlockForHierarchy(block);
    }
    fetchGramPanchayats(districtId, blockId);
    setShowLocationDropdown(false);
  };

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
    // Prevent duplicate API calls (React StrictMode calls effects twice in development)
    if (hasFetchedInitialData.current) {
      console.log('⏸️ Initial data already fetched, skipping...');
      return;
    }

    console.log('🔄 Fetching initial data (districts and FY list)...');
    hasFetchedInitialData.current = true;
    fetchDistricts();
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
    } else if (activeScope === 'Districts' && selectedDistrictId && selectedFyId) {
      console.log('📡 Calling district analytics API');
      fetchAnalytics();
    } else if (activeScope === 'Blocks' && selectedBlockId && selectedFyId) {
      console.log('📡 Calling block analytics API');
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

  // Process scheme-wise target achievement data for the chart
  const schemeData = analyticsData?.scheme_wise_target_achievement || [];
  const chartCategories = schemeData.map(item => item.scheme_name || item.scheme_code);
  const targetData = schemeData.map(item => item.target || 0);
  const achievementData = schemeData.map(item => item.achievement || 0);

  // Calculate max value for y-axis (with some padding)
  const maxValue = Math.max(
    ...targetData,
    ...achievementData,
    100
  );
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.2 / 10) * 10 : 100;

  // Chart data for SBMG Target vs Achievement
  const chartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent'
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 0
      }
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      categories: chartCategories.length > 0 ? chartCategories : ['IHHL', 'CSC', 'RRC', 'PWMU', 'Soak pit', 'Magic pit', 'Leach pit', 'WSP', 'DEWATS'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#6b7280', fontSize: '12px' } }
    },
    yaxis: {
      min: 0,
      max: yAxisMax,
      tickAmount: 5,
      labels: { style: { colors: '#6b7280', fontSize: '12px' } },
      axisBorder: { show: false }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    colors: ['#9ca3af', '#10b981'],
    legend: {
      show: false
    }
  };

  const chartSeries = [
    {
      name: 'Target',
      data: targetData.length > 0 ? targetData : [0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    {
      name: 'Achievement',
      data: achievementData.length > 0 ? achievementData : [0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  ];



  const lineChartSeries = [{
    name: 'Score',
    data: [18, 30, 28, 18, 35, 42, 35, 28, 35, 30, 40, 52]
  }];

  console.log('VillageMasterContent rendering...');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 py-1 px-2 md:px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4" style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '5px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left side - Dashboard title */}
        <div>
          <h1 className="text-lg md:text-xl" style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            GP Master Data
          </h1>
        </div>

        {/* Right side - Scope buttons and Location dropdown */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 w-full md:w-auto" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Scope segmented buttons */}
          <div className="flex flex-wrap md:flex-nowrap bg-gray-100 rounded-xl p-1 gap-0.5" style={{
            display: 'flex',
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            padding: '4px',
            gap: '2px'
          }}>
            {scopeButtons.map((scope) => (
              <button
                key={scope}
                onClick={() => handleScopeChange(scope)}
                className="px-2 md:px-2.5 py-1 rounded-lg text-xs md:text-sm font-medium transition-all"
                style={{
                  padding: '3px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: activeScope === scope ? '#10b981' : 'transparent',
                  color: activeScope === scope ? 'white' : '#6b7280',
                  transition: 'all 0.2s'
                }}
              >
                {scope}
              </button>
            ))}
          </div>
          {/* Location dropdown */}
          <div
            data-location-dropdown
            className="relative w-full md:w-auto md:min-w-[200px]"
            style={{
              position: 'relative',
              minWidth: '200px'
            }}
          >
            <button
              onClick={() => activeScope !== 'State' && setShowLocationDropdown(!showLocationDropdown)}
              disabled={activeScope === 'State'}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm md:text-base flex items-center justify-between"
              style={{
                width: '100%',
                padding: '5px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                backgroundColor: activeScope === 'State' ? '#f9fafb' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: activeScope === 'State' ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: activeScope === 'State' ? '#9ca3af' : '#6b7280',
                opacity: activeScope === 'State' ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                <span>{selectedLocation}</span>
              </div>
              <ChevronDown style={{
                width: '16px',
                height: '16px',
                color: activeScope === 'State' ? '#d1d5db' : '#9ca3af'
              }} />
            </button>

            {/* Location Dropdown Menu */}
            {showLocationDropdown && activeScope !== 'State' && (
              <div
                key={`dropdown-${activeScope}`}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  left: 'auto',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
                  zIndex: 1000,
                  marginTop: '6px',
                  display: 'flex',
                  overflow: 'hidden',
                  minWidth: activeScope === 'Districts' ? '280px' : activeScope === 'Blocks' ? '520px' : '780px'
                }}
              >
                <div
                  style={{
                    minWidth: '240px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    borderRight: activeScope !== 'Districts' ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  {loadingDistricts ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      Loading districts...
                    </div>
                  ) : districts.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      No districts available
                    </div>
                  ) : (
                    districts.map((district) => {
                      const isActiveDistrict = activeHierarchyDistrict?.id === district.id;
                      const isSelectedDistrict = activeScope === 'Districts' && selectedLocation === district.name;
                      const showArrow = activeScope === 'Blocks' || activeScope === 'GPs';

                      return (
                        <div
                          key={`district-${district.id}`}
                          onClick={() => handleDistrictClick(district)}
                          onMouseEnter={() => handleDistrictHover(district)}
                          style={getMenuItemStyles(isActiveDistrict || isSelectedDistrict)}
                        >
                          <span>{district.name}</span>
                          {showArrow && (
                            <ChevronRight style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {activeScope !== 'Districts' && (
                  <div
                    style={{
                      minWidth: '240px',
                      maxHeight: '280px',
                      overflowY: 'auto',
                      borderRight: activeScope === 'GPs' ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    {loadingBlocks ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        Loading blocks...
                      </div>
                    ) : !activeHierarchyDistrict ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        Select a district to view blocks
                      </div>
                    ) : blocksForActiveDistrict.length === 0 ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        No blocks found
                      </div>
                    ) : (
                      blocksForActiveDistrict.map((block) => {
                        const isActiveBlock = activeHierarchyBlock?.id === block.id;
                        const isSelectedBlock = activeScope === 'Blocks' && selectedLocation === block.name;
                        const showArrow = activeScope === 'GPs';

                        return (
                          <div
                            key={`block-${block.id}`}
                            onClick={() => handleBlockClick(block)}
                            onMouseEnter={() => handleBlockHover(block)}
                            style={getMenuItemStyles(isActiveBlock || isSelectedBlock)}
                          >
                            <span>{block.name}</span>
                            {showArrow && (
                              <ChevronRight style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeScope === 'GPs' && (
                  <div
                    style={{
                      minWidth: '240px',
                      maxHeight: '280px',
                      overflowY: 'auto'
                    }}
                  >
                    {loadingGPs ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        Loading GPs...
                      </div>
                    ) : !activeHierarchyBlock ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        Select a block to view GPs
                      </div>
                    ) : gpsForActiveBlock.length === 0 ? (
                      <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        No GPs found
                      </div>
                    ) : (
                      gpsForActiveBlock.map((gp) => {
                        const isSelectedGP = activeScope === 'GPs' && selectedLocation === gp.name;

                        return (
                          <div
                            key={`gp-${gp.id}`}
                            onClick={() => handleGPClick(gp)}
                            style={getMenuItemStyles(isSelectedGP)}
                          >
                            <span>{gp.name}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Indicator */}
      <div style={{
        padding: '10px 0px 0px 16px',
      }}>
        <span style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: '600'
        }}>
          {(() => {
            if (activeScope === 'State') {
              return selectedLocation;
            } else if (activeScope === 'Districts') {
              return `Rajasthan / ${selectedLocation}`;
            } else if (activeScope === 'Blocks') {
              const districtName = selectedDistrictForHierarchy?.name || selectedLocation;
              const blockName = selectedBlockForHierarchy?.name || selectedLocation;
              return `Rajasthan / ${districtName} / ${blockName}`;
            } else if (activeScope === 'GPs') {
              const districtName = selectedDistrictForHierarchy?.name || '';
              const blockName = selectedBlockForHierarchy?.name || '';
              return `Rajasthan / ${districtName} / ${blockName} / ${selectedLocation || ''}`;
            }
            return `Rajasthan / ${selectedLocation}`;
          })()}
        </span>
      </div>

      {/* Overview Section */}
      <div className="bg-white p-4 md:p-6 mx-2 md:mx-4 mt-1.5 rounded-lg border border-gray-300" style={{
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" style={{
          display: 'grid',
          gap: '16px'
        }}>
          {/* Total Village Master Data - Hidden in GP view */}
          {activeScope !== 'GPs' && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
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
                  Total GP Master Data
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <InfoTooltip tooltipKey="TOTAL_GP_MASTER_DATA" size={16} color="#6b7280" />
                  <Database style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: analyticsError ? '#ef4444' : '#111827',
                margin: 0
              }}>
                {loadingAnalytics ? '...' : formatNumber(getAnalyticsValue('total_village_master_data', 0))}
              </div>
              {analyticsError && (
                <div style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  marginTop: '4px'
                }}>
                  {analyticsError}
                </div>
              )}
            </div>
          )}

          {/* Village Master Data Coverage - Hidden in GP view */}
          {activeScope !== 'GPs' && (
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
                  Village GP Data Coverage
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <InfoTooltip tooltipKey="VILLAGE_GP_DATA_COVERAGE" size={16} color="#6b7280" />
                  <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: analyticsError ? '#ef4444' : '#111827',
                margin: 0
              }}>
                {loadingAnalytics ? '...' : `${getAnalyticsValue('village_master_data_coverage_percentage', 0)}%`}
              </div>
            </div>
          )}

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
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : formatCurrency(getAnalyticsValue('total_funds_sanctioned', 0))}

              <span className='ms-1! font-semibold text-[14px]'>CR</span>
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
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: analyticsError ? '#ef4444' : '#111827',
              margin: 0
            }}>
              {loadingAnalytics ? '...' : formatCurrency(getAnalyticsValue('total_work_order_amount', 0))}
              <span className='ms-1! font-semibold text-[14px]'>CR</span>

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
        <div className="flex flex-col lg:flex-row gap-2 md:gap-4 mt-4" style={{
          display: 'flex',
          gap: '10px',
          marginTop: '16px'
        }}>
          {/* SBMG Target vs Achievement Chart - Hidden in GP view */}
          {activeScope !== 'GPs' && (
            <div className="flex-1 md:flex-[2] bg-white p-3 md:p-4 rounded-lg border border-gray-200" style={{
              flex: 2,
              backgroundColor: 'white',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  SBMG Target vs. Achievement
                </h3>
                {/* Legend */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#9ca3af',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Target</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#10b981',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Achievement</span>
                  </div>
                </div>
              </div>
              <divider />
              <div style={{
                height: '1px',
                backgroundColor: '#e5e7eb',
                margin: '12px 0'
              }}></div>
              <div className="h-64 md:h-80 lg:h-96 overflow-x-auto" style={{
                height: '400px',
                minHeight: '300px',
                maxWidth: '100%'
              }}>
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="bar"
                  height="100%"
                />
              </div>
            </div>
          )}
          <divider />

          {/* Annual Overview */}
          <div className={`${activeScope === 'GPs' ? 'w-full' : 'flex-1'} bg-white p-3 md:p-4 rounded-lg border border-gray-200`} style={{
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

              {/* Household covered - Hidden in GP view */}
              {activeScope !== 'GPs' && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', color: '#6b7280' }}>Household covered (D2D)</span>
                    <InfoTooltip tooltipKey="HOUSEHOLDS_COVERED_D2D" size={14} color="#6b7280" />
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                    {loadingAnalytics ? '...' : (analyticsData?.annual_overview?.households_covered_d2d !== undefined && analyticsData?.annual_overview?.households_covered_d2d !== null ? formatNumber(analyticsData.annual_overview.households_covered_d2d) : analyticsData?.households_covered_d2d !== undefined && analyticsData?.households_covered_d2d !== null ? formatNumber(analyticsData.households_covered_d2d) : '0')}
                  </span>
                </div>
              )}

              {/* GPs with Identified Asset Gaps - Hidden in GP view */}
              {activeScope !== 'GPs' && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', color: '#6b7280' }}>GPs with Identified Asset Gaps</span>
                    <InfoTooltip tooltipKey="GPS_WITH_ASSET_GAPS" size={14} color="#6b7280" />
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                    {loadingAnalytics ? '...' : (analyticsData?.annual_overview?.gps_with_asset_gaps !== undefined && analyticsData?.annual_overview?.gps_with_asset_gaps !== null ? formatNumber(analyticsData.annual_overview.gps_with_asset_gaps) : '0')}
                  </span>
                </div>
              )}

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
                    <button
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      Send notice
                    </button>
                    {/* <button
                      onClick={() => { if (survey) { setEditSurveyId(survey.id); setShowEditModal(true); } }}
                      disabled={!hasData}
                      title={hasData ? 'Edit GP Master Data' : 'No data to edit'}
                      style={{
                        padding: '6px',
                        backgroundColor: hasData ? '#f3f4f6' : '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        cursor: hasData ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: hasData ? 1 : 0.6
                      }}
                    >
                      <Edit style={{ width: '16px', height: '16px', color: '#374151' }} />
                    </button> */}

                    <button
                      onClick={() => hasData && handleDownloadPDF(survey.id)}
                      disabled={!hasData}
                      title={hasData ? 'Download PDF' : 'No data to download'}
                      style={{
                        padding: '6px',
                        backgroundColor: hasData ? '#f3f4f6' : '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        cursor: hasData ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: hasData ? 1 : 0.6
                      }}
                    >
                      <Download style={{ width: '16px', height: '16px', color: '#374151' }} />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit GP Master Data modal */}
      {/* <EditGPMasterModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditSurveyId(null); }}
        surveyId={editSurveyId}
        gpName={selectedLocation}
        onSuccess={() => { fetchGpSurveys(); fetchAnalytics(); }}
        vdoGPId={selectedGPId}
      /> */}

      {/* Coverage Table Section - Only for State, Districts, and Blocks */}
      {activeScope !== 'GPs' && (
        <div style={{
          backgroundColor: 'white',
          padding: '14px',
          marginLeft: '16px',
          marginRight: '16px',
          marginTop: '16px',
          borderRadius: '8px',
          border: '1px solid lightgray'
        }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 5px'
            }}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              marginBottom: '12px'
            }}>
              {activeScope === 'State' ? 'District' : activeScope === 'Districts' ? 'Block' : 'GP'} Wise Coverage
            </h3>
            <h3>
              <button
                onClick={tableDataDownload}
                type="button"
                title="Download Data"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: '#10B981',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <Download style={{ width: '20px', height: '20px' }} />
              </button>
            </h3>
          </div>




          {/* Table */}
          {(() => {
            const coverageData = activeScope === 'State'
              ? analyticsData?.district_wise_coverage || []
              : activeScope === 'Districts'
                ? analyticsData?.block_wise_coverage || []
                : analyticsData?.gp_wise_coverage || [];


            // 🔥 Dynamic Column Sorting
            const sortedCoverageData = [...coverageData].sort((a, b) => {
              const { key, direction } = sortConfig;

              let valueA = a[key];
              let valueB = b[key];

              if (valueA == null) valueA = '';
              if (valueB == null) valueB = '';

              // String sorting
              if (typeof valueA === 'string') {
                const result = valueA.localeCompare(valueB);
                return direction === 'asc' ? result : -result;
              }

              // Number sorting
              const result = Number(valueA) - Number(valueB);
              return direction === 'asc' ? result : -result;
            });

            if (coverageData.length === 0) {

              return (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '14px'
                }}>
                  {loadingAnalytics ? 'Loading...' : 'No coverage data available'}
                </div>
              );
            }
            const gridColumns =
              activeScope === 'Blocks'
                ? '3fr  1fr 60px'
                : '2fr 1fr 1fr 1fr 1.5fr 60px';
            return (
              <div style={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                <div style={{
                  minWidth: '600px',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  overflowX: 'auto'
                }}>
                  {/* Table Header - Sticky */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: gridColumns,
                    backgroundColor: '#f9fafb',
                    padding: '12px 16px',
                    borderBottom: '1px solid #e5e7eb',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    <div
                      onClick={() => handleSort('geography_name')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                      {activeScope === 'State' ? 'District' : activeScope === 'Districts' ? 'Block' : 'GP'} Name
                      <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                    </div>
                    {activeScope !== 'Blocks' && (
                      <div
                        onClick={() => handleSort('total_gps')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer'
                        }}>
                        Total {activeScope === 'State' || activeScope === 'Districts' ? 'GPs' : 'Gps'}
                        <InfoTooltip tooltipKey="TOTAL_GPS" size={14} color="#9ca3af" />
                        <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                      </div>)}
                    {activeScope !== 'Blocks' && (
                      <div
                        onClick={() => handleSort('gps_with_data')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer'
                        }}>
                        {activeScope === 'State' || activeScope === 'Districts' ? 'GPs' : 'Villages'} with Data
                        <InfoTooltip tooltipKey="GPS_WITH_DATA" size={14} color="#9ca3af" />
                        <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                      </div>)}

                    {activeScope !== 'Blocks' && (
                      <div
                        onClick={() => handleSort('coverage_percentage')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer'
                        }}>
                        Coverage %
                        <InfoTooltip tooltipKey="COVERAGE_PERCENTAGE" size={14} color="#9ca3af" />
                        <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                      </div>
                    )}

                    <div
                      onClick={() => handleSort('master_data_status')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                      Status
                      <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Action
                    </div>
                  </div>

                  {/* Table Rows */}
                  {sortedCoverageData.map((item, index) => (
                    <div key={item.geography_id || index} style={{
                      display: 'grid',
                      gridTemplateColumns: gridColumns,
                      padding: '12px 16px',
                      borderBottom: index < sortedCoverageData.length - 1 ? '1px solid #e5e7eb' : 'none',
                      backgroundColor: 'white',
                      transition: 'background-color 0.2s'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                        {item.geography_name}
                      </div>
                      {activeScope !== 'Blocks' && (
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {formatNumber(item.total_gps || 0)}
                        </div>
                      )}
                      {activeScope !== 'Blocks' && (
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {formatNumber(item.gps_with_data || 0)}
                        </div>
                      )}
                      {activeScope !== 'Blocks' && (
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {item.coverage_percentage ? `${item.coverage_percentage}%` : '0%'}
                        </div>)}
                      <div style={{ fontSize: '14px', color: '#111827' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: item.master_data_status === 'Available' ? '#d1fae5' : '#fee2e2',
                          color: item.master_data_status === 'Available' ? '#065f46' : '#991b1b',
                          fontSize: '12px'
                        }}>
                          {item.master_data_status || 'Not Available'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDownloadAnnualSurveys(item)}
                          disabled={downloadingId === item.geography_id}
                          title="Download Data"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            cursor: downloadingId === item.geography_id ? 'wait' : 'pointer',
                            color: '#374151'
                          }}
                        >
                          <Download style={{ width: '18px', height: '18px' }} />
                        </button>
                      </div>
                    </div>

                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default VillageMasterContent;