import api from './api';

export interface Promotion {
  KhuyenMaiID: string;
  MaKhuyenMai: string;
  MoTa: string;
  PhanTramGiam: number;
  GiamToiDa: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  GioiHanSuDung: number;
}

export interface CreatePromotionDto {
  MaKhuyenMai: string;
  MoTa: string;
  PhanTramGiam: number;
  GiamToiDa: number;
  NgayBatDau: string;
  NgayKetThuc: string;
  GioiHanSuDung: number;
}

export const promotionService = {
  getAll: () => api.get<Promotion[]>('/khuyenmai'),
  getActive: () => api.get<Promotion[]>('/khuyenmai/active'),
  getById: (id: string) => api.get<Promotion>(`/khuyenmai/${id}`),
  create: (data: CreatePromotionDto) => api.post<Promotion>('/khuyenmai', data),
  update: (id: string, data: Partial<CreatePromotionDto>) => api.put<Promotion>(`/khuyenmai/${id}`, data),
  delete: (id: string) => api.delete(`/khuyenmai/${id}`),
};

