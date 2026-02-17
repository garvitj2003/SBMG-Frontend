import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, ChevronDown, ChevronRight, Calendar, List, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock , Plus, X, Star, User} from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient, { noticesAPI } from '../../../services/api';
import LocationDisplay from '../../common/LocationDisplay';
import { useVDOLocation } from '../../../context/VDOLocationContext';
import { InfoTooltip } from '../../common/Tooltip';

const VDOComplaintsContent = () => {
  // VDO Location context - fixed district, block, and GP
  const {
    vdoDistrictId,
    vdoDistrictName,
    vdoBlockId,
    vdoBlockName,
    vdoGPId,
    vdoGPName,
    getLocationPath,
  } = useVDOLocation();

  // VDO: Always works at villages level (no geo tabs)
  const activeScope = 'GPs';
  const selectedLocation = vdoGPName || 'Village';
  const selectedLocationId = vdoGPId;
  const dropdownLevel = 'villages';
  const selectedGPForHierarchy = vdoGPId ? { id: vdoGPId, name: vdoGPName } : null;
  const selectedDistrictForHierarchy = vdoDistrictId ? { id: vdoDistrictId, name: vdoDistrictName } : null;
  const selectedBlockForHierarchy = vdoBlockId ? { id: vdoBlockId, name: vdoBlockName } : null;
  
  // No-op functions for VDO (location is fixed)
  const setActiveScope = () => {}; // No-op for VDO
  const setDropdownLevel = () => {}; // No-op for VDO
  const setSelectedGPForHierarchy = () => {}; // No-op for VDO
  const setSelectedDistrictForHierarchy = () => {}; // No-op for VDO
  const setSelectedBlockId = () => {}; // No-op for VDO
  const setSelectedBlockForHierarchy = () => {}; // No-op for VDO
  const setSelectedLocation = () => {}; // No-op for VDO
  const setSelectedLocationId = () => {}; // No-op for VDO
  const setSelectedGPId = () => {}; // No-op for VDO
  
  // Context functions for useCallback compatibility (VDO doesn't have these in context)
  const contextTrackTabChange = undefined;
  const contextTrackDropdownChange = undefined;
  const contextUpdateLocationSelection = undefined;
  const contextGetCurrentLocationInfo = undefined;

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
  
  const getCurrentLocationInfo = useCallback(() => {
    if (typeof contextGetCurrentLocationInfo === 'function') {
      return contextGetCurrentLocationInfo();
    }
    return {
      scope: activeScope,
      location: selectedLocation,
      districtId: vdoDistrictId,
      blockId: vdoBlockId,
      gpId: vdoGPId
    };
  }, [contextGetCurrentLocationInfo, activeScope, selectedLocation, vdoDistrictId, vdoBlockId, vdoGPId]);
  
  const updateLocationSelection = useCallback((scope, location, locationId, districtId, blockId, gpId, changeType) => {
    console.log('🔄 updateLocationSelection called:', { scope, location, locationId, districtId, blockId, gpId, changeType });
    if (typeof contextUpdateLocationSelection === 'function') {
      contextUpdateLocationSelection(scope, location, locationId, districtId, blockId, gpId, changeType);
    }
  }, [contextUpdateLocationSelection]);

  // Local state for UI controls
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [loadingGPs, setLoadingGPs] = useState(false);

  // Complaints specific state
  const [activeFilter, setActiveFilter] = useState('Open');
  const [searchTerm, setSearchTerm] = useState('');

  // Raise Complaint Modal state
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [complaintCategories, setComplaintCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [villages, setVillages] = useState([]);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  
  // Form state
  const [complaintForm, setComplaintForm] = useState({
    complaintTypeId: '',
    details: '',
    phone_number: '',
    districtId: '',
    blockId: '',
    gpId: '',
    village: '',
    wardArea: ''
  });

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Complaints list data state from API
  const [complaintsListData, setComplaintsListData] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintsError, setComplaintsError] = useState(null);

  // Date selection state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null); // null means not selected
  const [selectedDay, setSelectedDay] = useState(null); // null means not selected
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectionStep, setSelectionStep] = useState('year'); // 'year', 'month', 'day'
  
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
  const handleDateKeyDown = (event) => {
    if (event.key !== 'Tab') {
      event.preventDefault();
    }
  };

// BDO can only view GPs

  const filterButtons = ['Open', 'Verified', 'Resolved', 'Closed'];

  // Predefined date ranges
  const dateRanges = [
    { label: 'Today', value: 'today', days: 0 },
    { label: 'Yesterday', value: 'yesterday', days: 1 },
    { label: 'Last 7 Days', value: 'last7days', days: 7 },
    { label: 'Last 30 Days', value: 'last30days', days: 30 },
    { label: 'Last 60 Days', value: 'last60days', days: 60 },
    { label: 'Custom', value: 'custom', days: null }
  ];

  // Months array
  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  // Log current location info whenever it changes
  useEffect(() => {
    const locationInfo = getCurrentLocationInfo();
    console.log('Current Location Info:', locationInfo);
  }, [activeScope, selectedLocation, selectedLocationId, vdoDistrictId, vdoBlockId, vdoGPId, getCurrentLocationInfo]);

  // BDO: Districts are not fetched - district is fixed from /me API
  const fetchDistricts = () => {
    // No-op for CEO - district ID comes from /me API (vdoDistrictId)
    console.log('BDO: Skipping fetchDistricts - using vdoDistrictId:', vdoDistrictId);
  };

  // Fetch blocks from API for a given district
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

  // Fetch gram panchayats from API for a given district & block
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

  // Fetch complaint categories
  const fetchComplaintCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await apiClient.get('/public/complaint-types');
      console.log('Complaint Categories API Response:', response.data);
      setComplaintCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching complaint categories:', error);
      setComplaintCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch villages from API for a given GP
  const fetchVillages = useCallback(async (gpId) => {
    if (!gpId) {
      setVillages([]);
      return;
    }

    try {
      setLoadingVillages(true);
      const response = await apiClient.get('/geography/villages', {
        params: {
          gp_id: gpId,
          skip: 0,
          limit: 100
        }
      });
      console.log('Villages API Response:', response.data);
      setVillages(response.data || []);
    } catch (error) {
      console.error('Error fetching villages:', error);
      setVillages([]);
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  // Handle scope change
  const handleScopeChange = (scope) => {
    console.log('Scope changed to:', scope);
    trackTabChange(scope);
    setActiveScope(scope);
    setShowLocationDropdown(false);
    
    // Use updateLocationSelection like dashboard for proper state management
    if (scope === 'State') {
      // For State scope, set Rajasthan as default and disable dropdown
      updateLocationSelection('State', 'Rajasthan', null, null, null, null, 'tab_change');
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Districts') {
      // Set first district as selected (districts are already loaded)
      if (districts.length > 0) {
        const firstDistrict = districts[0];
        updateLocationSelection('Districts', firstDistrict.name, firstDistrict.id, firstDistrict.id, null, null, 'tab_change');
        fetchBlocks(firstDistrict.id);
      }
      setDropdownLevel('districts');
      setSelectedDistrictForHierarchy(null);
      setSelectedBlockForHierarchy(null);
    } else if (scope === 'Blocks') {
      // BDO: Reset to show block selection
      updateLocationSelection('Blocks', 'Select Block', null, vdoDistrictId, null, null, 'tab_change');
      setGramPanchayats([]);
      setDropdownLevel('blocks');
      setSelectedBlockForHierarchy(null);
      // Blocks are already loaded from vdoDistrictId
    } else if (scope === 'GPs') {
      // BDO: Reset to show GP selection (blocks should already be loaded)
      updateLocationSelection('GPs', 'Select GP', null, vdoDistrictId, null, null, 'tab_change');
      setGramPanchayats([]);
      setDropdownLevel('blocks');
      setSelectedBlockForHierarchy(null);
      // Ensure blocks are loaded for GPs tab
      if (vdoDistrictId && blocks.length === 0) {
        fetchBlocks(vdoDistrictId);
      }
    }
  };

  // Get location options based on current scope and dropdown level
  const getLocationOptions = () => {
    if (false) {
      return districts;
    } else if (false) {
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
          vdoBlockId: selectedBlockForHierarchy?.id,
          filteredGPsCount: filteredGPs.length,
          filteredGPs: filteredGPs
        });
        return filteredGPs;
      }
    }
    return [];
  };

  // Handle hierarchical selection for blocks and GPs
  const handleHierarchicalSelection = (location) => {
    if (false) {
      if (dropdownLevel === 'districts') {
        // District selected, now show blocks
        setSelectedDistrictForHierarchy(location);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        fetchBlocks(location.id);
      } else if (dropdownLevel === 'blocks') {
        // Block selected
        trackDropdownChange(location.name, location.id, selectedDistrictForHierarchy.id);
        updateLocationSelection('Blocks', location.name, location.id, selectedDistrictForHierarchy.id, location.id, null, 'dropdown_change');
        fetchGramPanchayats(selectedDistrictForHierarchy.id, location.id);
        console.log('Selected block ID:', location.id, 'Name:', location.name, 'District ID:', selectedDistrictForHierarchy.id);
        setShowLocationDropdown(false);
      }
    } else if (activeScope === 'GPs') {
      if (dropdownLevel === 'districts') {
        // District selected, now show blocks
        setSelectedDistrictForHierarchy(location);
        setDropdownLevel('blocks');
        setSelectedLocation('Select Block');
        fetchBlocks(location.id);
      } else if (dropdownLevel === 'blocks') {
        // Block selected, now show GPs
        setSelectedBlockForHierarchy(location);
        setDropdownLevel('gps');
        setSelectedLocation('Select GP');
        fetchGramPanchayats(selectedDistrictForHierarchy?.id || vdoDistrictId, location.id);
      } else if (dropdownLevel === 'gps') {
        // GP selected
        trackDropdownChange(location.name, location.id, selectedBlockForHierarchy.id);
        updateLocationSelection('GPs', location.name, location.id, selectedDistrictForHierarchy.id, selectedBlockForHierarchy.id, location.id, 'dropdown_change');
        console.log('Selected GP ID:', location.id, 'Name:', location.name, 'Block ID:', selectedBlockForHierarchy.id, 'District ID:', selectedDistrictForHierarchy.id);
        setShowLocationDropdown(false);
      }
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-location-dropdown]') && 
          !event.target.closest('[data-date-dropdown]') && 
          !event.target.closest('[data-top3-dropdown]') &&
          !event.target.closest('[data-filter-dropdown]')) {
        setShowLocationDropdown(false);
        setShowDateDropdown(false);
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch districts immediately when complaints page loads
  useEffect(() => {
  }, []);

  // Fetch data immediately when complaints tab is selected
  useEffect(() => {
    console.log('🚀 Complaints tab selected - fetching initial data');
    // For State scope, we can call API immediately
    if (false) {
      console.log('📡 Calling initial API for State scope');
      fetchAnalyticsData();
      fetchComplaintsData();
    }
  }, []); // Empty dependency array means this runs only once when component mounts

  // Load additional data based on scope
  useEffect(() => {
    if (activeScope === 'Districts' && districts.length === 0) {
    }
  }, [activeScope]);

  // Helper function to calculate complaint counts from API data
  const calculateComplaintCounts = () => {
    if (!analyticsData?.response) {
      return {
        total: 0,
        open: 0,
        verified: 0,
        resolved: 0,
        disposed: 0
      };
    }

    const counts = {
      total: 0,
      open: 0,
      verified: 0,
      resolved: 0,
      disposed: 0
    };

    analyticsData.response.forEach(item => {
      const status = item.status?.toUpperCase();
      const count = item.count || 0;
      counts.total += count;
      
      switch (status) {
        case 'OPEN':
          counts.open += count;
          break;
        case 'VERIFIED':
          counts.verified += count;
          break;
        case 'RESOLVED':
          counts.resolved += count;
          break;
        case 'CLOSED':
        case 'DISPOSED':
          counts.disposed += count;
          break;
      }
    });

    return counts;
  };

  // Helper function to format numbers
  const formatNumber = (num) => {
    // Display whole numbers with commas for thousands
    return num.toLocaleString();
  };

  // Fetch complaints list from API
  const fetchComplaintsData = useCallback(async () => {
    try {
      setLoadingComplaints(true);
      setComplaintsError(null);

      console.log('🔄 ===== COMPLAINTS LIST API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        vdoDistrictId,
        vdoBlockId,
        vdoGPId,
        startDate,
        endDate
      });

      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', '500');
      params.append('order_by', 'newest');

      // Add date range filters
      if (startDate) {
        params.append('start_date', startDate);
        console.log('📅 Start Date:', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
        console.log('📅 End Date:', endDate);
      }

      // BDO: Only pass gp_id (backend knows district/block from GP)
      if (vdoGPId) {
        params.append('gp_id', vdoGPId);
        console.log('🏡 GP ID:', vdoGPId);
      }

      const url = `/complaints?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      
      const response = await apiClient.get(url);
      
      console.log('✅ Complaints List API Response:', {
        status: response.status,
        count: response.data?.length || 0,
        sample: response.data?.slice(0, 2)
      });
      
      setComplaintsListData(response.data || []);
      console.log('📊 Complaints data set:', response.data?.length || 0, 'complaints');
      console.log('🔄 ===== END COMPLAINTS LIST API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== COMPLAINTS LIST API ERROR =====');
      console.error('Error:', error);
      console.error('🔄 ===== END COMPLAINTS LIST API ERROR =====\n');
      
      setComplaintsError(error.message || 'Failed to fetch complaints data');
      setComplaintsListData([]);
    } finally {
      setLoadingComplaints(false);
    }
  }, [activeScope, vdoDistrictId, vdoBlockId, vdoGPId, startDate, endDate]);

  // Fetch analytics data from API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      setAnalyticsError(null);

      console.log('🔄 ===== COMPLAINTS ANALYTICS API CALL =====');
      console.log('📍 Current State:', {
        activeScope,
        selectedLocation,
        vdoDistrictId,
        vdoBlockId,
        vdoGPId,
        startDate,
        endDate
      });

      // Build query parameters based on selected scope
      const params = new URLSearchParams();

      // Determine level based on active scope
      const level = 'VILLAGE'; // BDO: Always VILLAGE level
      params.append('level', level);
      console.log('📊 Level:', level);

      // Add geography IDs based on selection
      // BDO: Only pass gp_id (backend knows district/block from GP)
      if (vdoGPId) {
        params.append('gp_id', vdoGPId);
        console.log('🏡 GP ID:', vdoGPId);
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

      const url = `/complaints/analytics/geo?${params.toString()}`;
      console.log('🌐 Full API URL:', url);
      console.log('🔗 Complete URL:', `${apiClient.defaults.baseURL}${url}`);
      
      // Check if token exists
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token Status:', token ? 'Present' : 'Missing');
      if (token) {
        console.log('🔑 Token Preview:', token.substring(0, 20) + '...');
      }
      
      const response = await apiClient.get(url);
      
      console.log('✅ Complaints Analytics API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      console.log('📦 Response Data Structure:', {
        geo_type: response.data?.geo_type,
        response_count: response.data?.response?.length,
        sample_data: response.data?.response?.slice(0, 2)
      });
      
      setAnalyticsData(response.data);
      
      // Calculate and log aggregated counts
      const aggregated = {
        total: 0,
        open: 0,
        verified: 0,
        resolved: 0,
        disposed: 0
      };
      
      response.data?.response?.forEach(item => {
        const status = item.status?.toUpperCase();
        const count = item.count || 0;
        aggregated.total += count;
        
        switch (status) {
          case 'OPEN':
            aggregated.open += count;
            break;
          case 'VERIFIED':
            aggregated.verified += count;
            break;
          case 'RESOLVED':
            aggregated.resolved += count;
            break;
          case 'CLOSED':
          case 'DISPOSED':
            aggregated.disposed += count;
            break;
        }
      });
      
      console.log('📈 Aggregated Counts:', aggregated);
      console.log('🔄 ===== END COMPLAINTS ANALYTICS API CALL =====\n');
      
    } catch (error) {
      console.error('❌ ===== COMPLAINTS ANALYTICS API ERROR =====');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.response?.data || error);
      console.error('Status Code:', error.response?.status);
      console.error('🔄 ===== END COMPLAINTS ANALYTICS API ERROR =====\n');
      
      setAnalyticsError(error.message || 'Failed to fetch analytics data');
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [activeScope, selectedLocation, vdoDistrictId, vdoBlockId, vdoGPId, startDate, endDate]);

  // Fetch analytics data for overview section when scope, location, or date range changes
  useEffect(() => {
    console.log('🔄 Analytics useEffect triggered:', {
      activeScope,
      districtsLength: districts.length,
      vdoDistrictId,
      vdoBlockId,
      vdoGPId,
      startDate,
      endDate,
      isCustomRange
    });

    // When Custom is selected, do NOT call API until user picks dates and clicks Apply
    if (isCustomRange && (!startDate || !endDate)) {
      console.log('⏸️ VDO Complaints: Custom selected without dates – skipping API until Apply');
      setAnalyticsError('Select start and end dates, then click Apply');
      setAnalyticsData(null);
      return;
    }
    
    // For State scope, we can call API immediately (no need to wait for districts)
    if (false) {
      console.log('📡 Calling API for State scope');
      fetchAnalyticsData();
      fetchComplaintsData();
      return;
    }
    
    // For other scopes, check if we have the necessary location data loaded
    if (activeScope === 'Districts' && !vdoDistrictId) {
      console.log('⏳ Waiting for district selection');
      return; // Wait for district selection
    }
    if (activeScope === 'Blocks' && !vdoBlockId) {
      console.log('⏳ Waiting for block selection');
      return; // Wait for block selection
    }
    if (false) {
      console.log('⏳ Waiting for GP selection');
      return; // Wait for GP selection
    }
    
    console.log('📡 Calling API for other scopes');
    fetchAnalyticsData();
    fetchComplaintsData();
  }, [activeScope, selectedLocation, vdoDistrictId, vdoBlockId, vdoGPId, startDate, endDate, isCustomRange, fetchComplaintsData]);

  // Date range functions
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  };

  const generateDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Get display text based on selected date range
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

  // Get the current filter type based on what's selected
  const getCurrentFilterType = () => {
    if (selectedDay && selectedMonth) {
      return 'day';
    } else if (selectedMonth) {
      return 'month';
    } else {
      return 'year';
    }
  };

  // Handle year selection
  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setSelectionStep('month');
    console.log(`Year selected: ${year}`);
  };

  // Handle month selection
  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setSelectionStep('day');
    console.log(`Month selected: ${months[month - 1].name} ${selectedYear}`);
  };

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day);
    console.log(`Day selected: ${months[selectedMonth - 1].name} ${day}, ${selectedYear}`);
  };

  // Skip to next step or finish
  const handleSkip = () => {
    if (selectionStep === 'month') {
      setSelectionStep('day');
    } else if (selectionStep === 'day') {
      setShowDateDropdown(false);
    }
  };

  // Finish selection
  const handleFinish = () => {
    setShowDateDropdown(false);
    console.log(`Final selection: ${getCurrentFilterType()} - ${getDateDisplayText()}`);
  };

  // Reset selection
  const handleReset = () => {
    setSelectedMonth(null);
    setSelectedDay(null);
    setSelectionStep('year');
  };

  // Toggle date dropdown on click
  const handleCalendarClick = () => {
    setShowDateDropdown(!showDateDropdown);
    if (!showDateDropdown) {
      setSelectionStep('year');
    }
  };

  // Handle predefined date range selection
  const handleDateRangeSelection = (range) => {
    if (range.value === 'custom') {
      setIsCustomRange(true);
      setSelectedDateRange('Custom');
      setStartDate(null);
      setEndDate(null);
      // Don't close dropdown for custom - let user select dates
    } else {
      setIsCustomRange(false);
      setSelectedDateRange(range.label);
      
      const today = new Date();
      
      // For "Today" and "Yesterday", both start and end dates should be the same
      if (range.value === 'today') {
        // Today: start = today, end = today
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      } else if (range.value === 'yesterday') {
        // Yesterday: start = yesterday, end = yesterday
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setStartDate(yesterday.toISOString().split('T')[0]);
        setEndDate(yesterday.toISOString().split('T')[0]);
      } else {
        // For ranges like "Last 7 Days", "Last 30 Days"
        // start = today - N days, end = today
        const start = new Date(today);
        start.setDate(today.getDate() - range.days);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
      }
      
      setShowDateDropdown(false);
    }
  };

  // Handle custom date selection
  const handleCustomDateSelection = (date) => {
    if (!startDate) {
      setStartDate(date);
    } else if (!endDate) {
      if (new Date(date) >= new Date(startDate)) {
        setEndDate(date);
        setShowDateDropdown(false);
      } else {
        // If end date is before start date, swap them
        setEndDate(startDate);
        setStartDate(date);
        setShowDateDropdown(false);
      }
    }
  };

  // Validate selected day when month or year changes
  useEffect(() => {
    if (selectedMonth && selectedDay) {
      const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      if (selectedDay > daysInSelectedMonth) {
        setSelectedDay(daysInSelectedMonth);
      }
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  // Log date changes for debugging
  useEffect(() => {
    console.log(`Selected date: ${getCurrentFilterType()} - ${getDateDisplayText()}`);
  }, [selectedYear, selectedMonth, selectedDay]);

  // Get dynamic complaint metrics from API data
  const getComplaintMetrics = () => {
    const counts = calculateComplaintCounts();
    
    return [
    {
      title: 'Total Complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.total),
      icon: List,
      color: '#9ca3af',
        trend: 'up',
      tooltipText: 'Total complaints logged for the selected scope and period.',
      chartData: {
        series: [{
            data: [counts.total * 0.8, counts.total * 0.9, counts.total * 0.95, counts.total]
        }],
        options: {
          chart: {
            type: 'area',
            height: 60,
            sparkline: { enabled: false },
            toolbar: { show: false },
            zoom: { enabled: false }
          },
          stroke: { curve: 'smooth', width: 2, colors: ['#6b7280'] },
          fill: {
            type: 'solid',
            opacity: 0.10,
            colors: ['#9ca3af']
          },
          tooltip: { enabled: false },
          grid: { 
            show: false,
            padding: {
              top: -10,
              right: 0,
              bottom: -10,
              left: 0
            }
          },
          xaxis: { 
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
            crosshairs: { show: false }
          },
          yaxis: { 
            show: false,
            labels: { show: false },
              min: counts.total * 0.7,
              max: counts.total * 1.1,
            forceNiceScale: false,
            floating: false
          },
          dataLabels: { enabled: false },
          markers: { size: 0 },
          legend: { show: false }
        }
      }
    },
    {
      title: 'Open Complaints',
        value: loadingAnalytics ? '...' : formatNumber(counts.open),
      icon: List,
      color: '#ef4444',
        trend: 'up',
      tooltipText: 'Complaints that are currently open and awaiting action.',
      chartData: {
        series: [{
            data: [counts.open * 0.85, counts.open * 0.92, counts.open * 0.97, counts.open]
        }],
        options: {
          chart: {
            type: 'area',
            height: 40,
            sparkline: { enabled: true }
          },
          stroke: { curve: 'smooth', width: 2, colors: ['#ef4444'] },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.3,
              opacityTo: 0.05,
              stops: [0, 100]
            }
          },
          tooltip: { enabled: false },
          grid: { show: false },
          xaxis: { labels: { show: false } },
          yaxis: { 
            labels: { show: false },
            min: 0,
              max: counts.open * 1.1
          },
          dataLabels: { enabled: false }
        }
      }
    },
    {
      title: 'Verified',
        value: loadingAnalytics ? '...' : formatNumber(counts.verified),
      icon: List,
      color: '#f59e0b',
        trend: 'up',
      tooltipText: 'Complaints verified by the VDO.',
      chartData: {
        series: [{
            data: [counts.verified * 0.82, counts.verified * 0.89, counts.verified * 0.93, counts.verified]
        }],
        options: {
          chart: {
            type: 'area',
            height: 40,
            sparkline: { enabled: true }
          },
          stroke: { curve: 'smooth', width: 2, colors: ['#f59e0b'] },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.3,
              opacityTo: 0.05,
              stops: [0, 100]
            }
          },
          tooltip: { enabled: false },
          grid: { show: false },
          xaxis: { labels: { show: false } },
          yaxis: { 
            labels: { show: false },
            min: 0,
              max: counts.verified * 1.1
            },
            dataLabels: { enabled: false }
          }
        }
      },
      {
        title: 'Resolved',
        value: loadingAnalytics ? '...' : formatNumber(counts.resolved),
        icon: List,
        color: '#f97316',
        trend: 'up',
      tooltipText: 'Complaints resolved after action was taken.',
        chartData: {
          series: [{
            data: [counts.resolved * 0.8, counts.resolved * 0.88, counts.resolved * 0.92, counts.resolved]
          }],
          options: {
            chart: {
              type: 'area',
              height: 40,
              sparkline: { enabled: true }
            },
            stroke: { curve: 'smooth', width: 2, colors: ['#f97316'] },
            fill: {
              type: 'gradient',
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.05,
                stops: [0, 100]
              }
            },
            tooltip: { enabled: false },
            grid: { show: false },
            xaxis: { labels: { show: false } },
            yaxis: { 
              labels: { show: false },
              min: 0,
              max: counts.resolved * 1.1
          },
          dataLabels: { enabled: false }
        }
      }
    },
    {
      title: 'Disposed',
        value: loadingAnalytics ? '...' : formatNumber(counts.disposed),
      icon: List,
      color: '#14b8a6',
        trend: 'up',
      tooltipText: 'Complaints closed after final disposal or resolution confirmation.',
      chartData: {
        series: [{
            data: [counts.disposed * 0.75, counts.disposed * 0.85, counts.disposed * 0.9, counts.disposed]
        }],
        options: {
          chart: {
            type: 'area',
            height: 40,
            sparkline: { enabled: true }
          },
          stroke: { curve: 'smooth', width: 2, colors: ['#14b8a6'] },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.3,
              opacityTo: 0.05,
              stops: [0, 100]
            }
          },
          tooltip: { enabled: false },
          grid: { show: false },
          xaxis: { labels: { show: false } },
          yaxis: { 
            labels: { show: false },
            min: 0,
              max: counts.disposed * 1.1
          },
          dataLabels: { enabled: false }
        }
      }
    }
  ];
  };

  const complaintMetrics = getComplaintMetrics();

  const normalizeStatusForFilter = (rawStatus) => {
    if (!rawStatus) return '';

    let s = String(rawStatus)
      .toUpperCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Handle common variations
    switch (s) {
      case 'OPEN':
      case 'PENDING':
      case 'PENDING REVIEW':
      case 'NEW':
      case 'AWAITING ACTION':
      case 'AWAITING RESPONSE':
      case 'OPEN COMPLAINT':
        return 'OPEN';

      case 'VERIFIED':
      case 'IN PROGRESS':
      case 'INPROGRESS':
      case 'IN PROGRESS WITH DEO':
      case 'IN PROCESS':
      case 'VERIFICATION PENDING':
      case 'PENDING VERIFICATION':
      case 'UNDER VERIFICATION':
      case 'VERIFICATION COMPLETED':
        return 'VERIFIED';

      case 'RESOLVED':
      case 'RESOLUTION SUBMITTED':
      case 'RESOLUTION IN PROGRESS':
      case 'ACTION TAKEN':
      case 'ADDRESSED':
        return 'RESOLVED';

      case 'CLOSED':
      case 'CLOSE':
      case 'CLOS':
      case 'DISPOSED':
      case 'DISPOSED OFF':
      case 'REJECTED':
      case 'NOT ACTIONABLE':
      case 'INVALID COMPLAINT':
        return 'CLOSED';

      default:
        // Return uppercase version of original if no match
        return s.toUpperCase();
    }
  };

  // Use dynamic complaints data from API, or empty array if loading/error
  // CSV Export Function
  const exportToCSV = () => {
    try {
      // Use filtered complaints so the export respects current filters and search
      const dataToExport = filteredComplaints;
      
      if (dataToExport.length === 0) {
        alert('No complaints to export');
        return;
      }

      // Define CSV headers
      const headers = [
        'Complaint ID',
        'User/Mobile',
        'Type of Complaint',
        'Description',
        'Location (GP)',
        'Village',
        'Block',
        'District',
        'Date of Complaint',
        'Status',
        'Assigned To',
        'Priority',
        'Latitude',
        'Longitude'
      ];

      // Convert data to CSV rows
      const csvRows = dataToExport.map(complaint => [
        complaint.id || 'N/A',
        complaint.submittedBy || 'N/A',
        complaint.title || 'N/A',
        (complaint.description || 'No description').replace(/"/g, '""'), // Escape quotes
        complaint.location || 'N/A',
        complaint.village || 'N/A',
        complaint.block || 'N/A',
        complaint.district || 'N/A',
        complaint.submittedDate || 'N/A',
        complaint.statusDisplay || complaint.status || 'N/A',
        complaint.assignedTo || 'Unassigned',
        complaint.priority || 'Medium',
        complaint.lat || 'N/A',
        complaint.long || 'N/A'
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generate filename with current date and filter
      const date = new Date().toISOString().split('T')[0];
      const filterText = activeFilter ? `_${activeFilter}` : '';
      const filename = `complaints_export${filterText}_${date}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Exported ${dataToExport.length} complaints to ${filename}`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Normalize incoming statuses and compute a normalized status + color to use for filtering and display
  // Deduplicate complaints by ID to avoid duplicate keys
  const uniqueComplaintsMap = new Map();
  complaintsListData.forEach((complaint, idx) => {
    const complaintId = complaint.id;
    if (!uniqueComplaintsMap.has(complaintId)) {
      uniqueComplaintsMap.set(complaintId, { ...complaint, _originalIndex: idx });
    }
  });
  const uniqueComplaintsList = Array.from(uniqueComplaintsMap.values());

  const complaintsData = uniqueComplaintsList.map((complaint, idx) => {
    const rawStatus = complaint.status || 'OPEN';
    const statusNormalized = normalizeStatusForFilter(rawStatus) || 'OPEN';
    const statusDisplay = statusNormalized === 'OPEN' ? 'Open'
      : statusNormalized === 'VERIFIED' ? 'Verified'
      : statusNormalized === 'RESOLVED' ? 'Resolved'
      : statusNormalized === 'CLOSED' ? 'Closed' : rawStatus;

    const statusColor = statusNormalized === 'OPEN' ? '#ef4444'
      : statusNormalized === 'VERIFIED' ? '#f97316'
      : statusNormalized === 'RESOLVED' ? '#8b5cf6'
      : '#10b981';

    return {
      id: `COMP-${complaint.id}`,
      title: complaint.complaint_type || 'N/A',
      description: complaint.description || 'No description',
      status: rawStatus,
      statusNormalized,
      statusDisplay,
      priority: 'Medium', // API doesn't provide priority, using default
      location: complaint.location || `${complaint.village_name}, ${complaint.block_name}`,
      submittedBy: complaint.mobile_number || 'N/A',
      submittedDate: complaint.created_at ? new Date(complaint.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
      assignedTo: complaint.assigned_worker || 'Unassigned',
      statusColor,
      village: complaint.village_name,
      block: complaint.block_name,
      district: complaint.district_name,
      lat: complaint.lat,
      long: complaint.long,
      media: complaint.media_urls || [],
      comments: complaint.comments || []
    };
  });


  const getStatusIcon = (status) => {
    // Handle both old format ("Open") and new API format ("OPEN", "VERIFIED")
    const normalizedStatus = status?.toUpperCase();
    
    switch (normalizedStatus) {
      case 'OPEN':
        return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'VERIFIED':
      case 'IN PROGRESS':
        return <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'RESOLVED':
        return <CheckCircle style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />;
      case 'CLOSED':
      case 'DISPOSED':
        return <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      default:
        return <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#ef4444';
      case 'Medium':
        return '#f59e0b';
      case 'Low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  // Normalize the active filter once
  const normalizedFilterStatus = activeFilter && activeFilter.trim().length > 0
    ? normalizeStatusForFilter(activeFilter).trim().toUpperCase()
    : null;

  const filteredComplaints = complaintsData.filter(complaint => {
    // Get normalized status from complaint (already normalized during mapping)
    const complaintStatusNormalized = (complaint.statusNormalized || normalizeStatusForFilter(complaint.status || 'OPEN'))
      .trim()
      .toUpperCase();
    
    // Only filter if we have a valid filter selection
    const matchesFilter = normalizedFilterStatus && normalizedFilterStatus.length > 0
      ? complaintStatusNormalized === normalizedFilterStatus
      : true; // if no filter selected, show all

    const q = searchTerm?.toLowerCase() || '';
    const matchesSearch = 
      complaint.title.toLowerCase().includes(q) ||
      complaint.description.toLowerCase().includes(q) ||
      complaint.id.toLowerCase().includes(q) ||
      (complaint.location || '').toLowerCase().includes(q) ||
      (complaint.submittedBy || '').toLowerCase().includes(q) ||
      (complaint.submittedDate || '').toLowerCase().includes(q) ||
      (complaint.statusDisplay || complaint.status || '').toLowerCase().includes(q) ||
      (complaint.assignedTo || '').toLowerCase().includes(q) ||
      (complaint.village || '').toLowerCase().includes(q) ||
      (complaint.block || '').toLowerCase().includes(q) ||
      (complaint.district || '').toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  // Debug logging with detailed filter analysis
  const sampleRawStatuses = complaintsListData.slice(0, 5).map(c => c.status);
  console.log('🔍 Complaints Data Debug:', {
    rawDataLength: complaintsListData.length,
    transformedDataLength: complaintsData.length,
    loadingComplaints,
    complaintsError,
    sampleRawStatusesFromAPI: sampleRawStatuses,
    sampleTransformed: complaintsData.slice(0, 3).map(c => ({
      id: c.id,
      rawStatus: c.status,
      normalized: c.statusNormalized,
      display: c.statusDisplay
    })),
    filteredComplaintsLength: filteredComplaints.length,
    activeFilter,
    normalizedFilterStatus,
    searchTerm,
    uniqueStatuses: [...new Set(complaintsData.map(c => c.status))],
    uniqueNormalized: [...new Set(complaintsData.map(c => c.statusNormalized))],
    filterBreakdown: {
      open: complaintsData.filter(c => (c.statusNormalized || normalizeStatusForFilter(c.status)).toUpperCase() === 'OPEN').length,
      verified: complaintsData.filter(c => (c.statusNormalized || normalizeStatusForFilter(c.status)).toUpperCase() === 'VERIFIED').length,
      resolved: complaintsData.filter(c => (c.statusNormalized || normalizeStatusForFilter(c.status)).toUpperCase() === 'RESOLVED').length,
      closed: complaintsData.filter(c => (c.statusNormalized || normalizeStatusForFilter(c.status)).toUpperCase() === 'CLOSED').length
    },
    filteredByStatus: normalizedFilterStatus ? filteredComplaints.length : 'N/A (showing all)',
    filterTest: normalizedFilterStatus ? {
      lookingFor: normalizedFilterStatus,
      foundCount: complaintsData.filter(c => {
        const normalized = (c.statusNormalized || normalizeStatusForFilter(c.status || 'OPEN')).trim().toUpperCase();
        return normalized === normalizedFilterStatus;
      }).length
    } : null
  });

  const activeHierarchyDistrict = selectedDistrictForHierarchy ||
    (vdoDistrictId ? districts.find(d => d.id === vdoDistrictId) : null);

  const blocksForActiveDistrict = activeHierarchyDistrict
    ? blocks.filter(block => block.district_id === activeHierarchyDistrict.id)
    : [];

  const activeHierarchyBlock = selectedBlockForHierarchy ||
    (vdoBlockId ? blocks.find(block => block.id === vdoBlockId) : null);

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
    if (false) {
      trackDropdownChange(district.name, district.id, district.id);
      updateLocationSelection('Districts', district.name, district.id, district.id, null, null, 'dropdown_change');
      fetchBlocks(district.id);
      setShowLocationDropdown(false);
    } else if (false) {
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
        fetchGramPanchayats(selectedDistrictForHierarchy?.id || vdoDistrictId, block.id);
      }
    }
  };

  const handleBlockClick = (block) => {
    if (false) {
      const district = districts.find(d => d.id === (block.district_id || selectedDistrictForHierarchy?.id)) || selectedDistrictForHierarchy;
      const districtId = district?.id || null;
      trackDropdownChange(block.name, block.id, districtId);
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
      fetchGramPanchayats(selectedDistrictForHierarchy?.id || vdoDistrictId, block.id);
    }
  };

  const handleGPClick = (gp) => {
    // BDO: Use fixed district and block from /me API
    trackDropdownChange(gp.name, gp.id, vdoDistrictId, vdoBlockId, gp.id);
    updateLocationSelection('GPs', gp.name, gp.id, vdoDistrictId, vdoBlockId, gp.id, 'dropdown_change');
    setShowLocationDropdown(false);
  };

  useEffect(() => {
    if (!showLocationDropdown) {
      return;
    }

    if ((activeScope === 'Blocks' || activeScope === 'GPs') && districts.length > 0) {
      if (!selectedDistrictForHierarchy) {
        const presetDistrict = (vdoDistrictId && districts.find(d => d.id === vdoDistrictId)) || districts[0];
        if (presetDistrict) {
          setSelectedDistrictForHierarchy(presetDistrict);
          setDropdownLevel(activeScope === 'GPs' && vdoBlockId ? 'gps' : 'blocks');
          fetchBlocks(presetDistrict.id);
        }
      }
    }

    if (activeScope === 'GPs' && selectedDistrictForHierarchy && blocks.length > 0) {
      if (!selectedBlockForHierarchy) {
        const presetBlock = (vdoBlockId && blocks.find(b => b.id === vdoBlockId && b.district_id === selectedDistrictForHierarchy.id))
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
    vdoDistrictId,
    vdoBlockId,
    fetchBlocks,
    fetchGramPanchayats
  ]);

  useEffect(() => {
    if ((activeScope === 'Districts' || activeScope === 'Blocks' || activeScope === 'GPs') && vdoDistrictId) {
      fetchBlocks(vdoDistrictId);
    }
  }, [activeScope, vdoDistrictId, fetchBlocks]);

  useEffect(() => {
    if ((activeScope === 'Blocks' || activeScope === 'GPs') && vdoDistrictId && vdoBlockId) {
      fetchGramPanchayats(vdoDistrictId, vdoBlockId);
    }
  }, [activeScope, vdoDistrictId, vdoBlockId, fetchGramPanchayats]);

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
            Complaints
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

        {/* Error Display */}
        {analyticsError && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            Error loading analytics data: {analyticsError}
          </div>
        )}

        {/* Metrics Cards */}
        <div style={{
          display: 'flex',
          gap: '48px',
          width: '100%',
          justifyContent: 'flex-start',
          flexWrap: 'nowrap'
        }}>
          {complaintMetrics.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              style={{
                flex: '0 1 17%',
                maxWidth: '250px',
                backgroundColor: 'white',
                padding: '18px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '220px',
                overflow: 'hidden'
              }}
            >
              {/* Info icon */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px'
              }}>
                <InfoTooltip
                  text={item.tooltipText}
                  size={16}
                  color="#9ca3af"
                />
              </div>

              {/* Card content */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: item.color
                }}></div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {item.title}
                  </span>
                </div>
              </div>

              {/* Value */}
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '16px'
              }}>
                {item.value}
              </div>

              {/* Chart */}
              <div style={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'flex-end',
                width: '100%',
                paddingRight: '16px',
                paddingBottom: '12px',
                boxSizing: 'border-box'
              }}>
                <div style={{ width: '100%' }}>
                  <Chart
                    options={item.chartData.options}
                    series={item.chartData.series}
                    type="area"
                    height={80}
                    width="100%"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complaints Table Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        marginLeft: '16px',
        marginRight: '16px',
        marginTop: '16px',
        borderRadius: '8px',
        border: '1px solid lightgray'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Complaints
            </h2>
            <span style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {getDateDisplayText()}
            </span>

            {/* Status Filter */}
            <div 
              data-filter-dropdown
              style={{
                position: 'relative',
                minWidth: '140px'
              }}
            >
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151'
                }}
              >
                <span>{activeFilter}</span>
                <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  marginTop: '4px'
                }}>
                  {filterButtons.map((filter) => (
                    <div
                      key={filter}
                      onClick={() => {
                        console.log('🎯 Filter clicked:', filter, 'Normalized:', normalizeStatusForFilter(filter));
                        setActiveFilter(filter);
                        setShowFilterDropdown(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#374151',
                        backgroundColor: activeFilter === filter ? '#f3f4f6' : 'transparent',
                        borderBottom: filter !== filterButtons[filterButtons.length - 1] ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      {filter}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Search Bar */}
            <div style={{
              position: 'relative',
              width: '200px'
            }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>

            <button 
              onClick={exportToCSV}
              style={{
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              
            </button>

          </div>
        </div>

        {/* Complaints Table */}
        <div style={{
          overflowX: 'auto',
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 10
            }}>
              <tr style={{
                borderBottom: '2px solid #e5e7eb'
              }}>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  User
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  Address(GP)
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  Type of complaint
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  Date of complaint
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  position: 'relative'
                }}>
                  Status
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    ↕
                  </div>
                </th>
              </tr>
            </thead>
            <tbody key={`complaints-${activeFilter}-${filteredComplaints.length}`}>
              {loadingComplaints ? (
                <tr>
                  <td colSpan="5" style={{
                    padding: '40px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Loading complaints...
                  </td>
                </tr>
              ) : (complaintsError || filteredComplaints.length === 0) ? (
                <tr>
                  <td colSpan="5" style={{ padding: 0 }}>
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>No data available</div>
                  </td>
                </tr>
              ) : (() => {
                console.log('📊 Rendering table with', filteredComplaints.length, 'complaints. Active filter:', activeFilter, 'Sample statuses:', filteredComplaints.slice(0, 3).map(c => ({ id: c.id, status: c.statusDisplay })));
                return filteredComplaints.map((complaint, index) => (
                  <tr key={complaint.id || `complaint-${index}`} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <div>
                        <div style={{
                          fontWeight: '500',
                          marginBottom: '2px'
                        }}>
                          {complaint.submittedBy || 'N/A'}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {complaint.submittedBy || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {complaint.location || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {complaint.title || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {complaint.submittedDate || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '90%'
                      }}>
                        <div style={{
                          display: 'inline-block',
                          backgroundColor: complaint.statusColor === '#ef4444' ? '#fef2f2' : 
                                         complaint.statusColor === '#f97316' ? '#fff7ed' :
                                         complaint.statusColor === '#8b5cf6' ? '#faf5ff' : '#f0fdf4',
                          color: complaint.statusColor,
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }} title={complaint.status || 'N/A'}>
                          {complaint.statusDisplay || complaint.status || 'N/A'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Scroll Indicator */}
        {filteredComplaints.length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            borderRadius: '0 0 8px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <span>
              {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? 's' : ''} total
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <span>Scroll to see all</span>
              <div style={{
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ↕
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Raise Complaint Modal */}
      {showComplaintModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowComplaintModal(false);
          }
        }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Raise Complaint
              </h2>
              <button
                onClick={() => setShowComplaintModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </button>
            </div>

            {/* Complaint Type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Select Type of Complaint
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={complaintForm.complaintTypeId}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, complaintTypeId: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    backgroundColor: 'white',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select option</option>
                  {complaintCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>

            {/* Details */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Details
              </label>
              <textarea
                value={complaintForm.details}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 100) {
                    setComplaintForm(prev => ({ ...prev, details: value }));
                  }
                }}
                placeholder="Details"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  minHeight: '80px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {complaintForm.details.length}/100
              </div>
            </div>

            {/* Phone Number */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                value={complaintForm.phone_number}
                onChange={(e) => setComplaintForm(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="Phone number"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151'
                }}
              />
            </div>

            {/* District and Block */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {/* District */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  District
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={complaintForm.districtId}
                    onChange={(e) => {
                      const districtId = e.target.value;
                      setComplaintForm(prev => ({
                        ...prev,
                        districtId,
                        blockId: '',
                        gpId: '',
                        village: ''
                      }));
                      if (districtId) {
                        fetchBlocks(districtId);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      backgroundColor: 'white',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>

              {/* Block */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Block
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={complaintForm.blockId}
                    onChange={(e) => {
                      const blockId = e.target.value;
                      setComplaintForm(prev => ({
                        ...prev,
                        blockId,
                        gpId: '',
                        village: ''
                      }));
                      if (blockId && complaintForm.districtId) {
                        fetchGramPanchayats(complaintForm.districtId, blockId);
                      }
                    }}
                    disabled={!complaintForm.districtId}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: complaintForm.districtId ? '#374151' : '#9ca3af',
                      backgroundColor: complaintForm.districtId ? 'white' : '#f9fafb',
                      appearance: 'none',
                      cursor: complaintForm.districtId ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <option value="">Select Block</option>
                    {blocks.filter(b => b.district_id === parseInt(complaintForm.districtId)).map(block => (
                      <option key={block.id} value={block.id}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>
            </div>

            {/* Gram Panchayat */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Gram Panchayat
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={complaintForm.gpId}
                  onChange={(e) => {
                    const gpId = e.target.value;
                    setComplaintForm(prev => ({
                      ...prev,
                      gpId,
                      village: ''
                    }));
                    if (gpId) {
                      fetchVillages(gpId);
                    }
                  }}
                  disabled={!complaintForm.blockId}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: complaintForm.blockId ? '#374151' : '#9ca3af',
                    backgroundColor: complaintForm.blockId ? 'white' : '#f9fafb',
                    appearance: 'none',
                    cursor: complaintForm.blockId ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="">Select Gram Panchayat</option>
                  {gramPanchayats.filter(gp => gp.block_id === parseInt(complaintForm.blockId)).map(gp => (
                    <option key={gp.id} value={gp.id}>
                      {gp.name}
                    </option>
                  ))}
                </select>
                <ChevronDown style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>

            {/* Village and Ward/Area */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Village */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Village
                </label>
                <input
                  type="text"
                  value={complaintForm.village}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, village: e.target.value }))}
                  placeholder="Enter Village"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151'
                  }}
                />
              </div>

              {/* Ward/Area */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Ward/Area
                </label>
                <input
                  type="text"
                  value={complaintForm.wardArea}
                  onChange={(e) => setComplaintForm(prev => ({ ...prev, wardArea: e.target.value }))}
                  placeholder="Enter Ward/Area"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => {
                  setShowComplaintModal(false);
                  setComplaintForm({
                    complaintTypeId: '',
                    details: '',
                    phone_number: '',
                    districtId: '',
                    blockId: '',
                    gpId: '',
                    village: '',
                    wardArea: ''
                  });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setSubmittingComplaint(true);
                    
                    const location = [complaintForm.village, complaintForm.wardArea].filter(Boolean).join(', ');
                    const params = {
                      phone_number: complaintForm.phone_number,
                      description: complaintForm.details,
                      complaint_type_id: complaintForm.complaintTypeId,
                      gp_id: complaintForm.gpId,
                      location
                    };
                    const body = new URLSearchParams(params).toString();
                    
                    await apiClient.post('/complaints/smd/complaints', body, {
                      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                    
                    setComplaintForm({
                      complaintTypeId: '',
                      details: '',
                      phone_number: '',
                      districtId: '',
                      blockId: '',
                      gpId: '',
                      village: '',
                      wardArea: ''
                    });
                    setShowComplaintModal(false);
                    setShowSuccessDialog(true);
                    fetchComplaintsData();
                  } catch (error) {
                    console.error('Error submitting complaint:', error);
                    alert('Failed to submit complaint. Please try again.');
                  } finally {
                    setSubmittingComplaint(false);
                  }
                }}
                disabled={submittingComplaint || !complaintForm.complaintTypeId || !complaintForm.details || !complaintForm.phone_number || !complaintForm.gpId || !(complaintForm.village || complaintForm.wardArea)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (submittingComplaint || !complaintForm.complaintTypeId || !complaintForm.details || !complaintForm.phone_number || !complaintForm.gpId || !(complaintForm.village || complaintForm.wardArea)) ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (submittingComplaint || !complaintForm.complaintTypeId || !complaintForm.details || !complaintForm.phone_number || !complaintForm.gpId || !(complaintForm.village || complaintForm.wardArea)) ? 'not-allowed' : 'pointer',
                  opacity: (submittingComplaint || !complaintForm.complaintTypeId || !complaintForm.details || !complaintForm.phone_number || !complaintForm.gpId || !(complaintForm.village || complaintForm.wardArea)) ? 0.6 : 1
                }}
              >
                {submittingComplaint ? 'Submitting...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '20px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowSuccessDialog(false);
          }
        }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Star Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <Star style={{
                width: '48px',
                height: '48px',
                color: '#f97316',
                fill: '#f97316'
              }} />
            </div>

            {/* Success Message */}
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '24px',
              lineHeight: '1.4'
            }}>
              Your Complaint has been
              <br />
              submitted successfully
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowSuccessDialog(false)}
              style={{
                padding: '12px 32px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%',
                maxWidth: '200px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VDOComplaintsContent;