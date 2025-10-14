import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Avatar, message, Divider, Row, Col, Upload } from 'antd';
import { UserOutlined, LockOutlined, UploadOutlined, SaveOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { uploadService } from '../services/uploadService';
import type { UploadFile } from 'antd/es/upload/interface';

interface ProfileFormData {
  HoTen: string;
  TenDangNhap: string;
  Email: string;
  SoDienThoai: string;
  DiaChi: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        HoTen: user.HoTen,
        TenDangNhap: user.TenDangNhap,
        Email: user.Email,
        SoDienThoai: user.SoDienThoai,
        DiaChi: user.DiaChi,
      });

      // Set avatar if exists
      if (user.HinhAnh) {
        setFileList([{
          uid: 'current',
          name: 'Avatar',
          status: 'done',
          url: `http://localhost:3000${user.HinhAnh}`,
        }]);
      }
    }
  }, [user, form]);

  const handleProfileSubmit = async (values: ProfileFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      let imageUrl = user.HinhAnh;

      // Handle image upload if there's a new file
      if (fileList.length > 0 && fileList[0].originFileObj) {
        try {
          imageUrl = await uploadService.uploadImage(fileList[0].originFileObj);
        } catch {
          message.error('Upload ảnh thất bại, vui lòng thử lại');
          setLoading(false);
          return;
        }
      }

      // Prepare update data
      const updateData = {
        ...values,
        HinhAnh: imageUrl,
      };

      const response = await userService.update(user.UserID, updateData);
      updateUser(response.data);
      message.success('Cập nhật thông tin thành công');
    } catch {
      message.error('Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: { MatKhau: string }) => {
    if (!user) return;

    setLoading(true);
    try {
      await userService.update(user.UserID, { MatKhau: values.MatKhau });
      message.success('Đổi mật khẩu thành công');
      passwordForm.resetFields();
    } catch {
      message.error('Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Upload props for avatar
  const uploadProps = {
    name: 'image',
    multiple: false,
    fileList,
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ được upload file ảnh!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Ảnh phải nhỏ hơn 5MB!');
        return false;
      }
      return false; // Prevent auto upload
    },
    onChange: (info: { fileList: UploadFile[] }) => {
      setFileList(info.fileList);
    },
    onRemove: () => {
      setFileList([]);
    },
    listType: 'picture-card' as const,
  };

  if (!user) {
    return <div>Không tìm thấy thông tin người dùng</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <UserOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
            Hồ sơ cá nhân
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: 16 }}>
          Quản lý thông tin cá nhân và mật khẩu của bạn
        </p>
      </div>

      <Row gutter={24}>
        <Col span={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined style={{ color: '#004d99' }} />
                <span>Thông tin cá nhân</span>
              </div>
            }
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid #f0f0f0',
            }}
            styles={{ body: { padding: '24px' } }}
          >
            {/* Avatar Section */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar
                size={100}
                src={fileList.length > 0 && fileList[0].url ? fileList[0].url : (user.HinhAnh ? `http://localhost:3000${user.HinhAnh}` : undefined)}
                icon={<UserOutlined />}
                style={{ border: '4px solid #e6f7ff', marginBottom: 16 }}
              />
              <Upload {...uploadProps}>
                {fileList.length === 0 && (
                  <Button icon={<UploadOutlined />}>
                    Thay đổi ảnh đại diện
                  </Button>
                )}
              </Upload>
            </div>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileSubmit}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="HoTen"
                    label="Họ tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                  >
                    <Input placeholder="Nhập họ tên" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="TenDangNhap"
                    label="Tên đăng nhập"
                    rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                  >
                    <Input placeholder="Nhập tên đăng nhập" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="Email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>

              <Form.Item
                name="SoDienThoai"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item
                name="DiaChi"
                label="Địa chỉ"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <Input.TextArea rows={3} placeholder="Nhập địa chỉ" />
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  style={{
                    background: '#004d99',
                    border: 'none',
                    borderRadius: '8px',
                    height: '40px',
                    fontWeight: '600',
                  }}
                >
                  Cập nhật thông tin
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LockOutlined style={{ color: '#52c41a' }} />
                <span>Đổi mật khẩu</span>
              </div>
            }
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid #f0f0f0',
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordSubmit}
            >
              <Form.Item
                name="MatKhau"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                ]}
              >
                <Input.Password
                  placeholder="Nhập mật khẩu mới"
                  iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('MatKhau') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Nhập lại mật khẩu mới"
                  iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<LockOutlined />}
                  style={{
                    background: '#52c41a',
                    border: 'none',
                    borderRadius: '8px',
                    height: '40px',
                    fontWeight: '600',
                  }}
                >
                  Đổi mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
