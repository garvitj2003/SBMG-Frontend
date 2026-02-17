import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight, List, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX, DollarSign, Target, TrendingUp, Database, BarChart3, ArrowUpDown, Calendar } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient, { annualSurveysAPI } from '../../../services/api';
import { useVDOLocation } from '../../../context/VDOLocationContext';
import NoDataFound from '../common/NoDataFound';
import { InfoTooltip } from '../../common/Tooltip';
import { generateAnnualSurveysPDF } from '../../../utils/annualSurveysPdf';
import EditGPMasterModal from '../EditGPMasterModal';

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
    const setActiveScope = () => {};
    const setSelectedLocation = () => {};
    const setSelectedLocationId = () => {};
    const setSelectedGPId = () => {};
    const setDropdownLevel = () => {};
    const setSelectedGPForHierarchy = () => {};
    const setSelectedDistrictForHierarchy = () => {};
    const setSelectedBlockForHierarchy = () => {};
    const setSelectedDistrictId = () => {};
    const setSelectedBlockId = () => {};
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
                // BDO: Skipped await fetchDistricts
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
                // BDO: Skipped await fetchDistricts
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
                // BDO: Skipped await fetchDistricts
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
              <Database style={{ width: '20px', height: '20px', color: '#6b7280' }} />
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
              <TrendingUp style={{ width: '20px', height: '20px', color: '#6b7280' }} />
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
                </button>
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
      <EditGPMasterModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditSurveyId(null); }}
        surveyId={editSurveyId}
        gpName={selectedLocation}
        onSuccess={() => { fetchGpSurveys(); fetchAnalytics(); }}
      />

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
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 60px',
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
                    {coverageData.map((item, index) => (
                      <div key={item.geography_id || index} style={{
              display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 60px',
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDownloadAnnualSurveys(item)}
                            disabled={downloadingId === item.geography_id}
                            title="Download PDF"
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

export default VDOVillageMasterContent;