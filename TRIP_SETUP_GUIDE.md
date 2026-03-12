# Trip Management Feature Setup Guide

## Overview
This guide will help you set up the Trip Management feature for the Steel Tracking application.

## What's New
The Trip Management feature allows admins to:
- Create and manage trips for steel/material shipments
- Assign drivers and vendors to trips
- Track trip status (scheduled, dispatched, in_transit, arriving, completed, cancelled)
- Monitor trip progress in real-time
- View trip history and analytics

## Setup Instructions

### 1. Database Setup

Run the trips table migration:

```bash
# Using psql
psql -U steel_user -d steel_tracking -f sql/trips.sql
```

Or manually in pgAdmin/your preferred PostgreSQL client:
1. Open your `steel_tracking` database
2. Copy and paste the contents of `sql/trips.sql`
3. Execute the script

### 2. Verify Backend Routes

The following API endpoints are now available:

#### Trip CRUD Operations
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/trips` | Get all trips | Yes |
| GET | `/api/user/trips/:id` | Get single trip | Yes |
| POST | `/api/user/trips` | Create new trip | Admin/Employee |
| PUT | `/api/user/trips/:id` | Update trip | Admin/Employee |
| PATCH | `/api/user/trips/:id/status` | Update trip status | Yes |
| DELETE | `/api/user/trips/:id` | Delete trip | Admin only |

#### Trip Assignment
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/user/trips/:id/assign-driver` | Assign driver to trip | Admin/Employee |

#### Role-Specific Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/driver/trips` | Get driver's trips | Driver only |
| GET | `/api/user/vendor/trips` | Get vendor's trips | Vendor only |
| GET | `/api/user/drivers` | Get all drivers | Admin/Employee |
| GET | `/api/user/vendors` | Get all vendors | Admin/Employee |

### 3. Start the Application

```bash
# Start backend
npm run dev

# In another terminal, start frontend
cd client
npm run dev
```

### 4. Access Trip Management

1. Login as an **Admin** user
2. Navigate to the Dashboard
3. Click on the **"Trip Management"** tab
4. Click **"Add New Trip"** to create your first trip

## Trip Status Workflow

```
scheduled → dispatched → in_transit → arriving → completed
     ↓
 cancelled (at any point)
```

### Status Descriptions:
- **Scheduled**: Trip is planned but not yet started
- **Dispatched**: Trip has been dispatched from origin
- **In Transit**: Trip is currently in progress
- **Arriving**: Trip is about to reach destination
- **Completed**: Trip has been completed successfully
- **Cancelled**: Trip has been cancelled

## Trip Form Fields

### Required Fields:
- Trip Number (unique identifier)
- Origin (pickup location)
- Destination (delivery location)

### Optional Fields:
- Origin/Destination Address
- Driver Assignment
- Vendor Assignment
- Dispatch Time
- Estimated Arrival
- Material Details (name, type, quantity, weight)
- Vehicle Information (number, type)
- Distance
- Notes

## Testing the Feature

### 1. Create a Test Trip
```javascript
POST /api/user/trips
Authorization: Bearer <token>
Content-Type: application/json

{
  "trip_number": "TRIP-TEST-001",
  "origin": "Test Vendor",
  "destination": "Lakshmi Vacuum Services",
  "driver_id": 4,
  "dispatch_time": "2024-01-15T10:00:00Z",
  "estimated_arrival": "2024-01-15T14:00:00Z",
  "material_name": "Steel Sheets",
  "quantity": 100,
  "vehicle_number": "TN-01-AB-1234"
}
```

### 2. Update Trip Status
```javascript
PATCH /api/user/trips/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_transit"
}
```

### 3. Assign Driver
```javascript
POST /api/user/trips/:id/assign-driver
Authorization: Bearer <token>
Content-Type: application/json

{
  "driver_id": 4,
  "driver_name": "Driver Name"
}
```

## Sample Data

The `sql/trips.sql` file includes 3 sample trips:
1. **TRIP-2024-001**: In transit trip with driver assigned
2. **TRIP-2024-002**: Scheduled trip (future)
3. **TRIP-2024-003**: Completed trip

## Frontend Features

### Admin Dashboard - Trip Management Tab:
- **Overview Stats**: Active trips, pending deliveries, completed today
- **Trip List Table**: View all trips with status badges
- **Quick Actions**: 
  - View/Edit trip details
  - Delete trip
  - Update status (Dispatch, Start Trip, Arriving, Complete)
- **Add New Trip Modal**: Complete form with all trip details
- **Edit Trip Modal**: Update existing trip information

### Driver Dashboard:
- View assigned active trip
- Update trip status
- View trip history

### Vendor Dashboard:
- View trips related to their materials
- Track shipment status

## Troubleshooting

### Database Error
If you get "relation 'trips' does not exist":
```bash
psql -U steel_user -d steel_tracking -f sql/trips.sql
```

### API Routes Not Found
Make sure the server is running and trip routes are registered in `server.js`:
```javascript
import tripRoutes from './routes/trip.js';
app.use('/api/user', tripRoutes);
```

### Permission Issues
Ensure you're logged in as Admin or Employee to create/edit trips.

## Next Steps

1. ✅ Set up database tables
2. ✅ Test API endpoints with Postman/cURL
3. ✅ Create trips from the admin dashboard
4. ✅ Test status updates
5. ✅ Assign drivers to trips
6. ✅ Test driver and vendor views

## Support

For issues or questions, check:
- Backend logs in terminal
- Browser console for frontend errors
- Network tab in DevTools for API errors
