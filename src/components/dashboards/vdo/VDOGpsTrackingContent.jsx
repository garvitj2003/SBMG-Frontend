import React, { useState } from "react";
import { Plus, Calendar, ChevronDown, X, Upload, MapPin, Search, Truck, Circle } from 'lucide-react';

const VDOGpsTrackingContent = () => {
    // VDO: Fixed location, no scope selection needed
    const [activeFleetTab, setActiveFleetTab] = useState('All(03)');
    const fleetTabs = ['All(03)', 'Active(01)', 'Running(01)', 'Stopped(01)'];

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
              • January 2025
            </span>
        </div>

        {/* VDO: No scope buttons or location dropdown (location is fixed) */}
      </div>

      {/* Main Content - Two Column Layout */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 80px)',
        gap: '0'
      }}>
        {/* Left Panel - Fleet Overview */}
        <div style={{
          width: '400px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Fleet Section */}
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
                  onClick={() => setActiveFleetTab(tab)}
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
                placeholder="Search vehicles..."
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <X style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af',
                cursor: 'pointer'
              }} />
            </div>

            {/* Vehicle List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Vehicle 1 - Active */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <Truck style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    Vehicle No
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Some data
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Circle style={{ width: '8px', height: '8px', color: '#10b981', fill: '#10b981' }} />
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                    • Active
                  </span>
                </div>
              </div>

              {/* Vehicle 2 - Running */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <Truck style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    Vehicle No
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Some data
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Circle style={{ width: '8px', height: '8px', color: '#3b82f6', fill: '#3b82f6' }} />
                  <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '500' }}>
                    • Running
                  </span>
                </div>
              </div>

              {/* Vehicle 3 - Stopped */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <Truck style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    Vehicle No
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Some data
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Circle style={{ width: '8px', height: '8px', color: '#ef4444', fill: '#ef4444' }} />
                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>
                    • Stopped
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Map View */}
        <div style={{
          flex: 1,
          backgroundColor: '#f8fafc',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Map Controls */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
        

           
          </div>

          {/* Map Placeholder */}
          <div style={{
            flex: 1,
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="%23d1d5db" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grid)"/%3E%3C/svg%3E")',
            backgroundSize: '20px 20px'
          }}>
            {/* Map Content Placeholder */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <MapPin style={{ width: '48px', height: '48px', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
                GPS Tracking Map
              </h3>
              <p style={{ fontSize: '14px', margin: 0 }}>
                Interactive map view with vehicle locations
              </p>
            </div>

            {/* Vehicle Markers on Map */}
            <div style={{
              position: 'absolute',
              top: '30%',
              left: '25%',
              width: '24px',
              height: '24px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <Truck style={{ width: '12px', height: '12px', color: 'white' }} />
            </div>

            <div style={{
              position: 'absolute',
              top: '40%',
              left: '60%',
              width: '24px',
              height: '24px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <Truck style={{ width: '12px', height: '12px', color: 'white' }} />
            </div>

            <div style={{
              position: 'absolute',
              top: '60%',
              left: '20%',
              width: '24px',
              height: '24px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <Truck style={{ width: '12px', height: '12px', color: 'white' }} />
            </div>

            {/* Route Line */}
            <div style={{
              position: 'absolute',
              top: '35%',
              left: '30%',
              width: '200px',
              height: '2px',
              backgroundColor: '#3b82f6',
              transform: 'rotate(15deg)',
              opacity: 0.7
            }}></div>

            {/* Bottom Right Number */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827',
              backgroundColor: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              84
            </div>
          </div>
        </div>
      </div>

        </div>
    );
};

export default VDOGpsTrackingContent;