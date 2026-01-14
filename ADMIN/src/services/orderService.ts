import api from './api';

export interface OrderDetail {
  ChiTietID: string;
  SanPhamID: string;
  SoLuong: number;
  Gia: number;
  TenSanPham?: string;
  HinhAnh?: string;
}

export interface Order {
  DonHangID: string;
  KhachHangID: string;
  NgayDat: string;
  TrangThai: 'ChuaXuLy' | 'DangGiao' | 'HoanThanh' | 'Huy';
  TongTien: number;
  KhuyenMaiID?: string;
  GiamGia: number;
  PhuongThucThanhToan: 'COD' | 'QR' | 'CARD' | 'MOMO' | 'ViDienTu' | 'TheNganHang' | 'CARD_PAYMENT' | 'VIETQR';
  ThanhTien: number;
  // Fields from JOIN with NguoiDung
  HoTen?: string;
  SoDienThoai?: string;
  DiaChi?: string;
  Email?: string;
  // Fields from JOIN with KhuyenMai
  MaKhuyenMai?: string;
  KhuyenMaiMoTa?: string;
  PhanTramGiam?: number;
  // Order details
  chiTiet?: OrderDetail[];
}

export const orderService = {
  getAll: () => api.get<Order[]>('/donhang'),
  getById: (id: string) => api.get<Order>(`/donhang/${id}`),
  update: (id: string, data: { TrangThai: string }) => api.put<Order>(`/donhang/${id}`, data),
  delete: (id: string) => api.delete(`/donhang/${id}`),
  cancel: (id: string) => api.put(`/donhang/${id}/cancel`),
};

