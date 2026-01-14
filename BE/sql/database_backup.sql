-- =====================================================
-- BACKUP DATABASE - E-COMMERCE SYSTEM
-- Generated: 2024
-- Description: Complete database backup for BTL-MB e-commerce system
-- =====================================================

-- Disable foreign key checks during restore
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. MAIN TABLES STRUCTURE
-- =====================================================

-- Bảng người dùng
CREATE TABLE IF NOT EXISTS NguoiDung (
    UserID CHAR(36) PRIMARY KEY,
    HoTen VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    SoDienThoai VARCHAR(20),
    DiaChi TEXT,
    MatKhau VARCHAR(255) NOT NULL,
    VaiTro ENUM('Admin', 'KhachHang') DEFAULT 'KhachHang',
    TrangThai ENUM('Active', 'Inactive', 'Banned') DEFAULT 'Active',
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (Email),
    INDEX idx_so_dien_thoai (SoDienThoai),
    INDEX idx_vai_tro (VaiTro),
    INDEX idx_trang_thai (TrangThai)
);

-- Bảng danh mục sản phẩm
CREATE TABLE IF NOT EXISTS DanhMuc (
    DanhMucID CHAR(36) PRIMARY KEY,
    TenDanhMuc VARCHAR(255) NOT NULL,
    MoTa TEXT,
    HinhAnh VARCHAR(500),
    TrangThai ENUM('Active', 'Inactive') DEFAULT 'Active',
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ten_danh_muc (TenDanhMuc),
    INDEX idx_trang_thai (TrangThai)
);

-- Bảng sản phẩm
CREATE TABLE IF NOT EXISTS SanPham (
    SanPhamID CHAR(36) PRIMARY KEY,
    TenSanPham VARCHAR(255) NOT NULL,
    MoTa TEXT,
    GiaGoc DECIMAL(15,2) NOT NULL,
    GiamGia DECIMAL(5,2) DEFAULT 0,
    GiaBan DECIMAL(15,2) GENERATED ALWAYS AS (GiaGoc * (1 - GiamGia/100)) STORED,
    HinhAnh JSON,
    ThuocTinh JSON,
    DanhMucID CHAR(36),
    BaoHanhThang INT DEFAULT 0,
    TrangThai ENUM('Active', 'Inactive', 'OutOfStock') DEFAULT 'Active',
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (DanhMucID) REFERENCES DanhMuc(DanhMucID) ON DELETE SET NULL,
    INDEX idx_ten_san_pham (TenSanPham),
    INDEX idx_gia_ban (GiaBan),
    INDEX idx_danh_muc (DanhMucID),
    INDEX idx_trang_thai (TrangThai),
    INDEX idx_ngay_tao (NgayTao)
);

-- Bảng đơn hàng
CREATE TABLE IF NOT EXISTS DonHang (
    DonHangID CHAR(36) PRIMARY KEY,
    KhachHangID CHAR(36) NOT NULL,
    NgayDat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TrangThai ENUM('ChuaXuLy', 'DangGiao', 'HoanThanh', 'Huy') DEFAULT 'ChuaXuLy',
    TongTien DECIMAL(15,2) NOT NULL,
    KhuyenMaiID CHAR(36),
    GiamGia DECIMAL(15,2) DEFAULT 0,
    PhuongThucThanhToan ENUM('COD', 'ViDienTu', 'TheNganHang') DEFAULT 'COD',
    ThanhTien DECIMAL(15,2) NOT NULL,
    DiaChiGiaoHang TEXT,
    GhiChu TEXT,
    PaymentStatus ENUM('UNPAID', 'PAID', 'REFUNDED') DEFAULT 'UNPAID',
    PaymentMethod VARCHAR(50),
    PaymentTransactionRef VARCHAR(100),
    FOREIGN KEY (KhachHangID) REFERENCES NguoiDung(UserID) ON DELETE CASCADE,
    FOREIGN KEY (KhuyenMaiID) REFERENCES KhuyenMai(KhuyenMaiID) ON DELETE SET NULL,
    INDEX idx_khach_hang (KhachHangID),
    INDEX idx_ngay_dat (NgayDat),
    INDEX idx_trang_thai (TrangThai),
    INDEX idx_payment_status (PaymentStatus),
    INDEX idx_payment_method (PaymentMethod)
);

-- Bảng chi tiết đơn hàng
CREATE TABLE IF NOT EXISTS ChiTietDonHang (
    ChiTietID CHAR(36) PRIMARY KEY,
    DonHangID CHAR(36) NOT NULL,
    SanPhamID CHAR(36) NOT NULL,
    SoLuong INT NOT NULL,
    Gia DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (DonHangID) REFERENCES DonHang(DonHangID) ON DELETE CASCADE,
    FOREIGN KEY (SanPhamID) REFERENCES SanPham(SanPhamID) ON DELETE CASCADE,
    INDEX idx_don_hang (DonHangID),
    INDEX idx_san_pham (SanPhamID)
);

-- Bảng khuyến mãi
CREATE TABLE IF NOT EXISTS KhuyenMai (
    KhuyenMaiID CHAR(36) PRIMARY KEY,
    MaKhuyenMai VARCHAR(50) UNIQUE NOT NULL,
    TenKhuyenMai VARCHAR(255) NOT NULL,
    MoTa TEXT,
    PhanTramGiam DECIMAL(5,2) NOT NULL,
    GiaTriGiam DECIMAL(15,2),
    GiaTriToiThieu DECIMAL(15,2),
    GiaTriToiDa DECIMAL(15,2),
    NgayBatDau TIMESTAMP NOT NULL,
    NgayKetThuc TIMESTAMP NOT NULL,
    SoLuongSuDung INT DEFAULT 0,
    GioiHanSuDung INT,
    TrangThai ENUM('Active', 'Inactive', 'Expired') DEFAULT 'Active',
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ma_khuyen_mai (MaKhuyenMai),
    INDEX idx_ngay_bat_dau (NgayBatDau),
    INDEX idx_ngay_ket_thuc (NgayKetThuc),
    INDEX idx_trang_thai (TrangThai)
);

-- Bảng bảo hành
CREATE TABLE IF NOT EXISTS BaoHanh (
    BaoHanhID CHAR(36) PRIMARY KEY,
    ChiTietID CHAR(36) NOT NULL,
    SanPhamID CHAR(36) NOT NULL,
    KhachHangID CHAR(36) NOT NULL,
    NgayMua TIMESTAMP NOT NULL,
    HanBaoHanh TIMESTAMP NOT NULL,
    TrangThai ENUM('ConHan', 'HetHan', 'DangSua', 'YeuCau') DEFAULT 'ConHan',
    GhiChu TEXT,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ChiTietID) REFERENCES ChiTietDonHang(ChiTietID) ON DELETE CASCADE,
    FOREIGN KEY (SanPhamID) REFERENCES SanPham(SanPhamID) ON DELETE CASCADE,
    FOREIGN KEY (KhachHangID) REFERENCES NguoiDung(UserID) ON DELETE CASCADE,
    INDEX idx_chi_tiet (ChiTietID),
    INDEX idx_san_pham (SanPhamID),
    INDEX idx_khach_hang (KhachHangID),
    INDEX idx_han_bao_hanh (HanBaoHanh),
    INDEX idx_trang_thai (TrangThai)
);

-- Bảng tồn kho
CREATE TABLE IF NOT EXISTS TonKho (
    TonKhoID CHAR(36) PRIMARY KEY,
    SanPhamID CHAR(36) NOT NULL,
    SoLuongTon INT NOT NULL DEFAULT 0,
    SoLuongNhap INT DEFAULT 0,
    SoLuongXuat INT DEFAULT 0,
    NgayCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (SanPhamID) REFERENCES SanPham(SanPhamID) ON DELETE CASCADE,
    UNIQUE KEY unique_san_pham (SanPhamID),
    INDEX idx_so_luong_ton (SoLuongTon)
);

-- Bảng giao dịch kho
CREATE TABLE IF NOT EXISTS GiaoDichKho (
    GiaoDichID CHAR(36) PRIMARY KEY,
    SanPhamID CHAR(36) NOT NULL,
    LoaiGiaoDich ENUM('Nhap', 'Xuat', 'TraHang', 'BaoHanh') NOT NULL,
    SoLuong INT NOT NULL,
    GhiChu TEXT,
    DonHangID CHAR(36),
    NgayGiaoDich TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SanPhamID) REFERENCES SanPham(SanPhamID) ON DELETE CASCADE,
    FOREIGN KEY (DonHangID) REFERENCES DonHang(DonHangID) ON DELETE SET NULL,
    INDEX idx_san_pham (SanPhamID),
    INDEX idx_loai_giao_dich (LoaiGiaoDich),
    INDEX idx_ngay_giao_dich (NgayGiaoDich)
);

-- Bảng giỏ hàng
CREATE TABLE IF NOT EXISTS GioHang (
    GioHangID CHAR(36) PRIMARY KEY,
    KhachHangID CHAR(36) NOT NULL,
    SanPhamID CHAR(36) NOT NULL,
    SoLuong INT NOT NULL DEFAULT 1,
    NgayThem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (KhachHangID) REFERENCES NguoiDung(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SanPhamID) REFERENCES SanPham(SanPhamID) ON DELETE CASCADE,
    UNIQUE KEY unique_gio_hang (KhachHangID, SanPhamID),
    INDEX idx_khach_hang (KhachHangID),
    INDEX idx_san_pham (SanPhamID)
);

-- Bảng yêu thích (wishlist)
CREATE TABLE IF NOT EXISTS YeuThich (
    YeuThichID CHAR(36) PRIMARY KEY,
    KhachHangID CHAR(36) NOT NULL,
    SanPhamID CHAR(36) NOT NULL,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (KhachHangID) REFERENCES NguoiDung(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SanPhamID) REFERENCES SanPham(SanPhamID) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist (KhachHangID, SanPhamID),
    INDEX idx_yeuthich_khachhang (KhachHangID),
    INDEX idx_yeuthich_sanpham (SanPhamID),
    INDEX idx_yeuthich_ngaytao (NgayTao)
);

-- =====================================================
-- 2. PAYMENT TABLES
-- =====================================================

-- Bảng giao dịch thanh toán
CREATE TABLE IF NOT EXISTS PaymentTransactions (
    PaymentID VARCHAR(36) PRIMARY KEY,
    OrderID VARCHAR(36) NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    Status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    PaymentProvider VARCHAR(50) NOT NULL,
    TransactionRef VARCHAR(100) NOT NULL,
    PaymentUrl TEXT,
    QRCode TEXT,
    QRContent TEXT,
    BankCode VARCHAR(10),
    CustomerInfo JSON,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES DonHang(DonHangID) ON DELETE CASCADE,
    INDEX idx_order_id (OrderID),
    INDEX idx_transaction_ref (TransactionRef),
    INDEX idx_status (Status),
    INDEX idx_created_at (CreatedAt)
);

-- Bảng cấu hình thanh toán
CREATE TABLE IF NOT EXISTS PaymentConfig (
    ConfigID INT AUTO_INCREMENT PRIMARY KEY,
    Provider VARCHAR(50) NOT NULL,
    ConfigKey VARCHAR(100) NOT NULL,
    ConfigValue TEXT,
    IsEncrypted BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_provider_key (Provider, ConfigKey)
);

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Trigger tự động tạo bảo hành khi đơn hàng hoàn thành
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS auto_create_warranty
AFTER UPDATE ON DonHang
FOR EACH ROW
BEGIN
    -- Chỉ chạy khi trạng thái thay đổi thành 'HoanThanh'
    IF NEW.TrangThai = 'HoanThanh' AND OLD.TrangThai != 'HoanThanh' THEN
        
        -- Tạo bảo hành cho tất cả sản phẩm trong đơn hàng có thời hạn bảo hành
        INSERT INTO BaoHanh (BaoHanhID, ChiTietID, SanPhamID, KhachHangID, NgayMua, HanBaoHanh, TrangThai)
        SELECT 
            UUID() as BaoHanhID,
            ct.ChiTietID,
            ct.SanPhamID,
            NEW.KhachHangID,
            NEW.NgayDat as NgayMua,
            DATE_ADD(NEW.NgayDat, INTERVAL sp.BaoHanhThang MONTH) as HanBaoHanh,
            'ConHan' as TrangThai
        FROM ChiTietDonHang ct
        JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
        WHERE ct.DonHangID = NEW.DonHangID 
            AND sp.BaoHanhThang > 0
            AND NOT EXISTS (
                -- Không tạo trùng lặp
                SELECT 1 FROM BaoHanh bh WHERE bh.ChiTietID = ct.ChiTietID
            );
            
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 4. DATA EXPORT STATEMENTS
-- =====================================================

-- Export NguoiDung data
-- INSERT INTO NguoiDung (UserID, HoTen, Email, SoDienThoai, DiaChi, MatKhau, VaiTro, TrangThai, NgayTao, NgayCapNhat) VALUES
-- ('user-uuid-1', 'Admin User', 'admin@example.com', '0123456789', '123 Admin St', 'hashed_password', 'Admin', 'Active', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- ('user-uuid-2', 'Customer User', 'customer@example.com', '0987654321', '456 Customer St', 'hashed_password', 'KhachHang', 'Active', '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Export DanhMuc data
-- INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, HinhAnh, TrangThai, NgayTao, NgayCapNhat) VALUES
-- ('category-uuid-1', 'Electronics', 'Electronic devices and gadgets', 'electronics.jpg', 'Active', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- ('category-uuid-2', 'Clothing', 'Fashion and clothing items', 'clothing.jpg', 'Active', '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Export SanPham data
-- INSERT INTO SanPham (SanPhamID, TenSanPham, MoTa, GiaGoc, GiamGia, HinhAnh, ThuocTinh, DanhMucID, BaoHanhThang, TrangThai, NgayTao, NgayCapNhat) VALUES
-- ('product-uuid-1', 'Smartphone', 'Latest smartphone model', 10000000.00, 10.00, '["phone1.jpg", "phone2.jpg"]', '{"color": "black", "storage": "128GB"}', 'category-uuid-1', 12, 'Active', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- ('product-uuid-2', 'T-Shirt', 'Cotton t-shirt', 200000.00, 5.00, '["shirt1.jpg"]', '{"size": "M", "color": "blue"}', 'category-uuid-2', 0, 'Active', '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Export DonHang data
-- INSERT INTO DonHang (DonHangID, KhachHangID, NgayDat, TrangThai, TongTien, KhuyenMaiID, GiamGia, PhuongThucThanhToan, ThanhTien, DiaChiGiaoHang, GhiChu, PaymentStatus, PaymentMethod, PaymentTransactionRef) VALUES
-- ('order-uuid-1', 'user-uuid-2', '2024-01-15 10:30:00', 'HoanThanh', 9000000.00, NULL, 0.00, 'COD', 9000000.00, '456 Customer St', 'Please deliver carefully', 'PAID', 'COD', NULL),
-- ('order-uuid-2', 'user-uuid-2', '2024-01-16 14:20:00', 'DangGiao', 180000.00, NULL, 0.00, 'ViDienTu', 180000.00, '456 Customer St', 'Fast delivery', 'PAID', 'MOMO', 'MOMO_REF_123');

-- Export ChiTietDonHang data
-- INSERT INTO ChiTietDonHang (ChiTietID, DonHangID, SanPhamID, SoLuong, Gia) VALUES
-- ('detail-uuid-1', 'order-uuid-1', 'product-uuid-1', 1, 9000000.00),
-- ('detail-uuid-2', 'order-uuid-2', 'product-uuid-2', 1, 180000.00);

-- Export KhuyenMai data
-- INSERT INTO KhuyenMai (KhuyenMaiID, MaKhuyenMai, TenKhuyenMai, MoTa, PhanTramGiam, GiaTriGiam, GiaTriToiThieu, GiaTriToiDa, NgayBatDau, NgayKetThuc, SoLuongSuDung, GioiHanSuDung, TrangThai, NgayTao, NgayCapNhat) VALUES
-- ('promo-uuid-1', 'WELCOME10', 'Welcome Discount', '10% off for new customers', 10.00, NULL, 100000.00, 1000000.00, '2024-01-01 00:00:00', '2024-12-31 23:59:59', 0, 100, 'Active', '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- Export BaoHanh data
-- INSERT INTO BaoHanh (BaoHanhID, ChiTietID, SanPhamID, KhachHangID, NgayMua, HanBaoHanh, TrangThai, GhiChu, NgayTao, NgayCapNhat) VALUES
-- ('warranty-uuid-1', 'detail-uuid-1', 'product-uuid-1', 'user-uuid-2', '2024-01-15 10:30:00', '2025-01-15 10:30:00', 'ConHan', 'Standard warranty', '2024-01-15 10:30:00', '2024-01-15 10:30:00');

-- Export TonKho data
-- INSERT INTO TonKho (TonKhoID, SanPhamID, SoLuongTon, SoLuongNhap, SoLuongXuat, NgayCapNhat) VALUES
-- ('inventory-uuid-1', 'product-uuid-1', 50, 100, 50, '2024-01-15 10:30:00'),
-- ('inventory-uuid-2', 'product-uuid-2', 200, 300, 100, '2024-01-16 14:20:00');

-- Export GiaoDichKho data
-- INSERT INTO GiaoDichKho (GiaoDichID, SanPhamID, LoaiGiaoDich, SoLuong, GhiChu, DonHangID, NgayGiaoDich) VALUES
-- ('transaction-uuid-1', 'product-uuid-1', 'Nhap', 100, 'Initial stock', NULL, '2024-01-01 00:00:00'),
-- ('transaction-uuid-2', 'product-uuid-1', 'Xuat', 1, 'Order fulfillment', 'order-uuid-1', '2024-01-15 10:30:00'),
-- ('transaction-uuid-3', 'product-uuid-2', 'Nhap', 300, 'Initial stock', NULL, '2024-01-01 00:00:00'),
-- ('transaction-uuid-4', 'product-uuid-2', 'Xuat', 1, 'Order fulfillment', 'order-uuid-2', '2024-01-16 14:20:00');

-- Export GioHang data
-- INSERT INTO GioHang (GioHangID, KhachHangID, SanPhamID, SoLuong, NgayThem) VALUES
-- ('cart-uuid-1', 'user-uuid-2', 'product-uuid-1', 1, '2024-01-20 09:00:00');

-- Export YeuThich data
-- INSERT INTO YeuThich (YeuThichID, KhachHangID, SanPhamID, NgayTao) VALUES
-- ('wishlist-uuid-1', 'user-uuid-2', 'product-uuid-2', '2024-01-20 09:00:00');

-- Export PaymentTransactions data
-- INSERT INTO PaymentTransactions (PaymentID, OrderID, PaymentMethod, Amount, Status, PaymentProvider, TransactionRef, PaymentUrl, QRCode, QRContent, BankCode, CustomerInfo, CreatedAt, UpdatedAt) VALUES
-- ('payment-uuid-1', 'order-uuid-1', 'COD', 9000000.00, 'SUCCESS', 'COD', 'COD_REF_123', NULL, NULL, NULL, NULL, '{"name": "Customer User", "phone": "0987654321"}', '2024-01-15 10:30:00', '2024-01-15 10:30:00'),
-- ('payment-uuid-2', 'order-uuid-2', 'MOMO', 180000.00, 'SUCCESS', 'MOMO', 'MOMO_REF_123', 'https://payment.momo.vn/...', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', '2|99|Customer User|180000|MOMO_REF_123', 'MOMO', '{"name": "Customer User", "phone": "0987654321"}', '2024-01-16 14:20:00', '2024-01-16 14:20:00');

-- Export PaymentConfig data
-- INSERT INTO PaymentConfig (ConfigID, Provider, ConfigKey, ConfigValue, IsEncrypted, CreatedAt, UpdatedAt) VALUES
-- (1, 'VNPAY', 'TMN_CODE', 'YOUR_TMN_CODE', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (2, 'VNPAY', 'SECRET_KEY', 'YOUR_SECRET_KEY', TRUE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (3, 'VNPAY', 'URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (4, 'VNPAY', 'RETURN_URL', 'http://localhost:3000/api/payment/vnpay-return', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (5, 'MOMO', 'PARTNER_CODE', 'YOUR_PARTNER_CODE', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (6, 'MOMO', 'ACCESS_KEY', 'YOUR_ACCESS_KEY', TRUE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (7, 'MOMO', 'SECRET_KEY', 'YOUR_SECRET_KEY', TRUE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (8, 'MOMO', 'ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (9, 'MOMO', 'RETURN_URL', 'http://localhost:3000/api/payment/momo-return', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (10, 'MOMO', 'NOTIFY_URL', 'http://localhost:3000/api/payment/momo-notify', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (11, 'VIETQR', 'CLIENT_ID', 'YOUR_CLIENT_ID', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (12, 'VIETQR', 'API_KEY', 'YOUR_API_KEY', TRUE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (13, 'VIETQR', 'API_URL', 'https://api.vietqr.io/v2/generate', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (14, 'VIETQR', 'ACCOUNT_NO', 'YOUR_ACCOUNT_NO', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
-- (15, 'VIETQR', 'ACCOUNT_NAME', 'YOUR_ACCOUNT_NAME', FALSE, '2024-01-01 00:00:00', '2024-01-01 00:00:00');

-- =====================================================
-- 5. RESTORE INSTRUCTIONS
-- =====================================================

-- To restore this backup:
-- 1. Create a new database: CREATE DATABASE your_database_name;
-- 2. Use the database: USE your_database_name;
-- 3. Run this script: mysql -u username -p your_database_name < database_backup.sql
-- 4. Or execute this file in MySQL Workbench or phpMyAdmin

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check table structure
-- SHOW TABLES;

-- Check foreign key constraints
-- SELECT 
--     TABLE_NAME,
--     COLUMN_NAME,
--     CONSTRAINT_NAME,
--     REFERENCED_TABLE_NAME,
--     REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE REFERENCED_TABLE_SCHEMA = DATABASE();

-- Check triggers
-- SHOW TRIGGERS;

-- =====================================================
-- END OF BACKUP
-- =====================================================

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
