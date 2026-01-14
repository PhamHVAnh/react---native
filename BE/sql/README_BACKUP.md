# Database Backup System - E-Commerce Platform

## Tổng quan
Hệ thống backup database cho dự án BTL-MB (E-commerce platform) bao gồm:
- Script backup toàn bộ database
- Script export dữ liệu
- Script tự động hóa backup
- Hướng dẫn restore database

## Cấu trúc Files

```
BE/sql/
├── database_backup.sql          # Script backup toàn bộ database
├── export_data.sql             # Script export dữ liệu
├── backup_database.sh          # Script backup cho Linux/Mac
├── backup_database.bat         # Script backup cho Windows
├── payment_tables.sql          # Cấu trúc bảng thanh toán
├── wishlist_table.sql          # Cấu trúc bảng yêu thích
├── warranty_auto_trigger.sql  # Trigger tự động bảo hành
└── README_BACKUP.md           # Hướng dẫn này
```

## Các bảng trong Database

### Bảng chính:
- **NguoiDung**: Thông tin người dùng (Admin, Khách hàng)
- **DanhMuc**: Danh mục sản phẩm
- **SanPham**: Thông tin sản phẩm
- **DonHang**: Đơn hàng
- **ChiTietDonHang**: Chi tiết đơn hàng
- **KhuyenMai**: Khuyến mãi
- **BaoHanh**: Bảo hành sản phẩm
- **TonKho**: Tồn kho
- **GiaoDichKho**: Giao dịch kho
- **GioHang**: Giỏ hàng
- **YeuThich**: Danh sách yêu thích

### Bảng thanh toán:
- **PaymentTransactions**: Giao dịch thanh toán
- **PaymentConfig**: Cấu hình thanh toán

## Cách sử dụng

### 1. Backup toàn bộ database

#### Linux/Mac:
```bash
# Cấp quyền thực thi
chmod +x backup_database.sh

# Backup toàn bộ database
./backup_database.sh full

# Backup và nén file
./backup_database.sh compress
```

#### Windows:
```cmd
# Backup toàn bộ database
backup_database.bat full

# Backup và nén file
backup_database.bat compress
```

### 2. Export chỉ dữ liệu

#### Linux/Mac:
```bash
./backup_database.sh data
```

#### Windows:
```cmd
backup_database.bat data
```

### 3. Backup chỉ cấu trúc

#### Linux/Mac:
```bash
./backup_database.sh structure
```

#### Windows:
```cmd
backup_database.bat structure
```

### 4. Backup tất cả (full + data + structure)

#### Linux/Mac:
```bash
./backup_database.sh all
```

#### Windows:
```cmd
backup_database.bat all
```

## Cấu hình Database

Trước khi chạy backup, cần cấu hình thông tin database trong script:

### Linux/Mac (backup_database.sh):
```bash
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="your_password"
DB_NAME="btl_mb"
```

### Windows (backup_database.bat):
```cmd
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=your_password
set DB_NAME=btl_mb
```

## Restore Database

### 1. Tạo database mới:
```sql
CREATE DATABASE btl_mb_new;
USE btl_mb_new;
```

### 2. Restore từ backup:
```bash
# Linux/Mac
mysql -u root -p btl_mb_new < backups/database_backup_YYYYMMDD_HHMMSS.sql

# Windows
mysql -u root -p btl_mb_new < backups\database_backup_YYYYMMDD_HHMMSS.sql
```

### 3. Restore từ file nén:
```bash
# Giải nén
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# Restore
mysql -u root -p btl_mb_new < database_backup_YYYYMMDD_HHMMSS.sql
```

## Lịch trình Backup tự động

### Linux/Mac (Cron):
```bash
# Mở crontab
crontab -e

# Thêm dòng sau để backup hàng ngày lúc 2:00 AM
0 2 * * * /path/to/backup_database.sh compress

# Backup hàng tuần vào Chủ nhật lúc 3:00 AM
0 3 * * 0 /path/to/backup_database.sh all
```

### Windows (Task Scheduler):
1. Mở Task Scheduler
2. Tạo task mới
3. Cấu hình trigger (thời gian)
4. Cấu hình action: chạy `backup_database.bat compress`

## Kiểm tra Backup

### 1. Kiểm tra file backup:
```bash
# Kiểm tra kích thước file
ls -lh backups/

# Kiểm tra nội dung file
head -20 backups/database_backup_YYYYMMDD_HHMMSS.sql
```

### 2. Kiểm tra database sau restore:
```sql
-- Kiểm tra số lượng bảng
SHOW TABLES;

-- Kiểm tra số lượng records
SELECT 
    'NguoiDung' as table_name, COUNT(*) as count FROM NguoiDung
UNION ALL
SELECT 'SanPham', COUNT(*) FROM SanPham
UNION ALL
SELECT 'DonHang', COUNT(*) FROM DonHang
UNION ALL
SELECT 'ChiTietDonHang', COUNT(*) FROM ChiTietDonHang;

-- Kiểm tra triggers
SHOW TRIGGERS;
```

## Troubleshooting

### Lỗi kết nối database:
```
Error: Cannot connect to MySQL database
```
**Giải pháp:**
- Kiểm tra MySQL service đang chạy
- Kiểm tra thông tin kết nối (host, user, password)
- Kiểm tra quyền truy cập database

### Lỗi không tìm thấy file:
```
Error: export_data.sql not found
```
**Giải pháp:**
- Đảm bảo chạy script từ thư mục `BE/sql/`
- Kiểm tra file `export_data.sql` tồn tại

### Lỗi quyền truy cập:
```
Permission denied
```
**Giải pháp:**
- Cấp quyền thực thi: `chmod +x backup_database.sh`
- Chạy với quyền admin nếu cần

## Bảo mật

### 1. Bảo vệ file backup:
```bash
# Cấp quyền chỉ cho owner
chmod 600 backups/*.sql

# Mã hóa file backup
gpg --symmetric --cipher-algo AES256 database_backup.sql
```

### 2. Xóa file backup cũ:
```bash
# Xóa file backup cũ hơn 30 ngày
find backups/ -name "*.sql" -mtime +30 -delete
find backups/ -name "*.tar.gz" -mtime +30 -delete
```

## Monitoring

### 1. Log backup:
```bash
# Thêm logging vào script
./backup_database.sh full >> backup.log 2>&1
```

### 2. Kiểm tra disk space:
```bash
# Kiểm tra dung lượng ổ cứng
df -h

# Kiểm tra dung lượng thư mục backup
du -sh backups/
```

## Liên hệ

Nếu gặp vấn đề với hệ thống backup, vui lòng:
1. Kiểm tra log file
2. Xem lại cấu hình database
3. Liên hệ team phát triển

---
**Lưu ý:** Luôn test restore trên môi trường development trước khi áp dụng trên production.
