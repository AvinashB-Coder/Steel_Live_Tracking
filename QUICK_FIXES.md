# 🔧 Quick Fixes for Critical Issues

## Issue #1: Incomplete RouteCardManagement.jsx

**Status:** Requires manual fix
**File:** `client/src/pages/RouteCardManagement.jsx`

The file is truncated. You need to complete the modal form with these missing fields:

```jsx
// Add these missing fields before the closing </div> of the form:

{/* Weight */}
<div className="form-row">
  <div className="form-group">
    <label>Weight</label>
    <input
      type="number"
      step="0.001"
      value={formData.weight || ''}
      onChange={handleInputChange}
      placeholder="Enter weight"
    />
  </div>
  <div className="form-group">
    <label>Required Hardness (HRC)</label>
    <input
      type="text"
      value={formData.req_hardness_hrc || ''}
      onChange={handleInputChange}
      placeholder="Enter hardness"
    />
  </div>
</div>

{/* Packing Options */}
<div className="form-group">
  <label>Packing Method</label>
  <div className="checkbox-group">
    <label className="checkbox-label">
      <input
        type="checkbox"
        name="packing_carton_box"
        checked={formData.packing_carton_box || false}
        onChange={handleInputChange}
      />
      Carton Box
    </label>
    <label className="checkbox-label">
      <input
        type="checkbox"
        name="packing_plastic_bin"
        checked={formData.packing_plastic_bin || false}
        onChange={handleInputChange}
      />
      Plastic Bin
    </label>
    <label className="checkbox-label">
      <input
        type="checkbox"
        name="packing_bubble_sheet"
        checked={formData.packing_bubble_sheet || false}
        onChange={handleInputChange}
      />
      Bubble Sheet
    </label>
    <label className="checkbox-label">
      <input
        type="checkbox"
        name="packing_wooden_pallet"
        checked={formData.packing_wooden_pallet || false}
        onChange={handleInputChange}
      />
      Wooden Pallet
    </label>
  </div>
</div>

{/* Submit Buttons */}
<div className="modal-actions">
  <button
    type="button"
    onClick={() => setShowModal(false)}
    className="btn-cancel"
  >
    Cancel
  </button>
  <button
    type="submit"
    className="btn-submit"
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Saving...' : 'Save Route Card'}
  </button>
</div>
```

---

## Issue #2: Missing Backend API Endpoints

**Status:** Requires code creation
**Files to Create:**

### Create `routes/trip.js`
```javascript
import express from 'express';
import pool from '../config/database.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all trips
router.get('/trips', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trips ORDER BY created_at DESC');
    res.json({ success: true, trips: result.rows });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trips' });
  }
});

// Create trip
router.post('/trips', verifyToken, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const { trip_number, origin, destination, status } = req.body;
    const result = await pool.query(
      'INSERT INTO trips (trip_number, origin, destination, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [trip_number, origin, destination, status || 'pending']
    );
    res.status(201).json({ success: true, trip: result.rows[0] });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ success: false, message: 'Failed to create trip' });
  }
});

export default router;
```

### Create `routes/tool.js`
```javascript
import express from 'express';
import pool from '../config/database.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all tools
router.get('/tools', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tools ORDER BY name');
    res.json({ success: true, tools: result.rows });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tools' });
  }
});

export default router;
```

### Update `server.js` to include new routes
```javascript
// Add these imports at the top
import tripRoutes from './routes/trip.js';
import toolRoutes from './routes/tool.js';

// Add these routes after existing routes
app.use('/api/user', tripRoutes);
app.use('/api/user', toolRoutes);
```

---

## Issue #3: Hardcoded Admin Email

**Status:** Quick fix
**Files:** `client/src/context/AuthContext.jsx`, `client/src/pages/AuthPage.jsx`

### Fix `AuthContext.jsx`
```javascript
// Remove this line:
const ADMIN_EMAIL = 'babuavinash2006@gmail.com';

// Update the login function to check from backend response
const login = (token, userData) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  setUser(userData);
};
```

### Fix `AuthPage.jsx`
```javascript
// Remove this line:
const ADMIN_EMAIL = 'babuavinash2006@gmail.com';

// The backend already handles admin role assignment in routes/auth.js
// Just use the role returned from the backend
```

The backend logic in `routes/auth.js` already handles admin role assignment correctly:
```javascript
const ADMIN_EMAIL = 'babuavinash2006@gmail.com';
const role = email === ADMIN_EMAIL ? 'admin' : 'employee';
```

This is fine since it's server-side.

---

## Issue #4: Hardcoded API Keys

**Status:** Quick fix
**Files:** `client/src/main.jsx`, `client/src/pages/AuthPage.jsx`, `client/src/components/LiveMap.jsx`

### Fix `client/src/main.jsx`
```javascript
// Replace hardcoded value with environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '756742317508-...';
```

### Fix `client/src/components/LiveMap.jsx`
```javascript
// Replace hardcoded value with environment variable
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAmlOOh_...';
```

### Create `client/.env`
```env
VITE_GOOGLE_CLIENT_ID=756742317508-6hnnknqhbs8rnr5rgan1g3efl9fg3a3r.apps.googleusercontent.com
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAmlOOh_RzyjXPCl2hfLfUxgx-wswJ-OlQ
```

### Update `client/.env.example`
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

---

## Issue #5: Password Validation Inconsistency

**Status:** Quick fix
**Files:** `client/src/pages/ResetPassword.jsx`, `client/src/pages/Profile.jsx`

### Fix `ResetPassword.jsx`
```jsx
<input
  type="password"
  name="newPassword"
  value={formData.newPassword}
  onChange={handleInputChange}
  placeholder="Enter new password"
  required
  minLength={8}  // Changed from 6 to 8
/>
<p className="password-hint">
  Password must be at least 8 characters and contain uppercase, lowercase, and number
</p>
```

---

## Issue #6: Email Configuration

**Status:** Configuration required
**File:** `.env`

### Get Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Copy the 16-character password
4. Update `.env`:

```env
EMAIL_PASS=abcd efgh ijkl mnop  # Your 16-char app password (no spaces)
```

---

## Issue #7: Standardize API Responses

**Status:** Requires code updates
**Files:** `routes/user.js`, `routes/auth.js`

### Update `routes/user.js`
```javascript
// Make all responses consistent with success field

// Before
res.json({ message: 'Profile updated successfully', user: result.rows[0] });

// After
res.json({ 
  success: true, 
  message: 'Profile updated successfully', 
  user: result.rows[0] 
});
```

Apply this pattern to all endpoints:
- `/profile` GET
- `/profile` PUT
- `/upload-picture` PUT
- `/delete-picture` DELETE
- `/change-password` PUT

---

## Issue #8: Add Rate Limiting

**Status:** Quick fix
**File:** `routes/user.js`

```javascript
import rateLimit from 'express-rate-limit';

// Add rate limiter for sensitive operations
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Apply to sensitive routes
router.put('/change-password', sensitiveLimiter, authenticateToken, changePasswordValidation, async (req, res) => {
  // ... existing code
});

router.put('/upload-picture', sensitiveLimiter, authenticateToken, upload.single('profilePicture'), async (req, res) => {
  // ... existing code
});
```

---

## Issue #9: Fix Multer Error Handler

**Status:** Quick fix
**Files:** `routes/user.js`, `routes/routeCard.js`

Move the multer error handler to immediately after multer configuration:

```javascript
const upload = multer({ /* config */ });

// Error handler for multer - PLACE IMMEDIATELY AFTER MULTER CONFIG
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'File size too large. Maximum size is 5MB' 
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'File upload failed', 
      error: err.message 
    });
  }
  next();
});

// Then define routes
router.get('/profile', ...);
router.put('/profile', ...);
```

---

## Issue #10: Remove Sensitive Console Logs

**Status:** Quick fix
**Files:** `routes/auth.js`, `routes/user.js`

Replace sensitive logs with sanitized versions:

```javascript
// Before
console.log('Email:', email);
console.log('Password provided:', password ? 'Yes' : 'No');

// After
console.log('Login attempt for user:', email);
// Remove password logging entirely
```

Or use a logging library:
```bash
npm install winston
```

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Usage
logger.info('Login attempt', { email });
```

---

## ✅ Quick Fix Checklist

Priority fixes (do these first):
- [ ] Complete RouteCardManagement.jsx
- [ ] Create trip.js and tool.js routes
- [ ] Update server.js with new routes
- [ ] Remove hardcoded admin email from client
- [ ] Create client/.env with API keys
- [ ] Fix password validation (minLength=8)
- [ ] Configure EMAIL_PASS in .env

Medium priority:
- [ ] Standardize API responses
- [ ] Add rate limiting to sensitive endpoints
- [ ] Fix multer error handler positioning
- [ ] Remove sensitive console logs

Low priority:
- [ ] Enable database SSL for production
- [ ] Add connection pool error recovery
- [ ] Create logging utility

---

**Total Fix Time:** 2-4 hours
**Priority:** Fix critical issues before deployment
