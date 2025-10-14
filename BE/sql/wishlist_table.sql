-- Tạo bảng YeuThich (Wishlist)
CREATE TABLE IF NOT EXISTS YeuThich (
    YeuThichID CHAR(36) PRIMARY KEY,
    KhachHangID CHAR(36) NOT NULL,
    SanPhamID CHAR(36) NOT NULL,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (KhachHangID) REFERENCES NguoiDung(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SanPhamID) REFERENCES SanPham(SanPhamID) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist (KhachHangID, SanPhamID)
);

-- Tạo index để tối ưu hóa truy vấn
CREATE INDEX idx_yeuthich_khachhang ON YeuThich(KhachHangID);
CREATE INDEX idx_yeuthich_sanpham ON YeuThich(SanPhamID);
CREATE INDEX idx_yeuthich_ngaytao ON YeuThich(NgayTao);