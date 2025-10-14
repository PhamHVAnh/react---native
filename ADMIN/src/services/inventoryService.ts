import api from './api';

export interface Inventory {
  SanPhamID: string;
  SoLuongTon: number;
  // Fields from JOIN with SanPham
  TenSanPham?: string;
  Model?: string;
  ThuongHieu?: string;
  HinhAnh?: string;
  GiaGoc?: number;
  GiamGia?: number;
  // Fields from JOIN with DanhMuc
  TenDanhMuc?: string;
}

export const inventoryService = {
  getAll: () => api.get<Inventory[]>('/tonkho'),
  getById: (id: string) => api.get<Inventory>(`/tonkho/${id}`),
  update: (id: string, data: { SoLuongTon: number }) => api.put<Inventory>(`/tonkho/${id}`, data),
  populate: () => api.post('/tonkho/populate'),
};

