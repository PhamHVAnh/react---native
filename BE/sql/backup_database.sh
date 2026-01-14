#!/bin/bash

# =====================================================
# DATABASE BACKUP SCRIPT - E-COMMERCE SYSTEM
# =====================================================

# Configuration
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="btl_mb"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="database_backup_${TIMESTAMP}.sql"
DATA_EXPORT_FILE="data_export_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}DATABASE BACKUP SCRIPT - E-COMMERCE SYSTEM${NC}"
echo -e "${GREEN}=====================================================${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to check if MySQL is running
check_mysql() {
    if ! command -v mysql &> /dev/null; then
        echo -e "${RED}Error: MySQL client is not installed or not in PATH${NC}"
        exit 1
    fi
    
    if ! mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null; then
        echo -e "${RED}Error: Cannot connect to MySQL database${NC}"
        echo -e "${YELLOW}Please check your database credentials and ensure MySQL is running${NC}"
        exit 1
    fi
}

# Function to create full database backup
create_full_backup() {
    echo -e "${YELLOW}Creating full database backup...${NC}"
    
    mysqldump -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --add-drop-database \
        --add-drop-table \
        --add-locks \
        --disable-keys \
        --extended-insert \
        --lock-tables=false \
        --quick \
        --set-charset \
        "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Full database backup created: $BACKUP_DIR/$BACKUP_FILE${NC}"
    else
        echo -e "${RED}Error creating full database backup${NC}"
        exit 1
    fi
}

# Function to export data only
export_data() {
    echo -e "${YELLOW}Exporting data only...${NC}"
    
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < export_data.sql > "$BACKUP_DIR/$DATA_EXPORT_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Data export created: $BACKUP_DIR/$DATA_EXPORT_FILE${NC}"
    else
        echo -e "${RED}Error creating data export${NC}"
        exit 1
    fi
}

# Function to create structure-only backup
create_structure_backup() {
    echo -e "${YELLOW}Creating structure-only backup...${NC}"
    
    mysqldump -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" \
        --no-data \
        --routines \
        --triggers \
        --events \
        --add-drop-database \
        --add-drop-table \
        "$DB_NAME" > "$BACKUP_DIR/structure_${TIMESTAMP}.sql"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Structure backup created: $BACKUP_DIR/structure_${TIMESTAMP}.sql${NC}"
    else
        echo -e "${RED}Error creating structure backup${NC}"
        exit 1
    fi
}

# Function to compress backup files
compress_backups() {
    echo -e "${YELLOW}Compressing backup files...${NC}"
    
    cd "$BACKUP_DIR"
    tar -czf "backup_${TIMESTAMP}.tar.gz" *.sql
    rm -f *.sql
    
    echo -e "${GREEN}Compressed backup created: backup_${TIMESTAMP}.tar.gz${NC}"
    cd - > /dev/null
}

# Function to show backup information
show_backup_info() {
    echo -e "${GREEN}=====================================================${NC}"
    echo -e "${GREEN}BACKUP COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}=====================================================${NC}"
    echo -e "${YELLOW}Backup Directory: $BACKUP_DIR${NC}"
    echo -e "${YELLOW}Timestamp: $TIMESTAMP${NC}"
    echo -e "${YELLOW}Files created:${NC}"
    ls -la "$BACKUP_DIR"/*"$TIMESTAMP"* 2>/dev/null || echo "No files found"
}

# Main execution
main() {
    # Check if MySQL is available
    check_mysql
    
    # Parse command line arguments
    case "${1:-full}" in
        "full")
            create_full_backup
            ;;
        "data")
            export_data
            ;;
        "structure")
            create_structure_backup
            ;;
        "all")
            create_full_backup
            export_data
            create_structure_backup
            ;;
        "compress")
            create_full_backup
            compress_backups
            ;;
        *)
            echo -e "${YELLOW}Usage: $0 [full|data|structure|all|compress]${NC}"
            echo -e "${YELLOW}  full      - Create full database backup (default)${NC}"
            echo -e "${YELLOW}  data      - Export data only${NC}"
            echo -e "${YELLOW}  structure - Create structure-only backup${NC}"
            echo -e "${YELLOW}  all       - Create all types of backups${NC}"
            echo -e "${YELLOW}  compress  - Create full backup and compress it${NC}"
            exit 1
            ;;
    esac
    
    show_backup_info
}

# Run main function
main "$@"
