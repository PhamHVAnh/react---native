import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, ConfigProvider } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  TagsOutlined,
  GiftOutlined,
  FileTextOutlined,
  SafetyOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  BarChartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // const { token: { colorBgContainer } } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/'),
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: 'Thống kê',
      onClick: () => navigate('/statistics'),
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Người dùng',
      onClick: () => navigate('/users'),
    },
    {
      key: '/categories',
      icon: <TagsOutlined />,
      label: 'Danh mục',
      onClick: () => navigate('/categories'),
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: 'Sản phẩm',
      onClick: () => navigate('/products'),
    },
    {
      key: '/promotions',
      icon: <GiftOutlined />,
      label: 'Khuyến mãi',
      onClick: () => navigate('/promotions'),
    },
    {
      key: '/orders',
      icon: <FileTextOutlined />,
      label: 'Đơn hàng',
      onClick: () => navigate('/orders'),
    },
    {
      key: '/payments',
      icon: <DollarOutlined />,
      label: 'Thanh toán',
      onClick: () => navigate('/payments'),
    },
    {
      key: '/warranties',
      icon: <SafetyOutlined />,
      label: 'Bảo hành',
      onClick: () => navigate('/warranties'),
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: 'Tồn kho',
      onClick: () => navigate('/inventory'),
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Hồ sơ',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const customTheme = {
    token: {
      colorPrimary: '#004d99',
      // colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    components: {
      Menu: {
        itemBg: 'transparent',
        itemSelectedBg: 'rgba(0, 77, 153, 0.1)',
        itemSelectedColor: '#004d99',
        itemHoverBg: 'rgba(0, 77, 153, 0.05)',
        itemHoverColor: '#004d99',
      },
      Layout: {
        siderBg: '#001529',
        headerBg: '#ffffff',
        bodyBg: '#f5f5f5',
      },
    },
  };

  return (
    <ConfigProvider theme={customTheme}>
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed} 
          theme="dark"
          style={{
            background: 'linear-gradient(180deg, #004d99 0%, #001529 100%)',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: collapsed ? 16 : 20,
              fontWeight: '800',
              background: 'rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 8,
            }}
          >
            {collapsed ? (
              <ThunderboltOutlined style={{ fontSize: 20, color: '#ffd700' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThunderboltOutlined style={{ fontSize: 20, color: '#ffd700' }} />
                <span>ELECTRO</span>
              </div>
            )}
          </div>
                  <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '8px 0',
                    }}
                    className="admin-sidebar-menu"
                  />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'trigger',
                onClick: () => setCollapsed(!collapsed),
                style: {
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#004d99',
                  padding: '8px',
                  borderRadius: '6px',
                  transition: 'all 0.3s ease',
                },
              })}
              <span style={{
                color: '#1a1a1a',
                fontSize: '18px',
                fontWeight: '600',
                marginLeft: 8
              }}>
                Hệ thống quản lý điện máy
              </span>
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
              }}>
                <Avatar
                  style={{
                    backgroundColor: user?.HinhAnh ? 'transparent' : '#004d99',
                    marginRight: 8,
                    border: '2px solid #e6f7ff',
                  }}
                  icon={<UserOutlined />}
                  src={user?.HinhAnh ? `http://localhost:3000${user.HinhAnh}` : undefined}
                />
                <span style={{ 
                  color: '#1a1a1a',
                  fontWeight: '500',
                }}>
                  {user?.HoTen || user?.TenDangNhap}
                </span>
              </div>
            </Dropdown>
          </Header>
          <Content
            style={{
              margin: '24px',
              padding: 0,
              minHeight: 280,
              background: 'transparent',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid #f0f0f0',
                minHeight: 'calc(100vh - 112px)',
              }}
            >
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;

