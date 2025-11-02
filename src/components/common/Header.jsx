import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bell, ChevronDown, Menu, Loader2 } from 'lucide-react';
import apiClient from '../../services/api';
import { useLocation } from '../../context/LocationContext';
import { useCEOLocation } from '../../context/CEOLocationContext';
import { useBDOLocation } from '../../context/BDOLocationContext';
import { useVDOLocation } from '../../context/VDOLocationContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/roleConfig';

const buildSubtitle = (typeLabel, meta) => {
  if (typeLabel === 'District') {
    return 'District';
  }
  if (typeLabel === 'Block') {
    const district = meta?.districtName ? `District: ${meta.districtName}` : null;
    return district ? `Block · ${district}` : 'Block';
  }
  if (typeLabel === 'Gram Panchayat') {
    const parts = [];
    if (meta?.blockName) {
      parts.push(`Block: ${meta.blockName}`);
    }
    if (meta?.districtName) {
      parts.push(`District: ${meta.districtName}`);
    }
    return parts.length > 0 ? `Gram Panchayat · ${parts.join(' · ')}` : 'Gram Panchayat';
  }
  return typeLabel;
};

const Header = ({ onMenuClick, onNotificationsClick, showLocationSearch = true }) => {
  const { role } = useAuth();
  const isCEO = role === ROLES.CEO;
  const isBDO = role === ROLES.BDO;
  const isVDO = role === ROLES.VDO;
  
  // Try all contexts - one will be available based on which dashboard we're in
  const locationContextSMD = useLocation();
  const locationContextCEO = useCEOLocation();
  const locationContextBDO = useBDOLocation();
  const locationContextVDO = useVDOLocation();
  
  // Use whichever context is available
  const locationContext = locationContextCEO || locationContextBDO || locationContextVDO || locationContextSMD || {
    updateLocationSelection: () => {},
    setActiveScope: () => {},
    setDropdownLevel: () => {},
    setSelectedDistrictForHierarchy: () => {},
    setSelectedBlockForHierarchy: () => {}
  };

  const {
    updateLocationSelection,
    setActiveScope,
    setDropdownLevel,
    setSelectedDistrictForHierarchy,
    setSelectedBlockForHierarchy
  } = locationContext;

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const searchTimeoutRef = useRef(null);
  const activeRequestRef = useRef(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const suggestionCache = useRef(new Map());
  const userInteractedRef = useRef(false);

  const clearSearchTimeout = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  const fetchGeographySuggestions = useCallback(async (term) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError(null);
      setHighlightedIndex(-1);
      userInteractedRef.current = false;
      return;
    }

    const cacheKey = trimmedTerm.toLowerCase();
    if (suggestionCache.current.has(cacheKey)) {
      const cached = suggestionCache.current.get(cacheKey);
      setSuggestions(cached.suggestions);
      setShowSuggestions(true);
      setSearchError(cached.error);
      if (!userInteractedRef.current) {
        setHighlightedIndex(cached.suggestions.length > 0 ? 0 : -1);
      }
      setIsSearching(false);
      return;
    }

    const requestId = Date.now();
    activeRequestRef.current = requestId;

    setIsSearching(true);
    setSearchError(null);

    const commonParams = {
      params: {
        skip: 0,
        limit: 20,
        search: trimmedTerm
      }
    };

    try {
      // CEO only searches blocks and GPs, not districts
      // BDO only searches GPs, not districts or blocks
      const searchPromises = isBDO
        ? [
            Promise.resolve({ status: 'fulfilled', value: { data: [] } }), // Skip districts for BDO
            Promise.resolve({ status: 'fulfilled', value: { data: [] } }), // Skip blocks for BDO
            apiClient.get('/geography/grampanchayats', commonParams)
          ]
        : isCEO 
        ? [
            Promise.resolve({ status: 'fulfilled', value: { data: [] } }), // Skip districts for CEO
            apiClient.get('/geography/blocks', commonParams),
            apiClient.get('/geography/grampanchayats', commonParams)
          ]
        : [
            apiClient.get('/geography/districts', commonParams),
            apiClient.get('/geography/blocks', commonParams),
            apiClient.get('/geography/grampanchayats', commonParams)
          ];
      
      const [districtResult, blockResult, gpResult] = await Promise.allSettled(searchPromises);

      if (activeRequestRef.current !== requestId) {
        return;
      }

      const nextSuggestions = [];

      // Only process district results for non-CEO and non-BDO users
      if (!isCEO && !isBDO && districtResult.status === 'fulfilled' && Array.isArray(districtResult.value?.data)) {
        districtResult.value.data.forEach((district) => {
          if (!district) return;
          const name = district.name || district.district_name || district.districtName || 'Unnamed District';
          nextSuggestions.push({
            id: district.id ?? district.district_id ?? name,
            name,
            type: 'district',
            typeLabel: 'District',
            raw: district,
            meta: {
              districtId: district.id ?? district.district_id ?? null,
              districtName: name
            },
            subtitle: buildSubtitle('District', { districtName: name })
          });
        });
      } else if (districtResult.status === 'rejected') {
        console.error('Failed to fetch districts for search:', districtResult.reason);
      }

      // Only process block results for non-BDO users
      if (!isBDO && blockResult.status === 'fulfilled' && Array.isArray(blockResult.value?.data)) {
        blockResult.value.data.forEach((block) => {
          if (!block) return;
          const name = block.name || block.block_name || block.blockName || 'Unnamed Block';
          const districtName = block.district?.name || block.district_name || block.districtName || '';
          const districtId = block.district_id ?? block.district?.id ?? null;
          nextSuggestions.push({
            id: block.id ?? block.block_id ?? name,
            name,
            type: 'block',
            typeLabel: 'Block',
            raw: block,
            meta: {
              districtId,
              districtName: districtName || undefined
            },
            subtitle: buildSubtitle('Block', {
              districtName: districtName || undefined
            })
          });
        });
      } else if (blockResult.status === 'rejected') {
        console.error('Failed to fetch blocks for search:', blockResult.reason);
      }

      if (gpResult.status === 'fulfilled' && Array.isArray(gpResult.value?.data)) {
        gpResult.value.data.forEach((gp) => {
          if (!gp) return;
          const name = gp.name || gp.gp_name || gp.gpName || 'Unnamed GP';
          const blockName = gp.block?.name || gp.block_name || gp.blockName || '';
          const districtName = gp.district?.name || gp.district_name || gp.districtName || '';
          const blockId = gp.block_id ?? gp.block?.id ?? null;
          const districtId = gp.district_id ?? gp.district?.id ?? null;
          nextSuggestions.push({
            id: gp.id ?? gp.gp_id ?? name,
            name,
            type: 'gp',
            typeLabel: 'Gram Panchayat',
            raw: gp,
            meta: {
              blockId,
              blockName: blockName || undefined,
              districtId,
              districtName: districtName || undefined
            },
            subtitle: buildSubtitle('Gram Panchayat', {
              blockName: blockName || undefined,
              districtName: districtName || undefined
            })
          });
        });
      } else if (gpResult.status === 'rejected') {
        console.error('Failed to fetch gram panchayats for search:', gpResult.reason);
      }

      const filteredSuggestions = nextSuggestions.filter((suggestion) => {
        return suggestion?.name?.toLowerCase().includes(trimmedTerm.toLowerCase());
      });

      filteredSuggestions.sort((a, b) => {
        if (a.name.toLowerCase() === b.name.toLowerCase()) {
          return a.typeLabel.localeCompare(b.typeLabel);
        }
        return a.name.localeCompare(b.name);
      });

      const errorMessage = filteredSuggestions.length === 0 ? 'No matching locations found.' : null;

      suggestionCache.current.set(cacheKey, {
        suggestions: filteredSuggestions,
        error: errorMessage
      });

      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setSearchError(errorMessage);
      if (!userInteractedRef.current) {
        setHighlightedIndex(filteredSuggestions.length > 0 ? 0 : -1);
      }
    } catch (error) {
      if (activeRequestRef.current !== requestId) {
        return;
      }
      console.error('Unexpected error during geography search:', error);
      const fallbackError = 'Unable to search locations right now.';
      suggestionCache.current.set(cacheKey, {
        suggestions: [],
        error: fallbackError
      });
      setSearchError(fallbackError);
      setSuggestions([]);
      setShowSuggestions(true);
      if (!userInteractedRef.current) {
        setHighlightedIndex(-1);
      }
    } finally {
      if (activeRequestRef.current === requestId) {
        setIsSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    clearSearchTimeout();

    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError(null);
      setHighlightedIndex(-1);
      return () => {};
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchGeographySuggestions(searchTerm);
    }, 300);

    return () => {
      clearSearchTimeout();
    };
  }, [searchTerm, fetchGeographySuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showSuggestions) return;
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  useEffect(() => () => clearSearchTimeout(), []);

  const resetSearchState = useCallback(() => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchError(null);
    setHighlightedIndex(-1);
    userInteractedRef.current = false;
  }, []);

  const ensureDistrictObject = (suggestion) => {
    const districtId = suggestion.meta?.districtId ?? suggestion.raw?.district_id ?? suggestion.raw?.districtId ?? null;
    const districtName = suggestion.meta?.districtName || suggestion.raw?.district?.name || suggestion.raw?.district_name || suggestion.raw?.districtName || suggestion.name;
    return districtId
      ? { ...suggestion.raw?.district, id: districtId, name: districtName }
      : suggestion.raw?.district ?? (districtName ? { name: districtName } : null);
  };

  const ensureBlockObject = (suggestion) => {
    const blockId = suggestion.meta?.blockId ?? suggestion.raw?.block_id ?? suggestion.raw?.blockId ?? suggestion.id;
    const blockName = suggestion.meta?.blockName || suggestion.raw?.block?.name || suggestion.raw?.name || suggestion.name;
    const districtId = suggestion.meta?.districtId ?? suggestion.raw?.district_id ?? suggestion.raw?.districtId ?? suggestion.raw?.block?.district_id ?? null;
    return {
      ...suggestion.raw,
      id: blockId,
      name: blockName,
      district_id: districtId
    };
  };

  const handleSuggestionSelect = useCallback((suggestion) => {
    if (!suggestion) {
      return;
    }

    resetSearchState();
    userInteractedRef.current = false;

    if (inputRef.current) {
      inputRef.current.blur();
    }

    const name = suggestion.name;

    if (suggestion.type === 'district') {
      const district = suggestion.raw || { id: suggestion.id, name };
      const districtId = district.id ?? suggestion.meta?.districtId ?? suggestion.id;
      setActiveScope('Districts');
      setDropdownLevel('blocks');
      setSelectedDistrictForHierarchy({ ...district, id: districtId, name });
      setSelectedBlockForHierarchy(null);
      updateLocationSelection('Districts', name, districtId, districtId, null, null, 'global_search');
    } else if (suggestion.type === 'block') {
      const district = ensureDistrictObject(suggestion);
      const block = ensureBlockObject(suggestion);
      const districtId = district?.id ?? suggestion.meta?.districtId ?? null;
      const blockId = block?.id ?? suggestion.id;

      setActiveScope('Blocks');
      setDropdownLevel('gps');
      setSelectedDistrictForHierarchy(district || null);
      setSelectedBlockForHierarchy(block || null);
      updateLocationSelection('Blocks', block.name || name, blockId, districtId, blockId, null, 'global_search');
    } else if (suggestion.type === 'gp') {
      const district = ensureDistrictObject(suggestion);
      const block = ensureBlockObject({
        ...suggestion,
        meta: {
          ...suggestion.meta,
          districtId: suggestion.meta?.districtId ?? district?.id ?? null
        }
      });
      const gp = suggestion.raw || { id: suggestion.id, name };
      const districtId = district?.id ?? suggestion.meta?.districtId ?? null;
      const blockId = block?.id ?? suggestion.meta?.blockId ?? null;
      const gpId = gp.id ?? suggestion.id;

      setActiveScope('GPs');
      setDropdownLevel('gps');
      setSelectedDistrictForHierarchy(district || null);
      setSelectedBlockForHierarchy(block || null);
      updateLocationSelection('GPs', gp.name || name, gpId, districtId, blockId, gpId, 'global_search');
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to scroll after global search selection:', error);
    }
  }, [ensureDistrictObject, ensureBlockObject, resetSearchState, setActiveScope, setDropdownLevel, setSelectedDistrictForHierarchy, setSelectedBlockForHierarchy, updateLocationSelection]);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
    setShowSuggestions(true);
    userInteractedRef.current = false;
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (event) => {
    if (!showSuggestions) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (suggestions.length === 0) return;
      userInteractedRef.current = true;
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= suggestions.length ? 0 : next;
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (suggestions.length === 0) return;
      userInteractedRef.current = true;
      setHighlightedIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? suggestions.length - 1 : next;
      });
    } else if (event.key === 'Enter') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      userInteractedRef.current = true;
      const selected = highlightedIndex >= 0 ? suggestions[highlightedIndex] : suggestions[0];
      handleSuggestionSelect(selected);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      resetSearchState();
    }
  };

  const handleClearSearch = () => {
    resetSearchState();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '6px 0px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left side - Menu icon */}
      <div style={{display: 'flex', alignItems: 'center'}}>
        <button onClick={onMenuClick} style={{
          padding: '8px',
          marginLeft: '8px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          <Menu style={{width: '20px', height: '20px', color: '#6b7280'}} />
        </button>
      </div>

      {/* Right side - Search bar, Notifications and Profile */}
      <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginRight: '16px'}}>
        {/* Search bar - hidden for VDO */}
        {showLocationSearch && (
          <div ref={containerRef} style={{position: 'relative', width: '320px'}}>
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
              ref={inputRef}
              type="text"
              value={searchTerm}
              placeholder={isBDO ? "Search GPs" : isCEO ? "Search blocks or GPs" : "Search districts, blocks, or GPs"}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '48px',
              paddingTop: '7px',
              paddingBottom: '7px',
              border: '1px solid #d1d5db',
              borderRadius: '28px',
              outline: 'none',
              fontSize: '14px'
            }}
          />
          {(searchTerm || isSearching || showSuggestions) && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '36px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
              aria-label="Clear search"
            >
              <span style={{fontSize: '14px'}}>×</span>
            </button>
          )}
          {isSearching && (
            <Loader2
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af'
              }}
            />
          )}
          {!isSearching && !searchTerm && showSuggestions && suggestions.length === 0 && (
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#9ca3af'
            }}>
              <Search style={{ width: '16px', height: '16px' }} />
            </div>
          )}
          {showSuggestions && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              boxShadow: '0 16px 32px -20px rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              zIndex: 1200,
              maxHeight: '320px',
              overflowY: 'auto'
            }}>
              {isSearching ? (
                <div style={{ padding: '16px', fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 style={{ width: '16px', height: '16px' }} />
                  Searching locations...
                </div>
              ) : (
                <>
                  {suggestions.map((suggestion, index) => {
                    const isActive = index === highlightedIndex;
                    return (
                      <button
                        key={`${suggestion.type}-${suggestion.id}-${index}`}
                        type="button"
                        onMouseEnter={() => {
                          userInteractedRef.current = true;
                          setHighlightedIndex(index);
                        }}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        style={{
                          width: '100%',
                          border: 'none',
                          backgroundColor: isActive ? '#f0fdf4' : 'transparent',
                          textAlign: 'left',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                          {suggestion.name} <span style={{ color: '#059669', fontWeight: 500 }}>({suggestion.typeLabel})</span>
                        </span>
                        {suggestion.subtitle && (
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{suggestion.subtitle}</span>
                        )}
                      </button>
                    );
                  })}
                  {searchError && (
                    <div style={{ padding: '14px 16px', fontSize: '13px', color: '#b91c1c', borderTop: suggestions.length > 0 ? '1px solid #f3f4f6' : 'none' }}>
                      {searchError}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          </div>
        )}
        {/* Notification bell - Separate container */}
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '1px',
          borderRadius: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <button
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Open notices"
            onClick={() => {
              if (typeof onNotificationsClick === 'function') {
                onNotificationsClick();
              } else {
                try {
                  const target = document.querySelector('[data-dashboard-section="notices"]');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                } catch (error) {
                  console.error('Failed to focus notices section:', error);
                }
              }
            }}
          >
            <Bell style={{width: '18px', height: '18px', color: '#6b7280'}} />
          </button>
        </div>

        {/* User profile - Separate container */}
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '2px 5px',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '1px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: '#d1d5db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{fontSize: '12px', fontWeight: '500', color: '#6b7280'}}>U</span>
          </div>
          <ChevronDown style={{width: '14px', height: '14px', color: '#6b7280'}} />
        </div>
      </div>
    </header>
  );
};

export default Header;