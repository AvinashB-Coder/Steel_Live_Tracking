import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import LiveMap from '../../components/LiveMap';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const LOGO2 = '/logo2.png';

function DriverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripHistory, setTripHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 13.0827, lng: 80.2707 });

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
      setCurrentTime(new Date());
    };

    updateGreeting();
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDriverTrips();
  }, []);

  const handleLocationUpdate = (newLocation) => {
    setCurrentLocation(newLocation);
    // TODO: Send location to server
  };

  const fetchDriverTrips = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/driver/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveTrip(data.activeTrip || null);
        setTripHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching driver trips:', error);
    }
    setLoading(false);
  };

  const getFirstName = () => {
    if (user?.username) {
      return user.username.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const renderUserAvatar = () => {
    if (user?.google_picture) {
      return (
        <img
          src={`${API_URL}${user.google_picture}`}
          alt={getFirstName()}
          className="user-avatar-image"
        />
      );
    }
    return getFirstName().charAt(0).toUpperCase();
  };

  const stats = [
    { title: 'Active Trip', value: activeTrip ? 1 : 0, icon: 'fa-truck', color: '#079cd4', suffix: '' },
    { title: 'Trips Completed', value: tripHistory.length, icon: 'fa-check-circle', color: '#27ae60', suffix: '' },
    { title: 'Distance Today', value: activeTrip ? (activeTrip.total_distance_km || 0).toFixed(1) : 0, icon: 'fa-road', color: '#f39c12', suffix: ' km' },
    { title: 'Hours Driven', value: 8, icon: 'fa-clock', color: '#9b59b6', suffix: ' hrs' },
  ];

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/driver/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trip_id: activeTrip?.id,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng
        })
      });
      if (response.ok) {
        alert('Check-in successful!');
        fetchDriverTrips();
      }
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Check-in failed. Please try again.');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="nav-brand">
              <img src={LOGO2} alt="Lakshmi Vacuum Services" className="nav-logo" />
              <span>Lakshmi Vacuum Services</span>
            </div>
            <div className="nav-user">
              <div className="user-info" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                <div className="user-avatar">
                  {renderUserAvatar()}
                </div>
                <div className="user-details">
                  <span className="user-name">{getFirstName()}</span>
                  <span className="user-role">Driver</span>
                </div>
              </div>
              <button onClick={logout} className="logout-btn">
                <i className="fa fa-sign-out"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="container">
          <div className="welcome-section">
            <div className="welcome-text">
              <h1 className="welcome-title animate-slide-down">
                {greeting}, {getFirstName()}!
              </h1>
              <p className="welcome-subtitle animate-slide-up">
                Driver Dashboard - Trip Management
              </p>
              <div className="current-time animate-fade-in">
                <i className="fa fa-clock"></i>
                <span>{currentTime.toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>

          {activeTrip && (
            <div className="active-trip-banner">
              <div className="banner-content">
                <div className="banner-icon">
                  <i className="fa fa-truck"></i>
                </div>
                <div className="banner-info">
                  <h3>Active Trip: {activeTrip.trip_number}</h3>
                  <p>{activeTrip.origin} → {activeTrip.destination}</p>
                </div>
                <button className="btn-checkin" onClick={handleCheckIn}>
                  <i className="fa fa-map-marker-alt"></i>
                  Check In
                </button>
              </div>
            </div>
          )}

          <div className="stats-grid">
            {stats.map((stat, index) => (
              <StatsCard
                key={stat.title}
                {...stat}
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))}
          </div>

          <div className="driver-main-content">
            <div className="trip-map-section">
              <div className="section-header">
                <h2><i className="fa fa-map-marked-alt"></i> Your Route</h2>
              </div>
              <div className="map-container-full">
                <LiveMap 
                  vendorLocation={currentLocation} 
                  trip={activeTrip}
                  showRoute={true}
                  onLocationUpdate={handleLocationUpdate}
                />
              </div>
            </div>

            <div className="trip-details-section">
              <div className="section-header">
                <h2><i className="fa fa-clipboard-list"></i> Trip Details</h2>
              </div>
              
              {activeTrip ? (
                <div className="trip-detail-card">
                  <div className="detail-header">
                    <span className="trip-number">{activeTrip.trip_number}</span>
                    <span className={`trip-status status-${activeTrip.status}`}>
                      {activeTrip.status}
                    </span>
                  </div>
                  <div className="detail-content">
                    <div className="detail-group">
                      <h4>Route Information</h4>
                      <div className="detail-item">
                        <i className="fa fa-map-marker-alt start"></i>
                        <div>
                          <strong>Pickup Location</strong>
                          <p>{activeTrip.origin}</p>
                        </div>
                      </div>
                      <div className="detail-item">
                        <i className="fa fa-map-marker-alt end"></i>
                        <div>
                          <strong>Delivery Location</strong>
                          <p>{activeTrip.destination}</p>
                        </div>
                      </div>
                    </div>
                    <div className="detail-group">
                      <h4>Timing Information</h4>
                      <div className="detail-item">
                        <i className="fa fa-clock"></i>
                        <div>
                          <strong>Dispatch Time</strong>
                          <p>{new Date(activeTrip.dispatch_time).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="detail-item">
                        <i className="fa fa-flag-checkered"></i>
                        <div>
                          <strong>Estimated Arrival</strong>
                          <p>{activeTrip.estimated_arrival ? new Date(activeTrip.estimated_arrival).toLocaleString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="detail-group">
                      <h4>Cargo Information</h4>
                      <div className="detail-item">
                        <i className="fa fa-box"></i>
                        <div>
                          <strong>Material</strong>
                          <p>{activeTrip.material_name || 'Steel Materials'}</p>
                        </div>
                      </div>
                      <div className="detail-item">
                        <i className="fa fa-weight-hanging"></i>
                        <div>
                          <strong>Quantity</strong>
                          <p>{activeTrip.quantity || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fa fa-truck"></i>
                  <p>No active trips</p>
                  <span>You're all caught up! Wait for your next assignment.</span>
                </div>
              )}
            </div>

            <div className="trip-history-section">
              <div className="section-header">
                <h2><i className="fa fa-history"></i> Trip History</h2>
              </div>
              <div className="history-list">
                {tripHistory.length === 0 ? (
                  <div className="empty-state">
                    <p>No trip history available</p>
                  </div>
                ) : (
                  tripHistory.map((trip) => (
                    <div key={trip.id} className="history-card">
                      <div className="history-header">
                        <span>{trip.trip_number}</span>
                        <span className={`status-${trip.status}`}>{trip.status}</span>
                      </div>
                      <div className="history-details">
                        <span>{trip.origin} → {trip.destination}</span>
                        <span>{new Date(trip.completion_time).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;
