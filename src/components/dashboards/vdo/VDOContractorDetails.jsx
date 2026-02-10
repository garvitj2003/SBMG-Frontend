import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, ChevronDown, ChevronRight, List, Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Users, UserCheck, UserX, DollarSign, Target, TrendingUp, Database, BarChart3, ArrowUpDown, Calendar } from 'lucide-react';
import Chart from 'react-apexcharts';
import apiClient, { annualSurveysAPI } from '../../../services/api';
import { useVDOLocation } from '../../../context/VDOLocationContext';
import NoDataFound from '../common/NoDataFound';
import { InfoTooltip } from '../../common/Tooltip';
import { generateAnnualSurveysPDF } from '../../../utils/annualSurveysPdf';
import EditGPMasterModal from '../EditGPMasterModal';
import EditContractorDetails from './EditContractorDetails';




const VDOContractorDetails = () => {

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
    loadingVDOData
  } = useVDOLocation();

  // console.log("District ID:", vdoDistrictId);
  // console.log("District Name:", vdoDistrictName);
  // console.log("Block ID:", vdoBlockId);
  // console.log("Block Name:", vdoBlockName);
  // console.log("GP ID:", vdoGPId);
  // console.log("GP Name:", vdoGPName);


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

      if (activeScope === 'GPs' && selectedGPId) {
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

  console.log('VillageMasterContent rendering...');

  // edit form
  const [editData, setEditData] = useState(null);



  // ADD Data
  const handleEdit = (item) => {
    setEditData(item);
    setShowEditModal(true);
  };
  // ADD Data
  const handleAdd = () => {
    setEditData(null);
    setShowEditModal(true);
  };




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
              return `Rajasthan / ${districtName} / ${blockName} / ${vdoGPName}`;
            }
            return `Rajasthan / ${selectedLocation}`;
          })()}
        </span>
      </div>

      {/* Overview Section */}


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
          <div className='flex w-full justify-between items-center'>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 16px 0'
            }}>
              Contractor  Details
            </h3>


            {
              !loadingAnalytics && analyticsData?.length === 0 && (
                <div>
                  <button
                    className='cursor-pointer'
                    title='ADD Contractor Data'
                    style={{
                      padding: '8px',
                      backgroundColor: '#009B56',
                      border: '0px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      margin: '0 0 16px 0'
                    }}
                    onClick={handleAdd}
                  >
                    Add Contractor
                  </button>
                </div>
              )
            }

          </div>

          {/* vendor details page static */}
          {loadingAnalytics ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : !analyticsData?.length ? (
            <div className="text-center text-gray-400">
              No Contractor found
            </div>
          ) :
            (

              analyticsData.map((item, index) => {
                const hasData = analyticsData.length;
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
                         <span className='font-semibold'>₹</span> {item.contract_amount}
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
                    <div>
                      <button
                        onClick={() => handleEdit(item)}
                        title='Edit Contractor Data'
                        style={{
                          marginTop: '15px',
                          padding: '8px',
                          backgroundColor: '#009B56',
                          border: '0px solid #d1d5db',
                          borderRadius: '0px 8px 8px 0px ',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',

                        }}
                      >  <Edit style={{ width: '16px', height: '16px', color: 'white' }} />
                      </button>
                    </div>
                  </div>

                )
              })

            )
          }
        </div>
      )}
      {
        showEditModal && (
          <EditContractorDetails
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditData(null);
            }}
            gpId={vdoGPId}
            editData={editData}
            onsuccess={fetchAnalytics}
          />

        )
      }
    </div>
  )

}

export default VDOContractorDetails