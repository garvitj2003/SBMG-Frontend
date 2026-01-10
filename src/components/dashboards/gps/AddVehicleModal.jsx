import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, Loader } from 'lucide-react';
import apiClient from '../../../services/api';

/**
 * AddVehicleModal component for adding new vehicles
 */
const AddVehicleModal = ({
  isOpen = false,
  onClose = () => {},
  onSubmit = () => {},
  isSubmitting = false,
  districts = [],
  blocks = [],
  gramPanchayats = [],
}) => {
  const [modalStep, setModalStep] = useState(1);
  const [formData, setFormData] = useState({
    imeiNumber: '',
    vehicleNumber: '',
    districtId: '',
    blockId: '',
    gpId: ''
  });

  // Local state for location data (will fetch if not provided as props)
  const [localDistricts, setLocalDistricts] = useState(districts);
  const [localBlocks, setLocalBlocks] = useState([]);
  const [localGramPanchayats, setLocalGramPanchayats] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingGPs, setLoadingGPs] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    vehicleNumber: '',
    imeiNumber: '',
    districtId: '',
    blockId: '',
    gpId: ''
  });

  // Vehicle number validation: Indian format (e.g., RJ01AB1234)
  // Format: 2 letters (state code) + 2 digits + 2 letters + 4 digits
  const validateVehicleNumber = (value) => {
    if (!value) {
      return 'Vehicle number is required';
    }
    // Remove spaces and convert to uppercase
    const cleaned = value.replace(/\s+/g, '').toUpperCase();
    // Indian vehicle number format: 2 letters + 2 digits + 2 letters + 4 digits
    const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
    if (!vehicleRegex.test(cleaned)) {
      return 'Invalid format. Use format: RJ01AB1234 (2 letters, 2 digits, 2 letters, 4 digits)';
    }
    return '';
  };

  // IMEI validation: exactly 15 digits
  const validateIMEI = (value) => {
    if (!value) {
      return 'IMEI number is required';
    }
    // Remove spaces and check if it's exactly 15 digits
    const cleaned = value.replace(/\s+/g, '');
    const imeiRegex = /^[0-9]{15}$/;
    if (!imeiRegex.test(cleaned)) {
      return 'IMEI must be exactly 15 digits';
    }
    return '';
  };

  // Fetch districts from API if not provided as props
  useEffect(() => {
    if (isOpen) {
      if (districts.length === 0) {
        const fetchDistricts = async () => {
          try {
            setLoadingDistricts(true);
            const response = await apiClient.get('/geography/districts?skip=0&limit=100');
            setLocalDistricts(response.data || []);
          } catch (error) {
            console.error('Error fetching districts:', error);
            setLocalDistricts([]);
          } finally {
            setLoadingDistricts(false);
          }
        };
        fetchDistricts();
      } else {
        setLocalDistricts(districts);
      }
    }
  }, [isOpen, districts]);

  // Fetch blocks when district is selected
  const fetchBlocks = useCallback(async (districtId) => {
    if (!districtId) {
      setLocalBlocks([]);
      setLocalGramPanchayats([]);
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
      setLocalBlocks(response.data || []);
      // Reset block and GP selections when district changes
      setFormData(prev => ({
        ...prev,
        blockId: '',
        gpId: ''
      }));
      setLocalGramPanchayats([]);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setLocalBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  // Fetch gram panchayats when district and block are selected
  const fetchGramPanchayats = useCallback(async (districtId, blockId) => {
    if (!districtId || !blockId) {
      setLocalGramPanchayats([]);
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
      setLocalGramPanchayats(response.data || []);
      // Reset GP selection when block changes
      setFormData(prev => ({
        ...prev,
        gpId: ''
      }));
    } catch (error) {
      console.error('Error fetching gram panchayats:', error);
      setLocalGramPanchayats([]);
    } finally {
      setLoadingGPs(false);
    }
  }, []);

  // Effect to fetch blocks when district changes
  useEffect(() => {
    if (formData.districtId) {
      fetchBlocks(formData.districtId);
    }
  }, [formData.districtId, fetchBlocks]);

  // Effect to fetch GPs when district and block change
  useEffect(() => {
    if (formData.districtId && formData.blockId) {
      fetchGramPanchayats(formData.districtId, formData.blockId);
    }
  }, [formData.districtId, formData.blockId, fetchGramPanchayats]);

  // Use props data if available, otherwise use local state
  const displayDistricts = districts.length > 0 ? districts : localDistricts;
  const displayBlocks = blocks.length > 0 ? blocks : localBlocks;
  const displayGramPanchayats = gramPanchayats.length > 0 ? gramPanchayats : localGramPanchayats;

  const handleInputChange = (field, value) => {
    let processedValue = value;

    // Auto-format vehicle number (uppercase, remove spaces)
    if (field === 'vehicleNumber') {
      processedValue = value.replace(/\s+/g, '').toUpperCase();
      const error = validateVehicleNumber(processedValue);
      setErrors(prev => ({ ...prev, vehicleNumber: error }));
    }

    // Auto-format IMEI (remove spaces, only digits)
    if (field === 'imeiNumber') {
      processedValue = value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
      const error = validateIMEI(processedValue);
      setErrors(prev => ({ ...prev, imeiNumber: error }));
    }

    // Handle location changes
    if (field === 'districtId') {
      setErrors(prev => ({ ...prev, districtId: '', blockId: '', gpId: '' }));
    }
    if (field === 'blockId') {
      setErrors(prev => ({ ...prev, blockId: '', gpId: '' }));
    }
    if (field === 'gpId') {
      setErrors(prev => ({ ...prev, gpId: '' }));
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleNext = () => {
    // Validate vehicle number
    const vehicleError = validateVehicleNumber(formData.vehicleNumber);
    const imeiError = validateIMEI(formData.imeiNumber);
    
    setErrors({
      vehicleNumber: vehicleError,
      imeiNumber: imeiError,
      districtId: '',
      blockId: '',
      gpId: ''
    });

    if (vehicleError || imeiError || !formData.vehicleNumber || !formData.imeiNumber) {
      return;
    }

    setModalStep(2);
  };

  const handleBack = () => {
    setModalStep(1);
  };

  const handleSubmit = async () => {
    // Validate location fields
    const locationErrors = {
      districtId: !formData.districtId ? 'Please select a district' : '',
      blockId: !formData.blockId ? 'Please select a block' : '',
      gpId: !formData.gpId ? 'Please select a Gram Panchayat' : ''
    };

    setErrors(prev => ({
      ...prev,
      ...locationErrors
    }));

    if (locationErrors.districtId || locationErrors.blockId || locationErrors.gpId) {
      return;
    }

    // Format vehicle number and IMEI before submitting
    const submitData = {
      ...formData,
      vehicleNumber: formData.vehicleNumber.replace(/\s+/g, '').toUpperCase(),
      imeiNumber: formData.imeiNumber.replace(/\s+/g, '')
    };

    await onSubmit(submitData);
    
    // Reset form
    setFormData({
      imeiNumber: '',
      vehicleNumber: '',
      districtId: '',
      blockId: '',
      gpId: ''
    });
    setErrors({
      vehicleNumber: '',
      imeiNumber: '',
      districtId: '',
      blockId: '',
      gpId: ''
    });
    setLocalBlocks([]);
    setLocalGramPanchayats([]);
    setModalStep(1);
  };

  const handleClose = () => {
    setFormData({
      imeiNumber: '',
      vehicleNumber: '',
      districtId: '',
      blockId: '',
      gpId: ''
    });
    setErrors({
      vehicleNumber: '',
      imeiNumber: '',
      districtId: '',
      blockId: '',
      gpId: ''
    });
    setLocalBlocks([]);
    setLocalGramPanchayats([]);
    setModalStep(1);
    onClose();
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        imeiNumber: '',
        vehicleNumber: '',
        districtId: '',
        blockId: '',
        gpId: ''
      });
      setErrors({
        vehicleNumber: '',
        imeiNumber: '',
        districtId: '',
        blockId: '',
        gpId: ''
      });
      setLocalBlocks([]);
      setLocalGramPanchayats([]);
      setModalStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Add Vehicle
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              border: 'none',
              background: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
          </button>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          gap: '16px'
        }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: modalStep === 1 ? '#10b981' : modalStep > 1 ? '#10b981' : '#e5e7eb',
              border: modalStep === 1 ? '2px solid #10b981' : modalStep > 1 ? '2px solid #10b981' : '2px solid #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: modalStep >= 1 ? 'white' : '#6b7280'
            }}>
              {modalStep > 1 ? '✓' : '01'}
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: modalStep === 1 ? '600' : '400',
              color: modalStep === 1 ? '#10b981' : '#6b7280'
            }}>
              Vehicle Details
            </span>
          </div>

          {/* Connector Line */}
          <div style={{
            width: '60px',
            height: '2px',
            backgroundColor: modalStep > 1 ? '#10b981' : '#d1d5db'
          }}></div>

          {/* Step 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: modalStep === 2 ? '#10b981' : '#e5e7eb',
              border: modalStep === 2 ? '2px solid #10b981' : '2px solid #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: modalStep === 2 ? 'white' : '#6b7280'
            }}>
              02
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: modalStep === 2 ? '600' : '400',
              color: modalStep === 2 ? '#10b981' : '#6b7280'
            }}>
              Location
            </span>
          </div>
        </div>

        {/* Step 1: Vehicle Details */}
        {modalStep === 1 && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Vehicle Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Enter vehicle number (e.g., RJ01AB1234)"
                value={formData.vehicleNumber}
                onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                maxLength={10}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: errors.vehicleNumber ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              />
              {errors.vehicleNumber && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#ef4444', 
                  marginTop: '4px' 
                }}>
                  {errors.vehicleNumber}
                </div>
              )}
              {!errors.vehicleNumber && formData.vehicleNumber && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#10b981', 
                  marginTop: '4px' 
                }}>
                  Format: 2 letters (state code) + 2 digits + 2 letters + 4 digits
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                IMEI Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Enter IMEI number (e.g., 357803372737250)"
                value={formData.imeiNumber}
                onChange={(e) => handleInputChange('imeiNumber', e.target.value)}
                maxLength={15}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: errors.imeiNumber ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              />
              {errors.imeiNumber && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#ef4444', 
                  marginTop: '4px' 
                }}>
                  {errors.imeiNumber}
                </div>
              )}
              {!errors.imeiNumber && formData.imeiNumber && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#10b981', 
                  marginTop: '4px' 
                }}>
                  {formData.imeiNumber.length}/15 digits - GPS device IMEI for tracking
                </div>
              )}
              {!errors.imeiNumber && !formData.imeiNumber && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  marginTop: '4px' 
                }}>
                  GPS device IMEI for tracking (must be exactly 15 digits)
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '32px'
            }}>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {modalStep === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  District <span style={{ color: '#ef4444' }}>*</span>
                </label>
                  <div style={{ position: 'relative' }}>
                  <select
                    value={formData.districtId}
                    onChange={(e) => handleInputChange('districtId', e.target.value)}
                    disabled={isSubmitting || loadingDistricts}
                    style={{
                      width: '100%',
                      padding: '10px 32px 10px 12px',
                      border: errors.districtId ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      appearance: 'none',
                      backgroundColor: 'white',
                      cursor: (isSubmitting || loadingDistricts) ? 'not-allowed' : 'pointer',
                      boxSizing: 'border-box',
                      opacity: (isSubmitting || loadingDistricts) ? 0.6 : 1,
                    }}
                  >
                    <option value="">{loadingDistricts ? 'Loading districts...' : 'Select District'}</option>
                    {displayDistricts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {loadingDistricts && (
                    <Loader style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      color: '#6b7280',
                      animation: 'spin 1s linear infinite',
                    }} />
                  )}
                  {!loadingDistricts && (
                    <ChevronDown style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      color: '#6b7280',
                      pointerEvents: 'none'
                    }} />
                  )}
                </div>
                {errors.districtId && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#ef4444', 
                    marginTop: '4px' 
                  }}>
                    {errors.districtId}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Block <span style={{ color: '#ef4444' }}>*</span>
                </label>
                  <div style={{ position: 'relative' }}>
                  <select
                    value={formData.blockId}
                    onChange={(e) => handleInputChange('blockId', e.target.value)}
                    disabled={isSubmitting || !formData.districtId || loadingBlocks}
                    style={{
                      width: '100%',
                      padding: '10px 32px 10px 12px',
                      border: errors.blockId ? '1px solid #ef4444' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      appearance: 'none',
                      backgroundColor: 'white',
                      cursor: (isSubmitting || !formData.districtId || loadingBlocks) ? 'not-allowed' : 'pointer',
                      boxSizing: 'border-box',
                      opacity: (isSubmitting || !formData.districtId || loadingBlocks) ? 0.6 : 1,
                    }}
                  >
                    <option value="">
                      {!formData.districtId 
                        ? 'Select district first' 
                        : loadingBlocks 
                        ? 'Loading blocks...' 
                        : 'Select Block'}
                    </option>
                    {displayBlocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                  {loadingBlocks && (
                    <Loader style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      color: '#6b7280',
                      animation: 'spin 1s linear infinite',
                    }} />
                  )}
                  {!loadingBlocks && (
                    <ChevronDown style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      color: '#6b7280',
                      pointerEvents: 'none'
                    }} />
                  )}
                </div>
                {errors.blockId && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#ef4444', 
                    marginTop: '4px' 
                  }}>
                    {errors.blockId}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Gram Panchayat <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={formData.gpId}
                  onChange={(e) => handleInputChange('gpId', e.target.value)}
                  disabled={isSubmitting || !formData.blockId || loadingGPs}
                  style={{
                    width: '100%',
                    padding: '10px 32px 10px 12px',
                    border: errors.gpId ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    appearance: 'none',
                    backgroundColor: 'white',
                    cursor: (isSubmitting || !formData.blockId || loadingGPs) ? 'not-allowed' : 'pointer',
                    boxSizing: 'border-box',
                    opacity: (isSubmitting || !formData.blockId || loadingGPs) ? 0.6 : 1,
                  }}
                >
                  <option value="">
                    {!formData.blockId 
                      ? 'Select block first' 
                      : loadingGPs 
                      ? 'Loading Gram Panchayats...' 
                      : 'Select Gram Panchayat'}
                  </option>
                  {displayGramPanchayats.map((gp) => (
                    <option key={gp.id} value={gp.id}>
                      {gp.name}
                    </option>
                  ))}
                </select>
                {loadingGPs && (
                  <Loader style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: '#6b7280',
                    animation: 'spin 1s linear infinite',
                  }} />
                )}
                {!loadingGPs && (
                  <ChevronDown style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: '#6b7280',
                    pointerEvents: 'none'
                  }} />
                )}
              </div>
              {errors.gpId && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#ef4444', 
                  marginTop: '4px' 
                }}>
                  {errors.gpId}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              marginTop: '32px'
            }}>
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                Back
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmitting && (
                    <Loader 
                      style={{ 
                        width: '16px', 
                        height: '16px',
                        animation: 'spin 1s linear infinite',
                      }} 
                    />
                  )}
                  {isSubmitting ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddVehicleModal;

