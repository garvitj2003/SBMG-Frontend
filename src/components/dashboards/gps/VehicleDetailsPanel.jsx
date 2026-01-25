import React from 'react';
import { X, Loader, Pencil, Trash2 } from 'lucide-react';

/**
 * VehicleDetailsPanel component to display detailed vehicle information
 */
const VehicleDetailsPanel = ({
  vehicle = null,
  details = null,
  isLoading = false,
  onClose = () => {},
  onEdit = null,
  onDelete = null,
}) => {
  if (!vehicle) return null;

  return (
    <div style={{
      width: '400px',
      backgroundColor: 'white',
      borderLeft: '1px solid #e5e7eb',
      padding: '24px',
      overflowY: 'auto',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: 0,
        }}>
          Vehicle Details
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {onEdit && (
            <button
              onClick={() => onEdit(vehicle)}
              title="Edit vehicle"
              style={{
                padding: '6px',
                border: 'none',
                background: 'none',
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
              <Pencil style={{ width: '18px', height: '18px' }} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(vehicle)}
              title="Delete vehicle"
              style={{
                padding: '6px',
                border: 'none',
                background: 'none',
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
              <Trash2 style={{ width: '18px', height: '18px' }} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          </button>
        </div>
      </div>

      {/* Vehicle Basic Info */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
      }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            Vehicle Number
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {vehicle.vehicle_no || vehicle.vehicle_number || 'N/A'}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
            Vehicle Name
          </div>
          <div style={{ fontSize: '14px', color: '#111827' }}>
            {vehicle.vehicle_name || 'N/A'}
          </div>
        </div>

        {details && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                District
              </div>
              <div style={{ fontSize: '14px', color: '#111827' }}>
                {details.district || vehicle.district || 'N/A'}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Block
              </div>
              <div style={{ fontSize: '14px', color: '#111827' }}>
                {details.block || vehicle.block || 'N/A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Gram Panchayat
              </div>
              <div style={{ fontSize: '14px', color: '#111827' }}>
                {details.gp || vehicle.gp || 'N/A'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Current Status */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: vehicle.status === 'active' || vehicle.status === 'running'
          ? '#f0fdf4'
          : '#fef2f2',
        borderRadius: '8px',
        border: `1px solid ${
          vehicle.status === 'active' || vehicle.status === 'running'
            ? '#10b981'
            : '#ef4444'
        }`,
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          Current Status
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: vehicle.status === 'active' || vehicle.status === 'running'
            ? '#10b981'
            : '#ef4444',
          textTransform: 'capitalize',
        }}>
          {vehicle.status || 'Unknown'}
        </div>
        {vehicle.speed !== undefined && (
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            Speed: {vehicle.speed} km/h
          </div>
        )}
        {vehicle.last_updated && (
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Last updated: {new Date(vehicle.last_updated).toLocaleString()}
          </div>
        )}
      </div>

      {/* Driver Info */}
      {vehicle.driver && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            Driver Information
          </div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Name
            </div>
            <div style={{ fontSize: '14px', color: '#111827' }}>
              {vehicle.driver.name || 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Phone
            </div>
            <div style={{ fontSize: '14px', color: '#111827' }}>
              {vehicle.driver.phone || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Daily Data Table */}
      {isLoading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          gap: '12px',
        }}>
          <Loader 
            style={{ 
              width: '32px', 
              height: '32px', 
              color: '#10b981',
              animation: 'spin 1s linear infinite',
            }} 
          />
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Loading details...
          </div>
        </div>
      ) : details?.daily_data && details.daily_data.length > 0 ? (
        <>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#111827',
            marginTop: 0,
            marginBottom: '12px',
          }}>
            Daily Data
          </h3>
          
          {details.working_hours_total && (
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              marginBottom: '16px',
            }}>
              Total Working Hours: <span style={{ fontWeight: '600', color: '#111827' }}>
                {details.working_hours_total}
              </span>
            </div>
          )}
          
          <div style={{ 
            overflowX: 'auto',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}>
            <table style={{
              width: '100%',
              fontSize: '13px',
              borderCollapse: 'collapse',
            }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    Date
                  </th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    Running Hr
                  </th>
                  <th style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {details.daily_data.map((day, index) => (
                  <tr key={index} style={{ 
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' 
                  }}>
                    <td style={{
                      padding: '12px 8px',
                      borderBottom: '1px solid #e5e7eb',
                      color: '#111827',
                    }}>
                      {day.date}
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      borderBottom: '1px solid #e5e7eb',
                      color: '#111827',
                    }}>
                      {day.running_hr || '0:00'}
                    </td>
                    <td style={{
                      padding: '12px 8px',
                      borderBottom: '1px solid #e5e7eb',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: day.status?.toLowerCase() === 'running' || day.status?.toLowerCase() === 'active'
                          ? '#d1fae5'
                          : '#fee2e2',
                        color: day.status?.toLowerCase() === 'running' || day.status?.toLowerCase() === 'active'
                          ? '#065f46'
                          : '#991b1b',
                      }}>
                        {day.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px',
        }}>
          No daily data available
        </div>
      )}
    </div>
  );
};

export default VehicleDetailsPanel;

