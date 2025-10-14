// Simple search utility không cần thư viện ngoài
// Phù hợp cho các trường hợp đơn giản

export interface SimpleSearchOptions {
  caseSensitive?: boolean;
  exactMatch?: boolean;
  minQueryLength?: number;
}

// Search theo một trường
export function simpleSearchByField(
  data: Record<string, unknown>[],
  query: string,
  field: string,
  options: SimpleSearchOptions = {}
): Record<string, unknown>[] {
  const {
    caseSensitive = false,
    exactMatch = false,
    minQueryLength = 2
  } = options;

  if (!query || query.length < minQueryLength) {
    return data;
  }

  const searchTerm = caseSensitive ? query : query.toLowerCase();

  return data.filter(item => {
    const fieldValue = item[field];
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }

    const value = caseSensitive ? String(fieldValue) : String(fieldValue).toLowerCase();

    if (exactMatch) {
      return value === searchTerm;
    } else {
      return value.includes(searchTerm);
    }
  });
}

// Search theo nhiều trường
export function simpleSearchMultiField(
  data: Record<string, unknown>[],
  query: string,
  fields: string[],
  options: SimpleSearchOptions = {}
): Record<string, unknown>[] {
  const minLength = options.minQueryLength || 2;
  if (!query || query.length < minLength) {
    return data;
  }

  return data.filter(item => {
    return fields.some(field => {
      const result = simpleSearchByField([item], query, field, { ...options, minQueryLength: 0 });
      return result.length > 0;
    });
  });
}

// Search users với simple search
export function simpleSearchUsers(
  users: Record<string, unknown>[],
  query: string,
  filters?: { role?: string }
): Record<string, unknown>[] {
  let filtered = users;

  // Search theo text
  if (query.trim()) {
    filtered = simpleSearchMultiField(
      filtered,
      query.trim(),
      ['HoTen', 'TenDangNhap', 'Email', 'SoDienThoai'],
      { caseSensitive: false, minQueryLength: 1 }
    ) as Record<string, unknown>[];
  }

  // Filter theo role
  if (filters?.role) {
    filtered = filtered.filter(user => user.VaiTro === filters.role);
  }

  return filtered;
}

// Search products với simple search
export function simpleSearchProducts(
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
): Record<string, unknown>[] {
  let filtered = products;

  // Search theo text
  if (query.trim()) {
    filtered = simpleSearchMultiField(
      filtered,
      query.trim(),
      ['TenSanPham', 'Model', 'ThuongHieu', 'TenDanhMuc'],
      { caseSensitive: false, minQueryLength: 1 }
    ) as Record<string, unknown>[];
  }

  // Filter theo category
  if (filters?.categoryId) {
    filtered = filtered.filter(p => p.DanhMucID === filters.categoryId);
  }

  // Filter theo thương hiệu
  if (filters?.brand) {
    filtered = filtered.filter(p => p.ThuongHieu === filters.brand);
  }

  // Filter theo trạng thái tồn kho
  if (filters?.stockStatus) {
    filtered = filtered.filter(p => {
      const soLuongTon = parseInt(String(p.SoLuongTon || 0));
      switch (filters.stockStatus) {
        case 'available':
          return soLuongTon > 0;
        case 'out_of_stock':
          return soLuongTon === 0;
        default:
          return true;
      }
    });
  }

  // Filter theo giá
  if (filters?.minPrice !== undefined) {
    filtered = filtered.filter(p => parseFloat(String(p.GiaGoc)) >= filters.minPrice!);
  }

  if (filters?.maxPrice !== undefined) {
    filtered = filtered.filter(p => parseFloat(String(p.GiaGoc)) <= filters.maxPrice!);
  }

  // Filter theo trạng thái hiển thị
  if (filters?.showOnly) {
    filtered = filtered.filter(p => {
      switch (filters.showOnly) {
        case 'active':
          return p.TrangThai === true || p.TrangThai === 1;
        case 'inactive':
          return p.TrangThai === false || p.TrangThai === 0;
        case 'featured':
          return p.NoiBat === true || p.NoiBat === 1;
        default:
          return true;
      }
    });
  }

  // Sort
  if (filters?.sortBy) {
    filtered = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'name_asc':
          return String(a.TenSanPham).localeCompare(String(b.TenSanPham));
        case 'name_desc':
          return String(b.TenSanPham).localeCompare(String(a.TenSanPham));
        case 'price_asc':
          return parseFloat(String(a.GiaGoc)) - parseFloat(String(b.GiaGoc));
        case 'price_desc':
          return parseFloat(String(b.GiaGoc)) - parseFloat(String(a.GiaGoc));
        case 'newest':
          return new Date(String(b.NgayTao || b.createdAt)).getTime() - new Date(String(a.NgayTao || a.createdAt)).getTime();
        case 'oldest':
          return new Date(String(a.NgayTao || a.createdAt)).getTime() - new Date(String(b.NgayTao || b.createdAt)).getTime();
        default:
          return 0;
      }
    });
  }

  return filtered;
}

// Search orders với simple search
export function simpleSearchOrders(
  orders: Record<string, unknown>[],
  query: string,
  filters?: { status?: string }
): Record<string, unknown>[] {
  let filtered = orders;

  // Search theo text
  if (query.trim()) {
    filtered = simpleSearchMultiField(
      filtered,
      query.trim(),
      ['DonHangID', 'HoTen', 'Email', 'SoDienThoai'],
      { caseSensitive: false, minQueryLength: 1 }
    ) as Record<string, unknown>[];
  }

  // Filter theo status
  if (filters?.status) {
    filtered = filtered.filter(o => o.TrangThai === filters.status);
  }

  return filtered;
}

// Search warranties với simple search
export function simpleSearchWarranties(
  warranties: Record<string, unknown>[],
  query: string,
  filters?: { status?: string }
): Record<string, unknown>[] {
  let filtered = warranties;

  // Search theo text
  if (query.trim()) {
    filtered = simpleSearchMultiField(
      filtered,
      query.trim(),
      ['TenSanPham', 'Model', 'HoTen', 'BaoHanhID'],
      { caseSensitive: false, minQueryLength: 1 }
    ) as Record<string, unknown>[];
  }

  // Filter theo status
  if (filters?.status) {
    filtered = filtered.filter(w => w.TrangThai === filters.status);
  }

  return filtered;
}
