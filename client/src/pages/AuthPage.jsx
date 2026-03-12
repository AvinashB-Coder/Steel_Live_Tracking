import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './AuthPage.css';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Admin email configuration
  const ADMIN_EMAIL = 'babuavinash2006@gmail.com';

  // API Base URL - Using relative path for Vite proxy
  const API_BASE_URL = '/api';

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation for sign up
    if (!isLogin) {
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      // Check password complexity
      const hasUppercase = /[A-Z]/.test(formData.password);
      const hasLowercase = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);

      if (!hasUppercase || !hasLowercase || !hasNumber) {
        setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const fullUrl = `${API_BASE_URL}${endpoint}`;

      console.log('Sending request to:', fullUrl);
      console.log('Request data:', formData);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);

      // Parse response JSON
      const data = await response.json().catch(() => ({ 
        success: false, 
        message: 'Server error - unable to parse response' 
      }));
      
      console.log('Response data:', data);

      // Check if response is ok
      if (!response.ok) {
        console.error('Server error:', data);
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      if (isLogin) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        // After successful registration, auto-login
        login(data.token, data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);

      // Provide more specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please make sure the server is running and try again.');
      } else if (err.name === 'SyntaxError') {
        setError('Server returned invalid response. Please try again.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');

    try {
      console.log('=== GOOGLE LOGIN STARTED ===');
      console.log('Credential received:', credentialResponse.credential ? 'Yes (' + credentialResponse.credential.length + ' chars)' : 'NO');
      console.log('Full response:', credentialResponse);

      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credential: credentialResponse.credential
        })
      });

      console.log('Backend response status:', response.status);
      const data = await response.json();
      console.log('Backend response data:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Google authentication failed');
      }

      console.log('Google login successful!');
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error('=== GOOGLE LOGIN ERROR ===');
      console.error('Error:', err);
      console.error('Error stack:', err.stack);
      setError(err.message || 'Google authentication failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (errorResponse) => {
    console.error('Google OAuth Error:', errorResponse);
    let errorMsg = 'Google authentication failed. Please try again.';
    
    if (errorResponse?.error === 'popup_closed') {
      errorMsg = 'Google popup was closed. Please try again.';
    } else if (errorResponse?.error === 'access_denied') {
      errorMsg = 'Access denied. Please allow Google permissions.';
    }
    
    setError(errorMsg);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      username: '',
      role: 'employee'
    });
  };

  return (
    <div className="auth-page">
      {/* Orbiting planets container */}
      <div className="universe-container">
        <div className="orbit orbit-1">
          <div className="planet planet-1"></div>
        </div>
        <div className="orbit orbit-2">
          <div className="planet planet-2"></div>
        </div>
        <div className="orbit orbit-3">
          <div className="planet planet-3"></div>
        </div>
        <div className="orbit orbit-4">
          <div className="planet planet-4"></div>
        </div>
        <div className="orbit orbit-5">
          <div className="planet planet-5"></div>
        </div>
      </div>

      {/* Shooting stars */}
      <div className="shooting-star shooting-star-1"></div>
      <div className="shooting-star shooting-star-2"></div>
      <div className="shooting-star shooting-star-3"></div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo-container">
              <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4" />
              </svg>
            </div>
            <h1 className="auth-title">Lakshmi Vacuum Services</h1>
            <p className="auth-subtitle">Live Location Monitoring System</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                minLength={8}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
                title="Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number"
              />
              {!isLogin && (
                <div className="password-requirements">
                  <p>Password must contain:</p>
                  <ul>
                    <li>At least 8 characters</li>
                    <li>At least one uppercase letter (A-Z)</li>
                    <li>At least one lowercase letter (a-z)</li>
                    <li>At least one number (0-9)</li>
                  </ul>
                </div>
              )}
              {isLogin && (
                <div className="forgot-password-link">
                  <Link to="/forgot-password">Forgot Password?</Link>
                </div>
              )}
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="employee">Employee</option>
                  <option value="vendor">Vendor</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <span className="loading-spinner">Loading...</span>
              ) : (
                isLogin ? 'Login' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <div className="google-login-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="100%"
              clientId="756742317508-6hnnknqhbs8rnr5rgan1g3efl9fg3a3r.apps.googleusercontent.com"
              auto_select={false}
            />
          </div>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button className="toggle-link" onClick={toggleMode}>
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
