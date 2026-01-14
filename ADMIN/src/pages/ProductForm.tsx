import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, InputNumber, Select, Button, message, Card, Row, Col, Space, Divider, Tag, Upload, Image, TreeSelect } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services/productService';
import type { CreateProductDto, Product } from '../services/productService';
import { categoryService } from '../services/categoryService';
import type { Category } from '../services/categoryService';
import { getAttributeTemplate } from '../utils/productAttributes';
import type { AttributeField } from '../utils/productAttributes';
import { uploadService } from '../services/uploadService';

const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [attributeFields, setAttributeFields] = useState<AttributeField[]>([]);
  const [images, setImages] = useState<string[]>(['']);
  const [uploading, setUploading] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);
  const [productLoaded, setProductLoaded] = useState(false);
  const [storedProductData, setStoredProductData] = useState<Product | null>(null);
  const [categoryTreeData, setCategoryTreeData] = useState<CategoryNode[]>([]);

  const isEditMode = !!id;

  interface CategoryNode extends Category {
    children: CategoryNode[];
  }

  const buildCategoryTree = useCallback((categories: Category[]): CategoryNode[] => {
    const categoryMap = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // First pass: create map of all categories
    categories.forEach(cat => {
      categoryMap.set(cat.DanhMucID, { 
        ...cat, 
        children: []
      });
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

    console.log('🌳 Built category tree:', roots);
    return roots;
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
      
      // Build tree structure for categories
      const treeData = buildCategoryTree(response.data);
      setCategoryTreeData(treeData);
    } catch {
      message.error('Không thể tải danh sách danh mục');
    }
  }, [buildCategoryTree]);

  interface TreeSelectNode {
    title: string;
    value: string;
    key: string;
    children?: TreeSelectNode[];
  }

  const convertToTreeSelectData = (treeData: CategoryNode[]): TreeSelectNode[] => {
    const result = treeData.map(node => ({
      title: node.TenDanhMuc,
      value: node.DanhMucID,
      key: node.DanhMucID,
      children: node.children && node.children.length > 0 
        ? convertToTreeSelectData(node.children)
        : undefined
    }));
    
    console.log('🌳 TreeSelect data:', result);
    return result;
  };

  const loadProduct = useCallback(async () => {
    if (!id || !categories.length) return;
    setLoading(true);
    try {
      const response = await productService.getById(id);
      const product = response.data;
      
      // Store product data for later use
      setStoredProductData(product);
      
      console.log('📦 Product data loaded:', product);
      console.log('🔧 Product attributes:', product.ThuocTinh);
      
      // Clear form first to remove any old data
      form.resetFields();
      
      // Set category and load attributes FIRST
      if (product.DanhMucID) {
        setSelectedCategory(product.DanhMucID);
        const category = categories.find(c => c.DanhMucID === product.DanhMucID);
        
        if (category) {
          const template = getAttributeTemplate(category.TenDanhMuc);
          setAttributeFields(template);
          
          console.log('📋 Template loaded:', template);
          
          if (template.length > 0) {
            message.success(`Đã tải ${template.length} trường thuộc tính cho "${category.TenDanhMuc}"`);
          } else {
            message.warning(`Không tìm thấy template cho "${category.TenDanhMuc}"`);
          }
        }
      }

      // Set images
      if (product.HinhAnh && Array.isArray(product.HinhAnh)) {
        setImages(product.HinhAnh.length > 0 ? product.HinhAnh : ['']);
      }

      // Set form values with proper handling for empty values
      const formValues = {
        TenSanPham: product.TenSanPham || '',
        DanhMucID: product.DanhMucID || undefined,
        Model: product.Model || '',
        ThuongHieu: product.ThuongHieu || '',
        MoTa: product.MoTa || '',
        GiaGoc: product.GiaGoc || 0,
        GiamGia: product.GiamGia || 0,
        BaoHanhThang: product.BaoHanhThang || 12,
        ...product.ThuocTinh,
      };
      
      console.log('📝 Form values to set:', formValues);
      
      // Use setTimeout to ensure attribute fields are loaded before setting values
      setTimeout(() => {
        form.setFieldsValue(formValues);
        console.log('✅ Form values set successfully');
      }, 100);
      
    } catch (error) {
      console.error('Error loading product:', error);
      message.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
      setFormLoaded(true);
    }
  }, [id, form, categories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (isEditMode && categories.length > 0 && !productLoaded) {
      loadProduct();
      setProductLoaded(true);
    }
  }, [isEditMode, categories.length, productLoaded, loadProduct]);

  // Re-set form values when attribute fields change (for edit mode)
  useEffect(() => {
    if (isEditMode && attributeFields.length > 0 && formLoaded && storedProductData) {
      console.log('🔄 Attribute fields changed, re-setting form values');
      console.log('🔧 Using stored product attributes:', storedProductData.ThuocTinh);
      
      if (storedProductData.ThuocTinh && Object.keys(storedProductData.ThuocTinh).length > 0) {
        // Set only the attribute values
        const attributeValues: Record<string, string | number | boolean> = {};
        
        // Map database field names (Vietnamese) to template field names (English)
        attributeFields.forEach(field => {
          // Find matching database field by label
          const dbFieldName = Object.keys(storedProductData.ThuocTinh || {}).find(dbKey => {
            // Try to match by label or by similar name
            return dbKey === field.label || 
                   dbKey.toLowerCase().includes(field.label.toLowerCase()) ||
                   field.label.toLowerCase().includes(dbKey.toLowerCase());
          });
          
          if (dbFieldName && storedProductData.ThuocTinh && storedProductData.ThuocTinh[dbFieldName] !== undefined) {
            attributeValues[field.name] = storedProductData.ThuocTinh[dbFieldName];
            console.log(`🔄 Mapped: ${dbFieldName} (${storedProductData.ThuocTinh[dbFieldName]}) -> ${field.name}`);
          }
        });
        
        console.log('📝 Setting attribute values:', attributeValues);
        
        setTimeout(() => {
          form.setFieldsValue(attributeValues);
          console.log('✅ Attribute values set successfully');
        }, 100);
      }
    }
  }, [attributeFields, isEditMode, formLoaded, storedProductData, form]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = categories.find(c => c.DanhMucID === categoryId);
    
    console.log('📦 Danh mục được chọn:', category);
    
    if (category) {
      const template = getAttributeTemplate(category.TenDanhMuc);
      console.log('📋 Template nhận được:', template);
      setAttributeFields(template);
      
      // Hiển thị thông báo khi load template
      if (template.length > 0) {
        message.success(`Đã tải ${template.length} trường thuộc tính cho "${category.TenDanhMuc}"`);
      } else {
        message.warning(`Không tìm thấy template cho "${category.TenDanhMuc}"`);
      }
    }
  };


  const removeImageField = (index: number) => {
    if (images.length > 1) {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
    }
  };



  const handleImageUpload = async (files: File[]) => {
    setUploading(true);
    try {
      let imageUrls: string[] = [];
      
      if (files.length === 1) {
        // Upload 1 ảnh
        const imageUrl = await uploadService.uploadImage(files[0]);
        imageUrls = [imageUrl];
      } else {
        // Upload nhiều ảnh
        imageUrls = await uploadService.uploadMultiple(files);
      }
      
      // Lọc bỏ các ảnh rỗng và thêm các ảnh mới
      const validImages = images.filter(img => img.trim() !== '');
      validImages.push(...imageUrls);
      setImages(validImages);
      
      message.success(`Upload thành công ${imageUrls.length} ảnh!`);
    } catch {
      message.error('Upload ảnh thất bại!');
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload behavior
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      // Tách các thuộc tính cơ bản và thuộc tính động
      const { TenSanPham, DanhMucID, Model, ThuongHieu, MoTa, GiaGoc, GiamGia, BaoHanhThang, ...attributes } = values;

      // Lọc attributes để chỉ giữ những field có trong template và có giá trị
      const filteredAttributes: Record<string, unknown> = {};
      attributeFields.forEach(field => {
        const value = attributes[field.name];
        if (value !== undefined && value !== '' && value !== null && value !== 0) {
          filteredAttributes[field.name] = value;
        }
      });

      console.log('💾 Thuộc tính sẽ được lưu:', filteredAttributes);

      const productData: CreateProductDto = {
        TenSanPham: TenSanPham as string,
        DanhMucID: DanhMucID as string,
        Model: Model as string,
        ThuongHieu: ThuongHieu as string,
        MoTa: MoTa as string,
        GiaGoc: GiaGoc as number,
        GiamGia: (GiamGia as number) || 0,
        BaoHanhThang: BaoHanhThang as number,
        HinhAnh: images.filter(img => img.trim() !== ''),
        ThuocTinh: filteredAttributes as Record<string, string | number | boolean>,
      };

      console.log('📤 Dữ liệu gửi lên server:', productData);

      if (isEditMode && id) {
        await productService.update(id, productData);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await productService.create(productData);
        message.success('Thêm sản phẩm thành công');
      }
      
      navigate('/products');
    } catch (error) {
      console.error('❌ Lỗi khi lưu sản phẩm:', error);
      message.error(isEditMode ? 'Không thể cập nhật sản phẩm' : 'Không thể thêm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const renderAttributeField = (field: AttributeField) => {
    const commonProps = {
      style: { width: '100%' },
    };

    switch (field.type) {
      case 'number':
        return (
          <InputNumber
            {...commonProps}
            placeholder={field.placeholder}
            addonAfter={field.unit}
            min={0}
          />
        );
      case 'select':
        return (
          <Select 
            {...commonProps} 
            placeholder={`Chọn ${field.label.toLowerCase()}`}
            showSearch
            filterOption={(input, option) =>
              String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {field.options?.map(option => (
              <Select.Option key={option} value={option}>
                {option}
              </Select.Option>
            ))}
          </Select>
        );
      case 'textarea':
        return (
          <Input.TextArea
            rows={3}
            placeholder={field.placeholder}
            style={{ width: '100%' }}
          />
        );
      default:
        return (
          <Input
            placeholder={field.placeholder}
            addonAfter={field.unit}
            style={{ width: '100%' }}
          />
        );
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/products')}
          style={{ marginBottom: 16 }}
        >
          Quay lại
        </Button>
        <h1>{isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          GiamGia: 0,
          BaoHanhThang: 12,
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Thông tin cơ bản" style={{ marginBottom: 24 }}>
              <Form.Item
                name="TenSanPham"
                label="Tên sản phẩm"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
              >
                <Input size="large" placeholder="Nhập tên sản phẩm" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="DanhMucID"
                    label="Danh mục"
                    rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                  >
                    <TreeSelect
                      size="large"
                      placeholder="Chọn danh mục"
                      onChange={handleCategoryChange}
                      showSearch
                      treeDefaultExpandAll={true}
                      allowClear
                      treeData={convertToTreeSelectData(categoryTreeData)}
                      treeNodeFilterProp="title"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="ThuongHieu"
                    label="Thương hiệu"
                    rules={[{ required: true, message: 'Vui lòng nhập thương hiệu' }]}
                  >
                    <Input size="large" placeholder="Samsung, LG, Sony..." />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="Model"
                label="Model"
                rules={[{ required: true, message: 'Vui lòng nhập model' }]}
              >
                <Input size="large" placeholder="Nhập mã model" />
              </Form.Item>

              <Form.Item name="MoTa" label="Mô tả">
                <Input.TextArea rows={4} placeholder="Mô tả chi tiết về sản phẩm" />
              </Form.Item>
            </Card>

            {/* Thuộc tính động */}
            {selectedCategory && attributeFields.length > 0 && (
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Thông số kỹ thuật</span>
                    <Tag color="green">{attributeFields.length} trường</Tag>
                  </div>
                }
                style={{ marginBottom: 24 }}
                headStyle={{ background: '#f0f5ff' }}
              >
                <Row gutter={16}>
                  {attributeFields.map(field => (
                    <Col xs={24} md={12} key={field.name}>
                      <Form.Item 
                        name={field.name} 
                        label={field.label}
                      >
                        {renderAttributeField(field)}
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}

            {/* Hướng dẫn nếu chưa chọn danh mục */}
            {!selectedCategory && (
              <Card 
                style={{ 
                  marginBottom: 24, 
                  background: '#fafafa',
                  border: '2px dashed #d9d9d9'
                }}
              >
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  <p style={{ fontSize: 16, marginBottom: 8 }}>
                    ℹ️ Chọn danh mục để hiển thị form thuộc tính mẫu
                  </p>
                  <p style={{ fontSize: 14 }}>
                    Hệ thống hỗ trợ: Tivi, Tủ lạnh, Máy giặt, Máy lạnh, Lò vi sóng, Quạt
                  </p>
                </div>
              </Card>
            )}
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Giá & Bảo hành" style={{ marginBottom: 24 }}>
              <Form.Item
                name="GiaGoc"
                label="Giá gốc"
                rules={[{ required: true, message: 'Vui lòng nhập giá gốc' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="₫"
                />
              </Form.Item>

              <Form.Item name="GiamGia" label="Giảm giá">
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  max={100}
                  addonAfter="%"
                  placeholder="Nhập phần trăm giảm giá"
                />
              </Form.Item>

              <Form.Item
                name="BaoHanhThang"
                label="Thời gian bảo hành"
                rules={[{ required: true, message: 'Vui lòng nhập thời gian bảo hành' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  addonAfter="tháng"
                />
              </Form.Item>
            </Card>

            <Card title="Hình ảnh sản phẩm">
              {/* Upload Section */}
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <Upload
                  beforeUpload={(_file, fileList) => {
                    // Chỉ lấy fileList, không gộp thêm file hiện tại (vì file đã có trong fileList)
                    const filesToUpload = (fileList || []).slice(0, 10);
                    handleImageUpload(filesToUpload);
                    return false;
                  }}
                  showUploadList={false}
                  accept="image/*"
                  multiple={true}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={uploading}
                    size="large"
                    style={{ 
                      background: '#004d99', 
                      borderColor: '#004d99',
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    {uploading ? 'Đang upload...' : 'Upload ảnh từ máy tính'}
                  </Button>
                </Upload>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  Hỗ trợ JPG, PNG, GIF. Có thể chọn 1 hoặc nhiều ảnh, tối đa 10 ảnh, mỗi ảnh 5MB
                </div>
              </div>

              {/* Image Grid */}
              {images.filter(img => img && img.trim() !== '').length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                    {images
                      .filter(img => img && img.trim() !== '')
                      .map((img, index) => {
                        return (
                          <div key={`image-${index}-${img}`} style={{ 
                            border: '1px solid #d9d9d9', 
                            borderRadius: 8, 
                            padding: 12,
                            background: '#fafafa'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontWeight: 500, fontSize: 14 }}>Ảnh {index + 1}</span>
                              <Button 
                                danger 
                                size="small" 
                                onClick={() => removeImageField(index)}
                                style={{ minWidth: 'auto', padding: '2px 8px' }}
                              >
                                ×
                              </Button>
                            </div>
                            
                            <div style={{ textAlign: 'center' }}>
                              <Image
                                src={img && img.startsWith('http') ? img : img ? `http://localhost:3000${img}` : undefined}
                                alt={`Preview ${index + 1}`}
                                style={{ 
                                  maxWidth: '100%', 
                                  height: 120, 
                                  objectFit: 'cover',
                                  borderRadius: 4
                                }}
                                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN..."
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {images.filter(img => img && img.trim() !== '').length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  border: '2px dashed #d9d9d9', 
                  borderRadius: 8,
                  background: '#fafafa'
                }}>
                  <UploadOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                  <div style={{ color: '#999', fontSize: 16 }}>Chưa có ảnh nào</div>
                  <div style={{ color: '#ccc', fontSize: 12 }}>Upload ảnh để hiển thị ở đây</div>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Divider />

        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!formLoaded && isEditMode}
            icon={<SaveOutlined />}
            size="large"
          >
            {isEditMode ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
          </Button>
          <Button size="large" onClick={() => navigate('/products')}>
            Hủy
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default ProductForm;

