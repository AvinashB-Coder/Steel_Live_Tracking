import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import LiveMap from '../../components/LiveMap';
import './Dashboard.css';

const API_URL = '';
const LOGO2 = '/logo2.png';

function VendorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [vendorLocation, setVendorLocation] = useState({ lat: 13.0827, lng: 80.2707 });
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(false);

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
    fetchVendorTrips();
  }, []);

  const fetchVendorTrips = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/vendor/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveTrips(data.trips || []);
      }
    } catch (error) {
      console.error('Error fetching vendor trips:', error);
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
    { title: 'Active Shipments', value: activeTrips.length, icon: 'fa-truck', color: '#079cd4', suffix: '' },
    { title: 'In Transit', value: activeTrips.filter(t => t.status === 'in_transit').length, icon: 'fa-map-marker-alt', color: '#27ae60', suffix: '' },
    { title: 'Arriving Today', value: activeTrips.filter(t => t.status === 'arriving').length, icon: 'fa-clock', color: '#f39c12', suffix: '' },
    { title: 'Delivered', value: activeTrips.filter(t => t.status === 'delivered').length, icon: 'fa-check-circle', color: '#9b59b6', suffix: '' },
  ];

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
                  <span className="user-role">Vendor</span>
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
                Vendor Dashboard - Live Location Tracking
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

          <div className="vendor-info-banner">
            <div className="info-card">
              <i className="fa fa-info-circle"></i>
              <span>View real-time location of your shipments below. Track all active deliveries on the map.</span>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat, index) => (
              <StatsCard
                key={stat.title}
                {...stat}
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))}
          </div>

          <div className="vendor-main-content">
            <div className="live-tracking-section">
              <div className="section-header">
                <h2><i className="fa fa-map-marked-alt"></i> Live Location Tracking</h2>
              </div>
              <div className="map-container-full">
                <LiveMap vendorLocation={vendorLocation} trips={activeTrips} />
              </div>
            </div>

            <div className="active-shipments-section">
              <div className="section-header">
                <h2><i className="fa fa-list"></i> Active Shipments</h2>
              </div>
              <div className="shipments-list">
                {loading ? (
                  <div className="loading-state">Loading shipments...</div>
                ) : activeTrips.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa fa-truck"></i>
                    <p>No active shipments</p>
                  </div>
                ) : (
                  activeTrips.map((trip) => (
                    <div key={trip.id} className="shipment-card">
                      <div className="shipment-header">
                        <span className="shipment-number">{trip.trip_number}</span>
                        <span className={`shipment-status status-${trip.status}`}>
                          {trip.status}
                        </span>
                      </div>
                      <div className="shipment-details">
                        <div className="detail-row">
                          <i className="fa fa-map-marker-alt"></i>
                          <span>From: {trip.origin}</span>
                        </div>
                        <div className="detail-row">
                          <i className="fa fa-flag-checkered"></i>
                          <span>To: {trip.destination}</span>
                        </div>
                        <div className="detail-row">
                          <i className="fa fa-clock"></i>
                          <span>ETA: {trip.estimated_arrival ? new Date(trip.estimated_arrival).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="shipment-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: trip.progress || '0%' }}></div>
                        </div>
                        <span className="progress-text">{trip.progress || 0}%</span>
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

export default VendorDashboard;
