import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import pool from '../config/database.js';
import {
  loginValidation,
  registerValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  googleOAuthValidation,
  sanitizeInput
} from '../middleware/validation.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Apply sanitization to all routes
router.use(sanitizeInput);

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: parseInt(process.env.EMAIL_PORT) === 465, // true for 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('=== EMAIL TRANSPORTER ERROR ===');
    console.error('Error:', error.message);
    console.log('Email configuration:');
    console.log('  Host:', process.env.EMAIL_HOST);
    console.log('  Port:', process.env.EMAIL_PORT);
    console.log('  User:', process.env.EMAIL_USER);
    console.log('  Pass:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
    console.log('===============================');
    console.log('');
    console.log('💡 TIP: Gmail requires an App Password (16 characters)');
    console.log('Get it from: https://myaccount.google.com/apppasswords');
    console.log('');
  } else {
    console.log('=== EMAIL TRANSPORTER READY ===');
    console.log('Server is ready to send emails');
    console.log('===============================');
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Password provided:', password ? 'Yes' : 'No');

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Query database for user
    console.log('Querying database...');
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    console.log('Query result:', result.rows.length, 'rows found');

    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];
    console.log('User found:', user.id, user.email, user.role);

    // Check if user is active
    if (!user.is_active) {
      console.log('User account is inactive');
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Verify password
    console.log('Verifying password...');
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      console.log('Invalid password');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('Password verified successfully');

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password_hash, reset_token, reset_token_expiry, ...userWithoutPassword } = user;

    console.log('Login successful for:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===================');
    
    // Handle specific errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        success: false,
        message: 'Database connection failed. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: error.message 
    });
  }
});

// Google OAuth Login/Register
router.post('/google', googleOAuthValidation, async (req, res) => {
  try {
    const { credential } = req.body;

    console.log('=== GOOGLE OAUTH REQUEST ===');
    console.log('Credential received:', credential ? 'Yes (' + credential.length + ' chars)' : 'NO');

    if (!credential) {
      console.error('No credential provided');
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify Google token
    console.log('Verifying Google token...');
    console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    console.log('Token verified successfully!');
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log('User info:', { googleId, email, name });

    // Admin email configuration
    const ADMIN_EMAIL = 'babuavinash2006@gmail.com';
    
    // Determine role - admin if email matches, otherwise default to employee
    const role = email === ADMIN_EMAIL ? 'admin' : 'employee';

    // Check if user exists
    let result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    if (result.rows.length > 0) {
      // User exists - update or create Google link
      const user = result.rows[0];
      console.log('Existing user found:', user.id, user.email);

      if (!user.google_id) {
        // Link Google account to existing user
        console.log('Linking Google account to existing user');
        await pool.query(
          'UPDATE users SET google_id = $1, google_picture = $2, auth_provider = $3, role = $4 WHERE id = $5',
          [googleId, picture, 'google', role, user.id]
        );
      }

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role || role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const { password_hash, ...userWithoutPassword } = user;

      console.log('Google login successful for:', user.email);
      res.json({
        message: 'Google login successful',
        token,
        user: { ...userWithoutPassword, role: user.role || role }
      });
    } else {
      // New user - create account
      console.log('Creating new user with Google');
      result = await pool.query(
        `INSERT INTO users (username, email, google_id, google_picture, role, auth_provider, is_active)
         VALUES ($1, $2, $3, $4, $5, 'google', TRUE)
         RETURNING id, username, email, role, google_id, google_picture, is_active, created_at`,
        [name || email.split('@')[0], email, googleId, picture, role]
      );

      const newUser = result.rows[0];

      // Generate token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('New user created:', newUser.email);
      res.status(201).json({
        message: 'Google registration successful',
        token,
        user: newUser
      });
    }
  } catch (error) {
    console.error('=== GOOGLE OAUTH ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('=========================');

    // Handle specific Google auth errors
    if (error.message.includes('Token used too early')) {
      res.status(401).json({ message: 'Token not yet valid. Please try again.' });
    } else if (error.message.includes('Token used too late')) {
      res.status(401).json({ message: 'Token expired. Please try again.' });
    } else if (error.message.includes('Invalid ID token')) {
      res.status(401).json({ message: 'Invalid Google token. Please try again.' });
    } else if (error.message.includes('audience')) {
      res.status(401).json({ message: 'Invalid Google Client ID configuration.' });
    } else {
      res.status(500).json({ message: 'Google authentication failed', error: error.message });
    }
  }
});
// Register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    console.log('=== REGISTER REQUEST ===');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Role:', role);

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('User already exists:', email);
      return res.status(409).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, auth_provider)
       VALUES ($1, $2, $3, $4, 'local')
       RETURNING id, username, email, role, is_active, created_at`,
      [username || email.split('@')[0], email, passwordHash, role || 'employee']
    );

    const newUser = result.rows[0];
    console.log('User created successfully:', newUser.id, newUser.email);

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Registration successful, token generated');

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle database errors
    if (error.code) {
      return res.status(500).json({ 
        success: false,
        message: 'Database error during registration',
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      'SELECT id, username, email, role, is_active, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - Generate reset token
router.post('/forgot-password', forgotPasswordValidation, async (req, res) => {
  try {
    console.log('=== FORGOT PASSWORD REQUEST ===');
    const { email } = req.body;
    console.log('Email received:', email);

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    console.log('Querying database for user...');
    const result = await pool.query(
      'SELECT id, email, username FROM users WHERE email = $1',
      [email]
    );

    console.log('Query result rows:', result.rows.length);

    // Always return success message to prevent email enumeration
    if (result.rows.length === 0) {
      console.log('User not found, returning success message');
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    const user = result.rows[0];
    console.log('User found:', user.id, user.email);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store token hash in database (not the plain token)
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log('Updating user with reset token...');
    await pool.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expiry = $2
       WHERE id = $3`,
      [resetTokenHash, resetTokenExpiry, user.id]
    );
    console.log('Reset token stored successfully');

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - Lakshmi Vacuum Services',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #079cd4 0%, #02cafe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #079cd4 0%, #02cafe 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1> Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${user.username || user.email},</p>
              <p>We received a request to reset your password for your Lakshmi Vacuum Services account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #079cd4;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
              </div>
              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <p>For security reasons, please don't share this link with anyone.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Lakshmi Vacuum Services.</p>
              <p>&copy; ${new Date().getFullYear()} Lakshmi Vacuum Services. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Verify transporter configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-app-password-here') {
      console.log('=== EMAIL NOT CONFIGURED ===');
      console.log('Reset URL:', resetUrl);
      console.log('===========================');
      return res.json({
        message: 'Password reset email configured. Check server logs for reset URL.',
        resetUrl // Remove in production
      });
    }

    // Send email
    console.log('Sending email...');
    await transporter.sendMail(mailOptions);

    console.log('=== PASSWORD RESET EMAIL SENT ===');
    console.log('To:', email);
    console.log('Reset URL:', resetUrl);
    console.log('=================================');

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('=== FORGOT PASSWORD ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('=============================');
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password - Validate token and update password
router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const result = await pool.query(
      `SELECT id, email FROM users
       WHERE reset_token = $1
       AND reset_token_expiry > NOW()`,
      [resetTokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const userId = result.rows[0].id;

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
