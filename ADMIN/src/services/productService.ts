import api from './api';

export interface Product {
  SanPhamID: string;
  TenSanPham: string;
  DanhMucID: string;
  Model: string;
  ThuongHieu: string;
  MoTa: string;
  GiaGoc: number;
  GiamGia: number;
  BaoHanhThang: number;
  HinhAnh: string[];
  ThuocTinh?: Record<string, string | number | boolean>;
  // Additional fields
  NgayTao?: string;
  // Converted field (added by frontend)
  TenDanhMuc?: string;
}

export interface CreateProductDto {
  TenSanPham: string;
  DanhMucID: string;
  Model: string;
  ThuongHieu: string;
  MoTa: string;
  GiaGoc: number;
  GiamGia: number;
  BaoHanhThang: number;
  HinhAnh: string[];
  ThuocTinh?: Record<string, string | number | boolean>;
}

export const productService = {
  getAll: () => api.get<Product[]>('/sanpham'),
  getById: (id: string) => api.get<Product>(`/sanpham/${id}`),
  create: (data: CreateProductDto) => api.post<Product>('/sanpham', data),
  update: (id: string, data: Partial<CreateProductDto>) => api.put<Product>(`/sanpham/${id}`, data),
  delete: (id: string) => api.delete(`/sanpham/${id}`),
  search: (query: string) => api.get<Product[]>(`/sanpham/search?q=${query}`),
};

