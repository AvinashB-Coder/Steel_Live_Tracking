# 🚀 Steel Live - Deployment Guide & Issue Report

## 📊 Project Status Summary

### ✅ Working Features
- User Authentication (Login/Register/Google OAuth)
- Password Reset (Email configuration required)
- Profile Management (Photo upload working)
- Route Card Management (Create, Read, Update, Delete)
- Photo Upload for Route Cards
- Database Connection (PostgreSQL)
- Security Middleware (Helmet, CORS, Rate Limiting, XSS Protection)

### ⚠️ Issues Found (35 Total)

---

## 🔴 CRITICAL ISSUES (Must Fix Before Deployment)

### 1. Incomplete Route Card Management File
**File:** `client/src/pages/RouteCardManagement.jsx`
- File is truncated at line 697 of 886
- Missing: packing options, form submission buttons, modal closing logic
- **Impact:** Cannot create/edit route cards properly

### 2. Missing Backend API Endpoints
Frontend references these non-existent APIs:
- `/api/user/trips` - Trip management
- `/api/user/tools` - Tool management  
- `/api/user/users` - User list (for admin)

**Impact:** Dashboard pages show 404 errors

### 3. Hardcoded Sensitive Data
```javascript
// Found in client code:
const ADMIN_EMAIL = 'babuavinash2006@gmail.com';
const GOOGLE_CLIENT_ID = '756742317508-...';
const GOOGLE_MAPS_API_KEY = 'AIzaSyAmlOOh_...';
```
**Impact:** Security vulnerability - exposed in browser

### 4. Inconsistent Password Validation
- Frontend: min 6 characters
- Backend: min 8 characters with complexity
**Impact:** User confusion, registration failures

---

## 🟡 MEDIUM ISSUES (Should Fix)

### 5. Email Not Configured
```env
EMAIL_PASS=your-app-password-here
```
**Impact:** Password reset emails won't send

### 6. API Response Structure Inconsistent
```javascript
// auth.js: { success: true, token, user }
// user.js: { message: '...' }  // No success field
// routeCard.js: { success: true, routeCards: [...] }
```
**Impact:** Frontend error handling difficult

### 7. No Rate Limiting on Sensitive Endpoints
- Profile update
- Password change
- File upload
**Impact:** Vulnerable to brute force attacks

### 8. Database SSL Disabled
```javascript
ssl: false
```
**Impact:** Not secure for production

### 9. Multer Error Handler Mispositioned
**Files:** `routes/user.js`, `routes/routeCard.js`
**Impact:** File upload errors may not be caught properly

### 10. Console Logs with Sensitive Data
```javascript
console.log('Email:', email);
console.log('Password provided:', password ? 'Yes' : 'No');
```
**Impact:** Security risk in production

---

## 🟢 LOW PRIORITY (Nice to Have)

- Magic numbers should be in config
- Duplicate multer configuration
- Better file type validation
- Connection pool error recovery
- Pagination bug in route cards count

---

# 📦 DEPLOYMENT GUIDE

## Prerequisites

1. **Node.js** v18+ installed
2. **PostgreSQL** v14+ installed and running
3. **Google Cloud** account (for OAuth & Maps)
4. **Gmail** account with App Password (for emails)
5. **Domain name** (for production)

---

## Step 1: Prepare Production Environment

### Server Requirements
- **OS:** Linux (Ubuntu 20.04+) or Windows Server
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 10GB+ for application and uploads
- **Ports:** 80 (HTTP), 443 (HTTPS), 5432 (PostgreSQL)

### Install PostgreSQL (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Node.js (Ubuntu)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Step 2: Configure Environment Variables

### Create Production `.env` File

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://steel_user:STRONG_PASSWORD@localhost:5432/steel_tracking

# JWT Secret (Generate new one!)
JWT_SECRET=your_super_secure_64_character_random_string_here

# Google OAuth
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# Frontend URL (Your production domain)
FRONTEND_URL=https://yourdomain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
EMAIL_FROM=Lakshmi Vacuum Services <your_email@gmail.com>

# Google Maps API Key (Set restrictions!)
GOOGLE_MAPS_API_KEY=your_restricted_api_key

# Security
SESSION_SECRET=another_secure_random_string
CORS_ORIGINS=https://yourdomain.com
MAX_FILE_SIZE=5242880
MIN_PASSWORD_LENGTH=8

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generate Secure Secrets
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 3: Database Setup

### Create Database and User
```bash
sudo -u postgres psql

CREATE DATABASE steel_tracking;
CREATE USER steel_user WITH PASSWORD 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE steel_tracking TO steel_user;
\q
```

### Run SQL Scripts
```bash
# Copy SQL files to server
scp sql/*.sql user@yourserver:/path/to/steel_live/sql/

# Execute on server
psql -U steel_user -d steel_tracking -f sql/init_db.sql
psql -U steel_user -d steel_tracking -f sql/route_cards.sql
```

### Enable SSL for Database (Production)
Edit `config/database.js`:
```javascript
const pool = new Pool({
  // ... other config
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem').toString()
  } : false
});
```

---

## Step 4: Backend Deployment

### Install Dependencies
```bash
cd /path/to/steel_live
npm install --production
```

### Build Frontend
```bash
cd client
npm install
npm run build
```

### Configure Nginx as Reverse Proxy

Install Nginx:
```bash
sudo apt install nginx
```

Create Nginx config `/etc/nginx/sites-available/steel_live`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (static files)
    location / {
        root /path/to/steel_live/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
        proxy_set_header Host $host;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/steel_live /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup PM2 for Process Management

Install PM2:
```bash
sudo npm install -g pm2
```

Start application:
```bash
cd /path/to/steel_live
pm2 start server.js --name steel-live-api
pm2 save
pm2 startup
```

### Enable HTTPS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Step 5: Frontend Configuration

### Update `client/vite.config.js` for Production
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
```

### Create `client/.env.production`
```env
VITE_API_URL=https://yourdomain.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Step 6: Google Cloud Configuration

### Update OAuth Consent Screen
1. Go to https://console.cloud.google.com/
2. Add production domain to authorized domains
3. Add production URLs to authorized redirect URIs:
   - `https://yourdomain.com`
   - `https://yourdomain.com/dashboard`

### Restrict API Keys
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit Google Maps API Key
3. Set HTTP referrer restrictions:
   - `yourdomain.com/*`
   - `www.yourdomain.com/*`

---

## Step 7: Security Hardening

### Firewall Configuration (Ubuntu)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (restrict to localhost if possible)
sudo ufw enable
```

### PostgreSQL Security
Edit `pg_hba.conf`:
```
# Only allow local connections
host    steel_tracking    steel_user    127.0.0.1/32    scram-sha-256
host    steel_tracking    steel_user    ::1/128         scram-sha-256
```

### File Permissions
```bash
# Set proper permissions
chown -R www-data:www-data /path/to/steel_live/uploads
chmod -R 755 /path/to/steel_live/uploads
chmod 600 /path/to/steel_live/.env
```

---

## Step 8: Testing

### Pre-Deployment Checklist
- [ ] Database connection working
- [ ] All API endpoints responding
- [ ] File uploads working
- [ ] Google OAuth working
- [ ] Email sending working
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] Backups configured

### Test Commands
```bash
# Health check
curl https://yourdomain.com/api/health

# Test login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test file upload
curl -X PUT https://yourdomain.com/api/user/upload-picture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profilePicture=@test.jpg"
```

---

## Step 9: Monitoring & Maintenance

### Setup Log Rotation
Create `/etc/logrotate.d/steel_live`:
```
/path/to/steel_live/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    postrotate
        pm2 reload steel-live-api
    endscript
}
```

### Database Backups
Create backup script `/usr/local/bin/backup_db.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U steel_user steel_tracking > /backups/steel_tracking_$DATE.sql
find /backups -name "steel_tracking_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /usr/local/bin/backup_db.sh
```

### PM2 Monitoring
```bash
pm2 monit          # Real-time monitoring
pm2 logs           # View logs
pm2 restart all    # Restart all apps
```

---

## Step 10: Post-Deployment

### Update DNS
Point your domain to server IP:
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 3600
```

### SSL Certificate Auto-Renewal
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Auto-renewal is already configured in cron
```

### Performance Optimization
1. Enable gzip compression in Nginx
2. Configure browser caching
3. Use CDN for static assets
4. Optimize database queries
5. Enable connection pooling

---

## 📋 Quick Deployment Checklist

```
□ Server provisioned and secured
□ PostgreSQL installed and configured
□ Node.js installed
□ Database and user created
□ SQL scripts executed
□ Environment variables configured
□ Google OAuth configured for production
□ Google Maps API key restricted
□ Backend dependencies installed
□ Frontend built
□ Nginx configured
□ SSL certificate installed
□ Firewall configured
□ PM2 setup
□ Backups configured
□ Monitoring enabled
□ All tests passing
```

---

## 🆘 Troubleshooting

### Server Won't Start
```bash
# Check logs
pm2 logs steel-live-api

# Check port availability
netstat -tulpn | grep :5000

# Check database connection
psql -U steel_user -d steel_tracking -c "SELECT 1"
```

### 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check Nginx config
sudo nginx -t

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

### Database Connection Errors
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 📞 Support

For issues:
1. Check logs: `pm2 logs`
2. Review error messages in browser console
3. Verify environment variables
4. Test database connection
5. Check Nginx error logs: `/var/log/nginx/error.log`

---

**Deployment Guide Version:** 1.0
**Last Updated:** March 12, 2026
**Recommended Deployment Time:** 2-4 hours
