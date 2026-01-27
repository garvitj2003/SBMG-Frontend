import React from 'react';
import { Search, X, Truck, Circle, AlertCircle, Pencil, Trash2 } from 'lucide-react';

/**
 * FleetSidebar component to display vehicle list with filters
 */
const FleetSidebar = ({
  vehicles = [],
  activeFleetTab = 'All(03)',
  fleetTabs = ['All(03)', 'Active(01)', 'Running(01)', 'Stopped(01)'],
  searchQuery = '',
  onSearchChange = () => {},
  onTabChange = () => {},
  onVehicleClick = () => {},
  onEdit = null,
  onDelete = null,
  selectedVehicle = null,
  showFlaggedToggle = false,
  flaggedCount = 0,
  showOnlyFlagged = false,
  onFlaggedToggle = () => {},
}) => {
  return (
    <div style={{
      width: '400px',
      backgroundColor: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ padding: '24px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 5px 0'
        }}>
          Fleet
        </h2>

        {/* Fleet Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {fleetTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              style={{
                padding: '5px 7px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                backgroundColor: activeFleetTab === tab ? '#10b981' : '#f3f4f6',
                color: activeFleetTab === tab ? 'white' : '#6b7280',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
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
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 40px 10px 40px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <X 
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af',
                cursor: 'pointer'
              }} 
            />
          )}
        </div>

        {/* Flagged Vehicles Toggle */}
        {showFlaggedToggle && flaggedCount > 0 && (
          <div 
            onClick={onFlaggedToggle}
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              marginBottom: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fde68a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fef3c7';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle style={{ 
                width: '20px', 
                height: '20px', 
                color: '#d97706' 
              }} />
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#92400e' 
              }}>
                Flagged vehicles ({flaggedCount})
              </span>
            </div>

            <div style={{
              position: 'relative',
              width: '44px',
              height: '24px',
              backgroundColor: showOnlyFlagged ? '#7c3aed' : '#d1d5db',
              borderRadius: '12px',
              transition: 'background-color 0.3s ease',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                position: 'absolute',
                top: '2px',
                left: showOnlyFlagged ? '22px' : '2px',
                width: '20px',
                height: '20px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: 'left 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}></div>
            </div>
          </div>
        )}

        {/* Vehicle List */}
        <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          maxHeight: 'calc(100vh - 450px)',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {vehicles.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <AlertCircle style={{ 
                width: '48px', 
                height: '48px', 
                margin: '0 auto 16px',
                color: '#9ca3af'
              }} />
              <p style={{ fontSize: '14px', margin: 0 }}>
                No vehicles found
              </p>
            </div>
          ) : (
            vehicles.map((vehicle) => {
              const isSelected = selectedVehicle?.vehicle_id === vehicle.vehicle_id || 
                               selectedVehicle?.id === vehicle.id;
              
              return (
                <div 
                  key={vehicle.vehicle_id || vehicle.id}
                  onClick={() => onVehicleClick(vehicle)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: vehicle.isFlagged ? '#fef3c7' : isSelected ? '#f0fdf4' : '#ffffff',
                    borderRadius: '8px',
                    border: vehicle.isFlagged 
                      ? '2px solid #fbbf24' 
                      : isSelected 
                        ? '2px solid #10b981'
                        : '1px solid #e5e7eb',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 4px 6px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                    }
                  }}
                >
                  <Truck style={{ width: '24px', height: '24px', color: '#4b5563' }} />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', marginBottom: '2px' }}>
                      Vehicle No
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                      {vehicle.vehicle_no || vehicle.vehicle_number || 'N/A'}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Circle 
                      style={{ 
                        width: '10px', 
                        height: '10px', 
                        color: vehicle.status === 'active' 
                          ? '#10b981' 
                          : vehicle.status === 'running'
                            ? '#3b82f6'
                            : vehicle.status === 'stopped'
                              ? '#ef4444'
                              : '#6b7280',
                        fill: vehicle.status === 'active' 
                          ? '#10b981' 
                          : vehicle.status === 'running'
                            ? '#3b82f6'
                            : vehicle.status === 'stopped'
                              ? '#ef4444'
                              : '#6b7280'
                      }} 
                    />
                    <span style={{ 
                      fontSize: '12px', 
                      color: vehicle.status === 'active' 
                        ? '#10b981' 
                        : vehicle.status === 'running'
                          ? '#3b82f6'
                          : '#6b7280',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {vehicle.status || 'Unknown'}
                    </span>
                  </div>

                  {/* Edit & Delete actions */}
                  {(onEdit || onDelete) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }} onClick={(e) => e.stopPropagation()}>
                      {onEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(vehicle); }}
                          title="Edit vehicle"
                          style={{
                            padding: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.color = '#374151';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          <Pencil style={{ width: '14px', height: '14px' }} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(vehicle); }}
                          title="Delete vehicle"
                          style={{
                            padding: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                            e.currentTarget.style.color = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                          }}
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetSidebar;

