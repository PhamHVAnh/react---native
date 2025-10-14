import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Table } from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { userService } from '../services/userService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import type { Order } from '../services/orderService';
import { warrantyService } from '../services/warrantyService';
import dayjs from 'dayjs';
import { formatPrice } from '../utils/priceFormatter';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    warranties: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersRes, productsRes, ordersRes, warrantiesRes] = await Promise.all([
        userService.getAll(),
        productService.getAll(),
        orderService.getAll(),
        warrantyService.getAll(),
      ]);

      setStats({
        users: usersRes.data.length,
        products: productsRes.data.length,
        orders: ordersRes.data.length,
        warranties: warrantiesRes.data.length,
      });

      // Get 5 most recent orders
      const sortedOrders = ordersRes.data
        .sort((a, b) => new Date(b.NgayDat).getTime() - new Date(a.NgayDat).getTime())
        .slice(0, 5);
      setRecentOrders(sortedOrders);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const orderColumns = [
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
      title: 'Ngày đặt',
      dataIndex: 'NgayDat',
      key: 'NgayDat',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'ThanhTien',
      key: 'ThanhTien',
      render: (value: number) => formatPrice(value),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          ChuaXuLy: { text: 'Chưa xử lý', color: '#faad14' },
          DangGiao: { text: 'Đang giao', color: '#1890ff' },
          HoanThanh: { text: 'Hoàn thành', color: '#52c41a' },
          Huy: { text: 'Đã hủy', color: '#ff4d4f' },
        };
        const config = statusMap[status] || { text: status, color: '#000' };
        return <span style={{ color: config.color }}>{config.text}</span>;
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <ThunderboltOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
            Dashboard
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: 16 }}>
          Tổng quan hệ thống quản lý điện máy
        </p>
      </div>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 77, 153, 0.1)',
              border: '1px solid rgba(0, 77, 153, 0.1)',
              transition: 'all 0.3s ease',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <UserOutlined style={{ fontSize: 24, color: 'white' }} />
              </div>
                      <div>
                        <div style={{ fontSize: 32, fontWeight: '700', color: '#1a1a1a', lineHeight: 1 }}>
                          {stats.users}
                        </div>
                        <div style={{ fontSize: 14, color: '#2c3e50', marginTop: 4, fontWeight: '500' }}>Người dùng</div>
                      </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 77, 153, 0.1)',
              border: '1px solid rgba(0, 77, 153, 0.1)',
              transition: 'all 0.3s ease',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #004d99 0%, #1890ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShoppingOutlined style={{ fontSize: 24, color: 'white' }} />
              </div>
                      <div>
                        <div style={{ fontSize: 32, fontWeight: '700', color: '#1a1a1a', lineHeight: 1 }}>
                          {stats.products}
                        </div>
                        <div style={{ fontSize: 14, color: '#2c3e50', marginTop: 4, fontWeight: '500' }}>Sản phẩm</div>
                      </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 77, 153, 0.1)',
              border: '1px solid rgba(0, 77, 153, 0.1)',
              transition: 'all 0.3s ease',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FileTextOutlined style={{ fontSize: 24, color: 'white' }} />
              </div>
                      <div>
                        <div style={{ fontSize: 32, fontWeight: '700', color: '#1a1a1a', lineHeight: 1 }}>
                          {stats.orders}
                        </div>
                        <div style={{ fontSize: 14, color: '#2c3e50', marginTop: 4, fontWeight: '500' }}>Đơn hàng</div>
                      </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card 
            loading={loading}
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 77, 153, 0.1)',
              border: '1px solid rgba(0, 77, 153, 0.1)',
              transition: 'all 0.3s ease',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <SafetyOutlined style={{ fontSize: 24, color: 'white' }} />
              </div>
                      <div>
                        <div style={{ fontSize: 32, fontWeight: '700', color: '#1a1a1a', lineHeight: 1 }}>
                          {stats.warranties}
                        </div>
                        <div style={{ fontSize: 14, color: '#2c3e50', marginTop: 4, fontWeight: '500' }}>Bảo hành</div>
                      </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#004d99' }} />
            <span style={{ fontSize: 18, fontWeight: '600' }}>Đơn hàng gần đây</span>
          </div>
        }
        style={{ 
          marginTop: 32,
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f0f0f0',
        }}
        headStyle={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          borderBottom: '1px solid #f0f0f0',
          borderRadius: '12px 12px 0 0',
        }}
      >
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="DonHangID"
          loading={loading}
          pagination={false}
          style={{
            borderRadius: '8px',
          }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;

