import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import LiveMap from '../../components/LiveMap';
import ActivityFeed from '../../components/ActivityFeed';
import './Dashboard.css';

const API_URL = '';
const LOGO2 = '/logo2.png';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

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
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === 'trips') {
      fetchTrips();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
    { title: 'Active Trips', value: trips.filter(t => t.status === 'in_transit').length, icon: 'fa-truck', color: '#079cd4', suffix: '' },
    { title: 'Total Users', value: users.length, icon: 'fa-users', color: '#27ae60', suffix: '' },
    { title: 'Pending Deliveries', value: trips.filter(t => t.status === 'dispatched').length, icon: 'fa-clock', color: '#f39c12', suffix: '' },
    { title: 'Completed Today', value: trips.filter(t => t.status === 'completed').length, icon: 'fa-check-circle', color: '#9b59b6', suffix: '' },
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
                  <span className="user-role">Admin</span>
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
                Admin Dashboard - Lakshmi Vacuum Services
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

          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fa fa-home"></i> Overview
            </button>
            <button
              className={`admin-tab ${activeTab === 'trips' ? 'active' : ''}`}
              onClick={() => setActiveTab('trips')}
            >
              <i className="fa fa-truck"></i> Trip Management
            </button>
            <button
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <i className="fa fa-users"></i> User Management
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

          {activeTab === 'trips' && (
            <div className="admin-section">
              <div className="section-header">
                <h2><i className="fa fa-truck"></i> Trip Management</h2>
                <button className="btn-primary" onClick={() => setShowAddTripModal(true)}>
                  <i className="fa fa-plus"></i> Add New Trip
                </button>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Trip #</th>
                      <th>Driver</th>
                      <th>Vendor</th>
                      <th>Status</th>
                      <th>Dispatch Time</th>
                      <th>ETA</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                          No trips found. Click "Add New Trip" to create one.
                        </td>
                      </tr>
                    ) : (
                      trips.map((trip) => (
                        <tr key={trip.id}>
                          <td>{trip.trip_number}</td>
                          <td>{trip.driver_name}</td>
                          <td>{trip.vendor_name}</td>
                          <td>
                            <span className={`status-badge status-${trip.status}`}>
                              {trip.status}
                            </span>
                          </td>
                          <td>{new Date(trip.dispatch_time).toLocaleDateString()}</td>
                          <td>{trip.estimated_arrival ? new Date(trip.estimated_arrival).toLocaleDateString() : 'N/A'}</td>
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

          {activeTab === 'users' && (
            <div className="admin-section">
              <div className="section-header">
                <h2><i className="fa fa-users"></i> User Management</h2>
                <button className="btn-primary" onClick={() => setShowAddUserModal(true)}>
                  <i className="fa fa-plus"></i> Add New User
                </button>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.username}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className="role-badge">{u.role}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{new Date(u.created_at).toLocaleDateString()}</td>
                          <td>
                            <button className="btn-icon" title="Edit">
                              <i className="fa fa-edit"></i>
                            </button>
                            <button className="btn-icon" title="Delete">
                              <i className="fa fa-trash"></i>
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

      {showAddTripModal && (
        <div className="modal-overlay" onClick={() => setShowAddTripModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Trip</h2>
            <p>Trip creation form will be implemented here.</p>
            <button className="btn-secondary" onClick={() => setShowAddTripModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New User</h2>
            <p>User creation form will be implemented here.</p>
            <button className="btn-secondary" onClick={() => setShowAddUserModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
