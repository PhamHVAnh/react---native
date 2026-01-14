@echo off
REM =====================================================
REM DATABASE BACKUP SCRIPT - E-COMMERCE SYSTEM (Windows)
REM =====================================================

REM Configuration
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=quanlydienmay
set BACKUP_DIR=.\backups
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=database_backup_%TIMESTAMP%.sql
set DATA_EXPORT_FILE=data_export_%TIMESTAMP%.sql

echo =====================================================
echo DATABASE BACKUP SCRIPT - E-COMMERCE SYSTEM
echo =====================================================

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Function to check if MySQL is available
:check_mysql
mysql -h"%DB_HOST%" -u"%DB_USER%" -p"%DB_PASSWORD%" -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo Error: Cannot connect to MySQL database
    echo Please check your database credentials and ensure MySQL is running
    pause
    exit /b 1
)

REM Function to create full database backup
:create_full_backup
echo Creating full database backup...
mysqldump -h"%DB_HOST%" -u"%DB_USER%" -p"%DB_PASSWORD%" ^
    --single-transaction ^
    --routines ^
    --triggers ^
    --events ^
    --add-drop-database ^
    --add-drop-table ^
    --add-locks ^
    --disable-keys ^
    --extended-insert ^
    --lock-tables=false ^
    --quick ^
    --set-charset ^
    "%DB_NAME%" > "%BACKUP_DIR%\%BACKUP_FILE%"

if errorlevel 1 (
    echo Error creating full database backup
    pause
    exit /b 1
) else (
    echo Full database backup created: %BACKUP_DIR%\%BACKUP_FILE%
)

REM Function to export data only
:export_data
echo Exporting data only...
mysql -h"%DB_HOST%" -u"%DB_USER%" -p"%DB_PASSWORD%" "%DB_NAME%" < export_data.sql > "%BACKUP_DIR%\%DATA_EXPORT_FILE%"

if errorlevel 1 (
    echo Error creating data export
    pause
    exit /b 1
) else (
    echo Data export created: %BACKUP_DIR%\%DATA_EXPORT_FILE%
)

REM Function to create structure-only backup
:create_structure_backup
echo Creating structure-only backup...
mysqldump -h"%DB_HOST%" -u"%DB_USER%" -p"%DB_PASSWORD%" ^
    --no-data ^
    --routines ^
    --triggers ^
    --events ^
    --add-drop-database ^
    --add-drop-table ^
    "%DB_NAME%" > "%BACKUP_DIR%\structure_%TIMESTAMP%.sql"

if errorlevel 1 (
    echo Error creating structure backup
    pause
    exit /b 1
) else (
    echo Structure backup created: %BACKUP_DIR%\structure_%TIMESTAMP%.sql
)

REM Function to compress backup files
:compress_backups
echo Compressing backup files...
cd "%BACKUP_DIR%"
tar -czf "backup_%TIMESTAMP%.tar.gz" *.sql
del *.sql
echo Compressed backup created: backup_%TIMESTAMP%.tar.gz
cd ..

REM Function to show backup information
:show_backup_info
echo =====================================================
echo BACKUP COMPLETED SUCCESSFULLY
echo =====================================================
echo Backup Directory: %BACKUP_DIR%
echo Timestamp: %TIMESTAMP%
echo Files created:
dir "%BACKUP_DIR%\*%TIMESTAMP%*" 2>nul

REM Main execution
:main
REM Check if MySQL is available
call :check_mysql

REM Parse command line arguments
if "%1"=="full" goto create_full_backup
if "%1"=="data" goto export_data
if "%1"=="structure" goto create_structure_backup
if "%1"=="all" (
    call :create_full_backup
    call :export_data
    call :create_structure_backup
    goto show_backup_info
)
if "%1"=="compress" (
    call :create_full_backup
    call :compress_backups
    goto show_backup_info
)

REM Default to full backup if no argument provided
if "%1"=="" goto create_full_backup

REM Show usage if invalid argument
echo Usage: %0 [full^|data^|structure^|all^|compress]
echo   full      - Create full database backup (default)
echo   data      - Export data only
echo   structure - Create structure-only backup
echo   all       - Create all types of backups
echo   compress  - Create full backup and compress it
pause
exit /b 1

REM Run main function
call :main %1
