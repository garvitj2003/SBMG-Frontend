import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, ChevronDown, ChevronRight, Calendar, List, Info, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX } from 'lucide-react';
import Chart from 'react-apexcharts';
import number1 from '../../../assets/images/number1.png';
import number2 from '../../../assets/images/nnumber2.png';
import number3 from '../../../assets/images/number3.png';
import apiClient from '../../../services/api';
import { useBDOLocation } from '../../../context/BDOLocationContext';
import SendNoticeModal from '../common/SendNoticeModal';
import NoDataFound from '../common/NoDataFound';
import { InfoTooltip } from '../../common/Tooltip';


const BDOInspectionContent = () => {
  // Refs to prevent duplicate API calls
  const hasFetchedInitialData = useRef(false);

  // Location state management via shared context
  const {
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedGPId,
    dropdownLevel,
    selectedGPForHierarchy,
    setActiveScope,
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedGPForHierarchy,
    updateLocationSelection: contextUpdateLocationSelection,
    trackTabChange: contextTrackTabChange,
    trackDropdownChange: contextTrackDropdownChange,
    getCurrentLocationInfo: contextGetCurrentLocationInfo,
    bdoDistrictId,
    bdoDistrictName,
    bdoBlockId,
    bdoBlockName,
    loadingBDOData
  } = useBDOLocation();
  
  // BDO always uses their district ID and block ID from /me API
  const selectedDistrictId = bdoDistrictId || null;
  const selectedBlockId = bdoBlockId || null;
  const selectedDistrictForHierarchy = bdoDistrictId ? { id: bdoDistrictId, name: bdoDistrictName } : null;
  const selectedBlockForHierarchy = bdoBlockId ? { id: bdoBlockId, name: bdoBlockName } : null;
  const setSelectedDistrictForHierarchy = () => {}; // No-op for BDO
  const setSelectedBlockForHierarchy = () => {}; // No-op for BDO
  
  // UI controls state
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);

  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePerformance, setActivePerformance] = useState('Time');

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Critical issues data state
  const [criticalIssuesData, setCriticalIssuesData] = useState(null);
  const [loadingCriticalIssues, setLoadingCriticalIssues] = useState(false);
  const [criticalIssuesError, setCriticalIssuesError] = useState(null);

  // Top Performers data state (for inspector-based performers - CEO/BDO/VDO)
  const [topPerformersData, setTopPerformersData] = useState(null);
  const [loadingTopPerformers, setLoadingTopPerformers] = useState(false);
  const [topPerformersError, setTopPerformersError] = useState(null);

  // Top Performers data state (for location-based performers - District/Block/GP)
  const [topPerformersLocationData, setTopPerformersLocationData] = useState(null);
  const [loadingTopPerformersLocation, setLoadingTopPerformersLocation] = useState(false);
  const [topPerformersLocationError, setTopPerformersLocationError] = useState(null);

  // Your Inspections data state
  const [yourInspectionsData, setYourInspectionsData] = useState(null);
  const [loadingYourInspections, setLoadingYourInspections] = useState(false);
  const [yourInspectionsError, setYourInspectionsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Performance Report data state
  const [performanceReportData, setPerformanceReportData] = useState(null);
  const [loadingPerformanceReport, setLoadingPerformanceReport] = useState(false);
  const [performanceReportError, setPerformanceReportError] = useState(null);

  // Top Performers dropdown state
  const [showPerformersDropdown1, setShowPerformersDropdown1] = useState(false);
  const [showPerformersDropdown2, setShowPerformersDropdown2] = useState(false);
  const [showPerformanceReportDropdown, setShowPerformanceReportDropdown] = useState(false);
  const [selectedPerformersFilter1, setSelectedPerformersFilter1] = useState('CEO'); // CEO/BDO/VDO for inspectors
  const [selectedPerformersFilter2, setSelectedPerformersFilter2] = useState('Block'); // BDO: Default to Block (no District)
  const [selectedPerformanceReportFilter, setSelectedPerformanceReportFilter] = useState('Block'); // BDO: Default to Block (no District)

  // Refs to prevent duplicate API calls
  const analyticsCallInProgress = useRef(false);
  const criticalIssuesCallInProgress = useRef(false);
  const topPerformersCallInProgress = useRef(false);
  const topPerformersLocationCallInProgress = useRef(false);
  const yourInspectionsCallInProgress = useRef(false);
  const performanceReportCallInProgress = useRef(false);
  
  // Refs to track previous values and prevent unnecessary API calls
  const prevAnalyticsParams = useRef(null);
  const prevCriticalIssuesParams = useRef(null);
  const prevPerformersFilter1 = useRef(null);
  const prevYourInspectionsParams = useRef(null);
  const prevPerformanceReportParams = useRef(null);
  const prevPerformersLocationParams = useRef(null);

  // Date selection state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectionStep, setSelectionStep] = useState('year');
  
  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState('Today');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isCustomRange, setIsCustomRange] = useState(false);
  
  // My Inspections visibility state
  const [showMyInspections, setShowMyInspections] = useState(false);
  
  // Send Notice Modal state
  const [showSendNoticeModal, setShowSendNoticeModal] = useState(false);
  const [selectedNoticeTarget, setSelectedNoticeTarget] = useState(null);
  const [noticeModuleData, setNoticeModuleData] = useState({
    moduleName: '',
    kpiName: '',
    kpiFigure: ''
  });
  
  const handleDateKeyDown = (event) => {
    if (event.key !== 'Tab') {
      event.preventDefault();
    }
  };

  const scopeButtons = ['GPs']; // BDO can only view GPs
  const performanceButtons = ['Time', 'Location'];

  // Predefined date ranges
  const dateRanges = [
    { label: 'Today', value: 'today', days: 0 },
    { label: 'Yesterday', value: 'yesterday', days: 1 },
    { label: 'Last 7 Days', value: 'last7days', days: 7 },
    { label: 'Last 30 Days', value: 'last30days', days: 30 },
    { label: 'Last 60 Days', value: 'last60days', days: 60 },
    { label: 'Custom', value: 'custom', days: null }
  ];

  // BDO: Districts are not fetched - district is fixed from /me API
  const fetchDistricts = () => {
    // No-op for CEO - district ID comes from /me API (bdoDistrictId)
    console.log('BDO: Skipping fetchDistricts - using bdoDistrictId:', bdoDistrictId);
  };

  // Fetch blocks for a specific district
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

  // Fetch gram panchayats for a specific district & block
  const fetchGramPanchayats = useCallback(async (districtId, blockId) => {
    if (!districtId || !blockId) {
      setGramPanchayats([]);
      return;
    }

    try {
      setLoadingGPs(true);
      const response = await apiClient.get('/geography/grampanchayats', {
        params: {
          district_id: districtId,
          block_id: blockId,
          skip: 0,
          limit: 100
        }
      });
      console.log('GPs API Response:', response.data);
      setGramPanchayats(response.data);
    } catch (error) {
      console.error('Error fetching gram panchayats:', error);
      setGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  }, []);

  // Effect to fetch initial data
  useEffect(() => {
    if (hasFetchedInitialData.current) return;
    
    if (activeScope === 'State') {
      hasFetchedInitialData.current = true;
    }
  }, [activeScope]);

  // Effect to fetch data when scope changes
  useEffect(() => {
    if (activeScope === 'Districts' || activeScope === 'Blocks' || activeScope === 'GPs') {
      if (activeScope !== 'Districts') {
        setBlocks([]);
        setGramPanchayats([]);
      }
    }
  }, [activeScope]);

  useEffect(() => {
    if ((activeScope === 'Districts' || activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId) {
      fetchBlocks(selectedDistrictId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScope, selectedDistrictId]);

  useEffect(() => {
    if ((activeScope === 'Blocks' || activeScope === 'GPs') && selectedDistrictId && selectedBlockId) {
      fetchGramPanchayats(selectedDistrictId, selectedBlockId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScope, selectedDistrictId, selectedBlockId]);

  // Helper functions
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
        return gramPanchayats.filter(gp => gp.block_id === selectedBlockForHierarchy?.id);
      }
    }
    return [];
  };

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
      setSelectedDistrictId?.(district.id);
      setSelectedLocation(district.name);
      setSelectedLocationId?.(district.id);
      fetchBlocks(district.id);
      setShowLocationDropdown(false);
    } else if (activeScope === 'Blocks') {
      setSelectedDistrictForHierarchy?.(district);
      setSelectedBlockForHierarchy?.(null);
      setSelectedLocation('Select Block');
      setDropdownLevel('blocks');
      fetchBlocks(district.id);
    } else if (activeScope === 'GPs') {
      setSelectedDistrictForHierarchy?.(district);
      setSelectedBlockForHierarchy?.(null);
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
      if (district) {
        setSelectedDistrictId?.(district.id);
        setSelectedDistrictForHierarchy?.(district);
      }
      setSelectedBlockId?.(block.id);
      setSelectedBlockForHierarchy?.(block);
      setSelectedLocation(block.name);
      setSelectedLocationId?.(block.id);
      fetchGramPanchayats(district?.id, block.id);
      setShowLocationDropdown(false);
    } else if (activeScope === 'GPs') {
      setSelectedBlockForHierarchy?.(block);
      setSelectedLocation('Select GP');
      setDropdownLevel('gps');
      fetchGramPanchayats(selectedDistrictForHierarchy?.id || selectedDistrictId, block.id);
    }
  };

  const handleGPClick = (gp) => {
    const block = blocks.find(b => b.id === (gp.block_id || selectedBlockForHierarchy?.id || selectedBlockId)) || selectedBlockForHierarchy;
    const district = districts.find(d => d.id === (block?.district_id || selectedDistrictForHierarchy?.id || selectedDistrictId)) || selectedDistrictForHierarchy;

    if (district) {
      setSelectedDistrictId?.(district.id);
      setSelectedDistrictForHierarchy?.(district);
    }
    if (block) {
      setSelectedBlockId?.(block.id);
      setSelectedBlockForHierarchy?.(block);
    }

    setSelectedGPId(gp.id);
    setSelectedLocation(gp.name);
    setSelectedLocationId?.(gp.id);
    fetchGramPanchayats(district?.id, block?.id || gp.block_id);
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

  // Date helper functions
  const getDateDisplayText = () => {
    if (isCustomRange && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    } else if (isCustomRange && startDate) {
      const start = new Date(startDate);
      return `${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()} - Select End Date`;
    } else {
      return selectedDateRange;
    }
  };

  const handleCalendarClick = () => {
    setShowDateDropdown(!showDateDropdown);
  };

  const handleDateRangeSelection = (range) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (range.value === 'custom') {
      setIsCustomRange(true);
      setSelectedDateRange('Custom');
      setStartDate(null);
      setEndDate(null);
      // Don't close dropdown for custom - let user select dates
    } else {
      setIsCustomRange(false);
      setSelectedDateRange(range.label);
      
      // For "Today" and "Yesterday", both start and end dates should be the same
      if (range.value === 'today') {
        // Today: start = today, end = today
        setStartDate(todayStr);
        setEndDate(todayStr);
      } else if (range.value === 'yesterday') {
        // Yesterday: start = yesterday, end = yesterday
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setStartDate(yesterday.toISOString().split('T')[0]);
        setEndDate(yesterday.toISOString().split('T')[0]);
      } else if (range.days !== null) {
        // For ranges like "Last 7 Days", "Last 30 Days"
        // start = today - N days, end = today
        const start = new Date(today);
        start.setDate(start.getDate() - range.days);
        const startStr = start.toISOString().split('T')[0];
        setStartDate(startStr);
        setEndDate(todayStr);
      }
      
      // Close dropdown after selection
      setShowDateDropdown(false);
    }
  };

  // Fetch inspection analytics data from API
  const fetchAnalyticsData = useCallback(async () => {
    // Prevent duplicate calls
    if (analyticsCallInProgress.current) {
      console.log('⏸️ Analytics API call already in progress, skipping...');
      return;
    }
    
    try {
      analyticsCallInProgress.current = true;
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      console.log('🔄 ===== INSPECTION ANALYTICS API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        startDate,
        endDate
      });

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on active scope
      const level = 'VILLAGE'; // BDO: Always VILLAGE level
      params.append('level', level);
      console.log('📊 Level:', level);

      // BDO: Only pass gp_id (backend knows district/block from GP)
      if (selectedGPId) {
        params.append('gp_id', selectedGPId);
        console.log('🏡 GP ID:', selectedGPId);
      }

      // Add date range if available
      if (startDate) {
        params.append('start_date', startDate);
        console.log('📅 Start Date:', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
        console.log('📅 End Date:', endDate);
      }

      const url = `/inspections/analytics?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Inspection Analytics API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setAnalyticsData(response.data);
      
      console.log('🔄 ===== END INSPECTION ANALYTICS API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== INSPECTION ANALYTICS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END INSPECTION ANALYTICS API ERROR =====\n');
      
      setAnalyticsError(error.message || 'Failed to fetch analytics data');
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
      analyticsCallInProgress.current = false;
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch critical issues data from API
  const fetchCriticalIssuesData = useCallback(async () => {
    // Prevent duplicate calls
    if (criticalIssuesCallInProgress.current) {
      console.log('⏸️ Critical Issues API call already in progress, skipping...');
      return;
    }
    
    try {
      criticalIssuesCallInProgress.current = true;
      setLoadingCriticalIssues(true);
      setCriticalIssuesError(null);

      console.log('🔄 ===== CRITICAL ISSUES API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        startDate,
        endDate
      });

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // BDO: Only pass gp_id (backend knows district/block from GP)
      if (selectedGPId) {
        params.append('gp_id', selectedGPId);
        console.log('🏡 GP ID:', selectedGPId);
      }

      // Add date range if available
      if (startDate) {
        params.append('start_date', startDate);
        console.log('📅 Start Date:', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
        console.log('📅 End Date:', endDate);
      }

      const url = `/inspections/criticals?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Critical Issues API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setCriticalIssuesData(response.data);
      
      console.log('🔄 ===== END CRITICAL ISSUES API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== CRITICAL ISSUES API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END CRITICAL ISSUES API ERROR =====\n');
      
      setCriticalIssuesError(error.message || 'Failed to fetch critical issues data');
      setCriticalIssuesData(null);
    } finally {
      setLoadingCriticalIssues(false);
      criticalIssuesCallInProgress.current = false;
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch top performers data from API
  const fetchTopPerformersData = useCallback(async (level) => {
    // Prevent duplicate calls
    if (topPerformersCallInProgress.current) {
      console.log('⏸️ Top Performers API call already in progress, skipping...');
      return;
    }
    
    try {
      topPerformersCallInProgress.current = true;
      setLoadingTopPerformers(true);
      setTopPerformersError(null);

      console.log('🔄 ===== TOP PERFORMERS API CALL =====');
      console.log('📍 Level:', level);

      // Map dropdown selection to API level
      let apiLevel = 'DISTRICT';
      if (level === 'Block') {
        apiLevel = 'BLOCK';
      } else if (level === 'GP') {
        apiLevel = 'VILLAGE';
      }

      const url = `/inspections/top-performers?level=${apiLevel}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Top Performers API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setTopPerformersData(response.data);
      
      console.log('🔄 ===== END TOP PERFORMERS API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== TOP PERFORMERS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END TOP PERFORMERS API ERROR =====\n');
      
      setTopPerformersError(error.message || 'Failed to fetch top performers data');
      setTopPerformersData(null);
    } finally {
      setLoadingTopPerformers(false);
      topPerformersCallInProgress.current = false;
    }
  }, []);

  // Fetch Your Inspections data from API
  const fetchYourInspectionsData = useCallback(async (page = 1) => {
    // Prevent duplicate calls
    if (yourInspectionsCallInProgress.current) {
      console.log('⏸️ Your Inspections API call already in progress, skipping...');
      return;
    }
    
    try {
      yourInspectionsCallInProgress.current = true;
      setLoadingYourInspections(true);
      setYourInspectionsError(null);

      console.log('🔄 ===== YOUR INSPECTIONS API CALL =====');
      console.log('📍 Page:', page);

      // Get current year dates
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
        start_date: startDate,
        end_date: endDate
      });

      const url = `/inspections/my?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Your Inspections API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setYourInspectionsData(response.data);
      setCurrentPage(response.data.page || 1);
      setTotalPages(response.data.total_pages || 1);
      
      console.log('🔄 ===== END YOUR INSPECTIONS API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== YOUR INSPECTIONS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END YOUR INSPECTIONS API ERROR =====\n');
      
      setYourInspectionsError(error.message || 'Failed to fetch your inspections data');
      setYourInspectionsData(null);
    } finally {
      setLoadingYourInspections(false);
      yourInspectionsCallInProgress.current = false;
    }
  }, []);

  // Fetch top performers by location (District/Block/GP) from analytics API
  const fetchTopPerformersLocationData = useCallback(async (level) => {
    // Prevent duplicate calls
    if (topPerformersLocationCallInProgress.current) {
      console.log('⏸️ Top Performers Location API call already in progress, skipping...');
      return;
    }
    
    try {
      topPerformersLocationCallInProgress.current = true;
      setLoadingTopPerformersLocation(true);
      setTopPerformersLocationError(null);

      console.log('🔄 ===== TOP PERFORMERS LOCATION API CALL =====');
      console.log('📍 Level:', level);

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Map dropdown selection to API level
      let apiLevel = 'DISTRICT';
      if (level === 'Block') {
        apiLevel = 'BLOCK';
      } else if (level === 'GP') {
        apiLevel = 'VILLAGE';
      }
      params.append('level', apiLevel);
      console.log('📊 Level:', apiLevel);

      // BDO: Only pass gp_id when not DISTRICT level (API: do not send IDs when level is DISTRICT)
      if (apiLevel !== 'DISTRICT' && selectedGPId) {
        params.append('gp_id', selectedGPId);
        console.log('🏡 GP ID:', selectedGPId);
      }

      // Add date range if available
      if (startDate) {
        params.append('start_date', startDate);
        console.log('📅 Start Date:', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
        console.log('📅 End Date:', endDate);
      }

      const url = `/inspections/analytics?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Top Performers Location API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setTopPerformersLocationData(response.data);
      
      console.log('🔄 ===== END TOP PERFORMERS LOCATION API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== TOP PERFORMERS LOCATION API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END TOP PERFORMERS LOCATION API ERROR =====\n');
      
      setTopPerformersLocationError(error.message || 'Failed to fetch top performers location data');
      setTopPerformersLocationData(null);
    } finally {
      setLoadingTopPerformersLocation(false);
      topPerformersLocationCallInProgress.current = false;
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Fetch Performance Report data from API
  const fetchPerformanceReportData = useCallback(async (level) => {
    // Prevent duplicate calls
    if (performanceReportCallInProgress.current) {
      console.log('⏸️ Performance Report API call already in progress, skipping...');
      return;
    }
    
    try {
      performanceReportCallInProgress.current = true;
      setLoadingPerformanceReport(true);
      setPerformanceReportError(null);

      console.log('🔄 ===== PERFORMANCE REPORT API CALL =====');
      console.log('📍 Current State:', {
        level,
        activeScope,
        selectedLocation,
        selectedDistrictId,
        selectedBlockId,
        selectedGPId,
        startDate,
        endDate
      });

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Map dropdown selection to API level
      let apiLevel = 'DISTRICT';
      if (level === 'Block') {
        apiLevel = 'BLOCK';
      } else if (level === 'GP') {
        apiLevel = 'VILLAGE';
      }
      params.append('level', apiLevel);
      console.log('📊 Level:', apiLevel);

      // BDO: Only pass gp_id (backend knows district/block from GP)
      if (selectedGPId) {
        params.append('gp_id', selectedGPId);
        console.log('🏡 GP ID:', selectedGPId);
      }

      // Add date range if available
      if (startDate) {
        params.append('start_date', startDate);
        console.log('📅 Start Date:', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
        console.log('📅 End Date:', endDate);
      }

      const url = `/inspections/performance-report?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Performance Report API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      setPerformanceReportData(response.data);
      
      console.log('🔄 ===== END PERFORMANCE REPORT API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== PERFORMANCE REPORT API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END PERFORMANCE REPORT API ERROR =====\n');
      
      setPerformanceReportError(error.message || 'Failed to fetch performance report data');
      setPerformanceReportData(null);
    } finally {
      setLoadingPerformanceReport(false);
      performanceReportCallInProgress.current = false;
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Effect to fetch analytics when scope or location changes
  // Use refs to track previous values and only call API when relevant values actually change
  useEffect(() => {
    // When Custom is selected, do NOT call API until user picks dates and clicks Apply
    if (isCustomRange && (!startDate || !endDate)) {
      setAnalyticsError('Select start and end dates, then click Apply');
      setAnalyticsData(null);
      return;
    }

    const currentParams = { activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate };
    if (!prevAnalyticsParams.current) {
      // First render - initialize and fetch
      prevAnalyticsParams.current = currentParams;
      fetchAnalyticsData();
      return;
    }
    
    const hasChanged = 
      prevAnalyticsParams.current.activeScope !== currentParams.activeScope ||
      prevAnalyticsParams.current.selectedDistrictId !== currentParams.selectedDistrictId ||
      prevAnalyticsParams.current.selectedBlockId !== currentParams.selectedBlockId ||
      prevAnalyticsParams.current.selectedGPId !== currentParams.selectedGPId ||
      prevAnalyticsParams.current.startDate !== currentParams.startDate ||
      prevAnalyticsParams.current.endDate !== currentParams.endDate;
    
    if (hasChanged) {
      prevAnalyticsParams.current = currentParams;
      fetchAnalyticsData();
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate, isCustomRange]);

  // Effect to fetch critical issues when scope or location changes
  useEffect(() => {
    const currentParams = { activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate };
    if (!prevCriticalIssuesParams.current) {
      // First render - initialize and fetch
      prevCriticalIssuesParams.current = currentParams;
      fetchCriticalIssuesData();
      return;
    }
    
    const hasChanged = 
      prevCriticalIssuesParams.current.activeScope !== currentParams.activeScope ||
      prevCriticalIssuesParams.current.selectedDistrictId !== currentParams.selectedDistrictId ||
      prevCriticalIssuesParams.current.selectedBlockId !== currentParams.selectedBlockId ||
      prevCriticalIssuesParams.current.selectedGPId !== currentParams.selectedGPId ||
      prevCriticalIssuesParams.current.startDate !== currentParams.startDate ||
      prevCriticalIssuesParams.current.endDate !== currentParams.endDate;
    
    if (hasChanged) {
      prevCriticalIssuesParams.current = currentParams;
      fetchCriticalIssuesData();
    }
  }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Effect to fetch top performers data when dropdown selection changes
  useEffect(() => {
    if (prevPerformersFilter1.current === null) {
      // First render - initialize and fetch
      prevPerformersFilter1.current = selectedPerformersFilter1;
      const level = mapRoleToLevel(selectedPerformersFilter1);
      fetchTopPerformersData(level);
      return;
    }
    
    if (prevPerformersFilter1.current !== selectedPerformersFilter1) {
      prevPerformersFilter1.current = selectedPerformersFilter1;
      // Map CEO/BDO/VDO to District/Block/GP for API call
      const level = mapRoleToLevel(selectedPerformersFilter1);
      fetchTopPerformersData(level);
    }
  }, [selectedPerformersFilter1]);

  // Effect to fetch Your Inspections data when component mounts (only once)
  useEffect(() => {
    if (!prevYourInspectionsParams.current) {
      // Only fetch on initial mount
      prevYourInspectionsParams.current = true; // Just mark as initialized
      fetchYourInspectionsData(1);
    }
  }, []);

  // Effect to fetch performance report data when dropdown selection changes
  useEffect(() => {
    const currentParams = { selectedPerformanceReportFilter, activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate };
    if (!prevPerformanceReportParams.current) {
      // First render - initialize and fetch
      prevPerformanceReportParams.current = currentParams;
      fetchPerformanceReportData(selectedPerformanceReportFilter);
      return;
    }
    
    const hasChanged = 
      prevPerformanceReportParams.current.selectedPerformanceReportFilter !== currentParams.selectedPerformanceReportFilter ||
      prevPerformanceReportParams.current.activeScope !== currentParams.activeScope ||
      prevPerformanceReportParams.current.selectedDistrictId !== currentParams.selectedDistrictId ||
      prevPerformanceReportParams.current.selectedBlockId !== currentParams.selectedBlockId ||
      prevPerformanceReportParams.current.selectedGPId !== currentParams.selectedGPId ||
      prevPerformanceReportParams.current.startDate !== currentParams.startDate ||
      prevPerformanceReportParams.current.endDate !== currentParams.endDate;
    
    if (hasChanged) {
      prevPerformanceReportParams.current = currentParams;
      fetchPerformanceReportData(selectedPerformanceReportFilter);
    }
  }, [selectedPerformanceReportFilter, activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Effect to fetch top performers location data when dropdown selection changes
  useEffect(() => {
    const currentParams = { selectedPerformersFilter2, activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate };
    if (!prevPerformersLocationParams.current) {
      // First render - initialize and fetch
      prevPerformersLocationParams.current = currentParams;
      fetchTopPerformersLocationData(selectedPerformersFilter2);
      return;
    }
    
    const hasChanged = 
      prevPerformersLocationParams.current.selectedPerformersFilter2 !== currentParams.selectedPerformersFilter2 ||
      prevPerformersLocationParams.current.activeScope !== currentParams.activeScope ||
      prevPerformersLocationParams.current.selectedDistrictId !== currentParams.selectedDistrictId ||
      prevPerformersLocationParams.current.selectedBlockId !== currentParams.selectedBlockId ||
      prevPerformersLocationParams.current.selectedGPId !== currentParams.selectedGPId ||
      prevPerformersLocationParams.current.startDate !== currentParams.startDate ||
      prevPerformersLocationParams.current.endDate !== currentParams.endDate;
    
    if (hasChanged) {
      prevPerformersLocationParams.current = currentParams;
      fetchTopPerformersLocationData(selectedPerformersFilter2);
    }
  }, [selectedPerformersFilter2, activeScope, selectedDistrictId, selectedBlockId, selectedGPId, startDate, endDate]);

  // Effect to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close all dropdowns when clicking outside
      if (!event.target.closest('[data-dropdown]')) {
        setShowPerformersDropdown1(false);
        setShowPerformersDropdown2(false);
        setShowPerformanceReportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper functions to extract values from analyticsData
  const getAverageScore = () => {
    if (loadingAnalytics) return '...';
    if (analyticsError || !analyticsData || !analyticsData.response || analyticsData.response.length === 0) {
      return '0%';
    }
    
    const scores = analyticsData.response.map(item => item.average_score || 0);
    const sum = scores.reduce((acc, score) => acc + score, 0);
    const average = scores.length > 0 ? sum / scores.length : 0;
    return `${average.toFixed(0)}%`;
  };

  const getTotalInspections = () => {
    if (loadingAnalytics) return '...';
    if (analyticsError || !analyticsData || !analyticsData.response || analyticsData.response.length === 0) {
      return '0';
    }
    
    // Sum up inspections based on geo_type
    const total = analyticsData.response.reduce((acc, item) => {
      if (analyticsData.geo_type === 'DISTRICT') {
        return acc + (item.inspected_blocks || 0);
      } else if (analyticsData.geo_type === 'BLOCK' || analyticsData.geo_type === 'VILLAGE') {
        return acc + (item.inspected_gps || 0);
      }
      return acc;
    }, 0);
    
    return total.toLocaleString();
  };

  const getVillageCoverage = () => {
    if (loadingAnalytics) return '0/0';
    if (analyticsError || !analyticsData || !analyticsData.response || analyticsData.response.length === 0) {
      return '0/0';
    }
    
    const inspectedGPs = analyticsData.response.reduce((acc, item) => acc + (item.inspected_gps || 0), 0);
    const totalGPs = analyticsData.response.reduce((acc, item) => acc + (item.total_gps || 0), 0);
    
    return `${inspectedGPs.toLocaleString()}/${totalGPs.toLocaleString()}`;
  };

  // Helper functions to extract values from criticalIssuesData
  const getCriticalIssuesCount = (issueType) => {
    if (loadingCriticalIssues) return '...';
    if (criticalIssuesError || !criticalIssuesData) {
      return '0';
    }
    
    return criticalIssuesData[issueType]?.toLocaleString() || '0';
  };

  // Helper functions to extract values from topPerformersData
  const getTopPerformers = () => {
    if (loadingTopPerformers) return [];
    if (topPerformersError || !topPerformersData || !Array.isArray(topPerformersData) || topPerformersData.length === 0) {
      return [];
    }
    
    // Get the first item from the response array and return its inspectors
    const firstItem = topPerformersData[0];
    const inspectors = firstItem?.inspectors || [];
    
    // Sort by inspections_count (descending), then by name (ascending) for consistency
    // and limit to exactly top 3 performers
    const sortedInspectors = [...inspectors]
      .sort((a, b) => {
        const countA = a.inspections_count || 0;
        const countB = b.inspections_count || 0;
        // Primary sort: by inspections_count (descending)
        if (countB !== countA) {
          return countB - countA;
        }
        // Secondary sort: by name (ascending) when counts are equal for consistent ordering
        const nameA = (a.inspector_name || '').toLowerCase();
        const nameB = (b.inspector_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      })
      .slice(0, 3); // Limit to exactly top 3
    
    return sortedInspectors;
  };

  // Helper functions to extract top 3 performers by location from analytics data
  const getTopPerformersLocation = () => {
    if (loadingTopPerformersLocation) return [];
    if (topPerformersLocationError || !topPerformersLocationData || !topPerformersLocationData.response) {
      return [];
    }
    
    // Get response array, sort by average_score (descending), then by name (ascending) for consistency
    // and limit to exactly top 3 performers
    const sortedData = [...topPerformersLocationData.response]
      .sort((a, b) => {
        const scoreA = a.average_score || 0;
        const scoreB = b.average_score || 0;
        // Primary sort: by average_score (descending)
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        // Secondary sort: by name (ascending) when scores are equal for consistent ordering
        const nameA = (a.geography_name || '').toLowerCase();
        const nameB = (b.geography_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      })
      .slice(0, 3); // Limit to exactly top 3
    
    return sortedData;
  };

  // Helper functions to extract values from yourInspectionsData
  const getYourInspections = () => {
    if (loadingYourInspections) return [];
    if (yourInspectionsError || !yourInspectionsData || !yourInspectionsData.items) {
      return [];
    }
    
    return yourInspectionsData.items || [];
  };

  // Helper functions to extract values from performanceReportData
  const getPerformanceReportItems = () => {
    if (loadingPerformanceReport) return [];
    if (performanceReportError || !performanceReportData || !performanceReportData.line_items) {
      return [];
    }
    
    return performanceReportData.line_items || [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  // Build notice target for performance report
  const buildNoticeTarget = useCallback((item, type) => {
    if (!item) {
      return null;
    }

    const baseTarget = {
      name: item.geo_name || item.name || 'Location',
      type: type || selectedPerformanceReportFilter,
      districtId: null,
      blockId: null,
      gpId: null,
    };

    if (type === 'District' || selectedPerformanceReportFilter === 'District') {
      baseTarget.districtId = item.geo_id ?? item.id ?? null;
    } else if (type === 'Block' || selectedPerformanceReportFilter === 'Block') {
      baseTarget.blockId = item.geo_id ?? item.id ?? null;
      baseTarget.districtId = selectedDistrictId ?? null;
    } else if (type === 'GP' || selectedPerformanceReportFilter === 'GP') {
      baseTarget.gpId = item.geo_id ?? item.id ?? null;
      baseTarget.blockId = selectedBlockId ?? null;
      baseTarget.districtId = selectedDistrictId ?? null;
    }

    return baseTarget;
  }, [selectedPerformanceReportFilter, selectedDistrictId, selectedBlockId]);

  const handleOpenNoticeModal = useCallback((item, type) => {
    const target = buildNoticeTarget(item, type);
    if (!target) {
      return;
    }

    // Set recipient based on type (CEO for District, BDO for Block, VDO for GP)
    if (target.type === 'District') {
      target.recipient = 'CEO';
    } else if (target.type === 'Block') {
      target.recipient = 'BDO';
    } else if (target.type === 'GP') {
      target.recipient = 'VDO';
    }

    // Set module data for notice template
    setNoticeModuleData({
      moduleName: 'Inspections',
      kpiName: item.geo_name || item.name || 'Performance',
      kpiFigure: item.average_score ? `${item.average_score.toFixed(0)}%` : 'N/A'
    });

    setSelectedNoticeTarget(target);
    setShowSendNoticeModal(true);
  }, [buildNoticeTarget]);

  const handleCloseNoticeModal = useCallback(() => {
    setShowSendNoticeModal(false);
    setSelectedNoticeTarget(null);
  }, []);

  // Handler for opening notice modal from My Inspections
  const handleOpenNoticeModalFromInspection = useCallback((inspection) => {
    if (!inspection) {
      return;
    }

    // Build target for the inspection (GP/Village level)
    const target = {
      name: inspection.village_name || inspection.gp_name || 'Location',
      type: 'GP',
      districtId: inspection.district_id || selectedDistrictId || null,
      blockId: inspection.block_id || selectedBlockId || null,
      gpId: inspection.gp_id || selectedGPId || null,
      recipient: 'VDO'
    };

    // Set module data for notice template
    setNoticeModuleData({
      moduleName: 'Inspections',
      kpiName: `${inspection.village_name || 'Village'} - Inspection`,
      kpiFigure: `Score: ${inspection.overall_score || 0}%, ${inspection.visibly_clean ? 'Clean' : 'Not Clean'}`
    });

    setSelectedNoticeTarget(target);
    setShowSendNoticeModal(true);
  }, [selectedDistrictId, selectedBlockId, selectedGPId]);

  // Handler for downloading PDF with inspection data
  const handleDownloadPDF = useCallback(async (inspection) => {
    try {
      console.log('📥 Downloading PDF for inspection:', inspection);
      
      // Get inspection_id
      const inspectionId = inspection.id || 1;
      
      // Fetch inspection data
      const response = await apiClient.get(`/inspections/${inspectionId}`);
      const inspectionData = response.data;
      
      console.log('✅ Inspection data fetched:', inspectionData);
      
      // Generate PDF
      generatePDF(inspectionData);
      
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  }, []);

  // Function to generate PDF from inspection data
  const generatePDF = (data) => {
    // Helper function to format boolean values
    const formatBoolean = (value) => value ? 'Yes' : 'No';
    
    // Get visibly_clean value - check both top-level and nested locations
    const visiblyClean = data.visibly_clean !== undefined ? data.visibly_clean : 
                         (data.other_items && data.other_items.village_visibly_clean !== undefined ? data.other_items.village_visibly_clean : null);
    
    // Get comments - check multiple possible field names
    const comments = data.comments || data.comment || data.inspector_comments || '';
    
    // Get photos/images - check multiple possible field names and structures
    const photos = data.photos || data.images || data.attachments || data.photo_urls || [];
    const photosArray = Array.isArray(photos) ? photos : (photos ? [photos] : []);
    
    // Create a formatted HTML content for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inspection Report - ${data.village_name || 'Village'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .section { margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 250px 1fr; gap: 10px; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #111827; }
          .yes { color: #10b981; font-weight: 600; }
          .no { color: #ef4444; font-weight: 600; }
          .header { text-align: center; margin-bottom: 30px; }
          .date { color: #6b7280; font-size: 14px; }
          .comments-section { background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-top: 10px; }
          .comments-text { color: #111827; white-space: pre-wrap; word-wrap: break-word; }
          .photos-section { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 10px; }
          .photo-item { border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
          .photo-item img { width: 100%; height: 200px; object-fit: cover; display: block; }
          .photo-caption { padding: 8px; font-size: 12px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Inspection Report</h1>
          <p class="date">Inspection Date: ${data.date || 'N/A'}</p>
        </div>

        <div class="section">
          <h2>Basic Information</h2>
          <div class="info-grid">
            <div class="label">Village Name:</div>
            <div class="value">${data.village_name || 'N/A'}</div>
            <div class="label">Block Name:</div>
            <div class="value">${data.block_name || 'N/A'}</div>
            <div class="label">District Name:</div>
            <div class="value">${data.district_name || 'N/A'}</div>
            <div class="label">Officer Name:</div>
            <div class="value">${data.officer_name || 'N/A'}</div>
            <div class="label">Officer Role:</div>
            <div class="value">${data.officer_role || 'N/A'}</div>
            <div class="label">Start Time:</div>
            <div class="value">${data.start_time ? new Date(data.start_time).toLocaleString() : 'N/A'}</div>
            <div class="label">Register Maintenance:</div>
            <div class="value ${data.register_maintenance ? 'yes' : 'no'}">${formatBoolean(data.register_maintenance)}</div>
            ${visiblyClean !== null ? `
            <div class="label">Visibly Clean:</div>
            <div class="value ${visiblyClean ? 'yes' : 'no'}">${formatBoolean(visiblyClean)}</div>
            ` : ''}
            <div class="label">Remarks:</div>
            <div class="value">${data.remarks || 'N/A'}</div>
          </div>
        </div>

        ${data.household_waste ? `
        <div class="section">
          <h2>Household Waste Collection</h2>
          <div class="info-grid">
            <div class="label">Waste Collection Frequency:</div>
            <div class="value">${data.household_waste.waste_collection_frequency || 'N/A'}</div>
            <div class="label">Dry-Wet Vehicle Segregation:</div>
            <div class="value ${data.household_waste.dry_wet_vehicle_segregation ? 'yes' : 'no'}">${formatBoolean(data.household_waste.dry_wet_vehicle_segregation)}</div>
            <div class="label">Covered Collection in Vehicles:</div>
            <div class="value ${data.household_waste.covered_collection_in_vehicles ? 'yes' : 'no'}">${formatBoolean(data.household_waste.covered_collection_in_vehicles)}</div>
            <div class="label">Waste Disposed at RRC:</div>
            <div class="value ${data.household_waste.waste_disposed_at_rrc ? 'yes' : 'no'}">${formatBoolean(data.household_waste.waste_disposed_at_rrc)}</div>
            <div class="label">RRC Waste Collection & Disposal Arrangement:</div>
            <div class="value ${data.household_waste.rrc_waste_collection_and_disposal_arrangement ? 'yes' : 'no'}">${formatBoolean(data.household_waste.rrc_waste_collection_and_disposal_arrangement)}</div>
            <div class="label">Waste Collection Vehicle Functional:</div>
            <div class="value ${data.household_waste.waste_collection_vehicle_functional ? 'yes' : 'no'}">${formatBoolean(data.household_waste.waste_collection_vehicle_functional)}</div>
          </div>
        </div>
        ` : ''}

        ${data.road_and_drain ? `
        <div class="section">
          <h2>Road and Drain Cleaning</h2>
          <div class="info-grid">
            <div class="label">Road Cleaning Frequency:</div>
            <div class="value">${data.road_and_drain.road_cleaning_frequency || 'N/A'}</div>
            <div class="label">Drain Cleaning Frequency:</div>
            <div class="value">${data.road_and_drain.drain_cleaning_frequency || 'N/A'}</div>
            <div class="label">Disposal of Sludge from Drains:</div>
            <div class="value ${data.road_and_drain.disposal_of_sludge_from_drains ? 'yes' : 'no'}">${formatBoolean(data.road_and_drain.disposal_of_sludge_from_drains)}</div>
            <div class="label">Drain Waste Collected on Roadside:</div>
            <div class="value ${data.road_and_drain.drain_waste_colllected_on_roadside ? 'yes' : 'no'}">${formatBoolean(data.road_and_drain.drain_waste_colllected_on_roadside)}</div>
          </div>
        </div>
        ` : ''}

        ${data.community_sanitation ? `
        <div class="section">
          <h2>Community Sanitation Complex (CSC)</h2>
          <div class="info-grid">
            <div class="label">CSC Cleaning Frequency:</div>
            <div class="value">${data.community_sanitation.csc_cleaning_frequency || 'N/A'}</div>
            <div class="label">Electricity and Water Available:</div>
            <div class="value ${data.community_sanitation.electricity_and_water ? 'yes' : 'no'}">${formatBoolean(data.community_sanitation.electricity_and_water)}</div>
            <div class="label">CSC Used by Community:</div>
            <div class="value ${data.community_sanitation.csc_used_by_community ? 'yes' : 'no'}">${formatBoolean(data.community_sanitation.csc_used_by_community)}</div>
            <div class="label">Pink Toilets Cleaning:</div>
            <div class="value ${data.community_sanitation.pink_toilets_cleaning ? 'yes' : 'no'}">${formatBoolean(data.community_sanitation.pink_toilets_cleaning)}</div>
            <div class="label">Pink Toilets Used:</div>
            <div class="value ${data.community_sanitation.pink_toilets_used ? 'yes' : 'no'}">${formatBoolean(data.community_sanitation.pink_toilets_used)}</div>
          </div>
        </div>
        ` : ''}

        ${data.other_items ? `
        <div class="section">
          <h2>Other Items</h2>
          <div class="info-grid">
            <div class="label">Firm Paid Regularly:</div>
            <div class="value ${data.other_items.firm_paid_regularly ? 'yes' : 'no'}">${formatBoolean(data.other_items.firm_paid_regularly)}</div>
            <div class="label">Cleaning Staff Paid Regularly:</div>
            <div class="value ${data.other_items.cleaning_staff_paid_regularly ? 'yes' : 'no'}">${formatBoolean(data.other_items.cleaning_staff_paid_regularly)}</div>
            <div class="label">Firm Provided Safety Equipment:</div>
            <div class="value ${data.other_items.firm_provided_safety_equipment ? 'yes' : 'no'}">${formatBoolean(data.other_items.firm_provided_safety_equipment)}</div>
            <div class="label">Regular Feedback Register Entry:</div>
            <div class="value ${data.other_items.regular_feedback_register_entry ? 'yes' : 'no'}">${formatBoolean(data.other_items.regular_feedback_register_entry)}</div>
            <div class="label">Chart Prepared for Cleaning Work:</div>
            <div class="value ${data.other_items.chart_prepared_for_cleaning_work ? 'yes' : 'no'}">${formatBoolean(data.other_items.chart_prepared_for_cleaning_work)}</div>
            ${visiblyClean === null && data.other_items.village_visibly_clean !== undefined ? `
            <div class="label">Village Visibly Clean:</div>
            <div class="value ${data.other_items.village_visibly_clean ? 'yes' : 'no'}">${formatBoolean(data.other_items.village_visibly_clean)}</div>
            ` : ''}
            <div class="label">Rate Chart Displayed:</div>
            <div class="value ${data.other_items.rate_chart_displayed ? 'yes' : 'no'}">${formatBoolean(data.other_items.rate_chart_displayed)}</div>
          </div>
        </div>
        ` : ''}

        ${comments ? `
        <div class="section">
          <h2>Comments</h2>
          <div class="comments-section">
            <div class="comments-text">${comments}</div>
          </div>
        </div>
        ` : ''}

        ${photosArray.length > 0 ? `
        <div class="section">
          <h2>Photos</h2>
          <div class="photos-section">
            ${photosArray.map((photo, index) => {
              // Handle different photo data structures
              const photoUrl = typeof photo === 'string' ? photo : (photo.url || photo.path || photo.image_url || photo);
              const photoCaption = typeof photo === 'object' && photo.caption ? photo.caption : 
                                 (typeof photo === 'object' && photo.description ? photo.description : `Photo ${index + 1}`);
              return `
                <div class="photo-item">
                  <img src="${photoUrl}" alt="${photoCaption}" onerror="this.style.display='none'; this.nextElementSibling.innerHTML='Image not available';" />
                  <div class="photo-caption">${photoCaption}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <p class="date">Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    printWindow.onload = () => {
      printWindow.print();
      
      // Close the window after printing (optional)
      // printWindow.onafterprint = () => printWindow.close();
    };
  };

  // Dropdown options for Top Performers
  const performersFilterOptions1 = ['CEO', 'BDO', 'VDO']; // For inspector-based performers
  const performersFilterOptions2 = ['Block', 'GP']; // BDO: For location-based performers (no District)

  // Helper function to map role to geographic level
  const mapRoleToLevel = (role) => {
    const roleMapping = {
      'CEO': 'District',
      'BDO': 'Block',
      'VDO': 'GP'
    };
    return roleMapping[role] || role;
  };

  // Helper function to generate chart data from analytics
  const getChartData = () => {
    if (!analyticsData || !analyticsData.response || analyticsData.response.length === 0) {
      return {
        categories: [],
        belowAverage: [],
        aboveAverage: [],
        stateAverage: 0
      };
    }

    const data = analyticsData.response;
    
    // Calculate state average from coverage_percentage
    const totalCoverage = data.reduce((sum, item) => sum + (item.coverage_percentage || 0), 0);
    const stateAverage = data.length > 0 ? totalCoverage / data.length : 0;
    
    // Extract categories (geography names)
    const categories = data.map(item => item.geography_name || 'N/A');
    
    // Split data into above and below average
    const belowAverage = data.map(item => {
      const coverage = item.coverage_percentage || 0;
      return coverage < stateAverage ? coverage : 0;
    });
    
    const aboveAverage = data.map(item => {
      const coverage = item.coverage_percentage || 0;
      return coverage >= stateAverage ? coverage : 0;
    });
    
    return {
      categories,
      belowAverage,
      aboveAverage,
      stateAverage
    };
  };

  // Dropdown click handlers
  const handlePerformersDropdown1Click = () => {
    setShowPerformersDropdown1(!showPerformersDropdown1);
    setShowPerformersDropdown2(false); // Close other dropdown
    setShowPerformanceReportDropdown(false); // Close other dropdown
  };

  const handlePerformersDropdown2Click = () => {
    setShowPerformersDropdown2(!showPerformersDropdown2);
    setShowPerformersDropdown1(false); // Close other dropdown
    setShowPerformanceReportDropdown(false); // Close other dropdown
  };

  const handlePerformanceReportDropdownClick = () => {
    setShowPerformanceReportDropdown(!showPerformanceReportDropdown);
    setShowPerformersDropdown1(false); // Close other dropdown
    setShowPerformersDropdown2(false); // Close other dropdown
  };

  const handlePerformersFilter1Select = (filter) => {
    setSelectedPerformersFilter1(filter);
    setShowPerformersDropdown1(false);
  };

  const handlePerformersFilter2Select = (filter) => {
    setSelectedPerformersFilter2(filter);
    setShowPerformersDropdown2(false);
  };

  const handlePerformanceReportFilterSelect = (filter) => {
    setSelectedPerformanceReportFilter(filter);
    setShowPerformanceReportDropdown(false);
  };

  // Chart data for State Performance Score - Dynamic based on analyticsData
  const chartData = getChartData();
  
  const chartOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 2
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          fontSize: '11px',
          colors: '#6b7280'
        },
        rotate: -45,
        rotateAlways: true
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6b7280'
        }
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    colors: ['#ef4444', '#10b981'],
    legend: {
      show: false
    },
    theme: {
      mode: 'light'
    },
    annotations: {
      yaxis: [
        {
          y: chartData.stateAverage,
          borderColor: '#9ca3af',
          borderWidth: 2,
          strokeDashArray: 5,
          label: {
            text: activeScope === 'State' ? 'District Average' : 
                  activeScope === 'Districts' ? 'Block Average' : 
                  activeScope === 'Blocks' ? 'GP Average' : 
                  'Village Average',
            style: {
              color: '#6b7280',
              fontSize: '12px'
            },
            offsetX: -10
          }
        }
      ]
    }
  };

  const averageLabel = activeScope === 'State' ? 'district average' : 
                        activeScope === 'Districts' ? 'block average' : 
                        activeScope === 'Blocks' ? 'GP average' : 
                        'village average';
  
  const chartSeries = [
    {
      name: `Below ${averageLabel}`,
      data: chartData.belowAverage
    },
    {
      name: `Above ${averageLabel}`, 
      data: chartData.aboveAverage
    }
  ];

  return (
    <div>
      {/* Header Section */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '5px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left side - Dashboard title */}
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            Inspection
          </h1>
        </div>

        {/* Right side - Scope buttons and Location dropdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Scope segmented buttons */}
          <div style={{
            display: 'flex',
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
            padding: '4px',
            gap: '2px'
          }}>
            {scopeButtons.map((scope) => (
              <button
                key={scope}
                onClick={() => setActiveScope(scope)}
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
          <div style={{
            position: 'relative',
            minWidth: '200px'
          }}>
            <button 
              onClick={() => activeScope !== 'State' && setShowLocationDropdown(!showLocationDropdown)}
              disabled={activeScope === 'State'}
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
            
            {/* Location Dropdown Menu - BDO: GPs ONLY (no districts or blocks) */}
            {showLocationDropdown && (
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
                  minWidth: '280px'
                }}
              >
                {/* BDO: Simple GP list from assigned block */}
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
                  ) : gramPanchayats.length === 0 ? (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      No GPs found for your block
                    </div>
                  ) : (
                    gramPanchayats.map((gp) => {
                      const isSelectedGP = selectedLocation === gp.name;
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
              </div>
            )}
          </div>
        </div>
      </div>

   {/* Location Indicator and My Inspections Button OR Back Button - Hidden in GP view */}
   {activeScope !== 'GPs' && (
   !showMyInspections ? (
   <div style={{
        padding: '10px 16px 0px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{
          fontSize: '14px',
          color: '#6B7280',
          fontWeight: '600'
        }}>
          {(() => {
            const rawDistrict = (bdoDistrictName || '').trim();
            const districtLabel = (rawDistrict && rawDistrict.toLowerCase() !== 'district') ? `${bdoDistrictName} DISTRICT` : '';
            const rawBlock = (selectedBlockForHierarchy?.name || bdoBlockName || selectedLocation || '').trim();
            const blockName = (rawBlock && rawBlock.toLowerCase() !== 'block') ? rawBlock : '';
            if (activeScope === 'State') {
              return selectedLocation;
            } else if (activeScope === 'Districts') {
              return districtLabel ? `Rajasthan / ${districtLabel}` : `Rajasthan / ${rawDistrict || selectedLocation}`;
            } else if (activeScope === 'Blocks') {
              const parts = ['Rajasthan', districtLabel, blockName].filter(Boolean);
              return parts.join(' / ');
            } else if (activeScope === 'GPs') {
              const gpName = (selectedLocation || '').trim();
              const parts = ['Rajasthan', districtLabel, blockName, gpName].filter(Boolean);
              return parts.join(' / ');
            }
            return districtLabel ? `Rajasthan / ${districtLabel}` : `Rajasthan / ${rawDistrict || selectedLocation}`;
          })()}
        </span>
        
        {/* My Inspections Button */}
        <button
          onClick={() => setShowMyInspections(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
          }}
        >
          My inspections ({yourInspectionsData?.total || '0'})
        </button>
      </div>
   ) : (
   <div style={{
        padding: '10px 16px 0px 16px',
      }}>
        <button
          onClick={() => setShowMyInspections(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '16px',
            color: '#374151',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          <ChevronRight style={{ width: '18px', height: '18px', transform: 'rotate(180deg)' }} />
          Back
        </button>
      </div>
   )
   )}

      {/* Overview Section - Hide when My Inspections is active (except in GP view) */}
      {(!showMyInspections || activeScope === 'GPs') && (
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
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              • {getDateDisplayText()}
            </span>
          </div>
          <div 
            onClick={handleCalendarClick}
            data-date-dropdown
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280',
              fontSize: '14px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <Calendar style={{ width: '16px', height: '16px' }} />
            <span>{getDateDisplayText()}</span>
            <ChevronDown style={{ width: '16px', height: '16px' }} />
            
            {/* Modern Date Range Picker */}
            {showDateDropdown && (
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  marginTop: '8px',
                  width: '600px',
                  maxWidth: '90vw',
                  display: 'flex',
                  overflow: 'hidden'
                }}
              >
                {/* Left Sidebar - Predefined Ranges */}
                <div style={{
                  width: '200px',
                  backgroundColor: '#f8fafc',
                  borderRight: '1px solid #e2e8f0',
                  padding: '16px 0'
                }}>
                  <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #e2e8f0' }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#1e293b' 
                    }}>
                      Quick Select
                    </h3>
                  </div>

                  {dateRanges.map((range, index) => (
                    <div
                      key={range.value}
                      onClick={() => handleDateRangeSelection(range)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: range.value === 'custom' ? '#10b981' : '#475569',
                        backgroundColor: selectedDateRange === range.label ? '#f0fdf4' : 'transparent',
                        borderLeft: selectedDateRange === range.label ? '3px solid #10b981' : '3px solid transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {range.label}
                    </div>
                  ))}
                </div>

                {/* Right Side - Calendar View */}
                <div style={{
                  flex: 1,
                  padding: '16px',
                  minHeight: '300px'
                }}>
                  {isCustomRange ? (
                    <div>
                      <h3 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#1e293b' 
                      }}>
                        Select Date Range
                      </h3>
                      
                      {/* Custom Date Inputs */}
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '12px', 
                            color: '#64748b', 
                            marginBottom: '4px' 
                          }}>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={startDate || ''}
                          onKeyDown={handleDateKeyDown}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              width: '140px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '12px',
                            color: '#64748b', 
                            marginBottom: '4px' 
                          }}>
                            End Date
                          </label>
                          <input
                            type="date"
                            value={endDate || ''}
                          onKeyDown={handleDateKeyDown}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              width: '140px'
                            }}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        justifyContent: 'flex-end'
                      }}>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const todayStr = today.toISOString().split('T')[0];
                            setStartDate(todayStr);
                            setEndDate(todayStr);
                            setIsCustomRange(false);
                            setSelectedDateRange('Today');
                          }}
                          style={{
                            padding: '8px 16px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: '#f9fafb',
                            color: '#6b7280',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        
                        <button
                          onClick={() => setShowDateDropdown(false)}
                          disabled={!startDate || !endDate}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: startDate && endDate ? '#10b981' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: startDate && endDate ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#1e293b' 
                      }}>
                        Selected Range
                      </h3>
                      
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
                          {selectedDateRange}
                        </div>
                        {startDate && endDate && (
                          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>
                            {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setShowDateDropdown(false)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Statewide Avg Score */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Statewide Avg Score
                </h3>
                <InfoTooltip tooltipKey="AVERAGE_INSPECTION_SCORE" size={16} color="#9ca3af" />
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                {getAverageScore()}
              </div>
            </div>

            {/* Total inspections */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <List style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Total inspections
                  </h3>
                </div>
                <InfoTooltip tooltipKey="TOTAL_INSPECTIONS" size={16} color="#9ca3af" />
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                {getTotalInspections()}
              </div>
            </div>

            {/* Village covered */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Village covered
                </h3>
                <InfoTooltip tooltipKey="INSPECTION_COVERAGE_PERCENTAGE" size={16} color="#9ca3af" />
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                {getVillageCoverage()}
              </div>
            </div>
          </div>

          {/* State Performance Score Chart - Hidden in GP view */}
          {activeScope !== 'GPs' && (
          <div style={{
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {activeScope === 'State' ? 'District performance score' : 
                 activeScope === 'Districts' ? 'Block performance score' : 
                 activeScope === 'Blocks' ? 'GP performance score' : 
                 'Village performance score'}
              </h3>
              
              {/* Legend */}
              <div style={{
                display: 'flex',
                  gap: '6px'
                }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Below {activeScope === 'State' ? 'district average' : 
                           activeScope === 'Districts' ? 'block average' : 
                           activeScope === 'Blocks' ? 'GP average' : 
                           'village average'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Above {activeScope === 'State' ? 'district average' : 
                           activeScope === 'Districts' ? 'block average' : 
                           activeScope === 'Blocks' ? 'GP average' : 
                           'village average'}
                  </span>
                </div>
              </div>
            </div>
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '12px 0'
            }}></div>
            
            {/* Loading State */}
            {loadingAnalytics && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '300px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading chart data...
              </div>
            )}
            
            {/* Error State */}
            {analyticsError && !loadingAnalytics && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '300px',
                color: '#ef4444',
                fontSize: '14px'
              }}>
                Error loading chart data
              </div>
            )}
            
            {/* Chart */}
            {!loadingAnalytics && !analyticsError && chartData.categories.length > 0 && (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={300}
                width="100%"
              />
            )}
            
            {/* Empty State */}
            {!loadingAnalytics && !analyticsError && chartData.categories.length === 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '300px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                No data available for chart
              </div>
            )}
          </div>
          )}
        </div>
      )}

        {/* Bottom Sections - Critical Issues and Top Performers - Hidden in GP view */}
        {!showMyInspections && activeScope !== 'GPs' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: '16px'
        }}>
          {/* Top Critical Issues */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            marginLeft: '16px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 10px 0'
            }}>
              Top Critical Issues
            </h3>
            
            <divider />
            <div style={{
              height: '1px',
              backgroundColor: '#e5e7eb',
              margin: '2px 0'
            }}></div>

            {/* Loading State */}
            {loadingCriticalIssues && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading critical issues...
              </div>
            )}

            {/* Error State */}
            {criticalIssuesError && !loadingCriticalIssues && (
              <NoDataFound size="small" />
            )}

            {/* Data State */}
            {!loadingCriticalIssues && !criticalIssuesError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Issue 1 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '#374151' }}>No Safety Equipment</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('no_safety_equipment')}
                </span>
              </div>
              
              {/* Issue 2 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>CSC without water/Elec.</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('csc_wo_water_or_electricity')}
                </span>
              </div>
              
              {/* Issue 3 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '#374151' }}>Firm Not Paid</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('firm_not_paid')}
                </span>
              </div>
              
              {/* Issue 4 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>Staff Not Paid</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('staff_not_paid')}
                </span>
              </div>
              
              {/* Issue 5 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 12px'
              }}>
                <span style={{ fontSize: '16px', color: '#6b7280' }}>Visibly Not Clean</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {getCriticalIssuesCount('visibly_unclean_village')}
                </span>
              </div>
            </div>
            )}
          </div>

          {/* Top 3 Performers */}
          <div style={{
            backgroundColor: 'white',
            marginRight: '16px',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Top 3 Performers(Officers)
              </h3>
              
              {/* Dropdown */}
              <div 
                data-dropdown
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}
                onClick={handlePerformersDropdown1Click}>
                <span style={{ fontSize: '14px', color: '#374151' }}>{selectedPerformersFilter1}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                
                {/* Dropdown Menu */}
                {showPerformersDropdown1 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    marginTop: '4px',
                    minWidth: '120px'
                  }}>
                    {performersFilterOptions1.map((option) => (
                      <div
                        key={option}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePerformersFilter1Select(option);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: selectedPerformersFilter1 === option ? '#f3f4f6' : 'transparent',
                          borderBottom: option !== performersFilterOptions1[performersFilterOptions1.length - 1] ? '1px solid #f3f4f6' : 'none'
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 1fr 100px',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div>Rank</div>
              <div>Name</div>
              <div>Location</div>
              <div>Inspections</div>
            </div>
            
            {/* Loading State */}
            {loadingTopPerformers && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading top performers...
              </div>
            )}

            {/* Error State */}
            {topPerformersError && !loadingTopPerformers && (
              <NoDataFound size="small" />
            )}

            {/* Data State */}
            {!loadingTopPerformers && !topPerformersError && getTopPerformers().map((performer, index) => {
              const rankImages = [number1, number2, number3];
              const rankImage = rankImages[index] || number3;
              
              return (
                <div key={performer.geo_id || index} style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 1fr 100px',
                  gap: '12px',
                  padding: '12px',
                  alignItems: 'center',
                  borderBottom: index < 2 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                    <img 
                      src={rankImage} 
                      alt={`Rank ${index + 1}`} 
                      style={{ 
                        width: '52px', 
                        height: '52px',
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{performer.inspector_name || 'N/A'}</div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{performer.geo_name || 'N/A'}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{performer.inspections_count || 0}</div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Additional Sections - Top 3 Performers and Performance Report - Hidden in GP view */}
        {!showMyInspections && activeScope !== 'GPs' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '16px',
          marginTop: '16px',
          marginLeft: '16px',
        }}>
          {/* Top 3 Performers - Updated Version */}
          <div style={{
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Top 3 Performers(Locations)
              </h3>
              
              {/* District Dropdown */}
              <div 
                data-dropdown
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}
                onClick={handlePerformersDropdown2Click}>
                <span style={{ fontSize: '14px', color: '#374151' }}>{selectedPerformersFilter2}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                
                {/* Dropdown Menu */}
                {showPerformersDropdown2 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    marginTop: '4px',
                    minWidth: '120px'
                  }}>
                    {performersFilterOptions2.map((option) => (
                      <div
                        key={option}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePerformersFilter2Select(option);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: selectedPerformersFilter2 === option ? '#f3f4f6' : 'transparent',
                          borderBottom: option !== performersFilterOptions2[performersFilterOptions2.length - 1] ? '1px solid #f3f4f6' : 'none'
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 100px',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div>Rank</div>
              <div>{selectedPerformersFilter2}</div>
              <div>Score</div>
            </div>
            
            {/* Loading State */}
            {loadingTopPerformersLocation && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading top performers...
              </div>
            )}

            {/* Error State */}
            {topPerformersLocationError && !loadingTopPerformersLocation && (
              <NoDataFound size="small" />
            )}

            {/* Data State */}
            {!loadingTopPerformersLocation && !topPerformersLocationError && getTopPerformersLocation().map((performer, index) => {
              const rankImages = [number1, number2, number3];
              const rankImage = rankImages[index] || number3;
              
              return (
                <div key={performer.geography_id || index} style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 100px',
                  gap: '12px',
                  padding: '12px',
                  alignItems: 'center',
                  borderBottom: index < 2 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start' }}>
                    <img 
                      src={rankImage} 
                      alt={`Rank ${index + 1}`} 
                      style={{ 
                        width: '50px', 
                        height: '50px',
                        objectFit: 'contain'
                      }} 
                    />
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>{performer.geography_name || 'N/A'}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {performer.average_score ? `${performer.average_score.toFixed(0)}%` : '0%'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Performance Report */}
          <div style={{
            backgroundColor: 'white',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginRight: '16px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Performance report
              </h3>
              
              {/* District Dropdown */}
              <div 
                data-dropdown
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}
                onClick={handlePerformanceReportDropdownClick}>
                <span style={{ fontSize: '14px', color: '#374151' }}>{selectedPerformanceReportFilter}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                
                {/* Dropdown Menu */}
                {showPerformanceReportDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    marginTop: '4px',
                    minWidth: '120px'
                  }}>
                    {performersFilterOptions2.map((option) => (
                      <div
                        key={option}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePerformanceReportFilterSelect(option);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: selectedPerformanceReportFilter === option ? '#f3f4f6' : 'transparent',
                          borderBottom: option !== performersFilterOptions2[performersFilterOptions2.length - 1] ? '1px solid #f3f4f6' : 'none'
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Table Header with Sort Icons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 120px',
              gap: '1px',
              padding: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'start', gap: '4px' }}>
                {selectedPerformanceReportFilter}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Coverage
                <InfoTooltip tooltipKey="INSPECTION_COVERAGE_PERCENTAGE" size={14} color="#6b7280" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div></div>
            </div>
            
            {/* Loading State */}
            {loadingPerformanceReport && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading performance report...
              </div>
            )}

            {/* Error State */}
            {performanceReportError && !loadingPerformanceReport && (
              <NoDataFound size="small" />
            )}

            {/* Performance Data Rows - From API */}
            {!loadingPerformanceReport && !performanceReportError && (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {getPerformanceReportItems().map((item, index) => (
                <div key={item.geo_id || index} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 120px',
                  gap: '1px',
                  padding: '12px',
                  alignItems: 'center',
                  borderBottom: index < getPerformanceReportItems().length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {item.geo_name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {item.coverage_percentage ? `${item.coverage_percentage.toFixed(0)}%` : '0%'}
                  </div>
                  <div>
                    <button
                      onClick={() => handleOpenNoticeModal(item, selectedPerformanceReportFilter)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#374151',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Send notice
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Empty State */}
              {getPerformanceReportItems().length === 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '40px 20px',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  No performance data available
                </div>
              )}
            </div>
            )}
          </div>
        </div>
        )}

        {/* Your Inspections Table - Always visible at bottom */}
        <div style={{
          marginTop: '16px',
          marginLeft: '16px',
          marginRight: '16px',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 20px 0'
            }}>
              {activeScope === 'GPs' ? 'Inspections' : 'My Inspections'} ({yourInspectionsData?.total || '0'})
            </h3>
            
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: activeScope === 'GPs' 
                ? '120px 120px 1.5fr 120px 120px 220px'
                : '120px 1.5fr 1.5fr 120px 120px 220px',
              gap: '16px',
              padding: '12px 16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Date
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              {activeScope === 'GPs' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Inspection by
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                    <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Village Name
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              {activeScope !== 'GPs' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  GP Name
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                    <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Cleaning Score
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Visibly Clean
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▲</span>
                  <span style={{ fontSize: '10px', lineHeight: '1' }}>▼</span>
                </div>
              </div>
              <div>Action</div>
            </div>
            
            {/* Loading State */}
            {loadingYourInspections && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Loading your inspections...
              </div>
            )}

            {/* Error State */}
            {yourInspectionsError && !loadingYourInspections && (
              <NoDataFound size="small" />
            )}

            {/* Data State */}
            {!loadingYourInspections && !yourInspectionsError && (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {getYourInspections().length === 0 ? (
                  <NoDataFound size="small" />
                ) : (
                  getYourInspections().map((inspection, index) => (
                  <div key={inspection.id || index} style={{
                    display: 'grid',
                    gridTemplateColumns: activeScope === 'GPs' 
                      ? '120px 120px 1.5fr 120px 120px 220px'
                      : '120px 1.5fr 1.5fr 120px 120px 220px',
                    gap: '16px',
                    padding: '12px 16px',
                    alignItems: 'center',
                    borderBottom: index < getYourInspections().length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      {formatDate(inspection.date)}
                    </div>
                    {activeScope === 'GPs' && (
                      <div style={{ fontSize: '14px', color: '#374151' }}>
                        {inspection.inspector_role || 'CEO'}
                      </div>
                    )}
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      {inspection.village_name || 'Village name'}
                    </div>
                    {activeScope !== 'GPs' && (
                      <div style={{ fontSize: '14px', color: '#374151' }}>
                        {inspection.gp_name || 'GP name'}
                      </div>
                    )}
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {inspection.overall_score || 0}%
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: inspection.visibly_clean ? '#10b981' : '#ef4444'
                    }}>
                      {inspection.visibly_clean ? 'Yes' : 'No'}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px' 
                    }}>
                      <button
                        onClick={() => handleOpenNoticeModalFromInspection(inspection)}
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
                      <button
                        onClick={() => handleDownloadPDF(inspection)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#374151',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Download style={{ width: '14px', height: '14px' }} />
                        PDF
                      </button>
                    </div>
                  </div>
                  ))
                )}
                
                {/* Pagination */}
                {getYourInspections().length > 0 && totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '20px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <button
                      onClick={() => fetchYourInspectionsData(currentPage - 1)}
                      disabled={currentPage <= 1}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: currentPage <= 1 ? '#f9fafb' : 'white',
                        color: currentPage <= 1 ? '#9ca3af' : '#374151',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Previous
                    </button>
                    
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => fetchYourInspectionsData(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: currentPage >= totalPages ? '#f9fafb' : 'white',
                        color: currentPage >= totalPages ? '#9ca3af' : '#374151',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Send Notice Modal */}
      <SendNoticeModal
        isOpen={showSendNoticeModal}
        onClose={handleCloseNoticeModal}
        target={selectedNoticeTarget}
        onSent={handleCloseNoticeModal}
        moduleName={noticeModuleData.moduleName}
        kpiName={noticeModuleData.kpiName}
        kpiFigure={noticeModuleData.kpiFigure}
      />
      </div>
  );
};

export default BDOInspectionContent;