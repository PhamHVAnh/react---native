import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, DatePicker, Popconfirm, Tag, Card, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { promotionService } from '../services/promotionService';
import type { Promotion, CreatePromotionDto } from '../services/promotionService';
import dayjs from 'dayjs';
import { formatPrice } from '../utils/priceFormatter';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';

const Promotions: React.FC = () => {
  const { message } = App.useApp();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [, setCurrentFilters] = useState<Record<string, unknown>>({});
  const [form] = Form.useForm();

  // Use search hook
  const { searchLoading, searchPromotions } = useSearch();

  useEffect(() => {
    loadPromotions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const response = await promotionService.getAll();
      setPromotions(response.data);
    } catch {
      message.error('Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, filters?: Record<string, unknown>) => {
    setCurrentFilters(filters || {});

    try {
      // Always fetch fresh data and search client-side
      const response = await promotionService.getAll();
      const allPromotions = response.data;

      // Use the search hook for client-side search
      const filteredPromotions = await searchPromotions(allPromotions as unknown as Record<string, unknown>[], query, {
        status: filters?.status as string
      });

      setPromotions(filteredPromotions as unknown as Promotion[]);
    } catch (error) {
      message.error('Không thể tìm kiếm khuyến mãi');
      console.error('Search error:', error);
    }
  };

  const handleResetSearch = () => {
    setCurrentFilters({});
    loadPromotions();
  };

  const handleAdd = () => {
    setEditingPromotion(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Promotion) => {
    setEditingPromotion(record);
    form.setFieldsValue({
      ...record,
      NgayBatDau: dayjs(record.NgayBatDau),
      NgayKetThuc: dayjs(record.NgayKetThuc),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await promotionService.delete(id);
      message.success('Xóa khuyến mãi thành công');
      loadPromotions();
    } catch {
      message.error('Không thể xóa khuyến mãi');
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const promotionData: CreatePromotionDto = {
        MaKhuyenMai: values.MaKhuyenMai as string,
        MoTa: values.MoTa as string,
        PhanTramGiam: values.PhanTramGiam as number,
        GiamToiDa: values.GiamToiDa as number,
        GioiHanSuDung: values.GioiHanSuDung as number,
        NgayBatDau: (values.NgayBatDau as { format: (format: string) => string }).format('YYYY-MM-DD'),
        NgayKetThuc: (values.NgayKetThuc as { format: (format: string) => string }).format('YYYY-MM-DD'),
      };

      if (editingPromotion) {
        await promotionService.update(editingPromotion.KhuyenMaiID, promotionData);
        message.success('Cập nhật khuyến mãi thành công');
      } else {
        await promotionService.create(promotionData);
        message.success('Thêm khuyến mãi thành công');
      }
      setModalVisible(false);
      loadPromotions();
    } catch {
      message.error(editingPromotion ? 'Không thể cập nhật khuyến mãi' : 'Không thể thêm khuyến mãi');
    }
  };

  const isActive = (promo: Promotion) => {
    const now = dayjs();
    const start = dayjs(promo.NgayBatDau);
    const end = dayjs(promo.NgayKetThuc);
    return now.isAfter(start) && now.isBefore(end) && promo.GioiHanSuDung > 0;
  };

  const columns = [
    {
      title: 'Mã khuyến mãi',
      dataIndex: 'MaKhuyenMai',
      key: 'MaKhuyenMai',
      render: (code: string) => <strong>{code}</strong>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'MoTa',
      key: 'MoTa',
    },
    {
      title: 'Giảm giá',
      dataIndex: 'PhanTramGiam',
      key: 'PhanTramGiam',
      render: (percent: number) => `${percent}%`,
    },
    {
      title: 'Giảm tối đa',
      dataIndex: 'GiamToiDa',
      key: 'GiamToiDa',
      render: (max: number) => formatPrice(max),
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'NgayBatDau',
      key: 'NgayBatDau',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'NgayKetThuc',
      key: 'NgayKetThuc',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Giới hạn sử dụng',
      dataIndex: 'GioiHanSuDung',
      key: 'GioiHanSuDung',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: Promotion) => (
        isActive(record) 
          ? <Tag color="green">Đang hoạt động</Tag>
          : <Tag color="red">Không hoạt động</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: Promotion) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa khuyến mãi này?"
            onConfirm={() => handleDelete(record.KhuyenMaiID)}
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
          <GiftOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
            Quản lý khuyến mãi
          </h1>
        </div>
        <p style={{ margin: 0, color: '#2c3e50', fontSize: 16, fontWeight: '500' }}>
          Quản lý các chương trình khuyến mãi và giảm giá
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
              <span style={{ fontSize: 18, fontWeight: '600' }}>Danh sách khuyến mãi</span>
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
              Thêm khuyến mãi
            </Button>
          </div>
        }
      >
        <SearchBar
          onSearch={handleSearch}
          onReset={handleResetSearch}
          searchType="promotions"
          loading={searchLoading}
        />

        <Table
          columns={columns}
          dataSource={promotions}
          rowKey="KhuyenMaiID"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} khuyến mãi`,
            style: { marginTop: 24 },
          }}
          style={{
            borderRadius: '8px',
          }}
        />
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GiftOutlined style={{ color: '#004d99' }} />
            <span style={{ fontSize: 18, fontWeight: '600' }}>
              {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi'}
            </span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        style={{ top: 20 }}
        okButtonProps={{
          style: {
            background: '#004d99',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
          }
        }}
        cancelButtonProps={{
          style: {
            borderRadius: '6px',
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="MaKhuyenMai"
            label={
              <span style={{ fontSize: 14, fontWeight: '500', color: '#1a1a1a' }}>
                Mã khuyến mãi*
              </span>
            }
            rules={[{ required: true, message: 'Vui lòng nhập mã khuyến mãi' }]}
          >
            <Input 
              placeholder="SALE2024" 
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="MoTa"
            label={
              <span style={{ fontSize: 14, fontWeight: '500', color: '#1a1a1a' }}>
                Mô tả*
              </span>
            }
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Mô tả chi tiết về chương trình khuyến mãi"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="PhanTramGiam"
              label={
                <span style={{ fontSize: 14, fontWeight: '500', color: '#1a1a1a' }}>
                  Phần trăm giảm (%)*
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập phần trăm giảm' }]}
              style={{ flex: 1 }}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0} 
                max={100}
                size="large"
                placeholder="10"
                addonAfter="%"
              />
            </Form.Item>

            <Form.Item
              name="GioiHanSuDung"
              label={
                <span style={{ fontSize: 14, fontWeight: '500', color: '#1a1a1a' }}>
                  Giới hạn sử dụng*
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng nhập giới hạn sử dụng' }]}
              style={{ flex: 1 }}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={1}
                size="large"
                placeholder="100"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="GiamToiDa"
            label={
              <span style={{ fontSize: 14, fontWeight: '500', color: '#1a1a1a' }}>
                Giảm tối đa (₫)*
              </span>
            }
            rules={[{ required: true, message: 'Vui lòng nhập giảm tối đa' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              placeholder="1000000"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              addonAfter="₫"
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="NgayBatDau"
              label={
                <span style={{ fontSize: 14, fontWeight: '500', color: '#1a1a1a' }}>
                  Ngày bắt đầu*
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
              style={{ flex: 1 }}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY" 
                size="large"
                placeholder="Chọn ngày bắt đầu"
              />
            </Form.Item>

            <Form.Item
              name="NgayKetThuc"
              label={
                <span style={{ fontSize: 14, fontWeight: '500', color: '#1a1a1a' }}>
                  Ngày kết thúc*
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
              style={{ flex: 1 }}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY" 
                size="large"
                placeholder="Chọn ngày kết thúc"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Promotions;

