import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Statistic,
  Select,
  DatePicker,
  Space,
  Tabs,
  Tag,
  Typography,
  Spin,
  Button,
  Tooltip,
  message
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  GiftOutlined,
  BarChartOutlined,
  FilePdfOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { statisticsService } from '../services/statisticsService';
import { formatPrice } from '../utils/priceFormatter';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Types
interface DashboardStats {
  revenueStats?: {
    totalRevenue: number;
    completedRevenue: number;
    pendingRevenue: number;
    completedOrders: number;
  };
  newCustomers?: number;
  totalStats?: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    activePromotions: number;
  };
  orderStatusStats?: Array<{
    TrangThai: string;
    count: number;
  }>;
}

interface RevenueStats {
  period: string;
  orderCount: number;
  completedRevenue: number;
  pendingRevenue: number;
  totalRevenue: number;
  avgOrderValue: number;
}

interface ProductStats {
  topSelling?: Array<{
    SanPhamID: string;
    TenSanPham: string;
    ThuongHieu: string;
    HinhAnh: string;
    totalSold: number;
    totalRevenue: number;
    orderCount: number;
  }>;
  categoryStats?: Array<{
    TenDanhMuc: string;
    totalSold: number;
  }>;
}

interface CustomerStats {
  topCustomers?: Array<{
    UserID: string;
    HoTen: string;
    Email: string;
    SoDienThoai: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
  }>;
  monthlyCustomers?: Array<{
    month: string;
    newCustomers: number;
  }>;
}


const Statistics: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats[]>([]);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const loadAllStats = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, revenueRes, productRes, customerRes] = await Promise.all([
        statisticsService.getDashboardStats(),
        statisticsService.getRevenueStats({
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          groupBy
        }),
        statisticsService.getProductStats(),
        statisticsService.getCustomerStats()
      ]);

      setDashboardStats(dashboardRes.data);
      setRevenueStats(revenueRes.data);
      setProductStats(productRes.data);
      setCustomerStats(customerRes.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
      message.error('Có lỗi khi tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  }, [dateRange, groupBy]);

  useEffect(() => {
    loadAllStats();
  }, [loadAllStats]);

  // Export Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Helper function to format currency
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(value);
      };

      // Helper function to set column widths
      const setColumnWidths = (ws: any, widths: number[]) => {
        ws['!cols'] = widths.map(w => ({ wch: w }));
      };

      // 1. Overview Sheet với styling đẹp
      const overviewData = [
        ['BÁO CÁO THỐNG KÊ TỔNG QUAN'],
        [`Thời gian: ${dateRange[0].format('DD/MM/YYYY')} - ${dateRange[1].format('DD/MM/YYYY')}`],
        [`Ngày xuất: ${dayjs().format('DD/MM/YYYY HH:mm')}`],
        [''],
        ['Chỉ số', 'Giá trị'],
        ['Tổng doanh thu', formatCurrency(dashboardStats?.revenueStats?.totalRevenue || 0)],
        ['Doanh thu hoàn thành', formatCurrency(dashboardStats?.revenueStats?.completedRevenue || 0)],
        ['Doanh thu đang chờ', formatCurrency(dashboardStats?.revenueStats?.pendingRevenue || 0)],
        ['Đơn hàng hoàn thành', dashboardStats?.revenueStats?.completedOrders || 0],
        ['Khách hàng mới (30 ngày)', dashboardStats?.newCustomers || 0],
        ['Khuyến mãi đang chạy', dashboardStats?.totalStats?.activePromotions || 0],
        ['Tổng người dùng', dashboardStats?.totalStats?.totalUsers || 0],
        ['Tổng sản phẩm', dashboardStats?.totalStats?.totalProducts || 0],
        ['Tổng đơn hàng tích lũy', dashboardStats?.totalStats?.totalOrders || 0]
      ];
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);

      // Merge cells cho tiêu đề
      wsOverview['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Merge title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Merge date range
        { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }  // Merge export date
      ];

      // Set column widths
      setColumnWidths(wsOverview, [35, 25]);

      XLSX.utils.book_append_sheet(wb, wsOverview, 'TongQuan');

      // 2. Revenue Sheet với header màu sắc
      if (revenueStats.length > 0) {
        const revenueHeaders = ['Thời gian', 'Số đơn hàng', 'Doanh thu hoàn thành', 'Doanh thu chờ', 'Tổng doanh thu', 'Giá trị TB đơn'];
        const revenueData = [
          revenueHeaders,
          ...revenueStats.map(item => [
            groupBy === 'day' ? dayjs(item.period).format('DD/MM/YYYY') : item.period,
            item.orderCount,
            formatCurrency(item.completedRevenue),
            formatCurrency(item.pendingRevenue),
            formatCurrency(item.totalRevenue),
            formatCurrency(item.avgOrderValue)
          ])
        ];
        const wsRevenue = XLSX.utils.aoa_to_sheet(revenueData);

        // Set column widths
        setColumnWidths(wsRevenue, [15, 15, 22, 20, 22, 22]);

        XLSX.utils.book_append_sheet(wb, wsRevenue, 'DoanhThu');
      }

      // 3. Products Sheet
      if (productStats?.topSelling && productStats.topSelling.length > 0) {
        const productHeaders = ['STT', 'Tên sản phẩm', 'Thương hiệu', 'Số lượng bán', 'Doanh thu', 'Số đơn hàng'];
        const productData = [
          productHeaders,
          ...productStats.topSelling.map((item, index) => [
            index + 1,
            item.TenSanPham,
            item.ThuongHieu,
            item.totalSold,
            formatCurrency(item.totalRevenue),
            item.orderCount
          ])
        ];
        const wsProducts = XLSX.utils.aoa_to_sheet(productData);

        // Set column widths
        setColumnWidths(wsProducts, [8, 35, 20, 15, 22, 15]);

        XLSX.utils.book_append_sheet(wb, wsProducts, 'SanPhamBanChay');
      }

      // 4. Customers Sheet
      if (customerStats?.topCustomers && customerStats.topCustomers.length > 0) {
        const customerHeaders = ['STT', 'Tên khách hàng', 'Email', 'Số điện thoại', 'Tổng đơn hàng', 'Tổng chi tiêu', 'Đơn cuối'];
        const customerData = [
          customerHeaders,
          ...customerStats.topCustomers.map((item, index) => [
            index + 1,
            item.HoTen,
            item.Email,
            item.SoDienThoai,
            item.totalOrders,
            formatCurrency(item.totalSpent),
            dayjs(item.lastOrderDate).format('DD/MM/YYYY HH:mm')
          ])
        ];
        const wsCustomers = XLSX.utils.aoa_to_sheet(customerData);

        // Set column widths
        setColumnWidths(wsCustomers, [8, 25, 30, 15, 15, 22, 18]);

        XLSX.utils.book_append_sheet(wb, wsCustomers, 'KhachHangVIP');
      }

      // Generate buffer
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

      saveAs(data, `BaoCao_ThongKe_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
      message.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error('Export Excel Error:', error);
      message.error('Có lỗi khi xuất file Excel');
    }
  };

  // Export functions
  const handleExportPDF = async () => {
    try {
      const contentElement = document.getElementById('statistics-content');
      if (!contentElement) {
        message.error('Không tìm thấy nội dung để xuất');
        return;
      }

      const exportButtons = contentElement.querySelector('.export-buttons');
      if (exportButtons) {
        (exportButtons as HTMLElement).style.display = 'none';
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        message.error('Không thể mở cửa sổ in');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Báo cáo thống kê</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary { background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BÁO CÁO THỐNG KÊ</h1>
            <p>Khoảng thời gian: ${dateRange[0].format('DD/MM/YYYY')} - ${dateRange[1].format('DD/MM/YYYY')}</p>
            <p>Ngày xuất báo cáo: ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Tổng doanh thu</h3>
              <p style="color: #52c41a; font-size: 24px; font-weight: bold;">
                ${formatPrice(dashboardStats?.revenueStats?.totalRevenue || 0)}
              </p>
            </div>
            <div class="stat-card">
              <h3>Đơn hàng hoàn thành</h3>
              <p style="color: #1890ff; font-size: 24px; font-weight: bold;">
                ${dashboardStats?.revenueStats?.completedOrders || 0}
              </p>
            </div>
            <div class="stat-card">
              <h3>Khách hàng mới (30 ngày)</h3>
              <p style="color: #722ed1; font-size: 24px; font-weight: bold;">
                ${dashboardStats?.newCustomers || 0}
              </p>
            </div>
            <div class="stat-card">
              <h3>Khuyến mãi đang hoạt động</h3>
              <p style="color: #fa8c16; font-size: 24px; font-weight: bold;">
                ${dashboardStats?.totalStats?.activePromotions || 0}
              </p>
            </div>
          </div>

          <div class="summary">
            <h2>TỔNG QUAN</h2>
            <p><strong>Tổng người dùng:</strong> ${dashboardStats?.totalStats?.totalUsers || 0}</p>
            <p><strong>Tổng sản phẩm:</strong> ${dashboardStats?.totalStats?.totalProducts || 0}</p>
            <p><strong>Tổng đơn hàng:</strong> ${dashboardStats?.totalStats?.totalOrders || 0}</p>
          </div>

          ${productStats?.topSelling?.length ? `
            <h2>TOP 5 SẢN PHẨM BÁN CHẠY</h2>
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Thương hiệu</th>
                  <th>Đã bán</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                ${productStats.topSelling.slice(0, 5).map((item) => `
                  <tr>
                    <td>${item.TenSanPham}</td>
                    <td>${item.ThuongHieu}</td>
                    <td>${item.totalSold} sản phẩm</td>
                    <td>${formatPrice(item.totalRevenue)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${customerStats?.topCustomers?.length ? `
            <h2>TOP 5 KHÁCH HÀNG VIP</h2>
            <table>
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Tổng đơn hàng</th>
                  <th>Tổng chi tiêu</th>
                </tr>
              </thead>
              <tbody>
                ${customerStats.topCustomers.slice(0, 5).map((item) => `
                  <tr>
                    <td>${item.HoTen}</td>
                    <td>${item.Email}</td>
                    <td>${item.totalOrders} đơn</td>
                    <td>${formatPrice(item.totalSpent)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.print();

      if (exportButtons) {
        (exportButtons as HTMLElement).style.display = 'block';
      }

      message.success('Báo cáo PDF đã được xuất thành công!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Có lỗi khi xuất báo cáo PDF');
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Revenue Chart Data
  const revenueChartData = revenueStats.map(item => ({
    ...item,
    period: groupBy === 'day' ? dayjs(item.period).format('DD/MM') :
      groupBy === 'week' ? `Tuần ${Math.ceil(dayjs(item.period).date() / 7)}` :
        dayjs(item.period).format('MM/YYYY')
  }));

  // Order Status Pie Chart Data
  const orderStatusData = dashboardStats?.orderStatusStats?.map((item, index: number) => ({
    name: item.TrangThai === 'ChuaXuLy' ? 'Chưa xử lý' :
      item.TrangThai === 'DangGiao' ? 'Đang giao' :
        item.TrangThai === 'HoanThanh' ? 'Hoàn thành' : 'Đã hủy',
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) || [];

  // Top Products Table Columns
  const topProductsColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'TenSanPham',
      key: 'TenSanPham',
      render: (text: string, record: NonNullable<ProductStats['topSelling']>[0]) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={record.HinhAnh ? `http://localhost:3000${record.HinhAnh}` : '/placeholder.png'}
            alt={text}
            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{record.ThuongHieu}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Đã bán',
      dataIndex: 'totalSold',
      key: 'totalSold',
      render: (value: number) => (
        <Tag color="blue">{value} sản phẩm</Tag>
      ),
    },
    {
      title: 'Doanh thu',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>{formatPrice(value)}</Text>
      ),
    },
  ];

  // Top Customers Table Columns
  const topCustomersColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Khách hàng',
      dataIndex: 'HoTen',
      key: 'HoTen',
      render: (text: string, record: NonNullable<CustomerStats['topCustomers']>[0]) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.Email}</div>
        </div>
      ),
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      render: (value: number) => (
        <Tag color="green">{value} đơn</Tag>
      ),
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (value: number) => (
        <Text strong style={{ color: '#1890ff' }}>{formatPrice(value)}</Text>
      ),
    },
    {
      title: 'Đơn hàng cuối',
      dataIndex: 'lastOrderDate',
      key: 'lastOrderDate',
      render: (value: string) => dayjs(value).format('DD/MM/YYYY'),
    },
  ];


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div id="statistics-content">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <BarChartOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <Title level={2} style={{ margin: 0 }}>Thống kê & Báo cáo</Title>
        </div>
        <Text type="secondary">Phân tích dữ liệu và hiệu suất kinh doanh</Text>
      </div>

      {/* Date Range and Group By Controls */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Text strong>Khoảng thời gian:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Text strong>Nhóm theo:</Text>
              <Select
                value={groupBy}
                onChange={setGroupBy}
                style={{ width: 120 }}
              >
                <Option value="day">Ngày</Option>
                <Option value="week">Tuần</Option>
                <Option value="month">Tháng</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8} className="export-buttons">
            <Space>
              <Tooltip title="Xuất báo cáo Excel">
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={handleExportExcel}
                  style={{ backgroundColor: '#217346', borderColor: '#217346' }}
                >
                  Xuất Excel
                </Button>
              </Tooltip>
              <Tooltip title="Xuất báo cáo PDF">
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
                >
                  Xuất PDF
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Dashboard Overview Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={dashboardStats?.revenueStats?.totalRevenue || 0}
              formatter={(value) => formatPrice(Number(value))}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              <div>Đã hoàn thành: {formatPrice(dashboardStats?.revenueStats?.completedRevenue || 0)}</div>
              <div>Đang xử lý: {formatPrice(dashboardStats?.revenueStats?.pendingRevenue || 0)}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn hàng hoàn thành"
              value={dashboardStats?.revenueStats?.completedOrders || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Khách hàng mới (30 ngày)"
              value={dashboardStats?.newCustomers || 0}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Khuyến mãi đang hoạt động"
              value={dashboardStats?.totalStats?.activePromotions || 0}
              prefix={<GiftOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="overview">
        {/* Overview Tab */}
        <TabPane tab="Tổng quan" key="overview">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title="Doanh thu theo thời gian" style={{ marginBottom: 24 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="completedRevenue"
                      stackId="1"
                      stroke="#52c41a"
                      fill="#52c41a"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Số đơn hàng theo thời gian">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="orderCount"
                      stroke="#1890ff"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Trạng thái đơn hàng" style={{ marginBottom: 24 }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                    >
                      {orderStatusData.map((entry, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Thống kê tổng quan">
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Tổng người dùng</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                      {dashboardStats?.totalStats?.totalUsers}
                    </div>
                  </div>
                  <div>
                    <Text strong>Tổng sản phẩm</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {dashboardStats?.totalStats?.totalProducts}
                    </div>
                  </div>
                  <div>
                    <Text strong>Tổng đơn hàng</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                      {dashboardStats?.totalStats?.totalOrders}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Products Tab */}
        <TabPane tab="Sản phẩm" key="products">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="Sản phẩm bán chạy nhất">
                <Table
                  columns={topProductsColumns}
                  dataSource={productStats?.topSelling || []}
                  pagination={false}
                  rowKey="SanPhamID"
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Thống kê theo danh mục">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productStats?.categoryStats || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="TenDanhMuc" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="totalSold" fill="#1890ff" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Customers Tab */}
        <TabPane tab="Khách hàng" key="customers">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="Khách hàng VIP">
                <Table
                  columns={topCustomersColumns}
                  dataSource={customerStats?.topCustomers || []}
                  pagination={false}
                  rowKey="UserID"
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Khách hàng mới theo tháng">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={customerStats?.monthlyCustomers || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="newCustomers"
                      stroke="#52c41a"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

      </Tabs>
    </div>
  );
};

export default Statistics;