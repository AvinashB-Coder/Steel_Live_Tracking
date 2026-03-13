import { useEffect, useState, useRef, useCallback } from 'react';
import './LiveMap.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAmlOOh_RzyjXPCl2hfLfUxgx-wswJ-OlQ';

function LiveMap({ 
  locations = [], 
  vendorLocation = { lat: 13.0827, lng: 80.2707 }, 
  trip = null, 
  showRoute = false,
  onLocationUpdate = null
}) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(null);
  const [status, setStatus] = useState('Initializing GPS...');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Default location - Chennai
  const defaultLocation = vendorLocation || { lat: 13.0827, lng: 80.2707 };

  const loadGoogleMaps = useCallback(() => {
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      existingScript.onload = () => initMap();
      return;
    }

    setMapError(false);
    setErrorDetails('');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps loaded successfully');
      initMap();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps');
      setMapError(true);
      setErrorDetails('Google Maps script failed to load. Check your internet connection or API key.');
    };
    document.head.appendChild(script);
  }, []);

  // Load Google Maps script
  useEffect(() => {
    loadGoogleMaps();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [loadGoogleMaps]);

  // Initialize map
  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      const mapOptions = {
        center: defaultLocation,
        zoom: 15,
        mapTypeId: 'roadmap',
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: true,
        fullscreenControl: true,
        rotateControl: true,
        scaleControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
      setMapLoaded(true);
      setMapError(false);
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError(true);
      setErrorDetails('Failed to initialize the map. Please check your browser settings.');
    }

    // Start tracking location after map is initialized (outside try-catch)
    startLocationTracking();
  };

  // Start real-time location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      setLocationPermissionDenied(true);
      setStatus('GPS Unsupported');
      return;
    }

    setStatus('Locating...');

    // Success callback
    const successCallback = (position) => {
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: new Date()
      };

      console.log('Location updated:', newLocation);

      // Calculate speed if we have previous position
      if (lastPositionRef.current && lastTimeRef.current) {
        const timeDiff = (Date.now() - lastTimeRef.current) / 3600000; // hours
        const distance = calculateDistance(
          lastPositionRef.current,
          newLocation
        );
        if (timeDiff > 0) {
          const calculatedSpeed = distance / timeDiff;
          setSpeed(Math.min(calculatedSpeed, 120)); // Cap at 120 km/h
        }
      }

      lastPositionRef.current = newLocation;
      lastTimeRef.current = Date.now();
      setCurrentLocation(newLocation);
      setStatus('In Transit');
      setLocationPermissionDenied(false);

      // Notify parent component if callback exists
      if (onLocationUpdate) {
        onLocationUpdate(newLocation);
      }

      // Update map marker
      updateMapMarker(newLocation);

      // Pan map to new location
      if (googleMapRef.current) {
        googleMapRef.current.panTo(newLocation);
      }
    };

    // Error callback
    const errorCallback = (error) => {
      console.error('Geolocation error:', error);
      let errorMsg = 'GPS Error';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = 'GPS Access Denied';
          console.log('User denied location permission');
          setLocationPermissionDenied(true);
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg = 'GPS Unavailable';
          console.log('Location information unavailable');
          break;
        case error.TIMEOUT:
          errorMsg = 'GPS Timeout';
          console.log('Location request timeout');
          break;
        default:
          console.log('Unknown location error');
      }
      
      setStatus(errorMsg);
    };

    // Watch position with high accuracy
    const watchOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout to 15s
      maximumAge: 0
    };

    // Clear existing watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      watchOptions
    );

    // Also get immediate position
    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      watchOptions
    );
  }, [onLocationUpdate]);

  // Update map marker
  const updateMapMarker = (location) => {
    if (!googleMapRef.current || !window.google || !window.google.maps) return;

    const position = { lat: location.lat, lng: location.lng };

    if (!markerRef.current) {
      // Create custom vehicle marker
      const markerIcon = {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: '#00ff88',
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#ffffff',
        rotation: location.heading || 0,
        anchor: new window.google.maps.Point(0, 0)
      };

      markerRef.current = new window.google.maps.Marker({
        position,
        map: googleMapRef.current,
        icon: markerIcon,
        title: 'Vehicle Location',
        animation: window.google.maps.Animation.DROP
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(location)
      });

      markerRef.current.addListener('click', () => {
        infoWindow.setContent(createInfoWindowContent(location));
        infoWindow.open(googleMapRef.current, markerRef.current);
      });

      // Add pulse circle around marker
      const pulseCircle = new window.google.maps.Circle({
        strokeColor: '#00ff88',
        strokeOpacity: 0.4,
        strokeWeight: 2,
        fillColor: '#00ff88',
        fillOpacity: 0.15,
        map: googleMapRef.current,
        center: position,
        radius: location.accuracy || 10,
        clickable: false
      });

      // Update circle position when marker moves
      markerRef.current.addListener('position_changed', () => {
        pulseCircle.setCenter(markerRef.current.getPosition());
      });

    } else {
      // Update existing marker
      markerRef.current.setPosition(position);
      
      const icon = markerRef.current.getIcon();
      if (icon && typeof icon === 'object') {
        icon.rotation = location.heading || icon.rotation || 0;
        markerRef.current.setIcon(icon);
      }
    }
  };

  // Create info window content
  const createInfoWindowContent = (location) => {
    const time = location.timestamp ? location.timestamp.toLocaleTimeString() : 'N/A';
    return `
      <div style="padding: 12px; min-width: 220px; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 12px 0; color: #1a73e8; font-size: 16px; border-bottom: 2px solid #1a73e8; padding-bottom: 8px;">
          🚛 Vehicle Location
        </h3>
        <div style="display: grid; gap: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666; font-size: 13px;">📍 Coordinates:</span>
            <span style="color: #333; font-weight: 600; font-size: 13px;">${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666; font-size: 13px;">⚡ Speed:</span>
            <span style="color: #333; font-weight: 600; font-size: 13px;">${speed > 0 ? `${speed.toFixed(1)} km/h` : 'Stopped'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666; font-size: 13px;">🎯 Accuracy:</span>
            <span style="color: #333; font-weight: 600; font-size: 13px;">${location.accuracy ? `±${Math.round(location.accuracy)}m` : 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666; font-size: 13px;">🕐 Last Update:</span>
            <span style="color: #333; font-weight: 600; font-size: 13px;">${time}</span>
          </div>
        </div>
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee;">
          <span style="background: #e8f5e9; color: #27ae60; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
            ● ${status}
          </span>
        </div>
      </div>
    `;
  };

  // Calculate ETA based on distance to destination
  useEffect(() => {
    if (!currentLocation || !trip?.destination) return;
    
    const destination = trip.destination_coords || defaultLocation;
    const remaining = calculateDistance(currentLocation, destination);
    const estimatedMinutes = speed > 0 ? Math.ceil((remaining / speed) * 60) : null;
    setEta(estimatedMinutes);
  }, [currentLocation, trip, defaultLocation, speed]);

  // Get driver name
  const getFirstName = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.username?.split(' ')[0] || user.email?.split('@')[0] || 'Driver';
    } catch {
      return 'Driver';
    }
  };

  // Format distance
  const formatDistance = (km) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(2)}km`;
  };

  const handleRetry = () => {
    setMapError(false);
    setErrorDetails('');
    loadGoogleMaps();
  };

  return (
    <div className="live-map-container">
      <div className="map-header">
        <div className="map-title">
          <i className="fa fa-map-marker-alt"></i>
          <span>Live Location Tracking</span>
        </div>
        <div className={`live-indicator ${status === 'Arrived' ? 'arrived' : ''} ${status.includes('Error') || status.includes('Denied') ? 'error' : ''}`}>
          <span className="pulse-dot"></span>
          <span>{status}</span>
        </div>
      </div>

      <div className="map-wrapper">
        <div ref={mapRef} className="google-map" />

        {!mapLoaded && !mapError && (
          <div className="map-loading">
            <i className="fa fa-spinner fa-spin"></i>
            <span>Loading Google Maps...</span>
          </div>
        )}

        {mapError && (
          <div className="map-error">
            <i className="fa fa-exclamation-triangle"></i>
            <h3>Map Error</h3>
            <span>{errorDetails}</span>
            <button className="retry-btn" onClick={handleRetry}>
              <i className="fa fa-redo"></i> Retry
            </button>
          </div>
        )}

        {locationPermissionDenied && (
          <div className="map-error location-error">
            <i className="fa fa-location-arrow"></i>
            <h3>GPS Permission Denied</h3>
            <span>Please enable location services in your browser settings to track live movements.</span>
            <button className="retry-btn" onClick={startLocationTracking}>
              <i className="fa fa-sync-alt"></i> Grant Access
            </button>
          </div>
        )}

        <div className="map-overlay">
          <div className="overlay-card">
            <div className="overlay-item">
              <div className="overlay-icon speed">
                <i className="fa fa-tachometer-alt"></i>
              </div>
              <div className="overlay-content">
                <span className="overlay-label">Speed</span>
                <span className="overlay-value">
                  {speed > 0 ? `${speed.toFixed(1)} km/h` : '🛑 Stopped'}
                </span>
              </div>
            </div>

            <div className="overlay-item">
              <div className="overlay-icon coordinates">
                <i className="fa fa-globe"></i>
              </div>
              <div className="overlay-content">
                <span className="overlay-label">Coordinates</span>
                <span className="overlay-value">
                  {currentLocation
                    ? `${currentLocation.lat.toFixed(4)}°N, ${currentLocation.lng.toFixed(4)}°E`
                    : status.includes('Locating') ? 'Locating...' : 'Waiting for GPS...'}
                </span>
              </div>
            </div>

            {eta !== null && (
              <div className="overlay-item">
                <div className="overlay-icon eta">
                  <i className="fa fa-clock"></i>
                </div>
                <div className="overlay-content">
                  <span className="overlay-label">ETA</span>
                  <span className="overlay-value">
                    {eta > 60 ? `${Math.floor(eta / 60)}h ${eta % 60}m` : `${eta} min`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {trip && (
            <div className="location-card">
              <div className="location-header">
                <i className="fa fa-truck"></i>
                <span>Trip Details</span>
              </div>
              <div className="location-details">
                <div className="detail-row">
                  <span className="detail-label">👤 Driver:</span>
                  <span className="detail-value">{getFirstName()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">📍 From:</span>
                  <span className="detail-value">{trip.origin || 'Chennai Port'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">🏁 To:</span>
                  <span className="detail-value">{trip.destination || 'LVS Chennai'}</span>
                </div>
                {currentLocation && trip.destination_coords && (
                  <div className="detail-row">
                    <span className="detail-label">📏 Distance:</span>
                    <span className="detail-value">
                      {formatDistance(calculateDistance(currentLocation, trip.destination_coords))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map controls info */}
        <div className="map-controls-info">
          <span>🖱️ Use mouse to drag & zoom</span>
        </div>
      </div>
    </div>
  );
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(point1, point2) {
  const R = 6371; // Earth radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default LiveMap;
