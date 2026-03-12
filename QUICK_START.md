# 🚀 Steel Live - Final Setup Instructions

## ⚠️ IMPORTANT: Database Password Required

Your PostgreSQL is configured to require a password, but the `postgres` user doesn't have one set yet.

### Quick Fix (Recommended)

**Run the password setup script:**

1. **Double-click** `set-db-password.bat` in this folder
2. Press any key when prompted
3. The script will set the password to `postgres`

**OR manually run this command:**

```powershell
"C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe" -h localhost -d steel_tracking -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### After Setting the Password

The `.env` file is already configured with the correct settings:
```
DB_PASSWORD=postgres
```

## ✅ Verify Everything Works

**Test database connection:**
```bash
node test-db.js
```

You should see:
```
✅ Database connected successfully!
✅ Users table exists
✅ Route cards table exists
```

**Start the server:**
```bash
npm start
```

You should see:
```
========================================
🔒 Server running with security enabled
📍 Port: 5000
🌐 API: http://localhost:5000/api
========================================
✅ Database connected successfully
```

**Test the API:**
Open your browser and go to: http://localhost:5000/api/health

## 📁 Files Updated

| File | Change |
|------|--------|
| `.env` | Added `DB_PASSWORD=postgres` |
| `config/database.js` | Updated to use explicit connection params |
| `test-db.js` | Improved error messages and testing |
| `set-db-password.bat` | NEW - Script to set PostgreSQL password |

## 🐛 Troubleshooting

### If database connection still fails:

1. **Check PostgreSQL is running:**
   ```powershell
   netstat -ano | findstr :5432
   ```

2. **Verify database exists:**
   ```bash
   "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe" -h localhost -U postgres -d steel_tracking -c "\dt"
   ```

3. **Check tables exist:**
   Run the SQL scripts if tables are missing:
   ```bash
   "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe" -h localhost -U postgres -d steel_tracking -f sql\init_db.sql
   "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe" -h localhost -U postgres -d steel_tracking -f route_cards.sql
   ```

### If you want a different password:

1. Set new password:
   ```powershell
   "C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe" -h localhost -U postgres -c "ALTER USER postgres WITH PASSWORD 'your_new_password';"
   ```

2. Update `.env`:
   ```
   DB_PASSWORD=your_new_password
   ```

## 📞 Next Steps

1. ✅ Set PostgreSQL password (run `set-db-password.bat`)
2. ✅ Test database connection (`node test-db.js`)
3. ✅ Start the server (`npm start`)
4. ✅ Open http://localhost:5000/api/health in browser
5. ✅ Install and run frontend (`cd client && npm install && npm run dev`)

---

**Last Updated:** March 12, 2026
