import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import LiveMap from '../../components/LiveMap';
import ActivityFeed from '../../components/ActivityFeed';
import './Dashboard.css';

const API_URL = '';
const LOGO2 = '/logo2.png';

function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [tools, setTools] = useState([]);
  const [routeCardsCount, setRouteCardsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddToolModal, setShowAddToolModal] = useState(false);

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
    if (activeTab === 'tools') {
      fetchTools();
    } else if (activeTab === 'route-cards') {
      fetchRouteCardsCount();
    }
  }, [activeTab]);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/tools`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTools(data.tools || []);
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    }
    setLoading(false);
  };

  const fetchRouteCardsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/route-cards?limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRouteCardsCount(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching route cards count:', error);
    }
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
    { title: 'Tools in Transit', value: tools.filter(t => t.status === 'in_transit').length, icon: 'fa-box', color: '#27ae60', suffix: '' },
    { title: 'Route Cards', value: routeCardsCount, icon: 'fa-clipboard-list', color: '#9b59b6', suffix: '' },
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
                  <span className="user-role">Employee</span>
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
                Employee Dashboard - Lakshmi Vacuum Services
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

          <div className="employee-tabs">
            <button
              className={`employee-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fa fa-home"></i> Overview
            </button>
            <button
              className={`employee-tab ${activeTab === 'route-cards' ? 'active' : ''}`}
              onClick={() => setActiveTab('route-cards')}
            >
              <i className="fa fa-clipboard-list"></i> Route Cards
            </button>
            <button
              className={`employee-tab ${activeTab === 'tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('tools')}
            >
              <i className="fa fa-wrench"></i> Tool Management
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <StatsCard
                    key={stat.title}
                    {...stat}
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                ))}
              </div>

              <div className="main-grid">
                <div className="map-section">
                  <LiveMap vendorLocation={{ lat: 13.0827, lng: 80.2707 }} />
                </div>
                <div className="activity-section">
                  <ActivityFeed />
                </div>
              </div>
            </>
          )}

          {activeTab === 'route-cards' && (
            <div className="employee-section">
              <div className="section-header">
                <h2><i className="fa fa-clipboard-list"></i> Route Card Management</h2>
                <button className="btn-primary" onClick={() => navigate('/route-cards')}>
                  <i className="fa fa-plus"></i> Manage Route Cards
                </button>
              </div>
              <div className="route-cards-summary">
                <div className="summary-card">
                  <div className="summary-icon">
                    <i className="fa fa-clipboard-list"></i>
                  </div>
                  <div className="summary-content">
                    <div className="summary-value">{routeCardsCount}</div>
                    <div className="summary-label">Total Route Cards</div>
                  </div>
                </div>
                <div className="summary-info">
                  <p><i className="fa fa-info-circle"></i> Click "Manage Route Cards" to create, view, and edit route cards</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="employee-section">
              <div className="section-header">
                <h2><i className="fa fa-wrench"></i> Tool Management</h2>
                <button className="btn-primary" onClick={() => setShowAddToolModal(true)}>
                  <i className="fa fa-plus"></i> Add New Tool
                </button>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Tool Name</th>
                      <th>Batch #</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tools.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                          No tools found. Click "Add New Tool" to create one.
                        </td>
                      </tr>
                    ) : (
                      tools.map((tool) => (
                        <tr key={tool.id}>
                          <td>{tool.material_name}</td>
                          <td>{tool.batch_number}</td>
                          <td>{tool.quantity} {tool.unit}</td>
                          <td>
                            <span className={`status-badge status-${tool.status || 'available'}`}>
                              {tool.status || 'Available'}
                            </span>
                          </td>
                          <td>{tool.location || 'Warehouse'}</td>
                          <td>
                            <button className="btn-icon" title="View">
                              <i className="fa fa-eye"></i>
                            </button>
                            <button className="btn-icon" title="Edit">
                              <i className="fa fa-edit"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddToolModal && (
        <div className="modal-overlay" onClick={() => setShowAddToolModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Tool</h2>
            <p>Tool creation form will be implemented here.</p>
            <button className="btn-secondary" onClick={() => setShowAddToolModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;
