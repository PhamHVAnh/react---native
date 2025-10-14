import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Select, Input, message, Tag, Card, Popconfirm } from 'antd';
import { EyeOutlined, DeleteOutlined, ThunderboltOutlined, SafetyOutlined } from '@ant-design/icons';
import { warrantyService } from '../services/warrantyService';
import type { Warranty } from '../services/warrantyService';
import dayjs from 'dayjs';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';

const Warranties: React.FC = () => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});

  // Use search hook
  const { searchLoading, searchWarranties } = useSearch();

  useEffect(() => {
    loadWarranties();
  }, []);

  const loadWarranties = async () => {
    setLoading(true);
    try {
      const response = await warrantyService.getAll();
      setWarranties(response.data);
    } catch {
      message.error('Không thể tải danh sách bảo hành');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Warranty) => {
    setSelectedWarranty(record);
    setNewStatus(record.TrangThai);
    setNote(record.GhiChu || '');
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!selectedWarranty) return;

    try {
      await warrantyService.update(selectedWarranty.BaoHanhID, {
        TrangThai: newStatus,
        GhiChu: note,
      });
      message.success('Cập nhật bảo hành thành công');
      setModalVisible(false);
      loadWarranties();
    } catch {
      message.error('Không thể cập nhật bảo hành');
    }
  };

  const handleSearch = async (query: string, filters?: Record<string, unknown>) => {
    setCurrentFilters(filters || {});

    try {
      // Always fetch fresh data and search client-side
      const response = await warrantyService.getAll();
      const allWarranties = response.data;

      // Use the search hook for client-side search
      const filteredWarranties = await searchWarranties(allWarranties as unknown as Record<string, unknown>[], query, {
        status: filters?.status as string
      });

      setWarranties(filteredWarranties as unknown as Warranty[]);
    } catch (error) {
      message.error('Không thể tìm kiếm bảo hành');
      console.error('Search error:', error);
    }
  };

  const handleResetSearch = () => {
    setCurrentFilters({});
    loadWarranties();
  };

  const handleDelete = async (warrantyId: string) => {
    try {
      await warrantyService.delete(warrantyId);
      message.success('Xóa bảo hành thành công');
      loadWarranties();
    } catch (error: unknown) {
      // Handle specific error message from backend
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Không thể xóa bảo hành';
      message.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      ConHan: 'green',
      HetHan: 'red',
      DangSua: 'orange',
      YeuCau: 'blue',
    };
    return statusMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      ConHan: 'Còn hạn',
      HetHan: 'Hết hạn',
      DangSua: 'Đang sửa',
      YeuCau: 'Yêu cầu',
    };
    return statusMap[status] || status;
  };

  const columns = [
    {
      title: 'Mã bảo hành',
      dataIndex: 'BaoHanhID',
      key: 'BaoHanhID',
      render: (text: string) => text.substring(0, 8) + '...',
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'TenSanPham',
      key: 'TenSanPham',
    },
    {
      title: 'Model',
      dataIndex: 'Model',
      key: 'Model',
    },
    {
      title: 'Thương hiệu',
      dataIndex: 'ThuongHieu',
      key: 'ThuongHieu',
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
      title: 'Ngày mua',
      dataIndex: 'NgayMua',
      key: 'NgayMua',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Hạn bảo hành',
      dataIndex: 'HanBaoHanh',
      key: 'HanBaoHanh',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'TrangThai',
      key: 'TrangThai',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: Warranty) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa bảo hành này?"
            description="Chỉ có thể xóa bảo hành đã hết hạn. Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.BaoHanhID)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.TrangThaiHienTai === 'ConHan'}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <SafetyOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
            Quản lý bảo hành
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: 16 }}>
          Quản lý danh sách bảo hành sản phẩm
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
              <span style={{ fontSize: 18, fontWeight: '600' }}>Danh sách bảo hành</span>
            </div>
          </div>
        }
      >
        <SearchBar
          onSearch={handleSearch}
          onReset={handleResetSearch}
          searchType="warranties"
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
          dataSource={warranties}
          rowKey="BaoHanhID"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bảo hành`,
            style: { marginTop: 24 },
          }}
          style={{
            borderRadius: '8px',
          }}
        />
      </Card>

      <Modal
        title="Cập nhật trạng thái bảo hành"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleUpdate}
      >
        {selectedWarranty && (
          <div>
            <p>
              <strong>Sản phẩm:</strong> {selectedWarranty.TenSanPham}
            </p>
            <p>
              <strong>Khách hàng:</strong> {selectedWarranty.HoTen}
            </p>
            <p>
              <strong>Ngày mua:</strong> {dayjs(selectedWarranty.NgayMua).format('DD/MM/YYYY')}
            </p>
            <p>
              <strong>Hạn bảo hành:</strong> {dayjs(selectedWarranty.HanBaoHanh).format('DD/MM/YYYY')}
            </p>

            <div style={{ marginTop: 16 }}>
              <label>Trạng thái:</label>
              <Select
                value={newStatus}
                onChange={setNewStatus}
                style={{ width: '100%', marginTop: 8 }}
              >
                <Select.Option value="ConHan">Còn hạn</Select.Option>
                <Select.Option value="HetHan">Hết hạn</Select.Option>
                <Select.Option value="DangSua">Đang sửa</Select.Option>
                <Select.Option value="YeuCau">Yêu cầu</Select.Option>
              </Select>
            </div>

            <div style={{ marginTop: 16 }}>
              <label>Ghi chú:</label>
              <Input.TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                style={{ marginTop: 8 }}
                placeholder="Nhập ghi chú..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Warranties;

