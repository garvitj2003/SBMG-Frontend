import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../services/api';

const CEOLocationContext = createContext();

export const useCEOLocation = () => {
  const context = useContext(CEOLocationContext);
  if (!context) {
    // Return null instead of throwing to allow conditional usage in Header
    return null;
  }
  return context;
};

export const CEOLocationProvider = ({ children }) => {
  const { user } = useAuth();


  // CEO's district ID from /me API (constant for CEO)
  const [ceoDistrictId, setCeoDistrictId] = useState(null);
  const [ceoDistrictName, setCeoDistrictName] = useState(null);
  const [loadingCEOData, setLoadingCEOData] = useState(true);

  // Global state for location selection (CEO can only select Blocks and GPs within their district)
  const [activeScope, setActiveScope] = useState('Blocks'); // Default to Blocks for CEO
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  // Hierarchical selection state
  const [selectedDistrictId, setSelectedDistrictId] = useState(null); // Will be set from CEO data
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedGPId, setSelectedGPId] = useState(null);

  // Hierarchical dropdown state
  const [dropdownLevel, setDropdownLevel] = useState('blocks'); // Start with blocks for CEO
  const [selectedBlockForHierarchy, setSelectedBlockForHierarchy] = useState(null);

  // Change tracking state
  const [changeHistory, setChangeHistory] = useState([]);
  const [lastChange, setLastChange] = useState(null);

  // Get CEO district data directly from user object (from /me API)
  useEffect(() => {
    const fetchDistrictName = async () => {
      if (user && user.district_id) {
        try {
          const districtId = user.district_id;

          const response = await apiClient.get(
            `/geography/districts?skip=0&limit=100`
          );

          const districts = response.data?.items || response.data || [];

          const matchedDistrict = districts.find(
            (d) => d.id === districtId
          );

          const districtName = matchedDistrict?.name;

          setCeoDistrictId(districtId);
          setSelectedDistrictId(districtId);
          setCeoDistrictName(districtName);
          setSelectedLocation(districtName);

          console.log("✅ District mapped correctly:", districtName);

        } catch (error) {
          console.error("❌ District mapping failed:", error);
        } finally {
          setLoadingCEOData(false);
        }
      }
    };

    fetchDistrictName();
  }, [user]);

  // Update location selection with change tracking
  const updateLocationSelection = useCallback((scope, location, locationId, districtId = null, blockId = null, gpId = null, changeType = 'selection') => {
    const timestamp = new Date().toISOString();
    const changeData = {
      timestamp,
      changeType,
      previous: {
        scope: activeScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: selectedDistrictId,
        blockId: selectedBlockId,
        gpId: selectedGPId
      },
      current: {
        scope,
        location,
        locationId,
        districtId: districtId || ceoDistrictId, // Always use CEO's district
        blockId,
        gpId
      }
    };

    // Update state (always maintain CEO's district)
    setActiveScope(scope);
    setSelectedLocation(location);
    setSelectedLocationId(locationId);
    setSelectedDistrictId(districtId || ceoDistrictId); // Ensure we always have CEO's district
    setSelectedBlockId(blockId);
    setSelectedGPId(gpId);

    // Track the change
    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);

    // Log the change
    console.log(`🔄 CEO Location Change (${changeType}):`, changeData);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, ceoDistrictId]);

  // Track tab changes specifically
  const trackTabChange = useCallback((newScope) => {
    const timestamp = new Date().toISOString();
    const changeData = {
      timestamp,
      changeType: 'tab_change',
      previous: {
        scope: activeScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: selectedDistrictId,
        blockId: selectedBlockId,
        gpId: selectedGPId
      },
      current: {
        scope: newScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: ceoDistrictId, // Always maintain CEO's district
        blockId: selectedBlockId,
        gpId: selectedGPId
      }
    };

    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);
    console.log(`📋 CEO Tab Change:`, changeData);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, ceoDistrictId]);

  // Track dropdown changes specifically
  const trackDropdownChange = useCallback((location, locationId, districtId = null, blockId = null, gpId = null) => {
    const timestamp = new Date().toISOString();
    const changeData = {
      timestamp,
      changeType: 'dropdown_change',
      previous: {
        scope: activeScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: selectedDistrictId,
        blockId: selectedBlockId,
        gpId: selectedGPId
      },
      current: {
        scope: activeScope,
        location,
        locationId,
        districtId: ceoDistrictId, // Always use CEO's district
        blockId,
        gpId
      }
    };

    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);
    console.log(`🔽 CEO Dropdown Change:`, changeData);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, ceoDistrictId]);

  // Reset location selection (for CEO, reset to Blocks view of their district)
  const resetLocationSelection = useCallback(() => {
    const timestamp = new Date().toISOString();
    const changeData = {
      timestamp,
      changeType: 'reset',
      previous: {
        scope: activeScope,
        location: selectedLocation,
        locationId: selectedLocationId,
        districtId: selectedDistrictId,
        blockId: selectedBlockId,
        gpId: selectedGPId
      },
      current: {
        scope: 'Blocks',
        location: ceoDistrictName,
        locationId: ceoDistrictId,
        districtId: ceoDistrictId,
        blockId: null,
        gpId: null
      }
    };

    setActiveScope('Blocks');
    setSelectedLocation(ceoDistrictName);
    setSelectedLocationId(ceoDistrictId);
    setSelectedDistrictId(ceoDistrictId);
    setSelectedBlockId(null);
    setSelectedGPId(null);
    setDropdownLevel('blocks');
    setSelectedBlockForHierarchy(null);

    setLastChange(changeData);
    setChangeHistory(prev => [...prev, changeData]);
    console.log(`🔄 CEO Reset Change:`, changeData);
  }, [activeScope, selectedLocation, selectedLocationId, selectedDistrictId, selectedBlockId, selectedGPId, ceoDistrictId, ceoDistrictName]);

  // Get current location info
  const getCurrentLocationInfo = useCallback(() => {
    return {
      scope: activeScope,
      location: selectedLocation,
      locationId: selectedLocationId,
      districtId: ceoDistrictId, // Always CEO's district
      blockId: selectedBlockId,
      gpId: selectedGPId,
      districtName: ceoDistrictName,
      blockName: selectedBlockForHierarchy?.name || null,
      ceoDistrictId, // Expose CEO's district explicitly
      ceoDistrictName
    };
  }, [activeScope, selectedLocation, selectedLocationId, ceoDistrictId, selectedBlockId, selectedGPId, ceoDistrictName, selectedBlockForHierarchy]);

  // Get change history
  const getChangeHistory = useCallback(() => {
    return changeHistory;
  }, [changeHistory]);

  // Get last change
  const getLastChange = useCallback(() => {
    return lastChange;
  }, [lastChange]);

  // Clear change history
  const clearChangeHistory = useCallback(() => {
    setChangeHistory([]);
    setLastChange(null);
    console.log('🧹 CEO Change history cleared');
  }, []);

  const value = useMemo(() => ({
    // State
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedDistrictId: ceoDistrictId, // Always CEO's district
    selectedBlockId,
    selectedGPId,
    dropdownLevel,
    selectedBlockForHierarchy,
    changeHistory,
    lastChange,
    ceoDistrictId, // CEO-specific
    ceoDistrictName, // CEO-specific
    loadingCEOData, // CEO-specific

    // Setters
    setActiveScope,
    setSelectedLocation,
    setSelectedLocationId,
    setSelectedBlockId,
    setSelectedGPId,
    setDropdownLevel,
    setSelectedBlockForHierarchy,

    // Actions
    updateLocationSelection,
    resetLocationSelection,
    getCurrentLocationInfo,

    // Change tracking
    trackTabChange,
    trackDropdownChange,
    getChangeHistory,
    getLastChange,
    clearChangeHistory
  }), [
    activeScope,
    selectedLocation,
    selectedLocationId,
    selectedBlockId,
    selectedGPId,
    dropdownLevel,
    selectedBlockForHierarchy,
    changeHistory,
    lastChange,
    ceoDistrictId,
    ceoDistrictName,
    loadingCEOData,
    updateLocationSelection,
    resetLocationSelection,
    getCurrentLocationInfo,
    trackTabChange,
    trackDropdownChange,
    getChangeHistory,
    getLastChange,
    clearChangeHistory
  ]);

  
  return (
    <CEOLocationContext.Provider value={value}>
      {children}
    </CEOLocationContext.Provider>
  );
};

