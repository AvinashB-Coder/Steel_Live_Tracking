import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/validation.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Configure multer for route card photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join('uploads', 'route-cards');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'route-card-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

// ============================================
// GET ALL ROUTE CARDS
// ============================================
router.get('/route-cards', verifyToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM route_cards WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM route_cards WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    // Filter by status
    if (status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    // Search by route card no, customer name, or part name
    if (search) {
      query += ` AND (route_card_no ILIKE $${paramIndex} OR customer_name ILIKE $${paramIndex} OR part_name ILIKE $${paramIndex})`;
      countQuery += ` AND (route_card_no ILIKE $${paramIndex} OR customer_name ILIKE $${paramIndex} OR part_name ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Order by created_at descending
    query += ' ORDER BY created_at DESC';

    // Pagination
    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limitNum, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, paramIndex - 2))
    ]);

    res.json({
      success: true,
      routeCards: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(countResult.rows[0].count / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching route cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route cards'
    });
  }
});

// ============================================
// GET SINGLE ROUTE CARD
// ============================================
router.get('/route-cards/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM route_cards WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route card not found'
      });
    }

    res.json({
      success: true,
      routeCard: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching route card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route card'
    });
  }
});

// ============================================
// CREATE ROUTE CARD (Employee only)
// ============================================
router.post('/route-cards', verifyToken, requireRole('admin', 'employee'), upload.single('photo'), async (req, res) => {
  try {
    const {
      route_card_no,
      grn_date,
      in_time,
      pg_number,
      po_number,
      customer_name,
      cus_dc_no,
      cus_dc_date,
      part_name,
      part_no,
      received_qty,
      quantity,
      grade,
      weight,
      req_hardness_hrc,
      packing_carton_box,
      packing_plastic_bin,
      packing_bubble_sheet,
      packing_wooden_pallet,
      packing_material_cap,
      packing_none,
      packing_cover,
      packing_bag,
      work_instruction_available,
      job_photo_url,
      remarks
    } = req.body;

    // Validate required fields
    if (!route_card_no || !grn_date || !in_time || !customer_name || !part_name || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if route card number already exists
    const existing = await pool.query('SELECT id FROM route_cards WHERE route_card_no = $1', [route_card_no]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Route card number already exists'
      });
    }

    // Get user info
    const userName = req.user.email?.split('@')[0] || req.user.id?.toString() || 'Unknown';

    // Handle photo upload
    let photoUrl = null;
    let photoFilename = null;
    let photoMimeType = null;
    let photoSizeBytes = null;
    let photoUploadedAt = null;

    if (req.file) {
      photoUrl = `/uploads/route-cards/${req.file.filename}`;
      photoFilename = req.file.filename;
      photoMimeType = req.file.mimetype;
      photoSizeBytes = req.file.size;
      photoUploadedAt = new Date();
    }

    const query = `
      INSERT INTO route_cards (
        route_card_no, grn_date, in_time, pg_number, po_number,
        customer_name, cus_dc_no, cus_dc_date, part_name, part_no,
        received_qty, quantity, grade, weight, req_hardness_hrc,
        prepared_by, prepared_by_name,
        packing_carton_box, packing_plastic_bin, packing_bubble_sheet,
        packing_wooden_pallet, packing_material_cap, packing_none,
        packing_cover, packing_bag,
        work_instruction_available, job_photo_url, remarks,
        photo_url, photo_filename, photo_mime_type, photo_size_bytes, photo_uploaded_at,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32, 'pending'
      )
      RETURNING *
    `;

    const values = [
      route_card_no,
      grn_date,
      in_time,
      pg_number || null,
      po_number || null,
      customer_name,
      cus_dc_no || null,
      cus_dc_date || null,
      part_name,
      part_no || null,
      received_qty || quantity,
      quantity,
      grade || null,
      weight || null,
      req_hardness_hrc || null,
      req.user.id,
      userName,
      packing_carton_box || false,
      packing_plastic_bin || false,
      packing_bubble_sheet || false,
      packing_wooden_pallet || false,
      packing_material_cap || false,
      packing_none || false,
      packing_cover || false,
      packing_bag || false,
      work_instruction_available || false,
      job_photo_url || null,
      remarks || null,
      photoUrl,
      photoFilename,
      photoMimeType,
      photoSizeBytes,
      photoUploadedAt
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Route card created successfully',
      routeCard: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating route card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create route card'
    });
  }
});

// ============================================
// UPDATE ROUTE CARD (Employee/Admin)
// ============================================
router.put('/route-cards/:id', verifyToken, requireRole('admin', 'employee'), upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing route card
    const existingResult = await pool.query('SELECT * FROM route_cards WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route card not found'
      });
    }

    const existing = existingResult.rows[0];
    const userName = req.user.email?.split('@')[0] || req.user.id?.toString() || 'Unknown';

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = [
      'grn_date', 'in_time', 'pg_number', 'po_number', 'customer_name',
      'cus_dc_no', 'cus_dc_date', 'part_name', 'part_no', 'received_qty',
      'quantity', 'grade', 'weight', 'req_hardness_hrc', 'status', 'remarks',
      'packing_carton_box', 'packing_plastic_bin', 'packing_bubble_sheet',
      'packing_wooden_pallet', 'packing_material_cap', 'packing_none',
      'packing_cover', 'packing_bag', 'work_instruction_available',
      'job_photo_url', 'checked_ok', 'incoming_inspection', 'process_confirmation'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(req.body[field]);
        paramIndex++;
      }
    });

    // Handle photo upload if new photo is provided
    if (req.file) {
      // Delete old photo if exists
      if (existing.photo_url) {
        const oldPhotoPath = path.join(__dirname, '..', existing.photo_url);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      updates.push('photo_url = $' + paramIndex);
      values.push(`/uploads/route-cards/${req.file.filename}`);
      paramIndex++;

      updates.push('photo_filename = $' + paramIndex);
      values.push(req.file.filename);
      paramIndex++;

      updates.push('photo_mime_type = $' + paramIndex);
      values.push(req.file.mimetype);
      paramIndex++;

      updates.push('photo_size_bytes = $' + paramIndex);
      values.push(req.file.size);
      paramIndex++;

      updates.push('photo_uploaded_at = $' + paramIndex);
      values.push(new Date());
      paramIndex++;
    }

    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE route_cards
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Route card updated successfully',
      routeCard: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating route card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update route card'
    });
  }
});

// ============================================
// UPLOAD PHOTO ONLY (for camera/file upload)
// ============================================
router.post('/route-cards/:id/upload-photo', verifyToken, requireRole('admin', 'employee'), upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if route card exists
    const existingResult = await pool.query('SELECT * FROM route_cards WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route card not found'
      });
    }

    const existing = existingResult.rows[0];

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    // Delete old photo if exists
    if (existing.photo_url) {
      const oldPhotoPath = path.join(__dirname, '..', existing.photo_url);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update photo fields
    const photoUrl = `/uploads/route-cards/${req.file.filename}`;
    const result = await pool.query(
      `UPDATE route_cards
       SET photo_url = $1,
           photo_filename = $2,
           photo_mime_type = $3,
           photo_size_bytes = $4,
           photo_uploaded_at = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [photoUrl, req.file.filename, req.file.mimetype, req.file.size, new Date(), id]
    );

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      routeCard: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo'
    });
  }
});

// ============================================
// DELETE PHOTO FROM ROUTE CARD
// ============================================
router.delete('/route-cards/:id/delete-photo', verifyToken, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get route card to find photo path
    const result = await pool.query('SELECT photo_url FROM route_cards WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route card not found'
      });
    }

    const routeCard = result.rows[0];

    // Delete physical file if exists
    if (routeCard.photo_url) {
      const photoPath = path.join(__dirname, '..', routeCard.photo_url);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Clear photo fields
    await pool.query(
      `UPDATE route_cards
       SET photo_url = NULL,
           photo_filename = NULL,
           photo_mime_type = NULL,
           photo_size_bytes = NULL,
           photo_uploaded_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete photo'
    });
  }
});

// ============================================
// VERIFY ROUTE CARD (Admin only)
// ============================================
router.post('/route-cards/:id/verify', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const userName = req.user.email?.split('@')[0] || req.user.id?.toString() || 'Unknown';

    const result = await pool.query(
      `UPDATE route_cards
       SET verified_by = $1, verified_by_name = $2, status = 'verified', updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [req.user.id, userName, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route card not found'
      });
    }

    res.json({
      success: true,
      message: 'Route card verified successfully',
      routeCard: result.rows[0]
    });
  } catch (error) {
    console.error('Error verifying route card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify route card'
    });
  }
});

// ============================================
// DELETE ROUTE CARD (Admin only)
// ============================================
router.delete('/route-cards/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT photo_url FROM route_cards WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route card not found'
      });
    }

    // Delete associated photo if exists
    if (result.rows[0].photo_url) {
      const photoPath = path.join(__dirname, '..', result.rows[0].photo_url);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await pool.query('DELETE FROM route_cards WHERE id = $1 RETURNING *', [id]);

    res.json({
      success: true,
      message: 'Route card deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting route card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete route card'
    });
  }
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ message: 'File upload failed', error: err.message });
  }
  next();
});

export default router;
