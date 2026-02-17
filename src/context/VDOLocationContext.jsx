import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const VDOLocationContext = createContext();

export const useVDOLocation = () => {
  const context = useContext(VDOLocationContext);
  if (!context) {
    // Return null instead of throwing to allow conditional usage in Header
    return null;
  }
  return context;
};

export const VDOLocationProvider = ({ children }) => {
  const { user } = useAuth();
  
  // VDO's district ID, block ID, and GP ID from /me API (constant for VDO)
  const [vdoDistrictId, setVdoDistrictId] = useState(null);
  const [vdoDistrictName, setVdoDistrictName] = useState(null);
  const [vdoBlockId, setVdoBlockId] = useState(null);
  const [vdoBlockName, setVdoBlockName] = useState(null);
  const [vdoGPId, setVdoGPId] = useState(null);
  const [vdoGPName, setVdoGPName] = useState(null);
  const [loadingVDOData, setLoadingVDOData] = useState(true);

  // Get VDO district, block, and village data directly from user object (from /me API)
  useEffect(() => {
    if (user && user.district_id && user.block_id && user.village_id) {
      // Get district, block, and village info directly from /me API response
      const districtId = user.district_id;
      const districtName = user.district_name || user.district?.name || 'District';
      const blockId = user.block_id;
      const blockName = user.block_name || user.block?.name || 'Block';
      const gpId = user.village_id; // API returns village_id for VDO
      const gpName = user.village_name || user.village?.name || 'Village';
      
      // Only set if not already set (prevent multiple updates)
      if (!vdoDistrictId || !vdoBlockId || !vdoGPId) {
        setVdoDistrictId(districtId);
        setVdoDistrictName(districtName);
        setVdoBlockId(blockId);
        setVdoBlockName(blockName);
        setVdoGPId(gpId);
        setVdoGPName(gpName);
        console.log('✅ VDO District, Block, and Village loaded from /me API:', { 
          districtId, 
          districtName, 
          blockId, 
          blockName, 
          villageId: gpId, 
          villageName: gpName 
        });
      }
      setLoadingVDOData(false);
    } else if (user) {
      console.warn('⚠️ VDO user data does not contain district_id, block_id, or village_id');
      setLoadingVDOData(false);
    }
  }, [user, vdoDistrictId, vdoBlockId, vdoGPId]);

  // Get current location info - VDO always works at village level
  const getCurrentLocationInfo = useCallback(() => {
    return {
      level: 'VILLAGE', // VDO always works at village level (uppercase, singular as API expects)
      districtId: vdoDistrictId,
      blockId: vdoBlockId,
      gpId: vdoGPId,
      districtName: vdoDistrictName,
      blockName: vdoBlockName,
      gpName: vdoGPName,
      vdoDistrictId, // Expose VDO's district explicitly
      vdoDistrictName,
      vdoBlockId, // Expose VDO's block explicitly
      vdoBlockName,
      vdoGPId, // Expose VDO's GP explicitly
      vdoGPName
    };
  }, [vdoDistrictId, vdoBlockId, vdoGPId, vdoDistrictName, vdoBlockName, vdoGPName]);

  // Location path for display - skip generic "District", "Block", "Village" to avoid "District DISTRICT" etc.
  const getLocationPath = useCallback(() => {
    const rawDistrict = (vdoDistrictName || '').trim();
    const districtLabel = (rawDistrict && rawDistrict.toLowerCase() !== 'district') ? `${vdoDistrictName} DISTRICT` : '';
    const rawBlock = (vdoBlockName || '').trim();
    const blockLabel = (rawBlock && rawBlock.toLowerCase() !== 'block') ? rawBlock : '';
    const rawGP = (vdoGPName || '').trim();
    const gpLabel = (rawGP && rawGP.toLowerCase() !== 'village') ? rawGP : '';
    const parts = ['Rajasthan', districtLabel, blockLabel, gpLabel].filter(Boolean);
    return parts.join(' / ');
  }, [vdoDistrictName, vdoBlockName, vdoGPName]);

  const value = useMemo(() => ({
    // State - VDO's fixed location data
    vdoDistrictId,
    vdoDistrictName,
    vdoBlockId,
    vdoBlockName,
    vdoGPId,
    vdoGPName,
    loadingVDOData,
    
    // Actions
    getCurrentLocationInfo,
    getLocationPath
  }), [
    vdoDistrictId,
    vdoDistrictName,
    vdoBlockId,
    vdoBlockName,
    vdoGPId,
    vdoGPName,
    loadingVDOData,
    getCurrentLocationInfo,
    getLocationPath
  ]);

  return (
    <VDOLocationContext.Provider value={value}>
      {children}
    </VDOLocationContext.Provider>
  );
};

