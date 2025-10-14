import api from './api';

export interface Warranty {
  BaoHanhID: string;
  ChiTietID: string;
  SanPhamID: string;
  KhachHangID: string;
  NgayMua: string;
  HanBaoHanh: string;
  TrangThai: 'ConHan' | 'HetHan' | 'DangSua' | 'YeuCau';
  GhiChu?: string;
  // Fields from JOIN with SanPham
  TenSanPham?: string;
  Model?: string;
  ThuongHieu?: string;
  BaoHanhThang?: number;
  HinhAnh?: string;
  // Fields from JOIN with NguoiDung
  HoTen?: string;
  SoDienThoai?: string;
  Email?: string;
  // Fields from JOIN with DonHang
  DonHangID?: string;
  // Calculated fields
  TrangThaiHienTai?: 'ConHan' | 'HetHan';
  SoNgayConLai?: number;
}

export const warrantyService = {
  getAll: () => api.get<Warranty[]>('/baohanh'),
  getById: (id: string) => api.get<Warranty>(`/baohanh/${id}`),
  update: (id: string, data: { TrangThai: string; GhiChu?: string }) => 
    api.put<Warranty>(`/baohanh/${id}`, data),
  delete: (id: string) => api.delete(`/baohanh/${id}`),
  getByOrder: (orderId: string) => api.get<Warranty[]>(`/baohanh/order/${orderId}`),
};

