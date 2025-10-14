-- SQL Trigger để tự động tạo bảo hành khi đơn hàng hoàn thành
-- Chạy script này trong MySQL để tạo trigger

DELIMITER $$

CREATE TRIGGER auto_create_warranty
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

-- Test script sau khi tạo trigger
-- 1. Kiểm tra trigger đã được tạo
SHOW TRIGGERS LIKE 'DonHang';

-- 2. Test: Cập nhật trạng thái đơn hàng
-- UPDATE DonHang SET TrangThai = 'HoanThanh' WHERE DonHangID = 'YOUR_ORDER_ID';

-- 3. Kiểm tra bảo hành đã được tạo
-- SELECT * FROM BaoHanh ORDER BY NgayMua DESC LIMIT 10;

-- Xóa trigger nếu cần (để tạo lại)
-- DROP TRIGGER IF EXISTS auto_create_warranty;