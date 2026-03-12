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
  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripForm, setTripForm] = useState({
    trip_number: '',
    origin: '',
    origin_address: '',
    destination: '',
    destination_address: '',
    driver_id: '',
    driver_name: '',
    vendor_id: '',
    vendor_name: '',
    dispatch_time: '',
    estimated_arrival: '',
    material_name: '',
    material_type: '',
    quantity: '',
    weight: '',
    total_distance_km: '',
    vehicle_number: '',
    vehicle_type: '',
    notes: ''
  });

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
      fetchDrivers();
      fetchVendors();
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fetch trips error:', response.status, errorData);
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          logout();
          return;
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTrips(data.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      alert('Failed to fetch trips: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
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

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/drivers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/vendors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTripForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDriverChange = (e) => {
    const driverId = e.target.value;
    const driver = drivers.find(d => d.id === parseInt(driverId));
    setTripForm(prev => ({
      ...prev,
      driver_id: driverId,
      driver_name: driver ? driver.username : ''
    }));
  };

  const handleVendorChange = (e) => {
    const vendorId = e.target.value;
    const vendor = vendors.find(v => v.id === parseInt(vendorId));
    setTripForm(prev => ({
      ...prev,
      vendor_id: vendorId,
      vendor_name: vendor ? vendor.username : ''
    }));
  };

  const handleSubmitTrip = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/api/user/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tripForm)
      });

      if (response.ok) {
        await fetchTrips();
        setShowAddTripModal(false);
        setTripForm({
          trip_number: '',
          origin: '',
          origin_address: '',
          destination: '',
          destination_address: '',
          driver_id: '',
          driver_name: '',
          vendor_id: '',
          vendor_name: '',
          dispatch_time: '',
          estimated_arrival: '',
          material_name: '',
          material_type: '',
          quantity: '',
          weight: '',
          total_distance_km: '',
          vehicle_number: '',
          vehicle_type: '',
          notes: ''
        });
        alert('Trip created successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to create trip');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip');
    }
  };

  const handleEditTrip = (trip) => {
    setSelectedTrip(trip);
    setTripForm({
      trip_number: trip.trip_number,
      origin: trip.origin,
      origin_address: trip.origin_address || '',
      destination: trip.destination,
      destination_address: trip.destination_address || '',
      driver_id: trip.driver_id || '',
      driver_name: trip.driver_name || '',
      vendor_id: trip.vendor_id || '',
      vendor_name: trip.vendor_name || '',
      dispatch_time: trip.dispatch_time ? new Date(trip.dispatch_time).toISOString().slice(0, 16) : '',
      estimated_arrival: trip.estimated_arrival ? new Date(trip.estimated_arrival).toISOString().slice(0, 16) : '',
      material_name: trip.material_name || '',
      material_type: trip.material_type || '',
      quantity: trip.quantity || '',
      weight: trip.weight || '',
      total_distance_km: trip.total_distance_km || '',
      vehicle_number: trip.vehicle_number || '',
      vehicle_type: trip.vehicle_type || '',
      notes: trip.notes || ''
    });
    setShowEditTripModal(true);
  };

  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_URL}/api/user/trips/${selectedTrip.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tripForm)
      });

      if (response.ok) {
        await fetchTrips();
        setShowEditTripModal(false);
        setSelectedTrip(null);
        alert('Trip updated successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update trip');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('Failed to update trip');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/user/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchTrips();
        alert('Trip deleted successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip');
    }
  };

  const handleUpdateTripStatus = async (tripId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/user/trips/${tripId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchTrips();
        alert('Trip status updated successfully!');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
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
                          <td>{trip.driver_name || 'Unassigned'}</td>
                          <td>{trip.vendor_name || 'N/A'}</td>
                          <td>
                            <span className={`status-badge status-${trip.status}`}>
                              {trip.status}
                            </span>
                          </td>
                          <td>{trip.dispatch_time ? new Date(trip.dispatch_time).toLocaleDateString() : 'N/A'}</td>
                          <td>{trip.estimated_arrival ? new Date(trip.estimated_arrival).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon" title="View" onClick={() => handleEditTrip(trip)}>
                                <i className="fa fa-eye"></i>
                              </button>
                              <button className="btn-icon" title="Edit" onClick={() => handleEditTrip(trip)}>
                                <i className="fa fa-edit"></i>
                              </button>
                              <button 
                                className="btn-icon" 
                                title="Delete"
                                onClick={() => handleDeleteTrip(trip.id)}
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            </div>
                            <div className="status-actions">
                              {trip.status === 'scheduled' && (
                                <button 
                                  className="btn-sm btn-primary"
                                  onClick={() => handleUpdateTripStatus(trip.id, 'dispatched')}
                                >
                                  Dispatch
                                </button>
                              )}
                              {trip.status === 'dispatched' && (
                                <button 
                                  className="btn-sm btn-primary"
                                  onClick={() => handleUpdateTripStatus(trip.id, 'in_transit')}
                                >
                                  Start Trip
                                </button>
                              )}
                              {trip.status === 'in_transit' && (
                                <button 
                                  className="btn-sm btn-primary"
                                  onClick={() => handleUpdateTripStatus(trip.id, 'arriving')}
                                >
                                  Arriving
                                </button>
                              )}
                              {trip.status === 'arriving' && (
                                <button 
                                  className="btn-sm btn-success"
                                  onClick={() => handleUpdateTripStatus(trip.id, 'completed')}
                                >
                                  Complete
                                </button>
                              )}
                            </div>
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

      {/* Add Trip Modal */}
      {showAddTripModal && (
        <div className="modal-overlay" onClick={() => setShowAddTripModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fa fa-plus"></i> Add New Trip</h2>
              <button className="modal-close" onClick={() => setShowAddTripModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmitTrip}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Trip Number *</label>
                  <input
                    type="text"
                    name="trip_number"
                    value={tripForm.trip_number}
                    onChange={handleInputChange}
                    required
                    placeholder="TRIP-2024-001"
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicle_number"
                    value={tripForm.vehicle_number}
                    onChange={handleInputChange}
                    placeholder="TN-01-AB-1234"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Origin *</label>
                  <input
                    type="text"
                    name="origin"
                    value={tripForm.origin}
                    onChange={handleInputChange}
                    required
                    placeholder="Company name"
                  />
                </div>
                <div className="form-group">
                  <label>Origin Address</label>
                  <input
                    type="text"
                    name="origin_address"
                    value={tripForm.origin_address}
                    onChange={handleInputChange}
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Destination *</label>
                  <input
                    type="text"
                    name="destination"
                    value={tripForm.destination}
                    onChange={handleInputChange}
                    required
                    placeholder="Delivery location"
                  />
                </div>
                <div className="form-group">
                  <label>Destination Address</label>
                  <input
                    type="text"
                    name="destination_address"
                    value={tripForm.destination_address}
                    onChange={handleInputChange}
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Driver</label>
                  <select
                    name="driver_id"
                    value={tripForm.driver_id}
                    onChange={handleDriverChange}
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vendor</label>
                  <select
                    name="vendor_id"
                    value={tripForm.vendor_id}
                    onChange={handleVendorChange}
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Dispatch Time</label>
                  <input
                    type="datetime-local"
                    name="dispatch_time"
                    value={tripForm.dispatch_time}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Arrival</label>
                  <input
                    type="datetime-local"
                    name="estimated_arrival"
                    value={tripForm.estimated_arrival}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Material Name</label>
                  <input
                    type="text"
                    name="material_name"
                    value={tripForm.material_name}
                    onChange={handleInputChange}
                    placeholder="Steel Sheets, Pipes, etc."
                  />
                </div>
                <div className="form-group">
                  <label>Material Type</label>
                  <input
                    type="text"
                    name="material_type"
                    value={tripForm.material_type}
                    onChange={handleInputChange}
                    placeholder="SS304, MS, etc."
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={tripForm.quantity}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={tripForm.weight}
                    onChange={handleInputChange}
                    step="0.001"
                    placeholder="0.000"
                  />
                </div>
                <div className="form-group">
                  <label>Distance (km)</label>
                  <input
                    type="number"
                    name="total_distance_km"
                    value={tripForm.total_distance_km}
                    onChange={handleInputChange}
                    step="0.1"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>
                <input
                  type="text"
                  name="vehicle_type"
                  value={tripForm.vehicle_type}
                  onChange={handleInputChange}
                  placeholder="Truck, Lorry, etc."
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={tripForm.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional instructions or notes..."
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddTripModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fa fa-plus"></i> Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditTripModal && (
        <div className="modal-overlay" onClick={() => { setShowEditTripModal(false); setSelectedTrip(null); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fa fa-edit"></i> Edit Trip</h2>
              <button className="modal-close" onClick={() => { setShowEditTripModal(false); setSelectedTrip(null); }}>
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUpdateTrip}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Trip Number</label>
                  <input
                    type="text"
                    name="trip_number"
                    value={tripForm.trip_number}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicle_number"
                    value={tripForm.vehicle_number}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Origin</label>
                  <input
                    type="text"
                    name="origin"
                    value={tripForm.origin}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Origin Address</label>
                  <input
                    type="text"
                    name="origin_address"
                    value={tripForm.origin_address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Destination</label>
                  <input
                    type="text"
                    name="destination"
                    value={tripForm.destination}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Destination Address</label>
                  <input
                    type="text"
                    name="destination_address"
                    value={tripForm.destination_address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Driver</label>
                  <select
                    name="driver_id"
                    value={tripForm.driver_id}
                    onChange={handleDriverChange}
                  >
                    <option value="">Unassigned</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vendor</label>
                  <select
                    name="vendor_id"
                    value={tripForm.vendor_id}
                    onChange={handleVendorChange}
                  >
                    <option value="">N/A</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Dispatch Time</label>
                  <input
                    type="datetime-local"
                    name="dispatch_time"
                    value={tripForm.dispatch_time}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Arrival</label>
                  <input
                    type="datetime-local"
                    name="estimated_arrival"
                    value={tripForm.estimated_arrival}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Material Name</label>
                  <input
                    type="text"
                    name="material_name"
                    value={tripForm.material_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Material Type</label>
                  <input
                    type="text"
                    name="material_type"
                    value={tripForm.material_type}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={tripForm.quantity}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={tripForm.weight}
                    onChange={handleInputChange}
                    step="0.001"
                  />
                </div>
                <div className="form-group">
                  <label>Distance (km)</label>
                  <input
                    type="number"
                    name="total_distance_km"
                    value={tripForm.total_distance_km}
                    onChange={handleInputChange}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>
                <input
                  type="text"
                  name="vehicle_type"
                  value={tripForm.vehicle_type}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={tripForm.notes}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setShowEditTripModal(false); setSelectedTrip(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fa fa-save"></i> Update Trip
                </button>
              </div>
            </form>
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
