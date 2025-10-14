import React, { useState } from 'react';
import { Input, Button, Space, Select, InputNumber, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';

const { Option } = Select;

interface SearchBarProps {
  onSearch: (query: string, filters?: Record<string, unknown>) => void;
  onReset: () => void;
  searchType: 'products' | 'users' | 'orders' | 'warranties' | 'categories' | 'inventory' | 'promotions';
  loading?: boolean;
  placeholder?: string;
  categories?: Array<{ DanhMucID: string; TenDanhMuc: string }>;
  brands?: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onReset,
  searchType,
  loading = false,
  placeholder,
  categories = [],
  brands = []
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const handleSearch = () => {
    // Luôn gọi onSearch, kể cả khi query rỗng để reset search
    onSearch(query.trim(), filters);
  };

  const handleFilterChange = (filterKey: string, value: unknown) => {
    const newFilters = { ...filters, [filterKey]: value };
    // Remove filter if value is empty
    if (!value) {
      delete newFilters[filterKey];
    }
    setFilters(newFilters);
    // Trigger search immediately when filter changes
    onSearch(query.trim(), newFilters);
  };

  const handleReset = () => {
    setQuery('');
    setFilters({});
    onReset();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getDefaultPlaceholder = () => {
    switch (searchType) {
      case 'products':
        return 'Tìm kiếm sản phẩm theo tên, model, thương hiệu...';
      case 'users':
        return 'Tìm kiếm người dùng theo tên, email, số điện thoại...';
      case 'orders':
        return 'Tìm kiếm đơn hàng theo mã, tên khách hàng...';
      case 'warranties':
        return 'Tìm kiếm bảo hành theo mã, sản phẩm...';
      case 'categories':
        return 'Tìm kiếm danh mục theo tên, mô tả...';
      case 'inventory':
        return 'Tìm kiếm tồn kho theo tên sản phẩm, model...';
      case 'promotions':
        return 'Tìm kiếm khuyến mãi theo tên, mã, mô tả...';
      default:
        return 'Nhập từ khóa tìm kiếm...';
    }
  };

  const renderQuickFilters = () => {
    switch (searchType) {
      case 'products':
        return (
          <Space>
            <Select
              placeholder="Danh mục"
              allowClear
              style={{ width: 140 }}
              value={filters.categoryId || undefined}
              onChange={(value) => handleFilterChange('categoryId', value)}
            >
              {categories.map(category => (
                <Option key={category.DanhMucID} value={category.DanhMucID}>
                  {category.TenDanhMuc}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Thương hiệu"
              allowClear
              style={{ width: 120 }}
              value={filters.brand || undefined}
              onChange={(value) => handleFilterChange('brand', value)}
            >
              {brands.map(brand => (
                <Option key={brand} value={brand}>
                  {brand}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: 120 }}
              value={filters.stockStatus || undefined}
              onChange={(value) => handleFilterChange('stockStatus', value)}
            >
              <Option value="available">Còn hàng</Option>
              <Option value="out_of_stock">Hết hàng</Option>
            </Select>
          </Space>
        );
      case 'orders':
        return (
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={(value) => handleFilterChange('status', value)}
          >
            <Option value="ChuaXuLy">Chưa xử lý</Option>
            <Option value="DangGiao">Đang giao</Option>
            <Option value="HoanThanh">Hoàn thành</Option>
            <Option value="Huy">Đã hủy</Option>
          </Select>
        );
      case 'users':
        return (
          <Select
            placeholder="Vai trò"
            allowClear
            style={{ width: 120 }}
            value={filters.role || undefined}
            onChange={(value) => handleFilterChange('role', value)}
          >
            <Option value="KhachHang">Khách hàng</Option>
            <Option value="NhanVien">Nhân viên</Option>
          </Select>
        );
      case 'warranties':
        return (
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={(value) => handleFilterChange('status', value)}
          >
            <Option value="ConHan">Còn hạn</Option>
            <Option value="HetHan">Hết hạn</Option>
            <Option value="DangSua">Đang sửa</Option>
            <Option value="YeuCau">Yêu cầu</Option>
          </Select>
        );
      case 'categories':
        // Categories don't need dropdown filters, just text search
        return null;
      case 'inventory':
        return (
          <Select
            placeholder="Trạng thái tồn kho"
            allowClear
            style={{ width: 140 }}
            value={filters.stockStatus || undefined}
            onChange={(value) => handleFilterChange('stockStatus', value)}
          >
            <Option value="out">Hết hàng</Option>
            <Option value="low">Sắp hết (&lt; 10)</Option>
            <Option value="medium">Còn ít (10-49)</Option>
            <Option value="high">Còn nhiều (≥ 50)</Option>
          </Select>
        );
      case 'promotions':
        return (
          <Select
            placeholder="Trạng thái"
          allowClear
          style={{ width: 120 }}
          value={filters.status || undefined}
          onChange={(value) => handleFilterChange('status', value)}
        >
          <Option value="active">Đang hoạt động</Option>
          <Option value="upcoming">Sắp bắt đầu</Option>
          <Option value="expired">Đã kết thúc</Option>
        </Select>
      );
      default:
        return null;
    }
  };

  const renderAdvancedFilters = () => {
    if (searchType !== 'products') return null;

    return (
      <div style={{
        marginTop: 12,
        padding: '16px',
        background: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #f0f0f0'
      }}>
        <Row gutter={16} align="middle">
          <Col>
            <FilterOutlined style={{ color: '#004d99', fontSize: '16px' }} />
            <span style={{ marginLeft: 8, fontWeight: 500, color: '#004d99' }}>
              Bộ lọc nâng cao
            </span>
          </Col>
          <Col flex="auto">
            <Row gutter={16}>
              <Col span={6}>
                <InputNumber
                  placeholder="Giá từ (VNĐ)"
                  style={{ width: '100%' }}
                  value={filters.minPrice as number || undefined}
                  onChange={(value) => handleFilterChange('minPrice', value)}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: string | undefined) => {
                    const cleaned = value?.replace(/\$\s?|(,*)/g, '') || '';
                    return cleaned ? parseFloat(cleaned) : 0;
                  }}
                />
              </Col>
              <Col span={6}>
                <InputNumber
                  placeholder="Giá đến (VNĐ)"
                  style={{ width: '100%' }}
                  value={filters.maxPrice as number || undefined}
                  onChange={(value) => handleFilterChange('maxPrice', value)}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: string | undefined) => {
                    const cleaned = value?.replace(/\$\s?|(,*)/g, '') || '';
                    return cleaned ? parseFloat(cleaned) : 0;
                  }}
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Sắp xếp theo"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.sortBy || undefined}
                  onChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <Option value="name_asc">Tên A-Z</Option>
                  <Option value="name_desc">Tên Z-A</Option>
                  <Option value="price_asc">Giá thấp đến cao</Option>
                  <Option value="price_desc">Giá cao đến thấp</Option>
                  <Option value="newest">Mới nhất</Option>
                  <Option value="oldest">Cũ nhất</Option>
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Hiển thị"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.showOnly || undefined}
                  onChange={(value) => handleFilterChange('showOnly', value)}
                >
                  <Option value="active">Chỉ sản phẩm active</Option>
                  <Option value="inactive">Chỉ sản phẩm inactive</Option>
                  <Option value="featured">Chỉ sản phẩm nổi bật</Option>
                </Select>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <>
      <div style={{
        padding: '16px 0',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '16px'
      }}>
        <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
          <Input
            placeholder={placeholder || getDefaultPlaceholder()}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            size="large"
            prefix={<SearchOutlined />}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
            size="large"
          >
            Tìm kiếm
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            size="large"
          >
            Làm mới
          </Button>
        </Space.Compact>

        {renderQuickFilters()}

        {/* Hiển thị bộ lọc hiện tại */}
        {Object.keys(filters).length > 0 && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: '#f6f8fa', borderRadius: '6px' }}>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 500 }}>
              Bộ lọc hiện tại: {Object.entries(filters)
                .filter(([, value]) => value !== undefined && value !== '')
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </span>
          </div>
        )}
      </div>

      {renderAdvancedFilters()}
    </>
  );
};

export default SearchBar;

