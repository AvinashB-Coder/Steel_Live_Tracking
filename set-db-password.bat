@echo off
echo ============================================
echo Setting PostgreSQL Password
echo ============================================
echo.
echo This will set the password for PostgreSQL 'postgres' user
echo.

REM Set password using psql
"C:\Program Files\PostgreSQL\18\pgAdmin 4\runtime\psql.exe" -h localhost -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS! Password has been set to: postgres
    echo ============================================
    echo.
    echo The .env file is already configured with this password.
    echo.
    echo Now run: npm start
    echo.
) else (
    echo.
    echo ============================================
    echo FAILED! Could not set password.
    echo ============================================
    echo.
    echo Try these alternatives:
    echo.
    echo 1. Open pgAdmin 4 from Start Menu
    echo 2. Right-click on PostgreSQL server
    echo 3. Properties -^> Connection
    echo 4. Set password there
    echo.
)
pause
