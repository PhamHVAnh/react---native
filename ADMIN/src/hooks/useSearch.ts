import { useState, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';

// Import cả hai cách search
import {
  simpleSearchUsers,
  simpleSearchProducts,
  simpleSearchOrders,
  simpleSearchWarranties
} from '../utils/simpleSearch';

export function useSearch() {
  const [searchLoading, setSearchLoading] = useState(false);

  const searchUsers = useCallback(async (
    users: Record<string, unknown>[],
    query: string,
    filters?: { role?: string }
  ) => {
    setSearchLoading(true);
    try {
      return simpleSearchUsers(users, query, filters);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (
    products: Record<string, unknown>[],
    query: string,
    filters?: {
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      brand?: string;
      stockStatus?: string;
      sortBy?: string;
      showOnly?: string;
    }
  ) => {
    setSearchLoading(true);
    try {
      return simpleSearchProducts(products, query, filters);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const searchOrders = useCallback(async (
    orders: Record<string, unknown>[],
    query: string,
    filters?: { status?: string }
  ) => {
    setSearchLoading(true);
    try {
      return simpleSearchOrders(orders, query, filters);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const searchWarranties = useCallback(async (
    warranties: Record<string, unknown>[],
    query: string,
    filters?: { status?: string }
  ) => {
    setSearchLoading(true);
    try {
      return simpleSearchWarranties(warranties, query, filters);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const createSearchHandler = useCallback((
    dataFetcher: () => Promise<Record<string, unknown>[]>,
    searchFn: (data: Record<string, unknown>[], query: string, filters?: Record<string, unknown>) => Record<string, unknown>[],
    entityName: string
  ) => {
    return async (query: string, filters?: Record<string, unknown>) => {
      setSearchLoading(true);

      try {
        const allData = await dataFetcher();
        const filteredData = searchFn(allData, query, filters);

        message.success(`Tìm thấy ${filteredData.length} ${entityName}`);
        return filteredData;
      } catch (error) {
        message.error(`Không thể tìm kiếm ${entityName}`);
        console.error('Search error:', error);
        throw error;
      } finally {
        setSearchLoading(false);
      }
    };
  }, []);

  const searchCategories = useCallback(async (
    categories: Record<string, unknown>[],
    query: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>
  ) => {
    setSearchLoading(true);
    try {
      // Simple search for categories
      let filtered = categories;

      if (query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        filtered = filtered.filter((category: Record<string, unknown>) =>
          String(category.TenDanhMuc || '').toLowerCase().includes(searchTerm) ||
          String(category.MoTa || '').toLowerCase().includes(searchTerm)
        );
      }

      return filtered;
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const searchInventory = useCallback(async (
    inventory: Record<string, unknown>[],
    query: string,
    filters?: Record<string, unknown>
  ) => {
    setSearchLoading(true);
    try {
      // Simple search for inventory by product name
      let filtered = inventory;

      if (query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        filtered = filtered.filter((item: Record<string, unknown>) =>
          String(item.TenSanPham || '').toLowerCase().includes(searchTerm) ||
          String(item.Model || '').toLowerCase().includes(searchTerm) ||
          String(item.ThuongHieu || '').toLowerCase().includes(searchTerm)
        );
      }

      // Filter by stock status if provided
      if (filters?.stockStatus) {
        filtered = filtered.filter((item: Record<string, unknown>) => {
          const quantity = Number(item.SoLuongTon || 0);
          const status = filters.stockStatus;

          if (status === 'out') return quantity === 0;
          if (status === 'low') return quantity > 0 && quantity < 10;
          if (status === 'medium') return quantity >= 10 && quantity < 50;
          if (status === 'high') return quantity >= 50;

          return true;
        });
      }

      return filtered;
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const searchPromotions = useCallback(async (
    promotions: Record<string, unknown>[],
    query: string,
    filters?: Record<string, unknown>
  ) => {
    setSearchLoading(true);
    try {
      // Simple search for promotions
      let filtered = promotions;

      if (query.trim()) {
        const searchTerm = query.toLowerCase().trim();
        filtered = filtered.filter((promotion: Record<string, unknown>) =>
          String(promotion.TenKhuyenMai || '').toLowerCase().includes(searchTerm) ||
          String(promotion.MoTa || '').toLowerCase().includes(searchTerm) ||
          String(promotion.MaKhuyenMai || '').toLowerCase().includes(searchTerm)
        );
      }

      // Filter by status if provided
      if (filters?.status) {
        const now = dayjs();
        filtered = filtered.filter((promotion: Record<string, unknown>) => {
          const startDate = dayjs(String(promotion.NgayBatDau));
          const endDate = dayjs(String(promotion.NgayKetThuc));
          const status = filters.status;

          if (status === 'active') {
            return now.isAfter(startDate) && now.isBefore(endDate);
          } else if (status === 'upcoming') {
            return now.isBefore(startDate);
          } else if (status === 'expired') {
            return now.isAfter(endDate);
          }

          return true;
        });
      }

      return filtered;
    } finally {
      setSearchLoading(false);
    }
  }, []);

  return {
    searchLoading,
    searchUsers,
    searchProducts,
    searchOrders,
    searchWarranties,
    searchCategories,
    searchInventory,
    searchPromotions,
    createSearchHandler
  };
}
