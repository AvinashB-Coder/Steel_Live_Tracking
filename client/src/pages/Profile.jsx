import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';
import logo2 from '../assets/logo2.png';

// API Base URL - Using relative path for Vite proxy
const API_BASE_URL = '';

function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [picturePreview, setPicturePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    google_picture: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isEditingRole, setIsEditingRole] = useState(false);
  const [tempRole, setTempRole] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || '',
        google_picture: user.google_picture || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTempRole(user.role || '');

      // Set picture URL - handle both full URL and relative path
      let pictureUrl = null;
      if (user.google_picture) {
        // If it's already a full URL, use it as is
        if (user.google_picture.startsWith('http')) {
          pictureUrl = user.google_picture;
        } else {
          // Otherwise prepend the base URL
          pictureUrl = `${API_BASE_URL}${user.google_picture}`;
        }
      }
      setPicturePreview(pictureUrl);
    }
  }, [user]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePictureClick = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      showNotification('File size must be less than 5MB', 'error');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Only image files are allowed (jpeg, jpg, png, gif, webp)', 'error');
      return;
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPicturePreview(previewUrl);

    // Upload file
    setIsUploadingPicture(true);
    try {
      const token = localStorage.getItem('token');
      const formDataPicture = new FormData();
      formDataPicture.append('profilePicture', file);

      console.log('Uploading picture...', file.name, file.type, file.size);

      const response = await fetch('/api/user/upload-picture', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataPicture
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        setFormData({
          ...formData,
          google_picture: result.user.google_picture
        });
        // Set full URL for preview
        setPicturePreview(`${API_BASE_URL}${result.user.google_picture}`);

        // Update user context and localStorage
        const updatedUser = { ...user, google_picture: result.user.google_picture };
        updateUser(updatedUser);

        showNotification('Profile picture updated successfully!');
      } else {
        showNotification(result.message || 'Failed to upload picture', 'error');
        setPicturePreview(formData.google_picture ? `${API_BASE_URL}${formData.google_picture}` : null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('Failed to upload picture: ' + error.message, 'error');
      setPicturePreview(formData.google_picture ? `${API_BASE_URL}${formData.google_picture}` : null);
    } finally {
      setIsUploadingPicture(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDeletePicture = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/delete-picture', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFormData({
          ...formData,
          google_picture: ''
        });
        setPicturePreview(null);
        
        // Update user context and localStorage
        const updatedUser = { ...user, google_picture: null };
        updateUser(updatedUser);
        
        showNotification('Profile picture deleted successfully!');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to delete picture', 'error');
      }
    } catch (error) {
      showNotification('Failed to delete picture', 'error');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleEdit = () => {
    setTempRole(formData.role);
    setIsEditingRole(true);
  };

  const handleRoleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: tempRole
        })
      });

      const result = await response.json();

      if (response.ok) {
        setFormData({
          ...formData,
          role: tempRole
        });
        updateUser(result.user);
        showNotification('Role updated successfully!');
        setIsEditingRole(false);
      } else {
        showNotification(result.message || 'Failed to update role', 'error');
      }
    } catch (error) {
      console.error('Role update error:', error);
      showNotification('Failed to update role: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleCancel = () => {
    setIsEditingRole(false);
    setTempRole(formData.role);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');

      console.log('=== Saving Profile ===');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Data:', { username: formData.username, email: formData.email, google_picture: formData.google_picture });

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          google_picture: formData.google_picture
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        updateUser(result.user);
        showNotification('Profile updated successfully!');
        setIsEditing(false);
      } else {
        showNotification(result.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      showNotification('Failed to update profile: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (response.ok) {
        showNotification('Password changed successfully!');
        setShowPasswordModal(false);
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        showNotification(error.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      showNotification('Failed to change password', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = () => {
    return formData.username
      ? formData.username.split(' ').map(n => n[0]).join('').toUpperCase()
      : formData.email.charAt(0).toUpperCase();
  };

  const renderProfileAvatar = () => {
    if (picturePreview) {
      return (
        <img
          src={picturePreview}
          alt="Profile"
          className="profile-avatar-image"
        />
      );
    }
    return getInitials();
  };

  return (
    <div className="profile-page">
      {/* Animated Background */}
      <div className="profile-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Navigation */}
      <nav className="profile-navbar">
        <div className="container">
          <div className="nav-content">
            <div className="nav-brand" onClick={() => navigate('/dashboard')}>
              <img src={logo2} alt="Lakshmi Vacuum Services" className="nav-logo" />
              <span>Lakshmi Vacuum Services</span>
            </div>
            <div className="nav-actions">
              <button onClick={() => navigate('/dashboard')} className="back-btn">
                <i className="fa fa-arrow-left"></i>
                <span>Back to Dashboard</span>
              </button>
              <button onClick={handleLogout} className="logout-btn">
                <i className="fa fa-sign-out"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="profile-content">
        <div className="container">
          {/* Notification */}
          {notification && (
            <div className={`notification ${notification.type} animate-slide-down`}>
              <i className={`fa ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <span>{notification.message}</span>
            </div>
          )}

          <div className="profile-card">
            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-avatar-section">
                <div className="profile-avatar-large">
                  {renderProfileAvatar()}
                  {isUploadingPicture && (
                    <div className="avatar-upload-overlay">
                      <i className="fa fa-spinner fa-spin"></i>
                    </div>
                  )}
                </div>
                <div className="avatar-upload-btn" onClick={handlePictureClick} style={{ cursor: 'pointer' }}>
                  <i className="fa fa-camera"></i>
                </div>
                {picturePreview && (
                  <button className="avatar-delete-btn" onClick={handleDeletePicture}>
                    <i className="fa fa-trash"></i>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  style={{ display: 'none' }}
                  disabled={isUploadingPicture}
                />
              </div>
              <div className="profile-info-header">
                <h1>{formData.username || 'User'}</h1>
                <p className="profile-email">{formData.email}</p>
                <div className="profile-badge">
                  <i className="fa fa-shield"></i>
                  <span className="role-badge">{formData.role}</span>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="profile-form-section">
              <div className="section-header">
                <h2>
                  <i className="fa fa-user"></i>
                  Personal Information
                </h2>
                <div className="action-buttons">
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="edit-btn">
                      <i className="fa fa-edit"></i>
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setIsEditing(false)} className="cancel-btn">
                        <i className="fa fa-times"></i>
                        <span>Cancel</span>
                      </button>
                      <button onClick={handleSave} className="save-btn" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <i className="fa fa-spinner fa-spin"></i>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa fa-check"></i>
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="form-grid">
                {/* Profile Picture Upload Section */}
                <div className="form-group full-width">
                  <label>
                    <i className="fa fa-image"></i>
                    Profile Picture
                  </label>
                  <div className="profile-picture-upload">
                    <div className="upload-preview-container">
                      <div className="upload-preview">
                        {picturePreview ? (
                          <img src={picturePreview} alt="Profile Preview" />
                        ) : (
                          <div className="upload-placeholder">
                            <i className="fa fa-user"></i>
                          </div>
                        )}
                        {isUploadingPicture && (
                          <div className="upload-overlay">
                            <i className="fa fa-spinner fa-spin"></i>
                            <span>Uploading...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="upload-actions">
                      <button
                        type="button"
                        className="upload-btn"
                        onClick={handlePictureClick}
                        disabled={isUploadingPicture}
                      >
                        <i className="fa fa-upload"></i>
                        <span>{picturePreview ? 'Change Picture' : 'Upload Picture'}</span>
                      </button>
                      {picturePreview && (
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={handleDeletePicture}
                          disabled={isUploadingPicture}
                        >
                          <i className="fa fa-trash"></i>
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePictureChange}
                      style={{ display: 'none' }}
                      disabled={isUploadingPicture}
                    />
                    <p className="upload-hint">
                      <i className="fa fa-info-circle"></i>
                      Accepted formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                    </p>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <i className="fa fa-user"></i>
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={isEditing ? 'active' : ''}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className="fa fa-envelope"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={isEditing ? 'active' : ''}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className="fa fa-shield"></i>
                    Role
                  </label>
                  {isEditingRole ? (
                    <div className="role-edit-container">
                      <select
                        value={tempRole}
                        onChange={(e) => setTempRole(e.target.value)}
                        className="role-select active"
                      >
                        <option value="employee">Employee</option>
                        <option value="vendor">Vendor</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="role-edit-actions">
                        <button onClick={handleRoleSave} className="save-role-btn" disabled={isSaving}>
                          {isSaving ? (
                            <i className="fa fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fa fa-check"></i>
                          )}
                        </button>
                        <button onClick={handleRoleCancel} className="cancel-role-btn">
                          <i className="fa fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="role-display">
                      <input
                        type="text"
                        value={formData.role}
                        disabled
                        className="disabled"
                      />
                      <button onClick={handleRoleEdit} className="edit-role-btn" title="Edit Role">
                        <i className="fa fa-edit"></i>
                      </button>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <i className="fa fa-clock"></i>
                    Member Since
                  </label>
                  <input
                    type="text"
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                    disabled
                    className="disabled"
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="profile-form-section">
              <div className="section-header">
                <h2>
                  <i className="fa fa-lock"></i>
                  Security
                </h2>
                <button onClick={() => setShowPasswordModal(true)} className="change-password-btn">
                  <i className="fa fa-key"></i>
                  <span>Change Password</span>
                </button>
              </div>

              <div className="security-info">
                <div className="security-item">
                  <div className="security-icon">
                    <i className="fa fa-shield-alt"></i>
                  </div>
                  <div className="security-details">
                    <h4>Password Protection</h4>
                    <p>Keep your account secure with a strong password</p>
                  </div>
                </div>
                <div className="security-item">
                  <div className="security-icon">
                    <i className="fa fa-check-circle"></i>
                  </div>
                  <div className="security-details">
                    <h4>Account Status</h4>
                    <p className="status-active">
                      <span className="status-dot"></span>
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="profile-actions">
              <h3>
                <i className="fa fa-cog"></i>
                Account Actions
              </h3>
              <div className="actions-grid">
                <button className="action-card danger" onClick={() => setShowPasswordModal(true)}>
                  <div className="action-icon">
                    <i className="fa fa-key"></i>
                  </div>
                  <div className="action-info">
                    <h4>Change Password</h4>
                    <p>Update your password</p>
                  </div>
                </button>
                <button className="action-card" onClick={() => navigate('/dashboard')}>
                  <div className="action-icon">
                    <i className="fa fa-tachometer"></i>
                  </div>
                  <div className="action-info">
                    <h4>Go to Dashboard</h4>
                    <p>View live tracking</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fa fa-key"></i>
                Change Password
              </h2>
              <button onClick={() => setShowPasswordModal(false)} className="modal-close">
                <i className="fa fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="modal-form">
              <div className="form-group">
                <label>
                  <i className="fa fa-lock"></i>
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fa fa-lock"></i>
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>
                  <i className="fa fa-lock"></i>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <i className="fa fa-check"></i>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
