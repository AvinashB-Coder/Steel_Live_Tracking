# Steel Live - Live Location Monitoring System

A web application for tracking steel/material shipments with live location monitoring and route card management.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment

Update `.env` file with your credentials:

```env
# Database
DATABASE_URL=postgresql://steel_user:steel_pass@localhost:5432/steel_tracking

# JWT Secret (change in production)
JWT_SECRET=your_secret_key_change_in_production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Email (for password resets)
EMAIL_PASS=your-gmail-app-password
```

### 3. Start PostgreSQL

```bash
# Windows
net start postgresql-x64-18

# Or use Services app (services.msc)
```

### 4. Setup Database

Run the SQL schema from `sql/` folder:

```bash
psql -U steel_user -d steel_tracking -f sql/route_cards.sql
```

### 5. Run the Application

```bash
# Run both backend and frontend
npm run dev:all
```

Or run separately:

```bash
# Backend (terminal 1)
npm start

# Frontend (terminal 2)
cd client
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features, users, and settings |
| **Employee** | Create/manage route cards, track shipments |
| **Vendor** | View assigned trips, check-in materials |
| **Driver** | View assigned trips, update location |

## ✨ Features

- 🔐 **Authentication**: Email/Password + Google OAuth
- 📷 **Photo Uploads**: Attach photos to route cards
- 📊 **Route Card Management**: Create, edit, verify route cards
- 🗺️ **Live Location Tracking**: Real-time tracking on Google Maps
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔒 **Security**: Helmet, CORS, Rate Limiting, XSS Protection
- ✨ **Modern UI**: Smooth animations and glossy design

## 📁 Project Structure

```
steel_live/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context (Auth, Theme)
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   └── package.json
├── config/                # Database configuration
├── middleware/            # Auth & validation middleware
├── routes/                # API routes
├── sql/                   # Database schemas
├── uploads/               # File uploads
├── server.js             # Express server
├── .env                  # Environment variables
└── package.json          # Dependencies
```

## 🔧 Development Commands

```bash
# Backend
npm start          # Start production server
npm run dev        # Start with nodemon (auto-reload)

# Frontend
cd client
npm run dev        # Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build

# Both together
npm run dev:all    # Run backend + frontend concurrently
```

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/upload-picture` | Upload profile picture |
| PUT | `/api/user/change-password` | Change password |

### Route Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/route-cards` | Get all route cards |
| GET | `/api/user/route-cards/:id` | Get single route card |
| POST | `/api/user/route-cards` | Create route card |
| PUT | `/api/user/route-cards/:id` | Update route card |
| POST | `/api/user/route-cards/:id/upload-photo` | Upload photo |
| DELETE | `/api/user/route-cards/:id/delete-photo` | Delete photo |
| POST | `/api/user/route-cards/:id/verify` | Verify (admin only) |
| DELETE | `/api/user/route-cards/:id` | Delete (admin only) |

## 🔐 Google OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing
3. **Enable Google+ API**
4. **Configure OAuth Consent Screen**:
   - Select External user type
   - Add your email as test user
5. **Create OAuth 2.0 Credentials**:
   - Application type: Web application
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5173`
   - Authorized redirect URIs:
     - `http://localhost:3000`
     - `http://localhost:5173`
6. **Copy Client ID** and update `.env`

## 📝 Environment Variables

### Backend (`.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://steel_user:steel_pass@localhost:5432/steel_tracking
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-client-id
```

## 🛡️ Security Features

- ✅ Helmet security headers
- ✅ CORS protection (localhost only in dev)
- ✅ Rate limiting (100 req/15min, 5 login attempts)
- ✅ XSS protection (input sanitization)
- ✅ HPP protection (parameter pollution)
- ✅ JWT authentication
- ✅ bcrypt password hashing
- ✅ Input validation (express-validator)
- ✅ File upload size limits

## 🐛 Troubleshooting

**Database Connection Error:**
- Ensure PostgreSQL is running: `netstat -ano | findstr :5432`
- Check DATABASE_URL in `.env`
- Verify database exists: `psql -U steel_user -d steel_tracking`

**Google OAuth Not Working:**
- Verify Client ID matches Google Cloud Console
- Add your Google account as test user
- Clear browser cache and cookies

**Port Already in Use:**
- Change PORT in `.env` for backend
- Change port in `client/vite.config.js` for frontend

**Email Not Sending:**
- Use Gmail App Password (not regular password)
- Get it from: https://myaccount.google.com/apppasswords

## 📦 Build for Production

```bash
# Build frontend
cd client
npm run build

# Backend is ready to deploy
npm start
```

## 📄 License

MIT
