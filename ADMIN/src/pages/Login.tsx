import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
                          (error as { response?: { data?: string } }).response?.data || 'Đăng nhập thất bại';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="login-container"
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Left Panel - Branding */}
      <div 
        className="login-branding"
        style={{
          flex: '0 0 40%',
          background: '#004d99',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '40px',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              transform: 'rotate(-15deg)',
            }}>
              ⚡
            </div>
          </div>
          <div 
            className="login-logo"
            style={{
              fontSize: '42px',
              fontWeight: '800',
              color: 'white',
              letterSpacing: '-1px',
              marginBottom: '8px',
            }}
          >
            ELECTRO
          </div>
          <div 
            className="login-subtitle"
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: '3px',
            }}
          >
            MANAGEMENT
          </div>
        </div>

        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '-50px',
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '30%',
          left: '-30px',
          width: '60px',
          height: '60px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
        }} />
      </div>

      {/* Right Panel - Login Form */}
      <div 
        className="login-form-panel"
        style={{
          flex: '0 0 60%',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: '400px',
        }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '8px',
              letterSpacing: '-0.5px',
            }}>
              Đăng nhập hệ thống
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#666666',
              marginBottom: '24px',
            }}>
              Quản lý cửa hàng điện máy
            </p>
            
            {/* Business Admin Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '32px',
              padding: '12px 16px',
              background: 'rgba(0, 77, 153, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(0, 77, 153, 0.1)',
            }}>
              <CheckCircleOutlined style={{
                color: '#004d99',
                fontSize: '16px',
                marginRight: '8px',
              }} />
              <span style={{
                color: '#004d99',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                Đăng nhập với quyền Quản trị viên
              </span>
            </div>
          </div>

          {/* Login Form */}
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label={
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                }}>
                  Tên đăng nhập*
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
              style={{ marginBottom: '24px' }}
            >
              <Input
                className="login-input"
                placeholder="Nhập tên đăng nhập"
                prefix={<UserOutlined style={{ color: '#999' }} />}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1a1a1a',
                }}>
                  Mật khẩu*
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              style={{ marginBottom: '24px' }}
            >
              <Input.Password
                className="login-input"
                placeholder="Nhập mật khẩu"
                prefix={<LockOutlined style={{ color: '#999' }} />}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}>
                <a href="#" style={{
                  color: '#004d99',
                  fontSize: '14px',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}>
                  Quên mật khẩu?
                </a>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                className="login-button"
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          {/* Footer */}
          <div style={{
            marginTop: '40px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#999',
          }}>
            © 2024 Electro Management System. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

