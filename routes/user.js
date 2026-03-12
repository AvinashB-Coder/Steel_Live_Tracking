import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import {
  profileUpdateValidation,
  changePasswordValidation,
  sanitizeInput
} from '../middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join('uploads', 'profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, is_active, created_at, last_login, google_picture FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, profileUpdateValidation, async (req, res) => {
  console.log('=== Update Profile Request ===');
  console.log('User ID:', req.user?.id);
  console.log('Request body:', req.body);

  try {
    const { username, email, role, google_picture } = req.body;

    if (!req.user?.id) {
      console.log('No user ID in token');
      return res.status(401).json({ message: 'Invalid token - no user ID' });
    }

    // Check if email is already taken by another user (only if email is provided and not empty)
    if (email && email.trim() !== '') {
      const existingEmail = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );

      if (existingEmail.rows.length > 0) {
        console.log('Email already in use:', email);
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    // Validate role if provided
    const validRoles = ['admin', 'employee', 'vendor', 'driver'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be one of: admin, employee, vendor, driver' });
    }

    // Build dynamic update query - only update fields that are provided and not empty
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (username && username.trim() !== '') {
      updates.push(`username = $${paramIndex}`);
      values.push(username.trim());
      paramIndex++;
    }

    if (email && email.trim() !== '') {
      updates.push(`email = $${paramIndex}`);
      values.push(email.trim());
      paramIndex++;
    }

    // Update role if provided
    if (role && validRoles.includes(role)) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    // Only update google_picture if explicitly provided (can be null to clear it)
    if (google_picture !== undefined) {
      updates.push(`google_picture = $${paramIndex}`);
      values.push(google_picture);
      paramIndex++;
    }

    // Always update the timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add the user ID as the last parameter
    values.push(req.user.id);

    if (updates.length === 1) {
      // Only updated_at would be in updates, meaning no actual changes
      return res.json({
        message: 'No changes to update',
        user: req.user
      });
    }

    const updateClause = updates.join(', ');
    const query = `
      UPDATE users
      SET ${updateClause}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, role, is_active, created_at, google_picture
    `;

    console.log('Updating user:', req.user.id, 'with query:', query);
    console.log('Values:', values);

    const result = await pool.query(query, values);

    console.log('Update result:', result.rows[0]);

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload profile picture
router.put('/upload-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  console.log('=== Upload Picture Request ===');
  console.log('User ID:', req.user?.id);
  console.log('File:', req.file?.filename, req.file?.mimetype, req.file?.size);
  console.log('Body:', req.body);
  
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.user?.id) {
      console.log('No user ID in token');
      return res.status(401).json({ message: 'Invalid token - no user ID' });
    }

    // Get current user's picture from database
    const userResult = await pool.query(
      'SELECT google_picture FROM users WHERE id = $1',
      [req.user.id]
    );
    
    console.log('User query result:', userResult.rows);

    // Delete old profile picture if exists
    if (userResult.rows.length > 0 && userResult.rows[0].google_picture) {
      const oldPicturePath = path.join(__dirname, '..', 'uploads', 'profiles', path.basename(userResult.rows[0].google_picture));
      console.log('Deleting old picture:', oldPicturePath);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
        console.log('Old picture deleted');
      }
    }

    // Save new picture path (relative URL)
    const picturePath = `/uploads/profiles/${req.file.filename}`;
    console.log('New picture path:', picturePath);

    const result = await pool.query(
      `UPDATE users
       SET google_picture = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, role, is_active, created_at, google_picture`,
      [picturePath, req.user.id]
    );
    
    console.log('Update result:', result.rows[0]);

    res.json({
      message: 'Profile picture updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Upload picture error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ message: 'File upload failed', error: err.message });
  }
  next();
});

// Delete profile picture
router.delete('/delete-picture', authenticateToken, async (req, res) => {
  try {
    // Get current picture path
    const result = await pool.query(
      'SELECT google_picture FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length > 0 && result.rows[0].google_picture) {
      const picturePath = path.join(__dirname, '..', 'uploads', 'profiles', path.basename(result.rows[0].google_picture));
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
    }

    // Clear picture from database
    await pool.query(
      'UPDATE users SET google_picture = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );

    res.json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    console.error('Delete picture error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/change-password', authenticateToken, changePasswordValidation, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Get current user's password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// GET ALL USERS (Admin only)
// ============================================
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const result = await pool.query(
      'SELECT id, username, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

export default router;
