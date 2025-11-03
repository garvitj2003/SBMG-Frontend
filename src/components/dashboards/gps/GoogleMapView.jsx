import React from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { Loader } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 26.2389,
  lng: 73.0243,
};

// Map options for better styling
const mapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

/**
 * Get marker icon URL based on vehicle status
 */
const getMarkerIcon = (status) => {
  // Define colors based on status
  const colors = {
    running: '#3b82f6',  // blue
    stopped: '#ef4444',  // red
    active: '#22c55e',   // green
    inactive: '#9ca3af', // gray
  };

  const color = colors[status?.toLowerCase()] || colors.inactive;
  
  // Use a custom SVG marker with truck icon
  const svgMarker = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
      <path d="M12 18h6v-4h4v4h4l-7 7-7-7z" fill="white"/>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarker)}`,
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 20),
  };
};

/**
 * GoogleMapView component to display vehicles on a map
 */
const GoogleMapView = ({ 
  vehicles = [], 
  selectedVehicle = null,
  onVehicleSelect = () => {},
  center = null,
  zoom = 13,
}) => {
  // Debug: Check if API key is available
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log('🗺️ Google Maps API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    language: 'en',
    region: 'IN',
  });

  // Calculate center based on vehicles if not provided
  const mapCenter = React.useMemo(() => {
    if (center) return center;
    
    if (vehicles.length === 0) return defaultCenter;
    
    // If there's a selected vehicle, center on it
    if (selectedVehicle?.coordinates) {
      return selectedVehicle.coordinates;
    }
    
    // Otherwise, center on first vehicle with coordinates
    const vehicleWithCoords = vehicles.find(v => v.coordinates?.lat && v.coordinates?.lng);
    return vehicleWithCoords?.coordinates || defaultCenter;
  }, [vehicles, selectedVehicle, center]);

  if (loadError) {
    console.error('🗺️ Google Maps Load Error:', loadError);
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        padding: '20px',
      }}>
        <div style={{
          fontSize: '16px',
          color: '#ef4444',
          marginBottom: '8px',
          fontWeight: '500',
        }}>
          Error loading Google Maps
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '8px',
          textAlign: 'center',
        }}>
          {loadError.message || 'Please check your API key and internet connection'}
        </div>
        {!apiKey && (
          <div style={{
            fontSize: '12px',
            color: '#dc2626',
            textAlign: 'center',
          }}>
            ⚠️ API key is missing. Please configure VITE_GOOGLE_MAPS_API_KEY environment variable.
          </div>
        )}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Loader 
            style={{ 
              width: '48px', 
              height: '48px', 
              color: '#10b981',
              animation: 'spin 1s linear infinite',
            }} 
          />
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
          }}>
            Loading map...
          </div>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={zoom}
      options={mapOptions}
    >
      {/* Render vehicle markers */}
      {vehicles.map((vehicle) => {
        // Skip vehicles without valid coordinates
        if (!vehicle.coordinates?.lat || !vehicle.coordinates?.lng) {
          return null;
        }

        return (
          <Marker
            key={vehicle.vehicle_id || vehicle.id}
            position={vehicle.coordinates}
            icon={getMarkerIcon(vehicle.status)}
            onClick={() => onVehicleSelect(vehicle)}
            title={vehicle.vehicle_no || vehicle.vehicle_number || 'Unknown'}
            animation={
              selectedVehicle?.vehicle_id === vehicle.vehicle_id
                ? window.google.maps.Animation.BOUNCE
                : null
            }
          />
        );
      })}

      {/* Render route polylines for vehicles with routes */}
      {vehicles.map((vehicle) => {
        if (!vehicle.route || !Array.isArray(vehicle.route) || vehicle.route.length < 2) {
          return null;
        }

        // Filter out invalid coordinates from route
        const validRoute = vehicle.route.filter(
          point => point?.lat && point?.lng
        );

        if (validRoute.length < 2) return null;

        const statusColors = {
          running: '#3b82f6',
          stopped: '#ef4444',
          active: '#22c55e',
          inactive: '#9ca3af',
        };

        const strokeColor = statusColors[vehicle.status?.toLowerCase()] || '#3b82f6';

        return (
          <Polyline
            key={`route-${vehicle.vehicle_id || vehicle.id}`}
            path={validRoute}
            options={{
              strokeColor: strokeColor,
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        );
      })}
    </GoogleMap>
  );
};

export default GoogleMapView;

