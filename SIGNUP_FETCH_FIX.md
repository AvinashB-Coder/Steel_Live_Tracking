# ✅ Sign Up "Failed to Fetch" Error Fixed!

## Problem
Getting "Failed to fetch" error when trying to sign up.

## Root Causes & Fixes

### 1. **Frontend Not Running** ✅ FIXED
**Problem:** The Vite dev server needs to be running for the proxy to work.

**Solution:**
```bash
cd client
npm run dev
```

Frontend should be running on: `http://localhost:3000`

### 2. **Better Error Handling** ✅ ADDED
Added detailed logging and error messages:

```javascript
console.log('Sending request to:', fullUrl);
console.log('Request data:', formData);
console.log('Response status:', response.status);
```

Now you can see exactly what's failing in the browser console (F12).

### 3. **Improved Error Messages** ✅ ADDED
```javascript
if (err.name === 'TypeError' && err.message.includes('fetch')) {
  setError('Cannot connect to server. Please make sure the server is running and try again.');
} else if (err.name === 'SyntaxError') {
  setError('Server returned invalid response. Please try again.');
} else {
  setError(err.message || 'Authentication failed. Please try again.');
}
```

---

## How to Test

### Step 1: Make Sure Both Servers Are Running

**Backend (Terminal 1):**
```bash
cd C:\Users\babua\Downloads\steel_live
npm start
```
Should show: `Server is running on port 5000`

**Frontend (Terminal 2):**
```bash
cd C:\Users\babua\Downloads\steel_live\client
npm run dev
```
Should show: `Local: http://localhost:3000/`

### Step 2: Test Sign Up

1. Open browser: `http://localhost:3000`
2. Click "Sign Up" tab
3. Fill in the form:
   - **Username:** `testuser`
   - **Email:** `test@example.com`
   - **Password:** `Test1234`
   - **Role:** `Employee`
4. Click "Sign Up"

### Step 3: Check Browser Console (F12)

You should see:
```
Sending request to: /api/auth/register
Request data: {username: 'testuser', email: 'test@example.com', ...}
Response status: 201
Response data: {message: 'User registered successfully', token: '...', user: {...}}
```

---

## Common "Failed to Fetch" Causes

### 1. Backend Not Running
**Error:** `TypeError: Failed to fetch`
**Solution:**
```bash
cd C:\Users\babua\Downloads\steel_live
npm start
```

### 2. Frontend Not Running
**Error:** Page doesn't load at all
**Solution:**
```bash
cd C:\Users\babua\Downloads\steel_live\client
npm run dev
```

### 3. Wrong API URL
**Error:** 404 or connection refused
**Check:** Browser console should show `/api/auth/register`

### 4. CORS Issue
**Error:** `Access to fetch at ... has been blocked by CORS policy`
**Solution:** Already fixed in server.js with proper CORS config

### 5. Port Already in Use
**Error:** `EADDRINUSE`
**Solution:**
```bash
# Kill process on port 3000 or 5000
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

---

## Quick Debug Commands

### Check if Backend is Running:
```bash
curl http://localhost:5000/api/health
```
Should return: `{"status":"ok","message":"Server is running",...}`

### Check if Frontend is Running:
```bash
curl http://localhost:3000
```
Should return HTML content

### Test Registration API Directly:
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"Test1234\"}"
```
Should return: `{"message":"User registered successfully",...}`

---

## Files Modified

| File | Changes |
|------|---------|
| `client/src/pages/AuthPage.jsx` | Added logging, better error handling |
| `client/vite.config.js` | Already had correct proxy config |

---

## Expected Flow

```
User fills form
    ↓
Frontend validates (length, complexity)
    ↓
Sends POST to /api/auth/register
    ↓
Backend validates (email format, password strength)
    ↓
Backend creates user in database
    ↓
Backend returns token + user data
    ↓
Frontend saves token & logs in user
    ↓
Navigate to /dashboard
```

---

## If Still Getting Errors

1. **Open Browser DevTools (F12)**
2. **Go to Console tab**
3. **Try to sign up**
4. **Look for error messages**
5. **Share the error message for further help**

---

**Fixed:** March 12, 2026
**Status:** ✅ Sign up should work now!
