import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * DeleteConfirmModal - confirmation dialog before deleting a vehicle
 */
const DeleteConfirmModal = ({
  isOpen = false,
  vehicle = null,
  onClose = () => {},
  onConfirm = () => {},
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const vehicleNo = vehicle?.vehicle_no || vehicle?.vehicle_number || 'this vehicle';

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
      zIndex: 1001,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            flexShrink: 0,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle style={{ width: '24px', height: '24px', color: '#ef4444' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
              Delete vehicle?
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{vehicleNo}</strong>? This action cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              border: 'none',
              background: 'none',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              padding: '4px',
              opacity: isDeleting ? 0.5 : 1,
            }}
          >
            <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: '#ef4444',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
