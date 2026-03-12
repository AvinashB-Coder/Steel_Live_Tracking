import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { sanitizeInput } from '../middleware/validation.js';
import pool from '../config/database.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// ============================================
// GET ALL TRIPS (Admin/Employee)
// ============================================
router.get('/trips', verifyToken, async (req, res) => {
  try {
    const { status, driver_id, vendor_id, search, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM trips WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM trips WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    // Filter by status
    if (status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    // Filter by driver
    if (driver_id) {
      query += ` AND driver_id = $${paramIndex}`;
      countQuery += ` AND driver_id = $${paramIndex}`;
      values.push(parseInt(driver_id));
      paramIndex++;
    }

    // Filter by vendor
    if (vendor_id) {
      query += ` AND vendor_id = $${paramIndex}`;
      countQuery += ` AND vendor_id = $${paramIndex}`;
      values.push(parseInt(vendor_id));
      paramIndex++;
    }

    // Search by trip number, origin, destination, or driver name
    if (search) {
      query += ` AND (trip_number ILIKE $${paramIndex} OR origin ILIKE $${paramIndex} OR destination ILIKE $${paramIndex} OR driver_name ILIKE $${paramIndex})`;
      countQuery += ` AND (trip_number ILIKE $${paramIndex} OR origin ILIKE $${paramIndex} OR destination ILIKE $${paramIndex} OR driver_name ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Order by created_at descending
    query += ' ORDER BY created_at DESC';

    // Pagination
    const limitNum = parseInt(limit) || 20;
    const pageNum = parseInt(page) || 1;
    const offset = (pageNum - 1) * limitNum;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limitNum, offset);

    // Count query doesn't need pagination parameters
    const countValues = values.slice(0, values.length - 2);

    const [result, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues)
    ]);

    res.json({
      success: true,
      trips: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(countResult.rows[0].count / limitNum) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips'
    });
  }
});

// ============================================
// GET SINGLE TRIP
// ============================================
router.get('/trips/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      trip: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip'
    });
  }
});

// ============================================
// CREATE TRIP (Admin/Employee only)
// ============================================
router.post('/trips', verifyToken, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const {
      trip_number,
      origin,
      origin_address,
      origin_coords_lat,
      origin_coords_lng,
      destination,
      destination_address,
      destination_coords_lat,
      destination_coords_lng,
      driver_id,
      driver_name,
      vendor_id,
      vendor_name,
      dispatch_time,
      estimated_arrival,
      material_name,
      material_type,
      quantity,
      weight,
      total_distance_km,
      vehicle_number,
      vehicle_type,
      notes,
      route_card_id
    } = req.body;

    console.log('=== CREATE TRIP REQUEST ===');
    console.log('User:', req.user);
    console.log('Body:', req.body);

    // Validate required fields
    if (!trip_number || !origin || !destination) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: trip_number, origin, destination'
      });
    }

    // Check if trip number already exists
    const existing = await pool.query('SELECT id FROM trips WHERE trip_number = $1', [trip_number]);
    if (existing.rows.length > 0) {
      console.log('Trip number already exists:', trip_number);
      return res.status(409).json({
        success: false,
        message: 'Trip number already exists'
      });
    }

    // Determine initial status
    let status = 'scheduled';
    if (dispatch_time && new Date(dispatch_time) <= new Date()) {
      status = 'dispatched';
    }

    const query = `
      INSERT INTO trips (
        trip_number, origin, origin_address, origin_coords_lat, origin_coords_lng,
        destination, destination_address, destination_coords_lat, destination_coords_lng,
        driver_id, driver_name, vendor_id, vendor_name,
        dispatch_time, estimated_arrival,
        material_name, material_type, quantity, weight, total_distance_km,
        vehicle_number, vehicle_type, notes, route_card_id,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      )
      RETURNING *
    `;

    const values = [
      trip_number,
      origin,
      origin_address || null,
      origin_coords_lat || null,
      origin_coords_lng || null,
      destination,
      destination_address || null,
      destination_coords_lat || null,
      destination_coords_lng || null,
      driver_id ? parseInt(driver_id) : null,
      driver_name || null,
      vendor_id ? parseInt(vendor_id) : null,
      vendor_name || null,
      dispatch_time || null,
      estimated_arrival || null,
      material_name || null,
      material_type || null,
      quantity && quantity !== '' ? parseInt(quantity) : 0,
      weight && weight !== '' ? parseFloat(weight) : null,
      total_distance_km && total_distance_km !== '' ? parseFloat(total_distance_km) : null,
      vehicle_number || null,
      vehicle_type || null,
      notes || null,
      route_card_id && route_card_id !== '' ? parseInt(route_card_id) : null,
      status,
      req.user.id
    ];

    console.log('Executing query with values:', values);
    const result = await pool.query(query, values);

    console.log('Trip created successfully:', result.rows[0]);
    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip: result.rows[0]
    });
  } catch (error) {
    console.error('=== ERROR CREATING TRIP ===');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    
    // Handle specific database errors
    if (error.code === '42P01') {
      return res.status(500).json({
        success: false,
        message: 'Database table "trips" does not exist. Please run the migration script.',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create trip',
      error: error.message
    });
  }
});

// ============================================
// UPDATE TRIP (Admin/Employee)
// ============================================
router.put('/trips/:id', verifyToken, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== UPDATE TRIP REQUEST ===');
    console.log('Trip ID:', id);
    console.log('Body:', req.body);

    // Get existing trip
    const existingResult = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const existing = existingResult.rows[0];

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = [
      'origin', 'origin_address', 'origin_coords_lat', 'origin_coords_lng',
      'destination', 'destination_address', 'destination_coords_lat', 'destination_coords_lng',
      'driver_id', 'driver_name', 'vendor_id', 'vendor_name',
      'dispatch_time', 'estimated_arrival', 'actual_arrival',
      'material_name', 'material_type',
      'vehicle_number', 'vehicle_type', 'notes', 'route_card_id',
      'status', 'progress',
      'current_location_lat', 'current_location_lng'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        // Handle empty strings and invalid values
        if (req.body[field] === '' || req.body[field] === null) {
          values.push(null);
        } else {
          values.push(req.body[field]);
        }
        paramIndex++;
      }
    });

    // Handle numeric fields separately with proper parsing
    const numericFields = {
      'quantity': parseInt,
      'weight': parseFloat,
      'total_distance_km': parseFloat
    };

    Object.keys(numericFields).forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        const parseFunc = numericFields[field];
        const value = req.body[field];
        // Convert empty string or invalid to null/0
        if (value === '' || value === null || value === undefined) {
          values.push(field === 'quantity' ? 0 : null);
        } else {
          const parsed = parseFunc(value);
          values.push(isNaN(parsed) ? 0 : parsed);
        }
        paramIndex++;
      }
    });

    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE trips
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    console.log('Update query:', query);
    console.log('Values:', values);

    const result = await pool.query(query, values);

    console.log('Trip updated successfully:', result.rows[0]);
    res.json({
      success: true,
      message: 'Trip updated successfully',
      trip: result.rows[0]
    });
  } catch (error) {
    console.error('=== ERROR UPDATING TRIP ===');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('===========================');
    res.status(500).json({
      success: false,
      message: 'Failed to update trip',
      error: error.message
    });
  }
});

// ============================================
// UPDATE TRIP STATUS (Admin/Employee/Driver)
// ============================================
router.patch('/trips/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, notes } = req.body;

    // Validate status
    const validStatuses = ['scheduled', 'dispatched', 'in_transit', 'arriving', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;

      // Set actual_arrival if status is completed
      if (status === 'completed') {
        updates.push(`actual_arrival = CURRENT_TIMESTAMP`);
      }
    }

    if (progress !== undefined) {
      updates.push(`progress = $${paramIndex}`);
      values.push(progress);
      paramIndex++;
    }

    if (notes) {
      updates.push(`notes = $${paramIndex}`);
      values.push(notes);
      paramIndex++;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE trips
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    res.json({
      success: true,
      message: 'Trip status updated successfully',
      trip: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trip status'
    });
  }
});

// ============================================
// ASSIGN DRIVER TO TRIP (Admin/Employee)
// ============================================
router.post('/trips/:id/assign-driver', verifyToken, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const { id } = req.params;
    const { driver_id, driver_name } = req.body;

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }

    // Verify driver exists and has driver role
    const driverResult = await pool.query('SELECT id, username, role FROM users WHERE id = $1 AND role = $2', [driver_id, 'driver']);
    if (driverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found or user does not have driver role'
      });
    }

    const result = await pool.query(
      `UPDATE trips
       SET driver_id = $1, driver_name = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [driver_id, driver_name || driverResult.rows[0].username, id]
    );

    res.json({
      success: true,
      message: 'Driver assigned successfully',
      trip: result.rows[0]
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign driver'
    });
  }
});

// ============================================
// GET DRIVER'S TRIPS (Driver)
// ============================================
router.get('/driver/trips', verifyToken, requireRole('driver'), async (req, res) => {
  try {
    // Get active trip (not completed/cancelled)
    const activeQuery = `
      SELECT * FROM trips 
      WHERE driver_id = $1 AND status NOT IN ('completed', 'cancelled')
      ORDER BY dispatch_time DESC
      LIMIT 1
    `;

    // Get trip history (completed/cancelled)
    const historyQuery = `
      SELECT * FROM trips 
      WHERE driver_id = $1 AND status IN ('completed', 'cancelled')
      ORDER BY updated_at DESC
      LIMIT 20
    `;

    const [activeResult, historyResult] = await Promise.all([
      pool.query(activeQuery, [req.user.id]),
      pool.query(historyQuery, [req.user.id])
    ]);

    res.json({
      success: true,
      activeTrip: activeResult.rows[0] || null,
      history: historyResult.rows
    });
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver trips'
    });
  }
});

// ============================================
// GET VENDOR'S TRIPS (Vendor)
// ============================================
router.get('/vendor/trips', verifyToken, requireRole('vendor'), async (req, res) => {
  try {
    const query = `
      SELECT * FROM trips 
      WHERE vendor_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const result = await pool.query(query, [req.user.id]);

    res.json({
      success: true,
      trips: result.rows
    });
  } catch (error) {
    console.error('Error fetching vendor trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor trips'
    });
  }
});

// ============================================
// DELETE TRIP (Admin only)
// ============================================
router.delete('/trips/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if trip exists
    const existingResult = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Prevent deletion of active trips
    const trip = existingResult.rows[0];
    if (trip.status === 'in_transit' || trip.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active or completed trips'
      });
    }

    await pool.query('DELETE FROM trips WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trip'
    });
  }
});

// ============================================
// GET ALL DRIVERS (For trip assignment dropdown)
// ============================================
router.get('/drivers', verifyToken, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, is_active FROM users WHERE role = $1 ORDER BY username',
      ['driver']
    );

    res.json({
      success: true,
      drivers: result.rows
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers'
    });
  }
});

// ============================================
// GET ALL VENDORS (For trip assignment dropdown)
// ============================================
router.get('/vendors', verifyToken, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, is_active FROM users WHERE role = $1 ORDER BY username',
      ['vendor']
    );

    res.json({
      success: true,
      vendors: result.rows
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors'
    });
  }
});

export default router;
