import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Select, message, Tag, Descriptions, Popconfirm, Image } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { orderService } from '../services/orderService';
import type { Order } from '../services/orderService';
import dayjs from 'dayjs';
import { formatPrice } from '../utils/priceFormatter';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});

  // Use search hook
  const { searchLoading, searchOrders } = useSearch();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getAll();
      setOrders(response.data);
    } catch {
      message.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (orderId: string) => {
    try {
      const response = await orderService.getById(orderId);
      setSelectedOrder(response.data);
      setDetailVisible(true);
    } catch {
      message.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const handleSearch = async (query: string, filters?: Record<string, unknown>) => {
    setCurrentFilters(filters || {});

    try {
      // Always fetch fresh data and search client-side
      const response = await orderService.getAll();
      const allOrders = response.data;

      // Use the search hook for client-side search
      const filteredOrders = await searchOrders(allOrders as unknown as Record<string, unknown>[], query, {
        status: filters?.status as string
      });

      setOrders(filteredOrders as unknown as Order[]);
    } catch (error) {
      message.error('Không thể tìm kiếm đơn hàng');
      console.error('Search error:', error);
    }
  };

  const handleResetSearch = () => {
    setCurrentFilters({});
    loadOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await orderService.update(orderId, { TrangThai: newStatus });
      message.success('Cập nhật trạng thái thành công');
      loadOrders();
    } catch {
      message.error('Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      await orderService.delete(orderId);
      message.success('Xóa đơn hàng thành công');
      loadOrders();
    } catch {
      message.error('Không thể xóa đơn hàng');
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      ChuaXuLy: 'orange',
      DangGiao: 'blue',
      HoanThanh: 'green',
      Huy: 'red',
    };
    return statusMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      ChuaXuLy: 'Chưa xử lý',
      DangGiao: 'Đang giao',
      HoanThanh: 'Hoàn thành',
      Huy: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'DonHangID',
      key: 'DonHangID',
      render: (text: string) => text.substring(0, 8) + '...',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'HoTen',
      key: 'HoTen',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'SoDienThoai',
      key: 'SoDienThoai',
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'NgayDat',
      key: 'NgayDat',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'TongTien',
      key: 'TongTien',
      render: (value: number) => formatPrice(value),
    },
    {
      title: 'Giảm giá',
      dataIndex: 'GiamGia',
      key: 'GiamGia',
      render: (value: number) => formatPrice(value),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'ThanhTien',
      key: 'ThanhTien',
      render: (value: number) => <strong>{formatPrice(value)}</strong>,
    },
    {
      title: 'Thanh toán',
      dataIndex: 'PhuongThucThanhToan',
      key: 'PhuongThucThanhToan',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      render: (status: string, record: Order) => (
        <Select
          value={status}
          style={{ width: 140 }}
          onChange={(value) => handleStatusChange(record.DonHangID, value)}
        >
          <Select.Option value="ChuaXuLy">
            <Tag color="orange">Chưa xử lý</Tag>
          </Select.Option>
          <Select.Option value="DangGiao">
            <Tag color="blue">Đang giao</Tag>
          </Select.Option>
          <Select.Option value="HoanThanh">
            <Tag color="green">Hoàn thành</Tag>
          </Select.Option>
          <Select.Option value="Huy">
            <Tag color="red">Đã hủy</Tag>
          </Select.Option>
        </Select>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: Order) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.DonHangID)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa đơn hàng này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.DonHangID)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>Quản lý đơn hàng</h1>
      </div>

      <SearchBar
        onSearch={handleSearch}
        onReset={handleResetSearch}
        searchType="orders"
        loading={searchLoading}
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
        dataSource={orders}
        rowKey="DonHangID"
        loading={loading}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="Chi tiết đơn hàng"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã đơn hàng" span={2}>
                {selectedOrder.DonHangID}
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {selectedOrder.HoTen}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedOrder.SoDienThoai}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {selectedOrder.Email}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedOrder.DiaChi}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {dayjs(selectedOrder.NgayDat).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getStatusColor(selectedOrder.TrangThai)}>
                  {getStatusText(selectedOrder.TrangThai)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                {selectedOrder.PhuongThucThanhToan}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                {formatPrice(selectedOrder.TongTien)}
              </Descriptions.Item>
              <Descriptions.Item label="Giảm giá">
                {formatPrice(selectedOrder.GiamGia)}
              </Descriptions.Item>
              <Descriptions.Item label="Thành tiền">
                <strong>{formatPrice(selectedOrder.ThanhTien)}</strong>
              </Descriptions.Item>
            </Descriptions>

            <h3 style={{ marginTop: 24, marginBottom: 16 }}>Chi tiết sản phẩm</h3>
            <Table
              columns={[
                {
                  title: 'Ảnh',
                  dataIndex: 'HinhAnh',
                  key: 'HinhAnh',
                  width: 80,
                  render: (hinhAnh: string) => (
                    <Image
                      src={hinhAnh ? `http://localhost:3000${hinhAnh}` : undefined}
                      alt="Sản phẩm"
                      width={50}
                      height={50}
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                      placeholder={
                        <div style={{
                          width: 50,
                          height: 50,
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          color: '#999'
                        }}>
                          📷
                        </div>
                      }
                    />
                  ),
                },
                {
                  title: 'Tên sản phẩm',
                  dataIndex: 'TenSanPham',
                  key: 'TenSanPham',
                },
                {
                  title: 'Số lượng',
                  dataIndex: 'SoLuong',
                  key: 'SoLuong',
                },
                {
                  title: 'Đơn giá',
                  dataIndex: 'Gia',
                  key: 'Gia',
                  render: (price: number) => formatPrice(price),
                },
                {
                  title: 'Thành tiền',
                  key: 'total',
                  render: (_: unknown, record: Record<string, unknown>) =>
                    formatPrice((record.SoLuong as number) * (record.Gia as number)),
                },
              ]}
              dataSource={(selectedOrder.chiTiet || []) as unknown as Record<string, unknown>[]}
              rowKey="ChiTietID"
              pagination={false}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;

