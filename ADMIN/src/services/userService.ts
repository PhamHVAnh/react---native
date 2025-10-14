import api from './api';

export interface User {
  UserID: string;
  HoTen: string;
  TenDangNhap: string;
  Email: string;
  SoDienThoai: string;
  DiaChi: string;
  VaiTro: 'KhachHang' | 'NhanVien';
  NgayTao: string;
  HinhAnh?: string;
}

export interface CreateUserDto {
  HoTen: string;
  TenDangNhap: string;
  MatKhau: string;
  Email: string;
  SoDienThoai: string;
  DiaChi: string;
  VaiTro: 'KhachHang' | 'NhanVien';
  HinhAnh?: string;
}

export interface UpdateUserDto {
  HoTen?: string;
  TenDangNhap?: string;
  MatKhau?: string;
  Email?: string;
  SoDienThoai?: string;
  DiaChi?: string;
  VaiTro?: 'KhachHang' | 'NhanVien';
  HinhAnh?: string;
}

export const userService = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: CreateUserDto) => api.post<User>('/users', data),
  update: (id: string, data: UpdateUserDto) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  login: (TenDangNhap: string, MatKhau: string) => 
    api.post<{ user: User; token: string }>('/users/login', { TenDangNhap, MatKhau }),
};

