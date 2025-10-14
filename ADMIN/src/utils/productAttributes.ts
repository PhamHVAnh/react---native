// Template thuộc tính cho từng loại sản phẩm
export interface AttributeField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  unit?: string;
  placeholder?: string;
}

export const productAttributeTemplates: Record<string, AttributeField[]> = {
  // Tivi
  'Tivi': [
    { name: 'KichThuocManHinh', label: 'Kích thước màn hình', type: 'number', unit: 'inch' },
    { name: 'DoPhanGiai', label: 'Độ phân giải', type: 'select', options: ['HD (1366x768)', 'Full HD (1920x1080)', '4K (3840x2160)', '8K (7680x4320)'] },
    { name: 'CongNgheManHinh', label: 'Công nghệ màn hình', type: 'select', options: ['LED', 'OLED', 'QLED', 'NanoCell', 'Mini LED'] },
    { name: 'TanSoQuet', label: 'Tần số quét', type: 'select', options: ['60Hz', '120Hz', '144Hz'] },
    { name: 'HDR', label: 'Hỗ trợ HDR', type: 'select', options: ['Có', 'Không'] },
    { name: 'HeDieuHanh', label: 'Hệ điều hành', type: 'select', options: ['Android TV', 'Tizen', 'webOS', 'Google TV'] },
    { name: 'CongKetNoi', label: 'Cổng kết nối', type: 'textarea', placeholder: 'VD: HDMI x3, USB x2, LAN' },
    { name: 'CongSuat', label: 'Công suất', type: 'number', unit: 'W' },
  ],

  // Tủ lạnh
  'Tủ lạnh': [
    { name: 'DungTich', label: 'Dung tích', type: 'number', unit: 'lít' },
    { name: 'SoCua', label: 'Số cửa', type: 'select', options: ['1 cửa', '2 cửa', '3 cửa', '4 cửa', 'Side by side'] },
    { name: 'CongNgheLamLanh', label: 'Công nghệ làm lạnh', type: 'select', options: ['Làm lạnh trực tiếp', 'Làm lạnh gián tiếp', 'Inverter'] },
    { name: 'CongNgheInverter', label: 'Công nghệ Inverter', type: 'select', options: ['Có', 'Không'] },
    { name: 'TietKiemDien', label: 'Mức tiết kiệm điện', type: 'select', options: ['1 sao', '2 sao', '3 sao', '4 sao', '5 sao'] },
    { name: 'KhangKhuan', label: 'Công nghệ kháng khuẩn', type: 'text', placeholder: 'VD: Bạc, Nano...' },
    { name: 'ChatLieuVo', label: 'Chất liệu vỏ', type: 'select', options: ['Thép không gỉ', 'Kính cường lực', 'Nhựa'] },
    { name: 'CongSuat', label: 'Công suất', type: 'number', unit: 'W' },
    { name: 'KichThuoc', label: 'Kích thước', type: 'text', placeholder: 'Cao x Rộng x Sâu (cm)' },
  ],

  // Máy giặt
  'Máy giặt': [
    { name: 'KhoiLuongGiat', label: 'Khối lượng giặt', type: 'number', unit: 'kg' },
    { name: 'LoaiMay', label: 'Loại máy', type: 'select', options: ['Cửa trước', 'Cửa trên', 'Lồng đứng', 'Lồng ngang'] },
    { name: 'CongNgheInverter', label: 'Công nghệ Inverter', type: 'select', options: ['Có', 'Không'] },
    { name: 'CongNgheSay', label: 'Chức năng sấy', type: 'select', options: ['Có', 'Không'] },
    { name: 'KhoiLuongSay', label: 'Khối lượng sấy', type: 'number', unit: 'kg' },
    { name: 'TocDoQuay', label: 'Tốc độ vắt tối đa', type: 'number', unit: 'vòng/phút' },
    { name: 'SoChuongTrinh', label: 'Số chương trình giặt', type: 'number' },
    { name: 'CongSuat', label: 'Công suất', type: 'number', unit: 'W' },
    { name: 'KichThuoc', label: 'Kích thước', type: 'text', placeholder: 'Cao x Rộng x Sâu (cm)' },
  ],

  // Máy lạnh/Điều hòa
  'Máy lạnh': [
    { name: 'CongSuat', label: 'Công suất làm lạnh', type: 'number', unit: 'BTU' },
    { name: 'LoaiMay', label: 'Loại máy', type: 'select', options: ['1 chiều', '2 chiều'] },
    { name: 'CongNgheInverter', label: 'Công nghệ Inverter', type: 'select', options: ['Có', 'Không'] },
    { name: 'DienTichLamMat', label: 'Diện tích làm mát', type: 'number', unit: 'm²' },
    { name: 'GaLamLanh', label: 'Gas làm lạnh', type: 'text', placeholder: 'VD: R32, R410A' },
    { name: 'LocKhongKhi', label: 'Lọc không khí', type: 'select', options: ['Có', 'Không'] },
    { name: 'CheDoDieuKhien', label: 'Chế độ điều khiển', type: 'text', placeholder: 'VD: Remote, WiFi, App' },
    { name: 'MucTieuThuDien', label: 'Mức tiêu thụ điện', type: 'number', unit: 'kWh/năm' },
  ],

  // Lò vi sóng
  'Lò vi sóng': [
    { name: 'DungTich', label: 'Dung tích', type: 'number', unit: 'lít' },
    { name: 'CongSuat', label: 'Công suất', type: 'number', unit: 'W' },
    { name: 'LoaiLo', label: 'Loại lò', type: 'select', options: ['Vi sóng cơ', 'Vi sóng điện tử', 'Vi sóng có nướng'] },
    { name: 'ChucNang', label: 'Chức năng', type: 'textarea', placeholder: 'VD: Rã đông, hâm nóng, nấu nướng' },
    { name: 'BangDieuKhien', label: 'Bảng điều khiển', type: 'select', options: ['Cơ', 'Điện tử', 'Cảm ứng'] },
    { name: 'KichThuoc', label: 'Kích thước', type: 'text', placeholder: 'Cao x Rộng x Sâu (cm)' },
  ],

  // Quạt
  'Quạt': [
    { name: 'LoaiQuat', label: 'Loại quạt', type: 'select', options: ['Quạt đứng', 'Quạt bàn', 'Quạt trần', 'Quạt điều hòa', 'Quạt sạc'] },
    { name: 'DuongKinhCanh', label: 'Đường kính cánh', type: 'number', unit: 'cm' },
    { name: 'CongSuat', label: 'Công suất', type: 'number', unit: 'W' },
    { name: 'SoCapDoGio', label: 'Số cấp độ gió', type: 'number' },
    { name: 'ChucNang', label: 'Chức năng', type: 'textarea', placeholder: 'VD: Hẹn giờ, điều khiển từ xa, dao động' },
    { name: 'MucTieuThuDien', label: 'Mức tiêu thụ điện', type: 'number', unit: 'kWh/tháng' },
  ],
};

// Lấy template dựa trên tên danh mục
export const getAttributeTemplate = (categoryName: string): AttributeField[] => {
  console.log('🔍 Tìm template cho danh mục:', categoryName);
  
  // Tìm kiếm không phân biệt hoa thường và cho phép match một phần
  const normalizedCategory = categoryName.toLowerCase().trim();
  
  // Mapping variations để hỗ trợ nhiều tên gọi
  const categoryMapping: Record<string, string> = {
    'tivi': 'Tivi',
    'tv': 'Tivi',
    'television': 'Tivi',
    'tủ lạnh': 'Tủ lạnh',
    'tu lanh': 'Tủ lạnh',
    'refrigerator': 'Tủ lạnh',
    'máy giặt': 'Máy giặt',
    'may giat': 'Máy giặt',
    'washing': 'Máy giặt',
    'máy lạnh': 'Máy lạnh',
    'may lanh': 'Máy lạnh',
    'điều hòa': 'Máy lạnh',
    'dieu hoa': 'Máy lạnh',
    'air conditioner': 'Máy lạnh',
    'lò vi sóng': 'Lò vi sóng',
    'lo vi song': 'Lò vi sóng',
    'microwave': 'Lò vi sóng',
    'quạt': 'Quạt',
    'quat': 'Quạt',
    'fan': 'Quạt',
  };
  
  // Tìm key phù hợp
  for (const [searchKey, templateKey] of Object.entries(categoryMapping)) {
    if (normalizedCategory.includes(searchKey)) {
      const template = productAttributeTemplates[templateKey];
      if (template) {
        console.log('✅ Tìm thấy template:', templateKey, 'với', template.length, 'trường');
        return template;
      }
    }
  }
  
  // Thử match trực tiếp
  for (const [key, value] of Object.entries(productAttributeTemplates)) {
    if (normalizedCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedCategory)) {
      console.log('✅ Tìm thấy template (direct):', key, 'với', value.length, 'trường');
      return value;
    }
  }
  
  console.log('⚠️ Không tìm thấy template phù hợp, dùng template mặc định');
  // Trả về template mặc định nếu không tìm thấy
  return [
    { name: 'ThongSoKyThuat', label: 'Thông số kỹ thuật', type: 'textarea', placeholder: 'Nhập thông số kỹ thuật' },
    { name: 'CongSuat', label: 'Công suất', type: 'text', placeholder: 'VD: 150W' },
    { name: 'KichThuoc', label: 'Kích thước', type: 'text', placeholder: 'Cao x Rộng x Sâu (cm)' },
    { name: 'TrongLuong', label: 'Trọng lượng', type: 'text', placeholder: 'VD: 15kg' },
  ];
};

