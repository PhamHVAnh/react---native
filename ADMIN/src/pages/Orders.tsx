import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Select, message, Tag, Descriptions, Popconfirm, Image, Tooltip } from 'antd';
import { CreditCardOutlined, QrcodeOutlined, BankOutlined } from '@ant-design/icons';
import { EyeOutlined, DeleteOutlined, PrinterOutlined, DollarOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import type { Order } from '../services/orderService';
import dayjs from 'dayjs';
import { formatPrice } from '../utils/priceFormatter';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';
import { getImageUrl } from '../utils/imageUtils';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentStatusesLoading, setPaymentStatusesLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  // Use search hook
  const { searchLoading, searchOrders } = useSearch();

  useEffect(() => {
    loadOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPaymentStatuses = async (orderIds: string[]) => {
    if (orderIds.length === 0) return;

    setPaymentStatusesLoading(true);
    try {
      console.log('=== LOADING PAYMENT STATUSES ===');
      console.log('Order IDs:', orderIds);

      // Call the new batch API
      const response = await fetch('http://localhost:3000/api/payment/orders-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds }),
      });

      const data = await response.json();
      console.log('Payment statuses response:', data);

      if (data.success && data.data) {
        const statusMap: Record<string, string> = {};
        Object.keys(data.data).forEach(orderId => {
          statusMap[orderId] = data.data[orderId].status;
        });

        console.log('Final payment statuses map:', statusMap);
        setPaymentStatuses(statusMap);
      } else {
        console.error('Failed to load payment statuses:', data.message);
      }
    } catch (error) {
      console.error('Error loading payment statuses:', error);
    } finally {
      setPaymentStatusesLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.getAll();
      setOrders(response.data);

      // Load payment statuses for all orders
      const orderIds = response.data.map((order: Order) => order.DonHangID);
      await loadPaymentStatuses(orderIds);
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

      // Load payment statuses for filtered orders
      const orderIds = filteredOrders.map((order: Record<string, unknown>) => order.DonHangID as string);
      await loadPaymentStatuses(orderIds);
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

  const handlePrintInvoice = async (orderId: string) => {
    try {
      // Download PDF directly
      const pdfUrl = `http://localhost:3000/api/donhang/${orderId}/invoice.pdf`;
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `hoa-don-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Đang tải hóa đơn PDF...');
    } catch (error) {
      message.error('Không thể tạo hóa đơn PDF');
      console.error('Print invoice error:', error);
    }
  };

  const handleCheckPaymentStatus = async (orderId: string) => {
    try {
      // Luôn chuyển sang trang Payments, ngay cả khi không có thông tin thanh toán
      navigate(`/payments?orderId=${orderId}&showInvoice=true`);
      message.success('Đang chuyển đến trang thanh toán...');
    } catch (error) {
      console.error('Error navigating to payments:', error);
      message.error('Không thể chuyển đến trang thanh toán');
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

  const getPaymentMethodAndStatusDisplay = (order: Order) => {
    const paymentMethod = order.PhuongThucThanhToan;
    const orderStatus = order.TrangThai;
    const actualPaymentStatus = paymentStatuses[order.DonHangID];

    const getPaymentMethodIcon = (method: string) => {
      const iconMap: Record<string, React.ReactNode> = {
        'COD': <DollarOutlined style={{ fontSize: '16px' }} />,
        'QR': <QrcodeOutlined style={{ fontSize: '16px' }} />,
        'CARD': <CreditCardOutlined style={{ fontSize: '16px' }} />,
        'MOMO': <BankOutlined style={{ fontSize: '16px' }} />,
        'ViDienTu': <BankOutlined style={{ fontSize: '16px' }} />,
        'TheNganHang': <CreditCardOutlined style={{ fontSize: '16px' }} />,
        'CARD_PAYMENT': <CreditCardOutlined style={{ fontSize: '16px' }} />,
        'VIETQR': <QrcodeOutlined style={{ fontSize: '16px' }} />
      };
      return iconMap[method] || <DollarOutlined style={{ fontSize: '16px' }} />;
    };

    // Show loading state if payment statuses are still loading
    if (paymentStatusesLoading && paymentMethod !== 'COD') {
      return (
        <Tooltip title="Đang tải thông tin thanh toán...">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {getPaymentMethodIcon(paymentMethod)}
            <Tag color="default" icon={<ClockCircleOutlined />} style={{ margin: 0, fontSize: '11px' }}>
              Đang tải...
            </Tag>
          </div>
        </Tooltip>
      );
    }

    console.log('=== PAYMENT STATUS DISPLAY DEBUG ===');
    console.log('Order ID:', order.DonHangID);
    console.log('Payment method:', paymentMethod, 'Type:', typeof paymentMethod);
    console.log('Order status:', orderStatus);
    console.log('Actual payment status:', actualPaymentStatus, 'Type:', typeof actualPaymentStatus);
    console.log('Is MOMO?', paymentMethod === 'MOMO');
    console.log('Is PENDING?', actualPaymentStatus === 'PENDING');

    if (paymentMethod === 'COD') {
      // COD: Chỉ thanh toán khi đơn hàng hoàn thành
      const isPaid = orderStatus === 'HoanThanh';
      const statusText = isPaid ? 'Đã thanh toán' : 'Chưa thanh toán';

      return (
        <Tooltip title={`COD - ${statusText}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {getPaymentMethodIcon(paymentMethod)}
            <Tag
              color={isPaid ? "green" : "orange"}
              icon={isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              style={{ margin: 0, fontSize: '11px' }}
            >
              {statusText}
            </Tag>
          </div>
        </Tooltip>
      );
    } else {
      // Các phương thức khác: Lấy trạng thái thực tế từ PaymentTransactions
      const statusMap: Record<string, {
        color: string;
        icon: React.ReactNode;
        text: string;
      }> = {
        'SUCCESS': {
          color: 'green',
          icon: <CheckCircleOutlined />,
          text: 'Thành công'
        },
        'PENDING': {
          color: 'orange',
          icon: <ClockCircleOutlined />,
          text: 'Chưa xử lý'
        },
        'FAILED': {
          color: 'red',
          icon: <CloseCircleOutlined />,
          text: 'Thất bại'
        },
        'CANCELLED': {
          color: 'gray',
          icon: <CloseCircleOutlined />,
          text: 'Đã hủy'
        },
        'NO_PAYMENT_RECORD': {
          color: 'purple',
          icon: <ClockCircleOutlined />,
          text: 'Chưa có thanh toán'
        },
        'ERROR': {
          color: 'red',
          icon: <CloseCircleOutlined />,
          text: 'Lỗi tải dữ liệu'
        },
      };

      const methodTextMap: Record<string, string> = {
        'QR': 'QR Code ngân hàng',
        'CARD': 'Thanh toán bằng thẻ',
        'MOMO': 'Ví điện tử MoMo',
        'ViDienTu': 'Ví điện tử',
        'TheNganHang': 'Thẻ ngân hàng',
        'CARD_PAYMENT': 'Thanh toán bằng thẻ',
        'VIETQR': 'QR Code ngân hàng'
      };
      const methodText = methodTextMap[paymentMethod] || paymentMethod;

      let statusInfo;
      // Nếu là MOMO và PENDING, hiển thị SUCCESS (vì user đã thanh toán)
      let effectiveStatus = actualPaymentStatus;

      // MOMO: Nếu có bất kỳ payment record nào (kể cả PENDING), coi như đã thanh toán
      if (paymentMethod === 'MOMO') {
        console.log('🔍 MOMO Payment detected!');
        console.log('   - actualPaymentStatus:', actualPaymentStatus);
        console.log('   - Will treat as SUCCESS');

        // Nếu là PENDING hoặc không có status (undefined/null), coi như SUCCESS
        if (!actualPaymentStatus || actualPaymentStatus === 'PENDING') {
          effectiveStatus = 'SUCCESS';
          console.log('   ✅ Changed to SUCCESS');
        }
      }

      if (effectiveStatus && statusMap[effectiveStatus]) {
        statusInfo = statusMap[effectiveStatus];
        console.log('Using actual payment status:', effectiveStatus, statusInfo);
      } else {
        // Fallback nếu không có thông tin thanh toán
        console.log('Using fallback status');
        statusInfo = {
          color: 'blue',
          icon: <DollarOutlined />,
          text: 'Đã thanh toán'
        };
      }

      const tooltipText = `${methodText} - ${statusInfo.text}`;

      return (
        <Tooltip title={tooltipText}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {getPaymentMethodIcon(paymentMethod)}
            <Tag
              color={statusInfo.color}
              icon={statusInfo.icon}
              style={{ margin: 0, fontSize: '11px' }}
            >
              {statusInfo.text}
            </Tag>
          </div>
        </Tooltip>
      );
    }
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
    // Ẩn cột Mã đơn hàng
    // {
    //   title: 'Mã đơn hàng',
    //   dataIndex: 'DonHangID',
    //   key: 'DonHangID',
    //   render: (text: string) => text.substring(0, 8) + '...',
    // },
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
      title: 'Thanh toán',
      key: 'paymentMethodAndStatus',
      render: (_: unknown, record: Order) => {
        return getPaymentMethodAndStatusDisplay(record);
      },
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
            title="Xem chi tiết"
          />
          <Button
            type="link"
            icon={<DollarOutlined />}
            onClick={() => handleCheckPaymentStatus(record.DonHangID)}
            title="Kiểm tra trạng thái thanh toán"
          />
          <Button
            type="link"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintInvoice(record.DonHangID)}
            title="In hóa đơn"
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
              title="Xóa đơn hàng"
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
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} đơn hàng`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 10);
          },
        }}
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
              <Descriptions.Item label="Stt" span={2}>
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
                      src={getImageUrl(hinhAnh)}
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

