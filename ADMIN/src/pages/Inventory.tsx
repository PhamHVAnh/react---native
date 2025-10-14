import React, { useEffect, useState } from 'react';
import { Table, message, Tag, Card, Button, Modal, Image, Input, Form, Select, DatePicker, Space, Divider, InputNumber } from 'antd';
import { ContainerOutlined, ThunderboltOutlined, DatabaseOutlined, EditOutlined, MinusOutlined, PlusOutlined, ShoppingCartOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { inventoryService } from '../services/inventoryService';
import type { Inventory } from '../services/inventoryService';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';


const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setCurrentFilters] = useState<Record<string, unknown>>({});
  const [populating, setPopulating] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [updating, setUpdating] = useState(false);
  const [stockForm] = Form.useForm();

  // Custom Quantity Input Component
  const QuantityInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
  }> = ({ value, onChange, min = 0, max = 99999 }) => {
    const handleDecrease = () => {
      const newValue = Math.max(min, value - 1);
      onChange(newValue);
    };

    const handleIncrease = () => {
      const newValue = Math.min(max, value + 1);
      onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Allow empty input for better UX
      if (inputValue === '') {
        onChange(0);
        return;
      }
      const numericValue = parseInt(inputValue) || 0;
      const clampedValue = Math.max(min, Math.min(max, numericValue));
      onChange(clampedValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrease();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrease();
      }
    };

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        overflow: 'hidden',
        width: 'fit-content',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease'
      }}>
        <Button
          type="text"
          icon={<MinusOutlined />}
          onClick={handleDecrease}
          disabled={value <= min}
          style={{
            border: 'none',
            borderRadius: 0,
            height: '36px',
            width: '36px',
            color: value <= min ? '#ccc' : '#1890ff',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (value > min) {
              e.currentTarget.style.backgroundColor = '#e6f7ff';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        />
        <Input
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{
            width: '90px',
            textAlign: 'center',
            border: 'none',
            borderRadius: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#262626'
          }}
          min={min}
          max={max}
          type="number"
        />
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={handleIncrease}
          disabled={value >= max}
          style={{
            border: 'none',
            borderRadius: 0,
            height: '36px',
            width: '36px',
            color: value >= max ? '#ccc' : '#1890ff',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (value < max) {
              e.currentTarget.style.backgroundColor = '#e6f7ff';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        />
      </div>
    );
  };

  // Use search hook
  const { searchLoading, searchInventory } = useSearch();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const inventoryRes = await inventoryService.getAll();
      setInventory(inventoryRes.data);

      // Nếu không có dữ liệu tồn kho, hiển thị thông báo và nút populate
      if (inventoryRes.data.length === 0) {
        message.info('Không có dữ liệu tồn kho. Vui lòng tạo dữ liệu tồn kho cho các sản phẩm hiện có.');
      }
    } catch {
      message.error('Không thể tải danh sách tồn kho');
    } finally {
      setLoading(false);
    }
  };

  const handlePopulateInventory = async (silent = false) => {
    setPopulating(true);
    try {
      const response = await inventoryService.populate();

      if (!silent) {
        message.success(response.data.message);
      }

      // Reload inventory after populating
      await loadInventory();

    } catch (error: unknown) {
      if (!silent) {
        const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Không thể tạo dữ liệu tồn kho';
        message.error(errorMessage);
      }
    } finally {
      setPopulating(false);
    }
  };

  const handleSearch = async (query: string, filters?: Record<string, unknown>) => {
    setCurrentFilters(filters || {});

    try {
      // Always fetch fresh data and search client-side
      const response = await inventoryService.getAll();
      const allInventory = response.data;

      // Use the search hook for client-side search
      const filteredInventory = await searchInventory(allInventory as unknown as Record<string, unknown>[], query, filters);

      setInventory(filteredInventory as unknown as Inventory[]);

      // Also update the display inventory for search results
      if (filteredInventory.length === 0 && query.trim()) {
        // If no results found, show a message
        message.info(`Không tìm thấy kết quả cho "${query}"`);
      }
    } catch (error) {
      message.error('Không thể tìm kiếm tồn kho');
      console.error('Search error:', error);
    }
  };

  const handleResetSearch = () => {
    setCurrentFilters({});
    loadInventory();
  };


  const handleEditInventory = (record: Inventory) => {
    setSelectedInventory(record);
    setNewQuantity(record.SoLuongTon);
    setEditModalVisible(true);
  };

  const handleUpdateInventory = async () => {
    if (!selectedInventory) return;

    setUpdating(true);
    try {
      await inventoryService.update(selectedInventory.SanPhamID, { SoLuongTon: newQuantity });
      message.success('Cập nhật số lượng tồn kho thành công');
      setEditModalVisible(false);
      loadInventory();
    } catch {
      message.error('Không thể cập nhật số lượng tồn kho');
    } finally {
      setUpdating(false);
    }
  };

  const handleStockIn = (record: Inventory) => {
    setSelectedInventory(record);
    stockForm.resetFields();
    stockForm.setFieldsValue({
      type: 'in',
      productId: record.SanPhamID,
      productName: record.TenSanPham,
      currentStock: record.SoLuongTon,
      date: dayjs(),
    });
    setStockModalVisible(true);
  };

  const handleStockOut = (record: Inventory) => {
    setSelectedInventory(record);
    stockForm.resetFields();
    stockForm.setFieldsValue({
      type: 'out',
      productId: record.SanPhamID,
      productName: record.TenSanPham,
      currentStock: record.SoLuongTon,
      date: dayjs(),
    });
    setStockModalVisible(true);
  };

  const handleStockSubmit = async (values: Record<string, unknown>) => {
    if (!selectedInventory) return;

    setUpdating(true);
    try {
      const { quantity, type } = values;
      // TODO: Save transaction log with reason and note
      // const { reason, note } = values;
      const quantityNum = quantity as number;
      const typeStr = type as string;
      let newStockQuantity = selectedInventory.SoLuongTon;

      if (typeStr === 'in') {
        newStockQuantity += quantityNum;
      } else if (typeStr === 'out') {
        newStockQuantity -= quantityNum;
        if (newStockQuantity < 0) {
          message.error('Không thể xuất hàng nhiều hơn số lượng tồn kho hiện tại');
          setUpdating(false);
          return;
        }
      }

      // Update inventory
      await inventoryService.update(selectedInventory.SanPhamID, {
        SoLuongTon: newStockQuantity
      });

      // Log the transaction (for now just show message, later can save to database)
      const actionText = typeStr === 'in' ? 'nhập' : 'xuất';
      message.success(`Đã ${actionText} ${quantityNum} sản phẩm thành công`);

      setStockModalVisible(false);
      loadInventory();
    } catch {
      message.error('Không thể thực hiện giao dịch tồn kho');
    } finally {
      setUpdating(false);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { text: 'Hết hàng', color: 'red' };
    } else if (quantity < 10) {
      return { text: 'Sắp hết', color: 'orange' };
    } else if (quantity < 50) {
      return { text: 'Còn ít', color: 'gold' };
    } else {
      return { text: 'Còn nhiều', color: 'green' };
    }
  };

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'HinhAnh',
      key: 'HinhAnh',
      width: 80,
      render: (hinhAnh: string) => (
        <Image
          src={hinhAnh ? `http://localhost:3000${hinhAnh}` : undefined}
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
      title: 'Số lượng tồn',
      dataIndex: 'SoLuongTon',
      key: 'SoLuongTon',
      render: (quantity: number) => (
        <strong style={{ 
          fontSize: 16,
          color: quantity === 0 ? '#ff4d4f' : quantity < 10 ? '#faad14' : '#52c41a'
        }}>
          {quantity}
        </strong>
      ),
      sorter: (a: Inventory, b: Inventory) => 
        a.SoLuongTon - b.SoLuongTon,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: Inventory) => {
        const status = getStockStatus(record.SoLuongTon);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
      filters: [
        { text: 'Hết hàng', value: 'out' },
        { text: 'Sắp hết', value: 'low' },
        { text: 'Còn ít', value: 'medium' },
        { text: 'Còn nhiều', value: 'high' },
      ],
      onFilter: (value: boolean | React.Key, record: Inventory) => {
        const quantity = record.SoLuongTon;
        if (value === 'out') return quantity === 0;
        if (value === 'low') return quantity > 0 && quantity < 10;
        if (value === 'medium') return quantity >= 10 && quantity < 50;
        if (value === 'high') return quantity >= 50;
        return false;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: Inventory) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditInventory(record)}
            style={{ color: '#1890ff' }}
          >
            Chỉnh sửa
          </Button>
          <Button
            type="link"
            icon={<ShoppingCartOutlined />}
            onClick={() => handleStockIn(record)}
            style={{ color: '#52c41a' }}
          >
            Nhập hàng
          </Button>
          <Button
            type="link"
            icon={<ExportOutlined />}
            onClick={() => handleStockOut(record)}
            style={{ color: '#faad14' }}
            disabled={record.SoLuongTon === 0}
          >
            Xuất hàng
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <ContainerOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
            Quản lý tồn kho
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: 16 }}>
          Theo dõi số lượng tồn kho các sản phẩm
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
              <span style={{ fontSize: 18, fontWeight: '600' }}>Danh sách tồn kho</span>
            </div>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              onClick={() => handlePopulateInventory(false)}
              loading={populating}
              style={{
                background: '#52c41a',
                border: 'none',
                borderRadius: '6px',
              }}
            >
              Tạo dữ liệu tồn kho
            </Button>
          </div>
        }
      >
        <SearchBar
          onSearch={handleSearch}
          onReset={handleResetSearch}
          searchType="inventory"
          loading={searchLoading}
        />

        <Table
          columns={columns}
          dataSource={inventory}
          rowKey="SanPhamID"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`,
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
            <EditOutlined style={{ color: '#1890ff' }} />
            <span>Cập nhật số lượng tồn kho</span>
          </div>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdateInventory}
        confirmLoading={updating}
        okText="Cập nhật số lượng"
        cancelText="Hủy"
        width={600}
        centered
      >
        {selectedInventory && (
          <div style={{ padding: '20px 0' }}>
            {/* Product Info Card */}
            <div style={{
              display: 'flex',
              gap: 16,
              padding: '16px',
              background: '#fafafa',
              borderRadius: '8px',
              marginBottom: 20,
              border: '1px solid #f0f0f0'
            }}>
              <Image
                src={selectedInventory.HinhAnh ? `http://localhost:3000${selectedInventory.HinhAnh}` : undefined}
                alt={selectedInventory.TenSanPham || 'Sản phẩm'}
                width={80}
                height={80}
                style={{ objectFit: 'cover', borderRadius: '6px' }}
                placeholder={
                  <div style={{
                    width: 80,
                    height: 80,
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    color: '#999'
                  }}>
                    📷
                  </div>
                }
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#262626', marginBottom: 4 }}>
                  {selectedInventory.TenSanPham || 'Tên sản phẩm chưa cập nhật'}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: 4 }}>
                  Model: {selectedInventory.Model || 'N/A'}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: 4 }}>
                  Thương hiệu: {selectedInventory.ThuongHieu || 'N/A'}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Danh mục: {selectedInventory.TenDanhMuc || 'N/A'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px', marginBottom: 8 }}>
                  Hiện tại: {selectedInventory.SoLuongTon}
                </Tag>
                {selectedInventory.GiaGoc && (
                  <div style={{ fontSize: '14px', color: '#52c41a', fontWeight: '500' }}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(Number(selectedInventory.GiaGoc))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 12, fontWeight: 500, color: '#262626' }}>
                Số lượng tồn kho mới
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Số lượng hiện tại:</span>
                  <Tag color="blue" style={{ fontSize: '14px', padding: '2px 8px' }}>
                    {selectedInventory?.SoLuongTon || 0}
                  </Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '14px', color: '#666', minWidth: '120px' }}>Số lượng mới:</span>
                  <QuantityInput
                    value={newQuantity}
                    onChange={setNewQuantity}
                    min={0}
                    max={99999}
                  />
                </div>
                {newQuantity !== (selectedInventory?.SoLuongTon || 0) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '14px', color: '#666', minWidth: '120px' }}>Thay đổi:</span>
                    <Tag
                      color={newQuantity > (selectedInventory?.SoLuongTon || 0) ? 'green' : 'orange'}
                      style={{ fontSize: '14px', padding: '2px 8px' }}
                    >
                      {newQuantity > (selectedInventory?.SoLuongTon || 0) ? '+' : ''}
                      {newQuantity - (selectedInventory?.SoLuongTon || 0)}
                    </Tag>
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <span style={{ fontSize: '14px', color: '#666', marginBottom: 8, display: 'block' }}>
                    Đặt số lượng nhanh:
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[0, 10, 50, 100, 500].map((preset) => (
                      <Button
                        key={preset}
                        size="small"
                        type={newQuantity === preset ? 'primary' : 'default'}
                        onClick={() => setNewQuantity(preset)}
                        style={{
                          minWidth: '50px',
                          fontSize: '12px'
                        }}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Stock In/Out Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCartOutlined style={{ color: '#1890ff' }} />
            <span>Nhập/Xuất hàng</span>
          </div>
        }
        open={stockModalVisible}
        onCancel={() => setStockModalVisible(false)}
        onOk={() => stockForm.submit()}
        confirmLoading={updating}
        okText="Xác nhận"
        cancelText="Hủy"
        width={700}
        centered
      >
        {selectedInventory && (
          <div style={{ padding: '20px 0' }}>
            {/* Product Info */}
            <div style={{
              display: 'flex',
              gap: 16,
              padding: '16px',
              background: '#fafafa',
              borderRadius: '8px',
              marginBottom: 20,
              border: '1px solid #f0f0f0'
            }}>
              <Image
                src={selectedInventory.HinhAnh ? `http://localhost:3000${selectedInventory.HinhAnh}` : undefined}
                alt={selectedInventory.TenSanPham || 'Sản phẩm'}
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: '6px' }}
                placeholder={
                  <div style={{
                    width: 60,
                    height: 60,
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    color: '#999'
                  }}>
                    📷
                  </div>
                }
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#262626', marginBottom: 4 }}>
                  {selectedInventory.TenSanPham || 'Tên sản phẩm chưa cập nhật'}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: 4 }}>
                  Model: {selectedInventory.Model || 'N/A'}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Thương hiệu: {selectedInventory.ThuongHieu || 'N/A'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                  Tồn kho: {selectedInventory.SoLuongTon}
                </Tag>
              </div>
            </div>

            <Form
              form={stockForm}
              layout="vertical"
              onFinish={handleStockSubmit}
            >
              <Form.Item name="type" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="productId" hidden>
                <Input />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  name="type"
                  label="Loại giao dịch"
                  rules={[{ required: true, message: 'Vui lòng chọn loại giao dịch' }]}
                >
                  <Select placeholder="Chọn loại">
                    <Select.Option value="in">
                      <span style={{ color: '#52c41a' }}>📥 Nhập hàng</span>
                    </Select.Option>
                    <Select.Option value="out">
                      <span style={{ color: '#faad14' }}>📤 Xuất hàng</span>
                    </Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="quantity"
                  label="Số lượng"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng' },
                    { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={selectedInventory.SoLuongTon > 0 ? selectedInventory.SoLuongTon : 99999}
                    style={{ width: '100%' }}
                    placeholder="Nhập số lượng"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="reason"
                label="Lý do"
                rules={[{ required: true, message: 'Vui lòng chọn lý do' }]}
              >
                <Select placeholder="Chọn lý do">
                  <Select.Option value="purchase">Mua hàng từ nhà cung cấp</Select.Option>
                  <Select.Option value="return">Trả hàng từ khách</Select.Option>
                  <Select.Option value="transfer">Chuyển kho</Select.Option>
                  <Select.Option value="adjustment">Điều chỉnh tồn kho</Select.Option>
                  <Select.Option value="damage">Hàng hỏng/mất</Select.Option>
                  <Select.Option value="promotion">Khuyến mãi/samples</Select.Option>
                  <Select.Option value="other">Lý do khác</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="date"
                label="Ngày giao dịch"
                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                />
              </Form.Item>

              <Form.Item
                name="note"
                label="Ghi chú"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập ghi chú (tùy chọn)"
                />
              </Form.Item>

              <Divider />

              <div style={{ background: '#f6ffed', padding: '12px', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.quantity !== currentValues.quantity ||
                    prevValues.type !== currentValues.type
                  }
                >
                  {({ getFieldValue }) => {
                    const quantity = getFieldValue('quantity') || 0;
                    const type = getFieldValue('type');
                    const currentStock = selectedInventory.SoLuongTon;
                    const newStock = type === 'in' ? currentStock + quantity : currentStock - quantity;

                    return (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#262626', marginBottom: 8 }}>
                          Xem trước thay đổi
                        </div>
                        <Space size="large">
                          <div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Hiện tại</div>
                            <Tag color="blue" style={{ fontSize: '16px' }}>{currentStock}</Tag>
                          </div>
                          <div style={{ fontSize: '20px', color: '#d9d9d9' }}>
                            {type === 'in' ? '➡️' : '➡️'}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {type === 'in' ? 'Sau nhập' : 'Sau xuất'}
                            </div>
                            <Tag
                              color={type === 'in' ? 'green' : newStock >= 0 ? 'orange' : 'red'}
                              style={{ fontSize: '16px' }}
                            >
                              {newStock}
                            </Tag>
                          </div>
                        </Space>
                      </div>
                    );
                  }}
                </Form.Item>
              </div>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;

