-- Insert sample products for testing chatbot
-- Tivi
INSERT INTO SanPham (SanPhamID, TenSanPham, MoTa, GiaGoc, GiamGia, DanhMucID, BaoHanhThang, TrangThai) VALUES
('SP-TIVI-001', 'Tivi Samsung 55 inch 4K', 'Smart TV 55 inch 4K UHD', 15000000, 13500000, '11111111-1111-1111-1111-111111111111', 24, 'Active'),
('SP-TIVI-002', 'Tivi LG OLED 65 inch', 'OLED TV 65 inch cao cấp', 35000000, 32000000, '11111111-1111-1111-1111-111111111111', 24, 'Active'),
('SP-TIVI-003', 'Tivi Sony Bravia 50 inch', 'Android TV 50 inch', 12000000, 11000000, '11111111-1111-1111-1111-111111111111', 24, 'Active');

-- Tủ lạnh
INSERT INTO SanPham (SanPhamID, TenSanPham, MoTa, GiaGoc, GiamGia, DanhMucID, BaoHanhThang, TrangThai) VALUES
('SP-TULANH-001', 'Tủ lạnh Samsung Inverter 360L', 'Tủ lạnh 2 cửa tiết kiệm điện', 9500000, 8500000, '22222222-2222-2222-2222-222222222222', 12, 'Active'),
('SP-TULANH-002', 'Tủ lạnh LG 420L', 'Tủ lạnh side by side', 18000000, 16500000, '22222222-2222-2222-2222-222222222222', 12, 'Active');

-- Máy giặt
INSERT INTO SanPham (SanPhamID, TenSanPham, MoTa, GiaGoc, GiamGia, DanhMucID, BaoHanhThang, TrangThai) VALUES
('SP-MAYGIAT-001', 'Máy giặt Toshiba 9kg', 'Máy giặt cửa trên', 5500000, 5000000, '33333333-3333-3333-3333-333333333333', 12, 'Active'),
('SP-MAYGIAT-002', 'Máy giặt Samsung Inverter 10kg', 'Máy giặt cửa ngang', 8500000, 7800000, '33333333-3333-3333-3333-333333333333', 12, 'Active');

-- Điện thoại
INSERT INTO SanPham (SanPhamID, TenSanPham, MoTa, GiaGoc, GiamGia, DanhMucID, BaoHanhThang, TrangThai) VALUES
('SP-PHONE-001', 'iPhone 15 Pro Max 256GB', 'Điện thoại cao cấp Apple', 32000000, 29500000, '66666666-6666-6666-6666-666666666666', 12, 'Active'),
('SP-PHONE-002', 'Samsung Galaxy S24 Ultra', 'Flagship Samsung 2024', 28000000, 25500000, '66666666-6666-6666-6666-666666666666', 12, 'Active');

-- Insert stock data
INSERT INTO TonKho (SanPhamID, SoLuongTon) VALUES
('SP-TIVI-001', 15),
('SP-TIVI-002', 8),
('SP-TIVI-003', 0),  -- Hết hàng
('SP-TULANH-001', 20),
('SP-TULANH-002', 5),
('SP-MAYGIAT-001', 12),
('SP-MAYGIAT-002', 0),  -- Hết hàng
('SP-PHONE-001', 25),
('SP-PHONE-002', 18);
