# Database Setup Guide for Steel Live

## Issue Found
The PostgreSQL database connection is failing because the password in `.env` doesn't match your PostgreSQL configuration.

## Quick Fix Options

### Option 1: Update `.env` with correct password
1. Find your PostgreSQL password (the one you set during installation)
2. Open `.env` file
3. Update this line with your actual password:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/steel_tracking
   ```
4. Replace `YOUR_PASSWORD` with your actual password

### Option 2: Reset PostgreSQL password (Windows)

1. **Open PowerShell as Administrator**

2. **Stop PostgreSQL service:**
   ```powershell
   net stop postgresql-x64-18
   ```
   (Replace `18` with your PostgreSQL version if different)

3. **Edit pg_hba.conf:**
   - Location: `C:\Program Files\PostgreSQL\<version>\data\pg_hba.conf`
   - Find lines with `host all all 127.0.0.1/32 scram-sha-256`
   - Change to `host all all 127.0.0.1/32 trust`
   - Save the file

4. **Start PostgreSQL service:**
   ```powershell
   net start postgresql-x64-18
   ```

5. **Set a new password:**
   ```powershell
   psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
   ```

6. **Revert pg_hba.conf changes:**
   - Change `trust` back to `scram-sha-256`
   - Save the file

7. **Restart PostgreSQL:**
   ```powershell
   net stop postgresql-x64-18
   net start postgresql-x64-18
   ```

8. **Update `.env` file:**
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/steel_tracking
   ```

### Option 3: Create database and user from scratch

1. **Open pgAdmin** (installed with PostgreSQL)
2. **Connect to PostgreSQL** (use your Windows password if prompted)
3. **Create database:**
   - Right-click on "Databases" → Create → Database
   - Name: `steel_tracking`
   - Owner: `postgres`
4. **Run the SQL scripts:**
   - Right-click on `steel_tracking` database → Query Tool
   - Copy contents from `sql/init_db.sql` and run
   - Copy contents from `route_cards.sql` and run

## Verify Connection

After fixing the password, run:
```bash
node test-db-direct.js
```

You should see:
```
✓ PostgreSQL connected successfully!
✓ Users table exists
✓ Route cards table exists
```

## Current .env Configuration
```
DATABASE_URL=postgresql://postgres:@localhost:5432/steel_tracking
```

**Note:** The current configuration has an empty password which PostgreSQL doesn't accept by default.
