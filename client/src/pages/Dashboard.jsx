import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import LiveMap from '../components/LiveMap';
import ActivityFeed from '../components/ActivityFeed';
import './Dashboard.css';

const API_URL = '';
const LOGO2 = '/logo2.png';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update greeting based on time of day
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
    const timer = setInterval(updateGreeting, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Get user's first name from username or email
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
    { title: 'Active Trips', value: 3, icon: 'fa-truck', color: '#079cd4', suffix: '' },
    { title: 'Tools in Transit', value: 12, icon: 'fa-box', color: '#27ae60', suffix: '' },
    { title: 'Pending Deliveries', value: 5, icon: 'fa-clock', color: '#f39c12', suffix: '' },
    { title: 'Completed Today', value: 8, icon: 'fa-check-circle', color: '#9b59b6', suffix: '' },
  ];

  return (
    <div className="dashboard">
      {/* Animated Background */}
      <div className="dashboard-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Navigation */}
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
                  <span className="user-role">{user?.role || 'User'}</span>
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

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="container">
          {/* Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-text">
              <h1 className="welcome-title animate-slide-down">
                {greeting}, {getFirstName()}!
              </h1>
              <p className="welcome-subtitle animate-slide-up">
                Welcome to Lakshmi Vacuum Services - Live Location Monitoring System
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

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <StatsCard
                key={stat.title}
                {...stat}
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))}
          </div>

          {/* Main Grid - Map and Activity */}
          <div className="main-grid">
            <div className="map-section">
              <LiveMap 
                vendorLocation={{ lat: 13.0827, lng: 80.2707 }}
              />
            </div>
            <div className="activity-section">
              <ActivityFeed />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3 className="section-title">
              <i className="fa fa-bolt"></i>
              Quick Actions
            </h3>
            <div className="actions-grid">
              <button className="action-btn">
                <i className="fa fa-plus-circle"></i>
                <span>New Trip</span>
              </button>
              <button className="action-btn">
                <i className="fa fa-users"></i>
                <span>Manage Drivers</span>
              </button>
              <button className="action-btn">
                <i className="fa fa-clipboard-list"></i>
                <span>View Reports</span>
              </button>
              <button className="action-btn">
                <i className="fa fa-bell"></i>
                <span>Alerts</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
