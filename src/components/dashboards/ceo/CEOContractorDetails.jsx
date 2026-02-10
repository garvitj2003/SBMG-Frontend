import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight, List, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX, DollarSign, Target, TrendingUp, Database, BarChart3, ArrowUpDown, Calendar } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient, { annualSurveysAPI } from '../../../services/api';
import { useCEOLocation } from '../../../context/CEOLocationContext';
import SendNoticeModal from '../common/SendNoticeModal';
import NoDataFound from '../common/NoDataFound';
import { InfoTooltip } from '../../common/Tooltip';
import { generateAnnualSurveysPDF } from '../../../utils/annualSurveysPdf';
import EditGPMasterModal from '../EditGPMasterModal';


const CEOContractorDetails = () => {



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
    const setSelectedDistrictForHierarchy = () => { }; // No-op for CEO

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
                url = `/contractors/contractors?gp_id=${selectedGPId}&fy_id=${fyId}`;
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

    // Fetch FY list when component loads (CEO: districts come from /me)
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
                        Contractor Details
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
                                    minWidth: activeScope === 'Blocks' ? '240px' : '480px'
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
                    {(() => {
                        if (activeScope === 'State') {
                            return selectedLocation;
                        } else if (activeScope === 'Districts') {
                            return `Rajasthan / ${selectedLocation}`;
                        } else if (activeScope === 'Blocks') {
                            const districtName = selectedDistrictForHierarchy?.name || selectedLocation;
                            return `Rajasthan / ${districtName} / ${selectedLocation}`;
                        } else if (activeScope === 'GPs') {
                            const districtName = selectedDistrictForHierarchy?.name || '';
                            const blockName = selectedBlockForHierarchy?.name || '';
                            return `Rajasthan / ${districtName} / ${blockName} / ${selectedLocation}`;
                        }
                        return `Rajasthan / ${selectedLocation}`;
                    })()}
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

                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" style={{
                    display: 'grid',
                    gap: '16px',
                    marginBottom: '32px'
                }}>

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
                                    Contractor Data Filled
                                    {/*   (total filled constrator / total contractor) * 100    */}
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
                                0.00 %
                                {/* {loadingAnalytics ? '...' : `${getAnalyticsValue('village_master_data_coverage_percentage', 0)}%`} */}
                            </div>
                        </div>
                    )}

                    {/* constrator  covered details */}
                    <div style={{
                        backgroundColor: 'white',
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
                                Data Filled covered
                            </h3>
                            <InfoTooltip tooltipKey="INSPECTION_COVERAGE_PERCENTAGE" size={16} color="#9ca3af" />
                        </div>
                        <div style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            color: '#111827',
                            margin: 0
                        }}>
                            {/* {getVillageCoverage()} */}
                            0/11,207
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
                        Contractor  Details
                    </h3>
                    {/* vendor details page static */}
                    {loadingAnalytics ? (
                        <div className="text-center text-gray-500">Loading...</div>
                    ) : !analyticsData?.length ? (
                        <div className="text-center text-gray-400">No vendors found</div>
                    ) :
                        (

                            analyticsData.map((item, index) => {
                                return (
                                    <div key={item.person_name} className='mx-auto  w-full mt-10  rounded flex justify-center '>
                                        <div
                                            style={{ padding: '24px', }}
                                            className='flex flex-col gap-5  max-w-[800px] w-full border border-gray-200 bg-gray-50 rounded-2xl '>
                                            <div className='flex justify-between '>
                                                <div>
                                                    Name :
                                                </div>
                                                <div>
                                                    {item.person_name}
                                                </div>
                                            </div>
                                            <div className='flex justify-between '>
                                                <div>
                                                    Contact Number :
                                                </div>
                                                <div>
                                                    {item.person_phone}
                                                </div>
                                            </div>

                                            <div className='flex justify-between '>
                                                <div>
                                                    Agency name :
                                                </div>
                                                <div>
                                                    {item.agency?.name || '-'}
                                                </div>
                                            </div>
                                            <div className='flex justify-between '>
                                                <div>
                                                    Annual Contract Amount :
                                                </div>
                                                <div>
                                                   ₹ {item.contract_amount}
                                                </div>
                                            </div>

                                            <div className='flex justify-between '>
                                                <div>
                                                    Contract Start Date :
                                                </div>
                                                <div>
                                                    {/* {item.contract_start_date} */}
                                                    {new Date(item.contract_start_date).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div className='flex justify-between '>
                                                <div>
                                                    Contract End Date :
                                                </div>
                                                <div>
                                                    {new Date(item.contract_end_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className='flex justify-between '>
                                                <div>
                                                    Frequency of work :
                                                </div>
                                                <div>
                                                    {item.contract_frequency}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })

                        )
                    }
                </div>
            )}

            {/* Edit GP Master Data modal */}
            {/* <EditGPMasterModal
                isOpen={showEditModal}
                onClose={() => { setShowEditModal(false); setEditSurveyId(null); }}
                surveyId={editSurveyId}
                gpName={selectedLocation}
                onSuccess={() => { fetchGpSurveys(); fetchAnalytics(); }}
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
                                        gridTemplateColumns: '2fr 1fr 2fr 1fr 1.5fr 60px',
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
                                            {activeScope === 'State' || activeScope === 'Districts' ? 'GPs' : 'Villages'} with Contractror Data
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
                                            gridTemplateColumns: '2fr 1fr 2fr 1fr 1.5fr 60px',
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
    )
}

export default CEOContractorDetails