-- ===============================================
-- SCRIPT CẬP NHẬT DANH MỤC SẢN PHẨM
-- ===============================================

-- Xóa tất cả danh mục hiện tại
DELETE FROM DanhMuc;

-- Reset AUTO_INCREMENT nếu có
ALTER TABLE DanhMuc AUTO_INCREMENT = 1;

-- ===============================================
-- DỮ LIỆU DANH MỤC CHA
-- ===============================================

INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('11111111-1111-1111-1111-111111111111', 'Tivi', 'Các loại Tivi thông minh, OLED, 4K', NULL),
('22222222-2222-2222-2222-222222222222', 'Tủ lạnh', 'Các loại tủ lạnh dung tích khác nhau', NULL, 'Active', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'Điều hòa', 'Điều hòa 1 chiều, 2 chiều, inverter', NULL, 'Active', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'Máy giặt', 'Máy giặt cửa ngang, cửa trên', NULL, 'Active', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Máy sấy', 'Máy sấy quần áo các loại', NULL, 'Active', NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'Máy lọc nước', 'Các loại máy lọc nước RO, Nano', NULL, 'Active', NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'Máy rửa bát', 'Máy rửa bát gia đình và công nghiệp', NULL, 'Active', NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'Máy hút ẩm', 'Thiết bị hút ẩm, lọc không khí', NULL, 'Active', NOW(), NOW()),
('99999999-9999-9999-9999-999999999999', 'Bình nóng lạnh', 'Các loại bình nóng lạnh gián tiếp, trực tiếp', NULL, 'Active', NOW(), NOW()),
('AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'Tủ đông', 'Tủ đông bảo quản thực phẩm', NULL, 'Active', NOW(), NOW());

-- ===============================================
-- DỮ LIỆU DANH MỤC CON
-- ===============================================

-- Tivi
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('11111111-AAAA-BBBB-1111-111111111111', 'Tivi OLED', 'Hiển thị rực rỡ, mỏng nhẹ', '11111111-1111-1111-1111-111111111111', 'Active', NOW(), NOW()),
('11111111-AAAA-BBBB-2222-111111111111', 'Tivi QLED', 'Tivi QLED chất lượng cao', '11111111-1111-1111-1111-111111111111', 'Active', NOW(), NOW()),
('11111111-AAAA-BBBB-3333-111111111111', 'Tivi 4K', 'Độ phân giải 4K sắc nét', '11111111-1111-1111-1111-111111111111', 'Active', NOW(), NOW()),
('11111111-AAAA-BBBB-4444-111111111111', 'Tivi Android', 'Tivi thông minh Android TV', '11111111-1111-1111-1111-111111111111', 'Active', NOW(), NOW());

-- Tủ lạnh
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('22222222-AAAA-BBBB-1111-222222222222', 'Tủ lạnh Inverter', 'Tiết kiệm điện năng', '22222222-2222-2222-2222-222222222222', 'Active', NOW(), NOW()),
('22222222-AAAA-BBBB-2222-222222222222', 'Tủ lạnh ngăn đá trên', 'Phổ biến, giá rẻ', '22222222-2222-2222-2222-222222222222', 'Active', NOW(), NOW()),
('22222222-AAAA-BBBB-3333-222222222222', 'Tủ lạnh ngăn đá dưới', 'Thiết kế tiện lợi', '22222222-2222-2222-2222-222222222222', 'Active', NOW(), NOW()),
('22222222-AAAA-BBBB-4444-222222222222', 'Tủ lạnh Side by Side', 'Thiết kế hai cánh sang trọng', '22222222-2222-2222-2222-222222222222', 'Active', NOW(), NOW()),
('22222222-AAAA-BBBB-5555-222222222222', 'Tủ lạnh mini', 'Dung tích nhỏ, tiết kiệm không gian', '22222222-2222-2222-2222-222222222222', 'Active', NOW(), NOW());

-- Điều hòa
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('33333333-AAAA-BBBB-1111-333333333333', 'Điều hòa 1 chiều', 'Chỉ làm mát', '33333333-3333-3333-3333-333333333333', 'Active', NOW(), NOW()),
('33333333-AAAA-BBBB-2222-333333333333', 'Điều hòa 2 chiều', 'Làm mát và sưởi ấm', '33333333-3333-3333-3333-333333333333', 'Active', NOW(), NOW()),
('33333333-AAAA-BBBB-3333-333333333333', 'Điều hòa Inverter', 'Tiết kiệm điện năng', '33333333-3333-3333-3333-333333333333', 'Active', NOW(), NOW()),
('33333333-AAAA-BBBB-4444-333333333333', 'Điều hòa âm trần', 'Lắp đặt cho văn phòng', '33333333-3333-3333-3333-333333333333', 'Active', NOW(), NOW()),
('33333333-AAAA-BBBB-5555-333333333333', 'Điều hòa di động', 'Dễ dàng di chuyển', '33333333-3333-3333-3333-333333333333', 'Active', NOW(), NOW());

-- Máy giặt
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('44444444-AAAA-BBBB-1111-444444444444', 'Máy giặt cửa trên', 'Phù hợp gia đình nhỏ', '44444444-4444-4444-4444-444444444444', 'Active', NOW(), NOW()),
('44444444-AAAA-BBBB-2222-444444444444', 'Máy giặt cửa ngang', 'Tiết kiệm nước và điện', '44444444-4444-4444-4444-444444444444', 'Active', NOW(), NOW()),
('44444444-AAAA-BBBB-3333-444444444444', 'Máy giặt sấy', 'Kết hợp giặt và sấy', '44444444-4444-4444-4444-444444444444', 'Active', NOW(), NOW()),
('44444444-AAAA-BBBB-4444-444444444444', 'Máy giặt mini', 'Nhỏ gọn tiện lợi', '44444444-4444-4444-4444-444444444444', 'Active', NOW(), NOW()),
('44444444-AAAA-BBBB-5555-444444444444', 'Máy giặt công nghiệp', 'Cho khách sạn, tiệm giặt', '44444444-4444-4444-4444-444444444444', 'Active', NOW(), NOW());

-- Máy sấy
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('55555555-AAAA-BBBB-1111-555555555555', 'Máy sấy bơm nhiệt', 'Tiết kiệm năng lượng', '55555555-5555-5555-5555-555555555555', 'Active', NOW(), NOW()),
('55555555-AAAA-BBBB-2222-555555555555', 'Máy sấy ngưng tụ', 'Dễ lắp đặt, không cần ống thoát', '55555555-5555-5555-5555-555555555555', 'Active', NOW(), NOW()),
('55555555-AAAA-BBBB-3333-555555555555', 'Máy sấy thông hơi', 'Giá thành rẻ hơn', '55555555-5555-5555-5555-555555555555', 'Active', NOW(), NOW());

-- Máy lọc nước
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('66666666-AAAA-BBBB-1111-666666666666', 'Máy lọc nước RO', 'Công nghệ lọc ngược RO', '66666666-6666-6666-6666-666666666666', 'Active', NOW(), NOW()),
('66666666-AAAA-BBBB-2222-666666666666', 'Máy lọc nước Nano', 'Không dùng điện, giữ khoáng', '66666666-6666-6666-6666-666666666666', 'Active', NOW(), NOW()),
('66666666-AAAA-BBBB-3333-666666666666', 'Máy lọc nước nóng lạnh', 'Tích hợp 2 chế độ nhiệt độ', '66666666-6666-6666-6666-666666666666', 'Active', NOW(), NOW());

-- Máy rửa bát
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('77777777-AAAA-BBBB-1111-777777777777', 'Máy rửa bát âm tủ', 'Thiết kế âm tủ sang trọng', '77777777-7777-7777-7777-777777777777', 'Active', NOW(), NOW()),
('77777777-AAAA-BBBB-2222-777777777777', 'Máy rửa bát để bàn', 'Dễ lắp đặt, nhỏ gọn', '77777777-7777-7777-7777-777777777777', 'Active', NOW(), NOW());

-- Máy hút ẩm
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('88888888-AAAA-BBBB-1111-888888888888', 'Máy hút ẩm dân dụng', 'Phù hợp hộ gia đình', '88888888-8888-8888-8888-888888888888', 'Active', NOW(), NOW()),
('88888888-AAAA-BBBB-2222-888888888888', 'Máy hút ẩm công nghiệp', 'Công suất lớn', '88888888-8888-8888-8888-888888888888', 'Active', NOW(), NOW());

-- Bình nóng lạnh
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('99999999-AAAA-BBBB-1111-999999999999', 'Bình nóng lạnh gián tiếp', 'Dùng cho gia đình', '99999999-9999-9999-9999-999999999999', 'Active', NOW(), NOW()),
('99999999-AAAA-BBBB-2222-999999999999', 'Bình nóng lạnh trực tiếp', 'Nhỏ gọn, tiện lợi', '99999999-9999-9999-9999-999999999999', 'Active', NOW(), NOW());

-- Tủ đông
INSERT INTO DanhMuc (DanhMucID, TenDanhMuc, MoTa, ParentID) VALUES
('AAAAAAA1-AAAA-BBBB-1111-AAAAAAAAAAAA', 'Tủ đông 1 ngăn', 'Bảo quản thực phẩm đông lạnh', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'Active', NOW(), NOW()),
('AAAAAAA1-AAAA-BBBB-2222-AAAAAAAAAAAA', 'Tủ đông 2 ngăn', 'Tách biệt ngăn mát và ngăn đông', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'Active', NOW(), NOW());

-- ===============================================
-- KIỂM TRA KẾT QUẢ
-- ===============================================

-- Đếm tổng số danh mục
SELECT 'Tổng số danh mục:' as Info, COUNT(*) as Count FROM DanhMuc;

-- Hiển thị danh mục cha
SELECT 'Danh mục cha:' as Info, COUNT(*) as Count FROM DanhMuc WHERE ParentID IS NULL;

-- Hiển thị danh mục con
SELECT 'Danh mục con:' as Info, COUNT(*) as Count FROM DanhMuc WHERE ParentID IS NOT NULL;

-- Hiển thị cấu trúc danh mục
SELECT 
    dm1.TenDanhMuc as 'Danh mục cha',
    dm2.TenDanhMuc as 'Danh mục con',
    dm2.MoTa as 'Mô tả'
FROM DanhMuc dm1
LEFT JOIN DanhMuc dm2 ON dm1.DanhMucID = dm2.ParentID
WHERE dm1.ParentID IS NULL
ORDER BY dm1.TenDanhMuc, dm2.TenDanhMuc;
