import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Image, Tag, Tooltip, Card, Modal } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../services/productService';
import { categoryService } from '../services/categoryService';
import type { Category } from '../services/categoryService';
import { formatPrice } from '../utils/priceFormatter';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';
import { getValidImageUrls } from '../utils/imageUtils';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedProductImages, setSelectedProductImages] = useState<string[]>([]);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Use search hook
  const { searchLoading, searchProducts } = useSearch();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch {
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch {
      message.error('Không thể tải danh sách danh mục');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.DanhMucID === categoryId);
    return category?.TenDanhMuc || 'N/A';
  };

  const handleAdd = () => {
    navigate('/products/new');
  };

  const handleEdit = (productId: string) => {
    navigate(`/products/edit/${productId}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await productService.delete(id);
      message.success('Xóa sản phẩm thành công');
      loadProducts();
    } catch {
      message.error('Không thể xóa sản phẩm');
    }
  };

  const handleViewImages = (images: string[], productName: string) => {
    const validImages = getValidImageUrls(images);
    if (validImages.length === 0) {
      message.warning('Sản phẩm này chưa có ảnh nào');
      return;
    }
    setSelectedProductImages(validImages);
    setSelectedProductName(productName);
    setImageModalVisible(true);
  };

  const handleSearch = async (query: string, filters?: Record<string, unknown>) => {
    setCurrentFilters(filters || {});

    try {
      // Always fetch fresh data and search client-side
      const response = await productService.getAll();
      const allProducts = response.data;

      // Use the search hook for client-side search
      const filteredProducts = await searchProducts(allProducts as unknown as Record<string, unknown>[], query, {
        categoryId: filters?.categoryId as string,
        minPrice: filters?.minPrice as number,
        maxPrice: filters?.maxPrice as number,
        brand: filters?.brand as string,
        stockStatus: filters?.stockStatus as string,
        sortBy: filters?.sortBy as string,
        showOnly: filters?.showOnly as string,
      });

      setProducts(filteredProducts as unknown as Product[]);
    } catch (error) {
      message.error('Không thể tìm kiếm sản phẩm');
      console.error('Search error:', error);
    }
  };

  const handleResetSearch = () => {
    setCurrentFilters({});
    loadProducts();
  };

  const getUniqueBrands = (products: Product[]): string[] => {
    const brands = products
      .map(product => product.ThuongHieu)
      .filter((brand): brand is string => brand !== null && brand !== undefined && brand.trim() !== '');
    return [...new Set(brands)].sort();
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => {
        return (currentPage - 1) * pageSize + index + 1;
      },
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'HinhAnh',
      key: 'HinhAnh',
      width: 120,
      render: (images: string[], record: Product) => {
        const validImages = getValidImageUrls(images);

        if (validImages.length === 0) {
          return <div style={{ textAlign: 'center', color: '#999' }}>Không có ảnh</div>;
        }

        const handleImageClick = () => {
          handleViewImages(images, record.TenSanPham);
        };

        const imageUrl = validImages[0];

        return (
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleImageClick}>
            <Image
              src={imageUrl || undefined}
              width={80}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN..."
            />
            {validImages.length > 1 && (
              <div style={{
                marginTop: 4,
                fontSize: 10,
                color: '#666',
                fontWeight: 500
              }}>
                +{validImages.length - 1} ảnh khác
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'TenSanPham',
      key: 'TenSanPham',
      render: (text: string, record: Product) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>Model: {record.Model}</div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'DanhMucID',
      key: 'DanhMucID',
      render: (_: unknown, record: Product) => (
        <Tag color="blue">{getCategoryName(record.DanhMucID)}</Tag>
      ),
    },
    {
      title: 'Thương hiệu',
      dataIndex: 'ThuongHieu',
      key: 'ThuongHieu',
      width: 120,
    },
    {
      title: 'Thuộc tính',
      dataIndex: 'ThuocTinh',
      key: 'ThuocTinh',
      width: 200,
      render: (attributes: Record<string, unknown>) => {
        if (!attributes || Object.keys(attributes).length === 0) {
          return <span style={{ color: '#999' }}>Chưa có</span>;
        }

        // Lấy 3 thuộc tính đầu tiên để hiển thị
        const entries = Object.entries(attributes).slice(0, 3);
        const displayText = entries
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');

        const hasMore = Object.keys(attributes).length > 3;

        return (
          <Tooltip
            title={
              <div>
                {Object.entries(attributes).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: 4 }}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
              </div>
            }
          >
            <div style={{
              fontSize: 12,
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <div style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {displayText}
                {hasMore && '...'}
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Giá bán',
      key: 'price',
      render: (_: unknown, record: Product) => {
        // GiamGia là phần trăm (0-100), tính giá cuối cùng
        const discountPercent = record.GiamGia || 0;
        const finalPrice = record.GiaGoc * (1 - discountPercent / 100);
        return (
          <div>
            <div style={{ fontWeight: 500, color: '#ff4d4f' }}>
              {formatPrice(finalPrice)}
            </div>
            {record.GiamGia > 0 && (
              <div style={{ fontSize: 12, textDecoration: 'line-through', color: '#999' }}>
                {formatPrice(record.GiaGoc)}
              </div>
            )}
            {record.GiamGia > 0 && (
              <div style={{ fontSize: 11, color: '#52c41a', fontWeight: 500 }}>
                -{discountPercent}%
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Bảo hành',
      dataIndex: 'BaoHanhThang',
      key: 'BaoHanhThang',
      width: 100,
      render: (months: number) => `${months} tháng`,
    },
    {
      title: 'Số lượng tồn kho',
      dataIndex: 'SoLuongTon',
      key: 'SoLuongTon',
      width: 120,
      sorter: (a: Product, b: Product) => (a.SoLuongTon || 0) - (b.SoLuongTon || 0),
      render: (_: number, record: Product) => {
        const stockQuantity = record.SoLuongTon || 0;
        const isOutOfStock = stockQuantity <= 0;
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontWeight: 600,
              color: isOutOfStock ? '#ff4d4f' : stockQuantity < 10 ? '#faad14' : '#52c41a',
              fontSize: 14
            }}>
              {stockQuantity}
            </div>
            <div style={{
              fontSize: 11,
              color: isOutOfStock ? '#ff4d4f' : stockQuantity < 10 ? '#faad14' : '#52c41a',
              fontWeight: 500
            }}>
              {isOutOfStock ? 'Hết hàng' : stockQuantity < 10 ? 'Sắp hết' : 'Còn hàng'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: Product) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.SanPhamID)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa sản phẩm này?"
            onConfirm={() => handleDelete(record.SanPhamID)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <ShoppingOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
            Quản lý sản phẩm
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: 16 }}>
          Quản lý danh sách sản phẩm điện máy
        </p>
      </div>

      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f0f0f0',
        }}
        styles={{ body: { padding: '24px' } }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ThunderboltOutlined style={{ color: '#004d99', fontSize: 16 }} />
              <span style={{ fontSize: 18, fontWeight: '600' }}>Danh sách sản phẩm</span>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{
                background: '#004d99',
                border: 'none',
                borderRadius: '8px',
                height: '40px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 77, 153, 0.3)',
              }}
            >
              Thêm sản phẩm
            </Button>
          </div>
        }
      >
        <SearchBar
          onSearch={handleSearch}
          onReset={handleResetSearch}
          searchType="products"
          loading={searchLoading}
          categories={categories}
          brands={getUniqueBrands(products)}
        />

        {Object.keys(currentFilters).length > 0 && (
          <div style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Đang áp dụng bộ lọc:
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {Object.entries(currentFilters)
                .filter(([, value]) => value !== undefined && value !== '')
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </div>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={products}
          rowKey="SanPhamID"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
            style: { marginTop: 24 },
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          style={{
            borderRadius: '8px',
          }}
        />
      </Card>

      {/* Image Gallery Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#004d99' }} />
            <span>Hình ảnh sản phẩm: {selectedProductName}</span>
          </div>
        }
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setImageModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={900}
        style={{ top: 20 }}
      >
        <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
          {selectedProductImages.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              padding: 16
            }}>
              {selectedProductImages.map((imageUrl, index) => (
                <div key={index} style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                  padding: 8,
                  background: '#fafafa',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 8, fontSize: 14 }}>
                    Ảnh {index + 1}
                  </div>
                  <Image
                    src={imageUrl}
                    alt={`${selectedProductName} - Ảnh ${index + 1}`}
                    style={{
                      width: '100%',
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 4
                    }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN..."
                    preview={{
                      mask: <div style={{ color: 'white' }}>Xem ảnh</div>
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Products;

