import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag, Card } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  FileOutlined,
  CaretDownFilled,
  CaretRightFilled,
  TagsOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { categoryService } from '../services/categoryService';
import type { Category, CreateCategoryDto } from '../services/categoryService';
import SearchBar from '../components/SearchBar';
import { useSearch } from '../hooks/useSearch';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [, setCurrentFilters] = useState<Record<string, unknown>>({});
  const [form] = Form.useForm();

  // Use search hook
  const { searchLoading, searchCategories } = useSearch();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch {
      message.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, filters?: Record<string, unknown>) => {
    setCurrentFilters(filters || {});

    try {
      // Always fetch fresh data and search client-side
      const response = await categoryService.getAll();
      const allCategories = response.data;

      // Use the search hook for client-side search
      const filteredCategories = await searchCategories(allCategories as unknown as Record<string, unknown>[], query, filters);

      setCategories(filteredCategories as unknown as Category[]);
    } catch (error) {
      message.error('Không thể tìm kiếm danh mục');
      console.error('Search error:', error);
    }
  };

  const handleResetSearch = () => {
    setCurrentFilters({});
    loadCategories();
  };

  // Build tree structure
  const treeData = useMemo(() => {
    const categoryMap = new Map<string, CategoryWithChildren>();
    const roots: CategoryWithChildren[] = [];

    // First pass: create map of all categories
    categories.forEach(cat => {
      categoryMap.set(cat.DanhMucID, { ...cat, children: [] });
    });

    // Second pass: build tree
    categories.forEach(cat => {
      const node = categoryMap.get(cat.DanhMucID)!;
      if (cat.ParentID && categoryMap.has(cat.ParentID)) {
        const parent = categoryMap.get(cat.ParentID)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [categories]);

  // Helper function to get category name by ID
  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return null;
    const category = categories.find(cat => cat.DanhMucID === id);
    return category?.TenDanhMuc || null;
  };

  // Get parent categories only (for select options)
  const parentCategories = useMemo(() => {
    return categories.filter(cat => !cat.ParentID);
  }, [categories]);

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Category) => {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryService.delete(id);
      message.success('Xóa danh mục thành công');
      loadCategories();
    } catch {
      message.error('Không thể xóa danh mục');
    }
  };

  const handleSubmit = async (values: CreateCategoryDto) => {
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.DanhMucID, values);
        message.success('Cập nhật danh mục thành công');
      } else {
        await categoryService.create(values);
        message.success('Thêm danh mục thành công');
      }
      setModalVisible(false);
      loadCategories();
    } catch {
      message.error(editingCategory ? 'Không thể cập nhật danh mục' : 'Không thể thêm danh mục');
    }
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'TenDanhMuc',
      key: 'TenDanhMuc',
      render: (text: string, record: Category) => (
        <Space>
          {record.ParentID ? (
            <FileOutlined style={{ color: '#1890ff' }} />
          ) : (
            <FolderOutlined style={{ color: '#faad14' }} />
          )}
          <span style={{ fontWeight: record.ParentID ? 'normal' : 'bold' }}>
            {text}
          </span>
          {!record.ParentID && (
            <Tag color="blue">Danh mục chính</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'MoTa',
      key: 'MoTa',
      render: (text: string) => text || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Danh mục cha',
      dataIndex: 'ParentID',
      key: 'ParentID',
      render: (id: string) => {
        const parentName = getCategoryName(id);
        return parentName ? (
          <Tag color="geekblue">{parentName}</Tag>
        ) : (
          <Tag color="default">Không có</Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: Category) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.DanhMucID)}
            okText="Xóa"
            cancelText="Hủy"
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
          <TagsOutlined style={{ fontSize: 24, color: '#004d99' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: '700', color: '#1a1a1a' }}>
            Quản lý danh mục
          </h1>
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: 16 }}>
          Quản lý danh mục sản phẩm điện máy
        </p>
      </div>

      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '1px solid #f0f0f0',
        }}
        bodyStyle={{ padding: '24px' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ThunderboltOutlined style={{ color: '#004d99', fontSize: 16 }} />
              <span style={{ fontSize: 18, fontWeight: '600' }}>Danh sách danh mục</span>
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
              Thêm danh mục
            </Button>
          </div>
        }
      >
        <SearchBar
          onSearch={handleSearch}
          onReset={handleResetSearch}
          searchType="categories"
          loading={searchLoading}
        />

        <Table
          columns={columns}
          dataSource={treeData}
          rowKey="DanhMucID"
          loading={loading}
          expandable={{
            defaultExpandAllRows: true,
            indentSize: 30,
            showExpandColumn: true,
            expandIcon: ({ expanded, onExpand, record }) => {
              // Chỉ hiển thị expand icon nếu có children
              if (record.children && record.children.length > 0) {
                return expanded ? (
                  <CaretDownFilled
                    onClick={(e) => onExpand(record, e)}
                    style={{ 
                      cursor: 'pointer', 
                      marginRight: 8,
                      color: '#004d99',
                      fontSize: 14
                    }}
                  />
                ) : (
                  <CaretRightFilled
                    onClick={(e) => onExpand(record, e)}
                    style={{ 
                      cursor: 'pointer', 
                      marginRight: 8,
                      color: '#999',
                      fontSize: 14
                    }}
                  />
                );
              }
              return <span style={{ marginRight: 24 }} />; // Placeholder để giữ alignment
            },
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} danh mục`,
            style: { marginTop: 24 },
          }}
          style={{
            borderRadius: '8px',
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="TenDanhMuc"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="MoTa" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item 
            name="ParentID" 
            label="Danh mục cha"
            tooltip="Để trống nếu đây là danh mục chính"
          >
            <Select 
              allowClear 
              placeholder="Chọn danh mục cha (để trống nếu là danh mục chính)"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {parentCategories.map(cat => (
                <Select.Option 
                  key={cat.DanhMucID} 
                  value={cat.DanhMucID}
                  label={cat.TenDanhMuc}
                  disabled={editingCategory?.DanhMucID === cat.DanhMucID}
                >
                  <Space>
                    <FolderOutlined style={{ color: '#faad14' }} />
                    {cat.TenDanhMuc}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;

