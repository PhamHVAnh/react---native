import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Avatar, Card, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, UserSwitchOutlined, ThunderboltOutlined, UploadOutlined } from '@ant-design/icons';
import { userService } from '../services/userService';
import { uploadService } from '../services/uploadService';
import type { User, CreateUserDto } from '../services/userService';
import dayjs from 'dayjs';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';
import type { UploadFile } from 'antd/es/upload/interface';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();

  // Use search hook
  const { searchLoading, searchUsers } = useSearch();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAll();
      setUsers(response.data);
    } catch {
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setFileList([]);
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      MatKhau: '', // Don't pre-fill password
    });

    // Set image if exists
    if (record.HinhAnh) {
      setFileList([{
        uid: 'existing',
        name: 'Avatar',
        status: 'done',
        url: `http://localhost:3000${record.HinhAnh}`,
      }]);
    } else {
      setFileList([]);
    }

    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await userService.delete(id);
      message.success('Xóa người dùng thành công');
      loadUsers();
    } catch {
      message.error('Không thể xóa người dùng');
    }
  };

  const handleSubmit = async (values: CreateUserDto) => {
    try {
      let imageUrl = values.HinhAnh;

      // Handle image upload if there's a new file
      if (fileList.length > 0 && fileList[0].originFileObj) {
        try {
          imageUrl = await handleUploadImage(fileList[0].originFileObj);
        } catch {
          message.error('Upload ảnh thất bại, vui lòng thử lại');
          return;
        }
      }

      // Prepare data with image URL
      const submitData = { ...values, HinhAnh: imageUrl };

      if (editingUser) {
        // Remove password from update if it's empty
        const updateData = { ...submitData };
        if (!updateData.MatKhau) {
          delete (updateData as Partial<CreateUserDto>).MatKhau;
        }
        await userService.update(editingUser.UserID, updateData);
        message.success('Cập nhật người dùng thành công');
      } else {
        await userService.create(submitData);
        message.success('Thêm người dùng thành công');
      }

      setModalVisible(false);
      setFileList([]);
      loadUsers();
    } catch {
      message.error(editingUser ? 'Không thể cập nhật người dùng' : 'Không thể thêm người dùng');
    }
  };

  const handleSearch = async (query: string, filters?: Record<string, unknown>) => {
    setCurrentFilters(filters || {});

    try {
      // Always fetch fresh data and search client-side
      const response = await userService.getAll();
      const allUsers = response.data;

      // Use the search hook for client-side search
      const filteredUsers = await searchUsers(allUsers as unknown as Record<string, unknown>[], query, {
        role: filters?.role as string
      });

      setUsers(filteredUsers as unknown as User[]);
    } catch (error) {
      message.error('Không thể tìm kiếm người dùng');
      console.error('Search error:', error);
    }
  };

  const handleResetSearch = () => {
    setCurrentFilters({});
    loadUsers();
  };

  // Upload props for image
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

  const handleUploadImage = async (file: File) => {
    try {
      const filePath = await uploadService.uploadImage(file);
      return filePath;
    } catch (error) {
      message.error('Upload ảnh thất bại');
      throw error;
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
    {
      title: 'Avatar',
      dataIndex: 'HinhAnh',
      key: 'HinhAnh',
      render: (url: string) => (
        <Avatar
          src={url ? `http://localhost:3000${url}` : undefined}
          icon={<UserOutlined />}
          size={40}
        />
      ),
    },
    {
      title: 'Họ tên',
      dataIndex: 'HoTen',
      key: 'HoTen',
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'TenDangNhap',
      key: 'TenDangNhap',
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'SoDienThoai',
      key: 'SoDienThoai',
    },
    {
      title: 'Vai trò',
      dataIndex: 'VaiTro',
      key: 'VaiTro',
      render: (role: string) => (
        <span style={{ color: role === 'NhanVien' ? '#1890ff' : '#52c41a' }}>
          {role === 'NhanVien' ? 'Nhân viên' : 'Khách hàng'}
        </span>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'NgayTao',
      key: 'NgayTao',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.UserID)}
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
          <UserSwitchOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
            Quản lý người dùng
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: 16 }}>
          Quản lý danh sách người dùng hệ thống
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
              <span style={{ fontSize: 18, fontWeight: '600' }}>Danh sách người dùng</span>
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
              Thêm người dùng
            </Button>
          </div>
        }
      >
        <SearchBar
          onSearch={handleSearch}
          onReset={handleResetSearch}
          searchType="users"
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
          dataSource={users}
          rowKey="UserID"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} người dùng`,
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

      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="HoTen"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="TenDangNhap"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="MatKhau"
            label={editingUser ? 'Mật khẩu (để trống nếu không đổi)' : 'Mật khẩu'}
            rules={editingUser ? [] : [{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="Email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="SoDienThoai"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="DiaChi"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="VaiTro"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select>
              <Select.Option value="KhachHang">Khách hàng</Select.Option>
              <Select.Option value="NhanVien">Nhân viên</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Ảnh đại diện">
            <Upload {...uploadProps}>
              {fileList.length === 0 && (
                <div style={{ textAlign: 'center' }}>
                  <UploadOutlined style={{ fontSize: '24px', color: '#999' }} />
                  <div style={{ marginTop: 8 }}>Tải lên ảnh đại diện</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;

