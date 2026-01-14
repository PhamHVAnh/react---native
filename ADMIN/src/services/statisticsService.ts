import api from './api';

export interface DashboardStats {
  totalStats: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalWarranties: number;
    activePromotions: number;
  };
  revenueStats: {
    completedRevenue: number;
    pendingRevenue: number;
    totalRevenue: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
  };
  monthlyStats: Array<{
    month: string;
    orderCount: number;
    revenue: number;
  }>;
  topProducts: Array<{
    SanPhamID: string;
    TenSanPham: string;
    ThuongHieu: string;
    GiaGoc: number;
    HinhAnh: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  orderStatusStats: Array<{
    TrangThai: string;
    count: number;
    totalAmount: number;
  }>;
  newCustomers: number;
}

export interface RevenueStats {
  period: string;
  orderCount: number;
  completedRevenue: number;
  pendingRevenue: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export interface ProductStats {
  topSelling: Array<{
    SanPhamID: string;
    TenSanPham: string;
    ThuongHieu: string;
    GiaGoc: number;
    HinhAnh: string;
    totalSold: number;
    totalRevenue: number;
    orderCount: number;
  }>;
  categoryStats: Array<{
    TenDanhMuc: string;
    productCount: number;
    totalSold: number;
    totalRevenue: number;
  }>;
  inventoryStats: Array<{
    SanPhamID: string;
    TenSanPham: string;
    SoLuongTon: number;
    GiaGoc: number;
    inventoryValue: number;
  }>;
}

export interface CustomerStats {
  topCustomers: Array<{
    UserID: string;
    HoTen: string;
    Email: string;
    SoDienThoai: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
  }>;
  monthlyCustomers: Array<{
    month: string;
    newCustomers: number;
  }>;
  customerTypes: Array<{
    customerType: string;
    count: number;
    avgSpent: number;
  }>;
}

export interface WarrantyStats {
  warrantyStatus: Array<{
    TrangThai: string;
    count: number;
  }>;
  expiringWarranties: Array<{
    BaoHanhID: string;
    NgayMua: string;
    HanBaoHanh: string;
    TenSanPham: string;
    HoTen: string;
    SoDienThoai: string;
    daysRemaining: number;
  }>;
  monthlyWarranties: Array<{
    month: string;
    warrantyCount: number;
  }>;
}

export const statisticsService = {
  getDashboardStats: () => api.get<DashboardStats>('/thongke/dashboard'),
  
  getRevenueStats: (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month' | 'year';
  }) => api.get<RevenueStats[]>('/thongke/revenue', { params }),
  
  getProductStats: () => api.get<ProductStats>('/thongke/products'),
  
  getCustomerStats: () => api.get<CustomerStats>('/thongke/customers'),
  
  getWarrantyStats: () => api.get<WarrantyStats>('/thongke/warranties'),
};
