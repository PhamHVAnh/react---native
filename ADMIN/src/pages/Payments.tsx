import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
  Tabs,
  Descriptions,
  Image,
  Alert,
  Input,
} from 'antd';
import {
  DollarOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  QrcodeOutlined,
  CreditCardOutlined,
  BankOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { paymentService, type PaymentTransaction, type PaymentStats, type PaymentMethod } from '../services/paymentService';
import { formatPrice } from '../utils/priceFormatter';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const Payments: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<PaymentTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    search: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsRes, statsRes, methodsRes] = await Promise.all([
        paymentService.getAllTransactions({
          page: 1,
          limit: 1000, // Load tất cả data
        }),
        paymentService.getPaymentStats(),
        paymentService.getPaymentMethods(),
      ]);

      setAllTransactions(transactionsRes.data);
      setStats(statsRes);
      setPaymentMethods(methodsRes);
    } catch (error) {
      console.error('Error loading payment data:', error);
      message.error('Không thể tải dữ liệu thanh toán');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter data client-side
  const filterTransactions = useCallback(() => {
    let filtered = [...allTransactions];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(t => t.Status === filters.status);
    }

    // Filter by payment method
    if (filters.paymentMethod) {
      filtered = filtered.filter(t => t.PaymentMethod === filters.paymentMethod);
    }

    // Filter by date range
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = filters.dateRange[0].startOf('day');
      const endDate = filters.dateRange[1].endOf('day');
      filtered = filtered.filter(t => {
        const transactionDate = dayjs(t.CreatedAt);
        return transactionDate.isAfter(startDate) && transactionDate.isBefore(endDate);
      });
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.PaymentID.toLowerCase().includes(searchTerm) ||
        t.OrderID.toLowerCase().includes(searchTerm) ||
        t.TransactionRef.toLowerCase().includes(searchTerm) ||
        (t.HoTen && t.HoTen.toLowerCase().includes(searchTerm)) ||
        (t.SoDienThoai && t.SoDienThoai.toLowerCase().includes(searchTerm)) ||
        (t.Email && t.Email.toLowerCase().includes(searchTerm)) ||
        (t.DiaChi && t.DiaChi.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredTransactions(filtered);
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      current: 1
    }));
  }, [allTransactions, filters]);

  const loadSpecificTransaction = useCallback(async (orderId: string) => {
    try {
      // Use the new endpoint to get transaction by order ID
      const response = await fetch(`http://localhost:3000/api/payment/order/${orderId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setSelectedTransaction(data.data);
        setDetailModalVisible(true);
        message.success('Đã tải thông tin hóa đơn');
      } else {
        message.error('Không tìm thấy giao dịch thanh toán cho đơn hàng này');
      }
    } catch (error) {
      console.error('Error loading specific transaction:', error);
      message.error('Không thể tải thông tin hóa đơn cho đơn hàng này');
    }
  }, []);

  useEffect(() => {
    loadAllData();

    // Check if there's an orderId in URL params to show specific invoice
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const showInvoice = urlParams.get('showInvoice');

    if (orderId && showInvoice === 'true') {
      // Load specific transaction and show modal
      loadSpecificTransaction(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter data when filters change
  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]);

  // Get paginated data
  const getPaginatedData = () => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredTransactions.slice(start, end);
  };

  const handleStatusUpdate = async (transactionRef: string, newStatus: string) => {
    try {
      await paymentService.updatePaymentStatus(transactionRef, newStatus);
      message.success('Cập nhật trạng thái thành công');
      loadAllData();
      setUpdateModalVisible(false);
    } catch (error) {
      console.error('Error updating payment status:', error);
      message.error('Không thể cập nhật trạng thái');
    }
  };


  const getStatusColor = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
      PENDING: { color: 'orange', icon: <ClockCircleOutlined /> },
      SUCCESS: { color: 'green', icon: <CheckCircleOutlined /> },
      FAILED: { color: 'red', icon: <CloseCircleOutlined /> },
      CANCELLED: { color: 'gray', icon: <StopOutlined /> },
    };
    return statusMap[status] || { color: 'default', icon: null };
  };

  const getPaymentMethodIcon = (method: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      QR: <QrcodeOutlined />,
      CARD: <CreditCardOutlined />,
      COD: <BankOutlined />,
      MOMO: <BankOutlined />,
    };
    return iconMap[method] || <DollarOutlined />;
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => {
        const start = (pagination.current - 1) * pagination.pageSize;
        return start + index + 1;
      },
    },
    // Ẩn cột Mã giao dịch
    // {
    //   title: 'Mã giao dịch',
    //   dataIndex: 'PaymentID',
    //   key: 'PaymentID',
    //   render: (text: string) => (
    //     <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
    //       {text.substring(0, 8)}...
    //     </span>
    //   ),
    // },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: PaymentTransaction) => {
        // Ưu tiên hiển thị thông tin từ bảng đơn hàng (HoTen, SoDienThoai)
        if (record.HoTen || record.SoDienThoai) {
          return (
            <div>
              <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                {record.HoTen || 'Chưa có thông tin'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.SoDienThoai || 'Chưa có SĐT'}
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                Đơn: {record.OrderID}
              </div>
            </div>
          );
        }

        // Nếu không có thông tin từ đơn hàng, thử lấy từ CustomerInfo
        if (record.CustomerInfo && typeof record.CustomerInfo === 'object') {
          const customerInfo = record.CustomerInfo as { name?: string; phone?: string; email?: string };
          return (
            <div>
              <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
                {customerInfo.name || 'Khách hàng'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {customerInfo.phone || customerInfo.email || 'Thông tin thanh toán'}
              </div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                Đơn: {record.OrderID}
              </div>
            </div>
          );
        }

        // Cuối cùng, hiển thị thông tin cơ bản
        return (
          <div>
            <div style={{ fontWeight: 'bold', color: '#666' }}>
              Khách hàng
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {record.OrderID}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Phương thức',
      dataIndex: 'PaymentMethod',
      key: 'PaymentMethod',
      render: (method: string) => (
        <Space>
          {getPaymentMethodIcon(method)}
          <span>{method}</span>
        </Space>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'Amount',
      key: 'Amount',
      render: (amount: number) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          {formatPrice(amount)}
        </span>
      ),
      sorter: (a: PaymentTransaction, b: PaymentTransaction) => a.Amount - b.Amount,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'Status',
      render: (status: string, record: PaymentTransaction) => {
        // Nếu là MOMO và PENDING, hiển thị SUCCESS
        let displayStatus = status;
        if (record.PaymentMethod === 'MOMO' && status === 'PENDING') {
          displayStatus = 'SUCCESS';
        }

        const { color, icon } = getStatusColor(displayStatus);
        return (
          <Tag color={color} icon={icon}>
            {displayStatus}
          </Tag>
        );
      },
      filters: [
        { text: 'Chưa xử lý', value: 'PENDING' },
        { text: 'Thành công', value: 'SUCCESS' },
        { text: 'Thất bại', value: 'FAILED' },
        { text: 'Đã hủy', value: 'CANCELLED' },
      ],
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'PaymentProvider',
      key: 'PaymentProvider',
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a: PaymentTransaction, b: PaymentTransaction) =>
        new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime(),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: unknown, record: PaymentTransaction) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedTransaction(record);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
          {record.Status === 'PENDING' && (
            <Tooltip title="Cập nhật trạng thái">
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={() => {
                  setSelectedTransaction(record);
                  setUpdateModalVisible(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const statusUpdateForm = (
    <Form
      layout="vertical"
      onFinish={(values) => {
        if (selectedTransaction) {
          handleStatusUpdate(selectedTransaction.TransactionRef, values.status);
        }
      }}
    >
      <Form.Item
        name="status"
        label="Trạng thái mới"
        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
      >
        <Select placeholder="Chọn trạng thái">
          <Option value="SUCCESS">Thành công</Option>
          <Option value="FAILED">Thất bại</Option>
          <Option value="CANCELLED">Đã hủy</Option>
        </Select>
      </Form.Item>
    </Form>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <DollarOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
            Quản lý thanh toán
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: 16 }}>
          Quản lý và theo dõi các giao dịch thanh toán
        </p>
      </div>

      {/* Thống kê tổng quan */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng giao dịch"
                value={stats.totalTransactions}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng số tiền"
                value={stats.totalAmount}
                formatter={(value) => formatPrice(Number(value))}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tỷ lệ thành công"
                value={stats.successRate}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Chưa xử lý"
                value={stats.pendingCount}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Bộ lọc */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Trạng thái"
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="PENDING">Chưa xử lý</Option>
              <Option value="SUCCESS">Thành công</Option>
              <Option value="FAILED">Thất bại</Option>
              <Option value="CANCELLED">Đã hủy</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Phương thức"
              value={filters.paymentMethod}
              onChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}
              allowClear
              style={{ width: '100%' }}
            >
              {paymentMethods.map(method => (
                <Option key={method.id} value={method.id}>
                  {method.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm theo mã giao dịch (VIETQR_xxx), mã đơn hàng, tên khách hàng..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onPressEnter={filterTransactions}
              style={{ marginBottom: 8 }}
            />
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={filterTransactions}
              >
                Tìm kiếm
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setFilters({
                    status: '',
                    paymentMethod: '',
                    dateRange: null,
                    search: '',
                  } as typeof filters);
                  setPagination(prev => ({ ...prev, current: 1 }));
                  loadAllData();
                }}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bảng giao dịch */}
      <Card>
        <Table
          columns={columns}
          dataSource={getPaginatedData()}
          rowKey="PaymentID"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} giao dịch`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 10,
              }));
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal chi tiết giao dịch */}
      <Modal
        title="Chi tiết giao dịch"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTransaction && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="Thông tin cơ bản" key="info">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Mã giao dịch" span={2}>
                  <span style={{ fontFamily: 'monospace' }}>
                    {selectedTransaction.PaymentID}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Khách hàng" span={2}>
                  {(() => {
                    // Ưu tiên thông tin từ bảng đơn hàng
                    if (selectedTransaction.HoTen || selectedTransaction.SoDienThoai) {
                      return (
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                            {selectedTransaction.HoTen || 'Chưa có thông tin'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Đơn hàng: {selectedTransaction.OrderID}
                          </div>
                        </div>
                      );
                    }

                    // Thử lấy từ CustomerInfo
                    if (selectedTransaction.CustomerInfo && typeof selectedTransaction.CustomerInfo === 'object') {
                      const customerInfo = selectedTransaction.CustomerInfo as { name?: string; phone?: string; email?: string };
                      return (
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
                            {customerInfo.name || 'Khách hàng'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Đơn hàng: {selectedTransaction.OrderID}
                          </div>
                        </div>
                      );
                    }

                    // Cuối cùng
                    return (
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#666' }}>
                          Khách hàng
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          Đơn hàng: {selectedTransaction.OrderID}
                        </div>
                      </div>
                    );
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {selectedTransaction.SoDienThoai ||
                    (selectedTransaction.CustomerInfo && typeof selectedTransaction.CustomerInfo === 'object'
                      ? (selectedTransaction.CustomerInfo as { phone?: string }).phone
                      : 'Chưa có SĐT')
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedTransaction.Email ||
                    (selectedTransaction.CustomerInfo && typeof selectedTransaction.CustomerInfo === 'object'
                      ? (selectedTransaction.CustomerInfo as { email?: string }).email
                      : 'Chưa có email')
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {selectedTransaction.DiaChi || 'Chưa có địa chỉ'}
                </Descriptions.Item>
                <Descriptions.Item label="Phương thức">
                  <Space>
                    {getPaymentMethodIcon(selectedTransaction.PaymentMethod)}
                    {selectedTransaction.PaymentMethod}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền">
                  <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                    {formatPrice(selectedTransaction.Amount)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {(() => {
                    // Nếu là MOMO và PENDING, hiển thị SUCCESS
                    let displayStatus = selectedTransaction.Status;
                    if (selectedTransaction.PaymentMethod === 'MOMO' && selectedTransaction.Status === 'PENDING') {
                      displayStatus = 'SUCCESS';
                    }

                    return (
                      <Tag
                        color={getStatusColor(displayStatus).color}
                        icon={getStatusColor(displayStatus).icon}
                      >
                        {displayStatus}
                      </Tag>
                    );
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Nhà cung cấp">
                  {selectedTransaction.PaymentProvider}
                </Descriptions.Item>
                <Descriptions.Item label="Mã tham chiếu">
                  {selectedTransaction.TransactionRef}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {dayjs(selectedTransaction.CreatedAt).format('DD/MM/YYYY HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày cập nhật">
                  {dayjs(selectedTransaction.UpdatedAt).format('DD/MM/YYYY HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            {selectedTransaction.QRCode && (
              <TabPane tab="QR Code" key="qr">
                <div style={{ textAlign: 'center' }}>
                  <h4>Mã QR thanh toán</h4>
                  <Image
                    src={selectedTransaction.QRCode}
                    alt="QR Code"
                    style={{ maxWidth: 300, maxHeight: 300 }}
                  />
                  {selectedTransaction.QRContent && (
                    <div style={{ marginTop: 16 }}>
                      <Alert
                        message="Nội dung QR"
                        description={selectedTransaction.QRContent}
                        type="info"
                        showIcon
                      />
                    </div>
                  )}
                </div>
              </TabPane>
            )}

            {selectedTransaction.CustomerInfo && (
              <TabPane tab="Thông tin khách hàng" key="customer">
                <pre style={{
                  background: '#f5f5f5',
                  padding: 16,
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap'
                }}>
                  {JSON.stringify(
                    typeof selectedTransaction.CustomerInfo === 'string'
                      ? JSON.parse(selectedTransaction.CustomerInfo)
                      : selectedTransaction.CustomerInfo,
                    null,
                    2
                  )}
                </pre>
              </TabPane>
            )}
          </Tabs>
        )}
      </Modal>

      {/* Modal cập nhật trạng thái */}
      <Modal
        title="Cập nhật trạng thái thanh toán"
        open={updateModalVisible}
        onCancel={() => setUpdateModalVisible(false)}
        footer={null}
      >
        {statusUpdateForm}
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <Space>
            <Button onClick={() => setUpdateModalVisible(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={() => {
                const form = document.querySelector('form');
                if (form) {
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                  form.dispatchEvent(submitEvent);
                }
              }}
            >
              Cập nhật
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default Payments;
