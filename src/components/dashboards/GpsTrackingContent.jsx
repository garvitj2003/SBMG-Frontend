import React, { useState, useMemo } from "react";
import { Plus, MapPin, ChevronDown } from 'lucide-react';
import GoogleMapView from './gps/GoogleMapView';
import FleetSidebar from './gps/FleetSidebar';
import VehicleDetailsPanel from './gps/VehicleDetailsPanel';
import AddVehicleModal from './gps/AddVehicleModal';
import { useVehicles, filterVehiclesByStatus, searchVehicles } from '../../hooks/useVehicles';
import { useVehicleDetails } from '../../hooks/useVehicleDetails';
import { useAddVehicle } from '../../hooks/useAddVehicle';

const GpsTrackingContent = () => {
  const [activeScope, setActiveScope] = useState('Districts');
  const [activeFleetTab, setActiveFleetTab] = useState('All(03)');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    districtId: null,
    blockId: null,
    gpId: null
  });

  const scopeButtons = ['All', 'Districts', 'Blocks', 'GPs'];

  // Fetch vehicles from API using location IDs
  // TODO: Connect to actual location context when available
  const { data: vehiclesData = [], isLoading: isLoadingVehicles, error: vehiclesError } = useVehicles({
    districtId: selectedLocation.districtId || 1, // Default to district 1 for demo
    blockId: selectedLocation.blockId || 1, // Default to block 1 for demo
    gpId: selectedLocation.gpId || 1, // Default to gp 1 for demo
  });

  // Fetch selected vehicle details
  const currentDate = new Date();
  const { data: vehicleDetails, isLoading: isLoadingDetails } = useVehicleDetails(
    selectedVehicle?.vehicle_id || selectedVehicle?.id,
    {
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    },
    {
      enabled: !!selectedVehicle,
    }
  );

  // Add vehicle mutation
  const addVehicleMutation = useAddVehicle({
    onSuccess: () => {
      setShowAddVehicleModal(false);
      alert('Vehicle added successfully!');
    },
    onError: (error) => {
      console.error('Failed to add vehicle:', error);
      alert('Failed to add vehicle. Please try again.');
    },
  });

  // Filter and search vehicles
  const filteredVehicles = useMemo(() => {
    let result = vehiclesData;

    // Filter by status tab
    result = filterVehiclesByStatus(result, activeFleetTab);

    // Filter by search query
    result = searchVehicles(result, searchQuery);

    // Filter by flagged status
    if (showOnlyFlagged) {
      result = result.filter(v => v.isFlagged);
    }

    return result;
  }, [vehiclesData, activeFleetTab, searchQuery, showOnlyFlagged]);

  // Calculate fleet stats
  const fleetStats = useMemo(() => {
    const all = vehiclesData.length;
    const active = vehiclesData.filter(v => v.status === 'active').length;
    const running = vehiclesData.filter(v => v.status === 'running').length;
    const stopped = vehiclesData.filter(v => v.status === 'stopped').length;

    return {
      all,
      active,
      running,
      stopped,
    };
  }, [vehiclesData]);

  // Update fleet tabs with real counts
  const fleetTabs = useMemo(() => [
    `All(${String(fleetStats.all).padStart(2, '0')})`,
    `Active(${String(fleetStats.active).padStart(2, '0')})`,
    `Running(${String(fleetStats.running).padStart(2, '0')})`,
    `Stopped(${String(fleetStats.stopped).padStart(2, '0')})`,
  ], [fleetStats]);

  const flaggedCount = vehiclesData.filter(v => v.isFlagged).length;

  const handleAddVehicle = async (formData) => {
    await addVehicleMutation.mutateAsync({
      gp_id: formData.gpId, // Use GP ID from form
      vehicle_no: formData.vehicleNumber,
      imei: formData.imeiNumber,
    });
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
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
        {/* Left side - Overview */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <h1 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#374151',
              margin: 0
            }}>
              Overview
            </h1>
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0
            }}>
              {new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
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
            <button style={{
              width: '100%',
              padding: '5px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
                <span>Select option</span>
              </div>
              <ChevronDown style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 80px)',
        gap: '0'
      }}>
        {/* Left Panel - Fleet Overview */}
        <FleetSidebar
          vehicles={filteredVehicles}
          activeFleetTab={activeFleetTab}
          fleetTabs={fleetTabs}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onTabChange={setActiveFleetTab}
          onVehicleClick={handleVehicleSelect}
          selectedVehicle={selectedVehicle}
          showFlaggedToggle={true}
          flaggedCount={flaggedCount}
          showOnlyFlagged={showOnlyFlagged}
          onFlaggedToggle={() => setShowOnlyFlagged(!showOnlyFlagged)}
        />

        {/* Center Panel - Map View */}
        <div style={{
          flex: 1,
          backgroundColor: '#f8fafc',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Add Vehicle Button */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10
          }}>
            <button
              onClick={() => setShowAddVehicleModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#111827';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1f2937';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              }}
            >
              <Plus style={{ width: '18px', height: '18px' }} />
              Add Vehicle
            </button>
          </div>

          {/* Google Map */}
          {isLoadingVehicles ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Loading vehicles...
              </div>
            </div>
          ) : vehiclesError ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f3f4f6',
            }}>
              <div style={{ fontSize: '14px', color: '#ef4444' }}>
                Error loading vehicles: {vehiclesError.message}
              </div>
            </div>
          ) : (
            <GoogleMapView
              vehicles={filteredVehicles}
              selectedVehicle={selectedVehicle}
              onVehicleSelect={handleVehicleSelect}
            />
          )}
        </div>

        {/* Right Panel - Vehicle Details */}
        {selectedVehicle && (
          <VehicleDetailsPanel
            vehicle={selectedVehicle}
            details={vehicleDetails}
            isLoading={isLoadingDetails}
            onClose={() => setSelectedVehicle(null)}
          />
        )}
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        onSubmit={handleAddVehicle}
        isSubmitting={addVehicleMutation.isPending}
        districts={[]}
        blocks={[]}
        gramPanchayats={[]}
      />
    </div>
  );
};

export default GpsTrackingContent;
