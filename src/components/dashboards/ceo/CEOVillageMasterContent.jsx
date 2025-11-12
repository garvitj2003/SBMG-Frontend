import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight, Calendar, List, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX, DollarSign, Target, TrendingUp, Database, BarChart3, ArrowUpDown } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient from '../../../services/api';
import { useCEOLocation } from '../../../context/CEOLocationContext';
import SendNoticeModal from '../common/SendNoticeModal';
import NoDataFound from '../common/NoDataFound';
import { InfoTooltip } from '../../common/Tooltip';

const CEOVillageMasterContent = () => {
    // Refs to prevent duplicate API calls
    const hasFetchedInitialData = useRef(false);

    // Location state management via shared context
    const {
        activeScope,
        selectedLocation,
        selectedLocationId,
        selectedBlockId,
        selectedGPId,
        dropdownLevel,
        selectedBlockForHierarchy,
        setActiveScope,
        setSelectedLocation,
        setSelectedLocationId,
        setSelectedBlockId,
        setSelectedGPId,
        setDropdownLevel,
        setSelectedBlockForHierarchy,
        updateLocationSelection: contextUpdateLocationSelection,
        trackTabChange: contextTrackTabChange,
        trackDropdownChange: contextTrackDropdownChange,
        getCurrentLocationInfo: contextGetCurrentLocationInfo,
    ceoDistrictId,
    ceoDistrictName,
    loadingCEOData
    } = useCEOLocation();
  
  // CEO always uses their district ID from /me API
  const selectedDistrictId = ceoDistrictId || null;
  const selectedDistrictForHierarchy = ceoDistrictId ? { id: ceoDistrictId, name: ceoDistrictName } : null;
  const setSelectedDistrictForHierarchy = () => {}; // No-op for CEO
    
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

    // Send Notice Modal state
    const [showSendNoticeModal, setShowSendNoticeModal] = useState(false);
    const [selectedNoticeTarget, setSelectedNoticeTarget] = useState(null);
    const [noticeModuleData, setNoticeModuleData] = useState({
      moduleName: '',
      kpiName: '',
      kpiFigure: ''
    });

    // Annual Survey state
    const [activeFyData, setActiveFyData] = useState([]);
    const [loadingFy, setLoadingFy] = useState(false);

    // Analytics state
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [analyticsError, setAnalyticsError] = useState(null);

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
    const handleDateKeyDown = (event) => {
        if (event.key !== 'Tab') {
            event.preventDefault();
        }
    };
  
  const buildNoticeTarget = useCallback((item) => {
    if (!item) {
      return null;
    }

    const baseTarget = {
      name: item.name,
      type: item.type,
      districtId: null,
      blockId: null,
      gpId: null,
    };

    if (item.type === 'District') {
      baseTarget.districtId = item.id ?? null;
    } else if (item.type === 'Block') {
      baseTarget.blockId = item.id ?? null;
      const matchedBlock = blocks.find((block) => block.id === item.id);
      baseTarget.districtId = matchedBlock?.district_id ?? selectedDistrictId ?? null;
    } else if (item.type === 'GP') {
      baseTarget.gpId = item.id ?? null;
      const matchedGP = gramPanchayats.find((gp) => gp.id === item.id);
      const derivedBlockId = matchedGP?.block_id ?? selectedBlockId ?? null;
      baseTarget.blockId = derivedBlockId;
      const matchedBlock = blocks.find((block) => block.id === derivedBlockId);
      baseTarget.districtId = matchedBlock?.district_id ?? selectedDistrictId ?? null;
    }

    return baseTarget;
  }, [blocks, gramPanchayats, selectedBlockId, selectedDistrictId]);

  const handleOpenNoticeModal = useCallback((item) => {
    const target = buildNoticeTarget(item);
    if (!target) {
      return;
    }

    // Set recipient based on type (CEO for District, BDO for Block)
    if (target.type === 'District') {
      target.recipient = 'CEO';
    } else if (target.type === 'Block') {
      target.recipient = 'BDO';
    }

    // Set module data for notice template
    setNoticeModuleData({
      moduleName: 'Village Master Data',
      kpiName: item.name || 'GP Data',
      kpiFigure: 'N/A'
    });

    setSelectedNoticeTarget(target);
    setShowSendNoticeModal(true);
  }, [buildNoticeTarget]);

  const handleCloseNoticeModal = useCallback(() => {
    setShowSendNoticeModal(false);
    setSelectedNoticeTarget(null);
  }, []);

    const scopeButtons = ['Blocks', 'GPs']; // CEO can only view Blocks and GPs
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
    const generatePDF = (data) => {
        // Create a formatted HTML content for the PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Annual Survey Report - ${data.gp_name || 'GP'}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
                    h2 { color: #374151; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
                    .section { margin-bottom: 20px; }
                    .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 10px; }
                    .label { font-weight: bold; color: #6b7280; }
                    .value { color: #111827; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
                    th { background-color: #f9fafb; font-weight: 600; color: #374151; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .date { color: #6b7280; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Annual Survey Report</h1>
                    <p class="date">Survey Date: ${data.survey_date || 'N/A'}</p>
                </div>

                <div class="section">
                    <h2>Basic Information</h2>
                    <div class="info-grid">
                        <div class="label">GP Name:</div>
                        <div class="value">${data.gp_name || 'N/A'}</div>
                        <div class="label">Block Name:</div>
                        <div class="value">${data.block_name || 'N/A'}</div>
                        <div class="label">District Name:</div>
                        <div class="value">${data.district_name || 'N/A'}</div>
                        <div class="label">Sarpanch Name:</div>
                        <div class="value">${data.sarpanch_name || 'N/A'}</div>
                        <div class="label">Sarpanch Contact:</div>
                        <div class="value">${data.sarpanch_contact || 'N/A'}</div>
                        <div class="label">Number of Ward Panchs:</div>
                        <div class="value">${data.num_ward_panchs || 0}</div>
                    </div>
                </div>

                ${data.vdo ? `
                <div class="section">
                    <h2>VDO Details</h2>
                    <div class="info-grid">
                        <div class="label">Name:</div>
                        <div class="value">${data.vdo.first_name} ${data.vdo.middle_name || ''} ${data.vdo.last_name}</div>
                        <div class="label">Username:</div>
                        <div class="value">${data.vdo.username || 'N/A'}</div>
                        <div class="label">Email:</div>
                        <div class="value">${data.vdo.email || 'N/A'}</div>
                        <div class="label">Date of Joining:</div>
                        <div class="value">${data.vdo.date_of_joining || 'N/A'}</div>
                        <div class="label">Role:</div>
                        <div class="value">${data.vdo.role_name || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.work_order ? `
                <div class="section">
                    <h2>Work Order</h2>
                    <div class="info-grid">
                        <div class="label">Work Order No:</div>
                        <div class="value">${data.work_order.work_order_no || 'N/A'}</div>
                        <div class="label">Date:</div>
                        <div class="value">${data.work_order.work_order_date || 'N/A'}</div>
                        <div class="label">Amount:</div>
                        <div class="value">₹${data.work_order.work_order_amount?.toLocaleString() || 0}</div>
                    </div>
                </div>
                ` : ''}

                ${data.fund_sanctioned ? `
                <div class="section">
                    <h2>Fund Sanctioned</h2>
                    <div class="info-grid">
                        <div class="label">Head:</div>
                        <div class="value">${data.fund_sanctioned.head || 'N/A'}</div>
                        <div class="label">Amount:</div>
                        <div class="value">₹${data.fund_sanctioned.amount?.toLocaleString() || 0}</div>
                    </div>
                </div>
                ` : ''}

                ${data.door_to_door_collection ? `
                <div class="section">
                    <h2>Door to Door Collection</h2>
                    <div class="info-grid">
                        <div class="label">Number of Households:</div>
                        <div class="value">${data.door_to_door_collection.num_households || 0}</div>
                        <div class="label">Number of Shops:</div>
                        <div class="value">${data.door_to_door_collection.num_shops || 0}</div>
                        <div class="label">Collection Frequency:</div>
                        <div class="value">${data.door_to_door_collection.collection_frequency || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.road_sweeping ? `
                <div class="section">
                    <h2>Road Sweeping</h2>
                    <div class="info-grid">
                        <div class="label">Width:</div>
                        <div class="value">${data.road_sweeping.width || 0} m</div>
                        <div class="label">Length:</div>
                        <div class="value">${data.road_sweeping.length || 0} m</div>
                        <div class="label">Cleaning Frequency:</div>
                        <div class="value">${data.road_sweeping.cleaning_frequency || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.drain_cleaning ? `
                <div class="section">
                    <h2>Drain Cleaning</h2>
                    <div class="info-grid">
                        <div class="label">Length:</div>
                        <div class="value">${data.drain_cleaning.length || 0} m</div>
                        <div class="label">Cleaning Frequency:</div>
                        <div class="value">${data.drain_cleaning.cleaning_frequency || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.csc_details ? `
                <div class="section">
                    <h2>CSC Details</h2>
                    <div class="info-grid">
                        <div class="label">Numbers:</div>
                        <div class="value">${data.csc_details.numbers || 0}</div>
                        <div class="label">Cleaning Frequency:</div>
                        <div class="value">${data.csc_details.cleaning_frequency || 'N/A'}</div>
                    </div>
                </div>
                ` : ''}

                ${data.swm_assets ? `
                <div class="section">
                    <h2>SWM Assets</h2>
                    <div class="info-grid">
                        <div class="label">RRC:</div>
                        <div class="value">${data.swm_assets.rrc || 0}</div>
                        <div class="label">PWMU:</div>
                        <div class="value">${data.swm_assets.pwmu || 0}</div>
                        <div class="label">Compost Pit:</div>
                        <div class="value">${data.swm_assets.compost_pit || 0}</div>
                        <div class="label">Collection Vehicle:</div>
                        <div class="value">${data.swm_assets.collection_vehicle || 0}</div>
                    </div>
                </div>
                ` : ''}

                ${data.sbmg_targets ? `
                <div class="section">
                    <h2>SBMG Targets</h2>
                    <div class="info-grid">
                        <div class="label">IHHL:</div>
                        <div class="value">${data.sbmg_targets.ihhl || 0}</div>
                        <div class="label">CSC:</div>
                        <div class="value">${data.sbmg_targets.csc || 0}</div>
                        <div class="label">RRC:</div>
                        <div class="value">${data.sbmg_targets.rrc || 0}</div>
                        <div class="label">PWMU:</div>
                        <div class="value">${data.sbmg_targets.pwmu || 0}</div>
                        <div class="label">Soak Pit:</div>
                        <div class="value">${data.sbmg_targets.soak_pit || 0}</div>
                        <div class="label">Magic Pit:</div>
                        <div class="value">${data.sbmg_targets.magic_pit || 0}</div>
                        <div class="label">Leach Pit:</div>
                        <div class="value">${data.sbmg_targets.leach_pit || 0}</div>
                        <div class="label">WSP:</div>
                        <div class="value">${data.sbmg_targets.wsp || 0}</div>
                        <div class="label">DEWATS:</div>
                        <div class="value">${data.sbmg_targets.dewats || 0}</div>
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

    // CEO: Districts are not fetched - district is fixed from /me API
  const fetchDistricts = () => {
    // No-op for CEO - district ID comes from /me API (ceoDistrictId)
    console.log('CEO: Skipping fetchDistricts - using ceoDistrictId:', ceoDistrictId);
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

    // Fetch active annual survey data
    const fetchActiveAnnualSurveys = async () => {
        try {
            setLoadingFy(true);
            console.log('🔄 Fetching active annual surveys...');
            const response = await apiClient.get('/annual-surveys/fy/active');
            console.log('✅ Active FY API Response:', response.data);
            
            // Store active FYs (where active is true)
            const activeData = response.data.filter(item => item.active === true);
            console.log('📊 Active FYs:', activeData);
            setActiveFyData(activeData);
            
            // Log the stored data
            activeData.forEach(item => {
                console.log(`✅ Stored FY: ID=${item.id}, FY=${item.fy}`);
            });
        } catch (error) {
            console.error('❌ Error fetching active annual surveys:', error);
            setActiveFyData([]);
        } finally {
            setLoadingFy(false);
        }
    };

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
                activeFyData
            });

            // Get the first active FY ID
            const fyId = activeFyData.length > 0 ? activeFyData[0].id : null;
            
            if (!fyId) {
                console.log('⚠️ No active FY ID available, skipping analytics call');
                setAnalyticsError('No active financial year available');
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
    }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, activeFyData]);

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
                // CEO: Skipped await fetchDistricts
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
                // CEO: Skipped await fetchDistricts
            }
            setBlocks([]);
            setGramPanchayats([]);
            updateLocationSelection('Blocks', 'Select Block', null, null, null, null, 'tab_change');
            setDropdownLevel('blocks');
            setSelectedDistrictForHierarchy(null);
            setSelectedBlockForHierarchy(null);
        } else if (scope === 'GPs') {
            // GPs tab selected - wait for district/block selection before fetching GPs
            if (districts.length === 0) {
                console.log('⏳ Loading districts first...');
                // CEO: Skipped await fetchDistricts
            }
            setBlocks([]);
            setGramPanchayats([]);
            updateLocationSelection('GPs', 'Select GP', null, null, null, null, 'tab_change');
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
            if (!event.target.closest('[data-location-dropdown]') && 
                !event.target.closest('[data-date-dropdown]')) {
                setShowLocationDropdown(false);
                setShowDateDropdown(false);
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

        console.log('🔄 Fetching initial data (districts and active FY)...');
        hasFetchedInitialData.current = true;
        fetchActiveAnnualSurveys();
    }, []);

    // Log active FY data when it changes
    useEffect(() => {
        if (activeFyData.length > 0) {
            console.log('📅 Active FY Data stored in state:', activeFyData);
            console.log('📅 Total active FYs:', activeFyData.length);
            activeFyData.forEach((item, index) => {
                console.log(`📅 FY ${index + 1}: ID=${item.id}, FY=${item.fy}, Active=${item.active}`);
            });
        }
    }, [activeFyData]);

    // Fetch analytics data when scope or district changes
    useEffect(() => {
        console.log('🔄 Analytics useEffect triggered:', {
            activeScope,
            selectedDistrictId,
            selectedBlockId,
            selectedGPId,
            hasFyData: activeFyData.length > 0,
            loadingAnalytics
        });
        
        // Fetch for State scope when FY data is available
        if (activeScope === 'State' && activeFyData.length > 0) {
            console.log('📡 Calling state analytics API');
            fetchAnalytics();
        }
        // Fetch for Districts scope when district is selected and FY data is available
        else if (activeScope === 'Districts' && selectedDistrictId && activeFyData.length > 0) {
            console.log('📡 Calling district analytics API');
            fetchAnalytics();
        }
        // Fetch for Blocks scope when block is selected and FY data is available
        else if (activeScope === 'Blocks' && selectedBlockId && activeFyData.length > 0) {
            console.log('📡 Calling block analytics API');
            fetchAnalytics();
        }
        // Fetch for GPs scope when GP is selected and FY data is available
        else if (activeScope === 'GPs' && selectedGPId && activeFyData.length > 0) {
            console.log('📡 Calling GP analytics API');
            fetchAnalytics();
        }
    }, [activeScope, selectedDistrictId, selectedBlockId, selectedGPId, activeFyData, fetchAnalytics]);

    // Date selection helper functions
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

    // Toggle date dropdown on click
    const handleCalendarClick = () => {
        setShowDateDropdown(!showDateDropdown);
    };

    // Handle predefined date range selection
    const handleDateRangeSelection = (range) => {
        if (range.value === 'custom') {
            setIsCustomRange(true);
            setSelectedDateRange('Custom');
            setStartDate(null);
            setEndDate(null);
        } else {
            setIsCustomRange(false);
            setSelectedDateRange(range.label);
            
            const today = new Date();
            
            if (range.value === 'today') {
                setStartDate(today.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
            } else if (range.value === 'yesterday') {
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                setStartDate(yesterday.toISOString().split('T')[0]);
                setEndDate(yesterday.toISOString().split('T')[0]);
            } else {
                const start = new Date(today);
                start.setDate(today.getDate() - range.days);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
            }
            
            setShowDateDropdown(false);
        }
    };

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
            Village Master
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
                onClick={() => handleScopeChange(scope)}
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
    style={{
            position: 'relative',
            minWidth: '200px'
    }}
  >
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
        {/* CEO: First column is BLOCKS (no districts!) */}
        {(activeScope === 'Blocks' || activeScope === 'GPs') && (
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
          {activeScope === 'State' ? selectedLocation : `Rajasthan / ${selectedLocation}`}
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
            {/* {showDateDropdown && (
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
            )} */}
          </div>
        </div>

        {/* Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeScope === 'GPs' ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
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
          {/* SBMG Target vs Achievement Chart - Hidden in GP view */}
          {activeScope !== 'GPs' && (
          <div style={{
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
            <div style={{ height: '400px' }}>
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 200px',
              padding: '12px 16px',
              alignItems: 'center',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                2025
              </div>
              <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                Available
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                <button
                  onClick={() => handleOpenNoticeModal({ id: 1, name: 'GP Report', type: 'GP' })}
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
                  onClick={() => handleDownloadPDF(1)}
                  style={{
                    padding: '6px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Download style={{ width: '16px', height: '16px', color: '#374151' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
              marginBottom: '12px'
            }}>
              {activeScope === 'State' ? 'District' : activeScope === 'Districts' ? 'Block' : 'GP'} Wise Coverage
            </h3>

            {/* Table */}
            {(() => {
              const coverageData = activeScope === 'State' 
                ? analyticsData?.district_wise_coverage || []
                : activeScope === 'Districts'
                ? analyticsData?.block_wise_coverage || []
                : analyticsData?.gp_wise_coverage || [];
              
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
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
              backgroundColor: '#f9fafb',
              padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                        {activeScope === 'State' ? 'District' : activeScope === 'Districts' ? 'Block' : 'GP'} Name
                <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                        Total {activeScope === 'State' || activeScope === 'Districts' ? 'GPs' : 'Villages'}
                <InfoTooltip tooltipKey="TOTAL_GPS" size={14} color="#9ca3af" />
                <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                        {activeScope === 'State' || activeScope === 'Districts' ? 'GPs' : 'Villages'} with Data
                <InfoTooltip tooltipKey="GPS_WITH_DATA" size={14} color="#9ca3af" />
                <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                        Coverage %
                <InfoTooltip tooltipKey="COVERAGE_PERCENTAGE" size={14} color="#9ca3af" />
                <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
              </div>
            <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Status
                        <ArrowUpDown style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
            </div>
            </div>

                    {/* Table Rows */}
                    {coverageData.map((item, index) => (
                      <div key={item.geography_id || index} style={{
              display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
              padding: '12px 16px',
                        borderBottom: index < coverageData.length - 1 ? '1px solid #e5e7eb' : 'none',
                        backgroundColor: 'white',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                          {item.geography_name}
            </div>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {formatNumber(item.total_gps || 0)}
            </div>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {formatNumber(item.gps_with_data || 0)}
                        </div>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {item.coverage_percentage ? `${item.coverage_percentage}%` : '0%'}
                        </div>
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
          </div>
                    ))}
        </div>
                </div>
              );
            })()}
          </div>
        )}

      {/* Send Notice Modal */}
      <SendNoticeModal
        isOpen={showSendNoticeModal}
        onClose={handleCloseNoticeModal}
        target={selectedNoticeTarget}
        moduleName={noticeModuleData.moduleName}
        kpiName={noticeModuleData.kpiName}
        kpiFigure={noticeModuleData.kpiFigure}
      />
      </div>
    );
  };

export default CEOVillageMasterContent;