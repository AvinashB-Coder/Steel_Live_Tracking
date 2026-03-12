import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RouteCard.css';

const API_URL = '';

function RouteCardManagement() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');
  const [routeCards, setRouteCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    route_card_no: '',
    grn_date: '',
    in_time: '',
    pg_number: '',
    po_number: '',
    customer_name: '',
    cus_dc_no: '',
    cus_dc_date: '',
    part_name: '',
    part_no: '',
    received_qty: '',
    quantity: '',
    grade: '',
    weight: '',
    req_hardness_hrc: '',
    packing_carton_box: false,
    packing_plastic_bin: false,
    packing_bubble_sheet: false,
    packing_wooden_pallet: false,
    packing_material_cap: false,
    packing_none: false,
    packing_cover: false,
    packing_bag: false,
    work_instruction_available: false,
    remarks: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchRouteCards();
  }, [search, statusFilter]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchRouteCards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/api/user/route-cards?search=${search}&limit=50`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRouteCards(data.routeCards || []);
      }
    } catch (error) {
      console.error('Error fetching route cards:', error);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    
    const token = localStorage.getItem('token');
    const formDataPhoto = new FormData();
    formDataPhoto.append('photo', photoFile);

    setUploadingPhoto(true);
    try {
      const url = editingCard
        ? `${API_URL}/api/user/route-cards/${editingCard.id}/upload-photo`
        : `${API_URL}/api/user/route-cards`;

      const method = editingCard ? 'POST' : 'POST';
      
      // If editing, use the upload-photo endpoint
      if (editingCard) {
        const response = await fetch(`${API_URL}/api/user/route-cards/${editingCard.id}/upload-photo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataPhoto
        });

        const result = await response.json();

        if (response.ok) {
          showNotification('Photo uploaded successfully!');
          setPhotoFile(null);
          setPhotoPreview(null);
          fetchRouteCards();
        } else {
          showNotification(result.message || 'Failed to upload photo', 'error');
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      showNotification('Failed to upload photo', 'error');
    }
    setUploadingPhoto(false);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleOpenModal = (card = null) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        route_card_no: card.route_card_no || '',
        grn_date: card.grn_date || '',
        in_time: card.in_time || '',
        pg_number: card.pg_number || '',
        po_number: card.po_number || '',
        customer_name: card.customer_name || '',
        cus_dc_no: card.cus_dc_no || '',
        cus_dc_date: card.cus_dc_date || '',
        part_name: card.part_name || '',
        part_no: card.part_no || '',
        received_qty: card.received_qty || '',
        quantity: card.quantity || '',
        grade: card.grade || '',
        weight: card.weight || '',
        req_hardness_hrc: card.req_hardness_hrc || '',
        packing_carton_box: card.packing_carton_box || false,
        packing_plastic_bin: card.packing_plastic_bin || false,
        packing_bubble_sheet: card.packing_bubble_sheet || false,
        packing_wooden_pallet: card.packing_wooden_pallet || false,
        packing_material_cap: card.packing_material_cap || false,
        packing_none: card.packing_none || false,
        packing_cover: card.packing_cover || false,
        packing_bag: card.packing_bag || false,
        work_instruction_available: card.work_instruction_available || false,
        remarks: card.remarks || ''
      });
      // Load existing photo if available
      if (card.photo_url) {
        setPhotoPreview(`${API_URL}${card.photo_url}`);
      } else {
        setPhotoPreview(null);
      }
      setPhotoFile(null);
    } else {
      setEditingCard(null);
      setFormData({
        route_card_no: '',
        grn_date: '',
        in_time: '',
        pg_number: '',
        po_number: '',
        customer_name: '',
        cus_dc_no: '',
        cus_dc_date: '',
        part_name: '',
        part_no: '',
        received_qty: '',
        quantity: '',
        grade: '',
        weight: '',
        req_hardness_hrc: '',
        packing_carton_box: false,
        packing_plastic_bin: false,
        packing_bubble_sheet: false,
        packing_wooden_pallet: false,
        packing_material_cap: false,
        packing_none: false,
        packing_cover: false,
        packing_bag: false,
        work_instruction_available: false,
        remarks: ''
      });
      setPhotoPreview(null);
      setPhotoFile(null);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      // If there's a photo file, use FormData to upload it
      if (photoFile) {
        const formDataPhoto = new FormData();
        
        // Add all form fields to FormData
        Object.keys(formData).forEach(key => {
          if (typeof formData[key] === 'boolean') {
            formDataPhoto.append(key, formData[key] ? 'true' : 'false');
          } else {
            formDataPhoto.append(key, formData[key]);
          }
        });
        
        // Add the photo file
        formDataPhoto.append('photo', photoFile);

        const url = editingCard
          ? `${API_URL}/api/user/route-cards/${editingCard.id}`
          : `${API_URL}/api/user/route-cards`;

        const response = await fetch(url, {
          method: editingCard ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataPhoto
        });

        const result = await response.json();

        if (response.ok) {
          showNotification(editingCard ? 'Route card updated successfully!' : 'Route card created successfully!');
          setShowModal(false);
          setPhotoFile(null);
          setPhotoPreview(null);
          fetchRouteCards();
        } else {
          showNotification(result.message || 'Failed to save route card', 'error');
        }
      } else {
        // No photo, use regular JSON request
        const url = editingCard
          ? `${API_URL}/api/user/route-cards/${editingCard.id}`
          : `${API_URL}/api/user/route-cards`;

        const response = await fetch(url, {
          method: editingCard ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
          showNotification(editingCard ? 'Route card updated successfully!' : 'Route card created successfully!');
          setShowModal(false);
          fetchRouteCards();
        } else {
          showNotification(result.message || 'Failed to save route card', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving route card:', error);
      showNotification('Failed to save route card', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route card?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/user/route-cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showNotification('Route card deleted successfully!');
        fetchRouteCards();
      } else {
        showNotification('Failed to delete route card', 'error');
      }
    } catch (error) {
      console.error('Error deleting route card:', error);
      showNotification('Failed to delete route card', 'error');
    }
  };

  const handleVerify = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/user/route-cards/${id}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showNotification('Route card verified successfully!');
        fetchRouteCards();
      } else {
        showNotification('Failed to verify route card', 'error');
      }
    } catch (error) {
      console.error('Error verifying route card:', error);
      showNotification('Failed to verify route card', 'error');
    }
  };

  const getFirstName = () => {
    return user?.username?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  };

  const renderUserAvatar = () => {
    if (user?.google_picture) {
      return <img src={`${API_URL}${user.google_picture}`} alt={getFirstName()} className="user-avatar-image" />;
    }
    return getFirstName().charAt(0).toUpperCase();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'verified': return 'status-verified';
      case 'pending': return 'status-pending';
      default: return '';
    }
  };

  return (
    <div className="dashboard">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <i className={`fa ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="nav-brand">
              <span>🏭 Lakshmi Vacuum Services</span>
            </div>
            <div className="nav-user">
              <div className="user-info" onClick={() => navigate('/profile')}>
                <div className="user-avatar">{renderUserAvatar()}</div>
                <div className="user-details">
                  <span className="user-name">{getFirstName()}</span>
                  <span className="user-role">{user?.role}</span>
                </div>
              </div>
              <button onClick={() => navigate('/dashboard')} className="logout-btn">
                <i className="fa fa-arrow-left"></i> Back
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        <div className="container">
          {/* Header */}
          <div className="section-header">
            <h2><i className="fa fa-clipboard-list"></i> Route Card Management</h2>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <i className="fa fa-plus"></i> Add Route Card
            </button>
          </div>

          {/* Filters */}
          <div className="filters-bar">
            <input
              type="text"
              placeholder="🔍 Search by Route Card No, Customer, Part..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Route Cards List */}
          <div className="route-cards-grid">
            {loading ? (
              <div className="loading-state">Loading route cards...</div>
            ) : routeCards.length === 0 ? (
              <div className="empty-state">
                <i className="fa fa-clipboard"></i>
                <p>No route cards found</p>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                  <i className="fa fa-plus"></i> Create First Route Card
                </button>
              </div>
            ) : (
              routeCards.map((card) => (
                <div key={card.id} className="route-card-item">
                  <div className="card-header">
                    <div className="card-number">
                      <i className="fa fa-hashtag"></i> {card.route_card_no}
                    </div>
                    <span className={`status-badge ${getStatusClass(card.status)}`}>{card.status}</span>
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">📅 GRN Date:</span>
                      <span className="value">{new Date(card.grn_date).toLocaleDateString()}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">🕐 In Time:</span>
                      <span className="value">{card.in_time}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">👤 Customer:</span>
                      <span className="value">{card.customer_name}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">🔩 Part:</span>
                      <span className="value">{card.part_name}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">📦 Quantity:</span>
                      <span className="value">{card.quantity}</span>
                    </div>
                    {card.grade && (
                      <div className="info-row">
                        <span className="label">🏅 Grade:</span>
                        <span className="value">{card.grade}</span>
                      </div>
                    )}
                    {card.req_hardness_hrc && (
                      <div className="info-row">
                        <span className="label">💪 Hardness:</span>
                        <span className="value">{card.req_hardness_hrc} HRC</span>
                      </div>
                    )}
                    {card.photo_url && (
                      <div className="info-row photo-indicator">
                        <span className="label">📷 Photo:</span>
                        <span className="value"><i className="fa fa-check-circle" style={{ color: '#27ae60' }}></i> Attached</span>
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    <button className="btn-icon" onClick={() => handleOpenModal(card)} title="Edit">
                      <i className="fa fa-edit"></i>
                    </button>
                    {user?.role === 'admin' && card.status !== 'verified' && (
                      <button className="btn-icon btn-verify" onClick={() => handleVerify(card.id)} title="Verify">
                        <i className="fa fa-check"></i>
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button className="btn-icon btn-delete" onClick={() => handleDelete(card.id)} title="Delete">
                        <i className="fa fa-trash"></i>
                      </button>
                    )}
                    {card.photo_url && (
                      <button 
                        className="btn-icon" 
                        onClick={() => {
                          setPhotoPreview(`${API_URL}${card.photo_url}`);
                          handleOpenModal(card);
                        }} 
                        title="View Photo"
                      >
                        <i className="fa fa-camera"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content route-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fa fa-clipboard-list"></i> {editingCard ? 'Edit' : 'Create'} Route Card</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Section 1: Basic Info */}
                <div className="form-section">
                  <h3>📋 Basic Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Route Card No *</label>
                      <input
                        type="text"
                        name="route_card_no"
                        value={formData.route_card_no}
                        onChange={handleInputChange}
                        required
                        placeholder="RC-2024-001"
                      />
                    </div>
                    <div className="form-group">
                      <label>GRN Date *</label>
                      <input
                        type="date"
                        name="grn_date"
                        value={formData.grn_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>In Time *</label>
                      <input
                        type="time"
                        name="in_time"
                        value={formData.in_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>PG Number</label>
                      <input
                        type="text"
                        name="pg_number"
                        value={formData.pg_number}
                        onChange={handleInputChange}
                        placeholder="PG-001"
                      />
                    </div>
                    <div className="form-group">
                      <label>PO Number</label>
                      <input
                        type="text"
                        name="po_number"
                        value={formData.po_number}
                        onChange={handleInputChange}
                        placeholder="PO-001"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Customer Details */}
                <div className="form-section">
                  <h3>👤 Customer Details</h3>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Customer Name *</label>
                      <input
                        type="text"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleInputChange}
                        required
                        placeholder="Raghavendra Industries"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cus. DC No</label>
                      <input
                        type="text"
                        name="cus_dc_no"
                        value={formData.cus_dc_no}
                        onChange={handleInputChange}
                        placeholder="10288"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cus. DC Date</label>
                      <input
                        type="date"
                        name="cus_dc_date"
                        value={formData.cus_dc_date}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Part Details */}
                <div className="form-section">
                  <h3>🔩 Part Details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Part Name / Part No *</label>
                      <input
                        type="text"
                        name="part_name"
                        value={formData.part_name}
                        onChange={handleInputChange}
                        required
                        placeholder="1.SLEEVE"
                      />
                    </div>
                    <div className="form-group">
                      <label>Part No</label>
                      <input
                        type="text"
                        name="part_no"
                        value={formData.part_no}
                        onChange={handleInputChange}
                        placeholder="Part Number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                        min="1"
                        placeholder="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Received Qty</label>
                      <input
                        type="number"
                        name="received_qty"
                        value={formData.received_qty}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Grade</label>
                      <input
                        type="text"
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        placeholder="EFICAST"
                      />
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        step="0.001"
                        placeholder="25.450"
                      />
                    </div>
                    <div className="form-group">
                      <label>Req Hardness (HRC)</label>
                      <input
                        type="text"
                        name="req_hardness_hrc"
                        value={formData.req_hardness_hrc}
                        onChange={handleInputChange}
                        placeholder="44-46"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Packing Instructions */}
                <div className="form-section">
                  <h3>📦 Packing Instructions</h3>
                  <div className="checkbox-grid">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="packing_carton_box"
                        checked={formData.packing_carton_box}
                        onChange={handleInputChange}
                      />
                      <span>📦 Carton Box</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="packing_plastic_bin"
                        checked={formData.packing_plastic_bin}
                        onChange={handleInputChange}
                      />
                      <span>🗑️ Plastic Bin</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="packing_bubble_sheet"
                        checked={formData.packing_bubble_sheet}
                        onChange={handleInputChange}
                      />
                      <span>🫧 Bubble Sheet</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="packing_wooden_pallet"
                        checked={formData.packing_wooden_pallet}
                        onChange={handleInputChange}
                      />
                      <span>🪵 Wooden Pallet</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="packing_material_cap"
                        checked={formData.packing_material_cap}
                        onChange={handleInputChange}
                      />
                      <span>🧢 Material Cap</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="packing_none"
                        checked={formData.packing_none}
                        onChange={handleInputChange}
                      />
                      <span>❌ None</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="packing_cover"
                        checked={formData.packing_cover}
                        onChange={handleInputChange}
                      />
                      <span>🔃 Cover</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="packing_bag"
                        checked={formData.packing_bag}
                        onChange={handleInputChange}
                      />
                      <span>🛍️ Bag</span>
                    </label>
                  </div>
                </div>

                {/* Section 5: Additional Info */}
                <div className="form-section">
                  <h3>📝 Additional Information</h3>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="work_instruction_available"
                        checked={formData.work_instruction_available}
                        onChange={handleInputChange}
                      />
                      <span>✅ Work Instruction Available for this Grade</span>
                    </label>
                  </div>
                  <div className="form-group full-width">
                    <label>Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Any additional notes..."
                    />
                  </div>
                </div>

                {/* Section 6: Photo Upload */}
                <div className="form-section">
                  <h3>📷 Photo Upload</h3>
                  <div className="photo-upload-section">
                    <div className="photo-upload-inputs">
                      <label className="photo-upload-btn">
                        <i className="fa fa-camera"></i> Take Photo / Choose from Gallery
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhotoChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {photoFile && (
                        <button
                          type="button"
                          className="btn-upload"
                          onClick={handleUploadPhoto}
                          disabled={uploadingPhoto}
                        >
                          {uploadingPhoto ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa fa-upload"></i>}
                          {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                        </button>
                      )}
                    </div>
                    
                    {photoPreview && (
                      <div className="photo-preview-container">
                        <div className="photo-preview">
                          <img src={photoPreview} alt="Preview" />
                          <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={handleRemovePhoto}
                          >
                            <i className="fa fa-times"></i>
                          </button>
                        </div>
                        <p className="photo-info">
                          {photoFile ? `${photoFile.name} (${(photoFile.size / 1024).toFixed(1)} KB)` : 'Existing photo'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <i className="fa fa-save"></i> {editingCard ? 'Update' : 'Create'} Route Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteCardManagement;
