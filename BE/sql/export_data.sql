-- =====================================================
-- DATA EXPORT SCRIPT - E-COMMERCE SYSTEM
-- Generated: 2024
-- Description: Export all data from existing database
-- =====================================================

-- =====================================================
-- 1. EXPORT USERS DATA
-- =====================================================

SELECT '-- Export NguoiDung data' as '';
SELECT CONCAT('INSERT INTO NguoiDung (UserID, HoTen, Email, SoDienThoai, DiaChi, MatKhau, VaiTro, TrangThai, NgayTao, NgayCapNhat) VALUES') as '';
SELECT CONCAT('(''', UserID, ''', ''', 
              REPLACE(HoTen, '''', ''''''), ''', ''', 
              Email, ''', ''', 
              COALESCE(SoDienThoai, 'NULL'), ''', ''', 
              COALESCE(REPLACE(DiaChi, '''', ''''''), 'NULL'), ''', ''', 
              MatKhau, ''', ''', 
              VaiTro, ''', ''', 
              TrangThai, ''', ''', 
              NgayTao, ''', ''', 
              NgayCapNhat, '''),') as ''
FROM NguoiDung
ORDER BY NgayTao;

-- =====================================================
-- 2. EXPORT CATEGORIES DATA
-- =====================================================

SELECT '-- Export DanhMuc data' as '';
SELECT CONCAT('INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, HinhAnh, TrangThai, NgayTao, NgayCapNhat) VALUES') as '';
SELECT CONCAT('(''', DanhMucID, ''', ''', 
              REPLACE(TenDanhMuc, '''', ''''''), ''', ''', 
              COALESCE(REPLACE(MoTa, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(REPLACE(HinhAnh, '''', ''''''), 'NULL'), ''', ''', 
              TrangThai, ''', ''', 
              NgayTao, ''', ''', 
              NgayCapNhat, '''),') as ''
FROM DanhMuc
ORDER BY NgayTao;

-- =====================================================
-- 3. EXPORT PRODUCTS DATA
-- =====================================================

SELECT '-- Export SanPham data' as '';
SELECT CONCAT('INSERT INTO SanPham (SanPhamID, TenSanPham, MoTa, GiaGoc, GiamGia, HinhAnh, ThuocTinh, DanhMucID, BaoHanhThang, TrangThai, NgayTao, NgayCapNhat) VALUES') as '';
SELECT CONCAT('(''', SanPhamID, ''', ''', 
              REPLACE(TenSanPham, '''', ''''''), ''', ''', 
              COALESCE(REPLACE(MoTa, '''', ''''''), 'NULL'), ''', ''', 
              GiaGoc, ', ', 
              GiamGia, ', ''', 
              COALESCE(REPLACE(HinhAnh, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(REPLACE(ThuocTinh, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(DanhMucID, 'NULL'), ', ', 
              BaoHanhThang, ', ''', 
              TrangThai, ''', ''', 
              NgayTao, ''', ''', 
              NgayCapNhat, '''),') as ''
FROM SanPham
ORDER BY NgayTao;

-- =====================================================
-- 4. EXPORT PROMOTIONS DATA
-- =====================================================

SELECT '-- Export KhuyenMai data' as '';
SELECT CONCAT('INSERT INTO KhuyenMai (KhuyenMaiID, MaKhuyenMai, TenKhuyenMai, MoTa, PhanTramGiam, GiaTriGiam, GiaTriToiThieu, GiaTriToiDa, NgayBatDau, NgayKetThuc, SoLuongSuDung, GioiHanSuDung, TrangThai, NgayTao, NgayCapNhat) VALUES') as '';
SELECT CONCAT('(''', KhuyenMaiID, ''', ''', 
              MaKhuyenMai, ''', ''', 
              REPLACE(TenKhuyenMai, '''', ''''''), ''', ''', 
              COALESCE(REPLACE(MoTa, '''', ''''''), 'NULL'), ''', ''', 
              PhanTramGiam, ', ', 
              COALESCE(GiaTriGiam, 'NULL'), ', ', 
              COALESCE(GiaTriToiThieu, 'NULL'), ', ', 
              COALESCE(GiaTriToiDa, 'NULL'), ', ''', 
              NgayBatDau, ''', ''', 
              NgayKetThuc, ''', ', ', 
              SoLuongSuDung, ', ', 
              COALESCE(GioiHanSuDung, 'NULL'), ', ''', 
              TrangThai, ''', ''', 
              NgayTao, ''', ''', 
              NgayCapNhat, '''),') as ''
FROM KhuyenMai
ORDER BY NgayTao;

-- =====================================================
-- 5. EXPORT ORDERS DATA
-- =====================================================

SELECT '-- Export DonHang data' as '';
SELECT CONCAT('INSERT INTO DonHang (DonHangID, KhachHangID, NgayDat, TrangThai, TongTien, KhuyenMaiID, GiamGia, PhuongThucThanhToan, ThanhTien, DiaChiGiaoHang, GhiChu, PaymentStatus, PaymentMethod, PaymentTransactionRef) VALUES') as '';
SELECT CONCAT('(''', DonHangID, ''', ''', 
              KhachHangID, ''', ''', 
              NgayDat, ''', ''', 
              TrangThai, ''', ', ', 
              TongTien, ', ', 
              COALESCE(CONCAT('''', KhuyenMaiID, ''''), 'NULL'), ', ', 
              GiamGia, ', ''', 
              PhuongThucThanhToan, ''', ', ', 
              ThanhTien, ', ''', 
              COALESCE(REPLACE(DiaChiGiaoHang, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(REPLACE(GhiChu, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(PaymentStatus, 'UNPAID'), ''', ''', 
              COALESCE(REPLACE(PaymentMethod, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(REPLACE(PaymentTransactionRef, '''', ''''''), 'NULL'), '''),') as ''
FROM DonHang
ORDER BY NgayDat;

-- =====================================================
-- 6. EXPORT ORDER DETAILS DATA
-- =====================================================

SELECT '-- Export ChiTietDonHang data' as '';
SELECT CONCAT('INSERT INTO ChiTietDonHang (ChiTietID, DonHangID, SanPhamID, SoLuong, Gia) VALUES') as '';
SELECT CONCAT('(''', ChiTietID, ''', ''', 
              DonHangID, ''', ''', 
              SanPhamID, ''', ', ', 
              SoLuong, ', ', 
              Gia, '),') as ''
FROM ChiTietDonHang
ORDER BY ChiTietID;

-- =====================================================
-- 7. EXPORT WARRANTY DATA
-- =====================================================

SELECT '-- Export BaoHanh data' as '';
SELECT CONCAT('INSERT INTO BaoHanh (BaoHanhID, ChiTietID, SanPhamID, KhachHangID, NgayMua, HanBaoHanh, TrangThai, GhiChu, NgayTao, NgayCapNhat) VALUES') as '';
SELECT CONCAT('(''', BaoHanhID, ''', ''', 
              ChiTietID, ''', ''', 
              SanPhamID, ''', ''', 
              KhachHangID, ''', ''', 
              NgayMua, ''', ''', 
              HanBaoHanh, ''', ''', 
              TrangThai, ''', ''', 
              COALESCE(REPLACE(GhiChu, '''', ''''''), 'NULL'), ''', ''', 
              NgayTao, ''', ''', 
              NgayCapNhat, '''),') as ''
FROM BaoHanh
ORDER BY NgayMua;

-- =====================================================
-- 8. EXPORT INVENTORY DATA
-- =====================================================

SELECT '-- Export TonKho data' as '';
SELECT CONCAT('INSERT INTO TonKho (TonKhoID, SanPhamID, SoLuongTon, SoLuongNhap, SoLuongXuat, NgayCapNhat) VALUES') as '';
SELECT CONCAT('(''', TonKhoID, ''', ''', 
              SanPhamID, ''', ', ', 
              SoLuongTon, ', ', 
              SoLuongNhap, ', ', 
              SoLuongXuat, ', ''', 
              NgayCapNhat, '''),') as ''
FROM TonKho
ORDER BY SanPhamID;

-- =====================================================
-- 9. EXPORT INVENTORY TRANSACTIONS DATA
-- =====================================================

SELECT '-- Export GiaoDichKho data' as '';
SELECT CONCAT('INSERT INTO GiaoDichKho (GiaoDichID, SanPhamID, LoaiGiaoDich, SoLuong, GhiChu, DonHangID, NgayGiaoDich) VALUES') as '';
SELECT CONCAT('(''', GiaoDichID, ''', ''', 
              SanPhamID, ''', ''', 
              LoaiGiaoDich, ''', ', ', 
              SoLuong, ', ''', 
              COALESCE(REPLACE(GhiChu, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(CONCAT('''', DonHangID, ''''), 'NULL'), ', ''', 
              NgayGiaoDich, '''),') as ''
FROM GiaoDichKho
ORDER BY NgayGiaoDich;

-- =====================================================
-- 10. EXPORT CART DATA
-- =====================================================

SELECT '-- Export GioHang data' as '';
SELECT CONCAT('INSERT INTO GioHang (GioHangID, KhachHangID, SanPhamID, SoLuong, NgayThem) VALUES') as '';
SELECT CONCAT('(''', GioHangID, ''', ''', 
              KhachHangID, ''', ''', 
              SanPhamID, ''', ', ', 
              SoLuong, ', ''', 
              NgayThem, '''),') as ''
FROM GioHang
ORDER BY NgayThem;

-- =====================================================
-- 11. EXPORT WISHLIST DATA
-- =====================================================

SELECT '-- Export YeuThich data' as '';
SELECT CONCAT('INSERT INTO YeuThich (YeuThichID, KhachHangID, SanPhamID, NgayTao) VALUES') as '';
SELECT CONCAT('(''', YeuThichID, ''', ''', 
              KhachHangID, ''', ''', 
              SanPhamID, ''', ''', 
              NgayTao, '''),') as ''
FROM YeuThich
ORDER BY NgayTao;

-- =====================================================
-- 12. EXPORT PAYMENT TRANSACTIONS DATA
-- =====================================================

SELECT '-- Export PaymentTransactions data' as '';
SELECT CONCAT('INSERT INTO PaymentTransactions (PaymentID, OrderID, PaymentMethod, Amount, Status, PaymentProvider, TransactionRef, PaymentUrl, QRCode, QRContent, BankCode, CustomerInfo, CreatedAt, UpdatedAt) VALUES') as '';
SELECT CONCAT('(''', PaymentID, ''', ''', 
              OrderID, ''', ''', 
              PaymentMethod, ''', ', ', 
              Amount, ', ''', 
              Status, ''', ''', 
              PaymentProvider, ''', ''', 
              TransactionRef, ''', ''', 
              COALESCE(REPLACE(PaymentUrl, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(REPLACE(QRCode, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(REPLACE(QRContent, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(REPLACE(BankCode, '''', ''''''), 'NULL'), ''', ''', 
              COALESCE(REPLACE(CustomerInfo, '''', ''''''), 'NULL'), ''', ''', 
              CreatedAt, ''', ''', 
              UpdatedAt, '''),') as ''
FROM PaymentTransactions
ORDER BY CreatedAt;

-- =====================================================
-- 13. EXPORT PAYMENT CONFIG DATA
-- =====================================================

SELECT '-- Export PaymentConfig data' as '';
SELECT CONCAT('INSERT INTO PaymentConfig (ConfigID, Provider, ConfigKey, ConfigValue, IsEncrypted, CreatedAt, UpdatedAt) VALUES') as '';
SELECT CONCAT('(', ConfigID, ', ''', 
              Provider, ''', ''', 
              ConfigKey, ''', ''', 
              COALESCE(REPLACE(ConfigValue, '''', ''''''), 'NULL'), ''', ', ', 
              IsEncrypted, ', ''', 
              CreatedAt, ''', ''', 
              UpdatedAt, '''),') as ''
FROM PaymentConfig
ORDER BY ConfigID;

-- =====================================================
-- END OF DATA EXPORT
-- =====================================================
