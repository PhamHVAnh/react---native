import api from './api';

export interface Category {
  DanhMucID: string;
  TenDanhMuc: string;
  MoTa?: string;
  ParentID?: string;
}

export interface CreateCategoryDto {
  TenDanhMuc: string;
  MoTa?: string;
  ParentID?: string;
}

export const categoryService = {
  getAll: () => api.get<Category[]>('/danhmuc'),
  getById: (id: string) => api.get<Category>(`/danhmuc/${id}`),
  create: (data: CreateCategoryDto) => api.post<Category>('/danhmuc', data),
  update: (id: string, data: CreateCategoryDto) => api.put<Category>(`/danhmuc/${id}`, data),
  delete: (id: string) => api.delete(`/danhmuc/${id}`),
};

