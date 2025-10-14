# 📸 Hướng dẫn Upload ảnh sản phẩm

## 🎯 **Tính năng mới: Upload ảnh từ máy tính**

### ✅ **Các chức năng có sẵn:**

#### **1. Upload 1 ảnh:**
- Click nút "Upload 1 ảnh"
- Chọn 1 file ảnh từ máy tính
- Ảnh sẽ được upload và hiển thị preview

#### **2. Upload nhiều ảnh:**
- Click nút "Upload nhiều ảnh"
- Chọn nhiều file ảnh cùng lúc (tối đa 5 ảnh)
- Tất cả ảnh sẽ được upload và hiển thị preview

#### **3. Nhập link ảnh:**
- Vẫn có thể nhập link ảnh trực tiếp
- Click "Thêm trường nhập link ảnh" để thêm trường mới

#### **4. Preview ảnh:**
- Hiển thị preview ảnh ngay sau khi upload
- Hỗ trợ ảnh local và ảnh từ URL

## 🔧 **Cách sử dụng:**

### **Bước 1: Truy cập trang thêm/sửa sản phẩm**
```
ADMIN → Sản phẩm → Thêm sản phẩm / Chỉnh sửa
```

### **Bước 2: Scroll xuống phần "Hình ảnh sản phẩm"**

### **Bước 3: Upload ảnh**
- **Upload 1 ảnh**: Chọn 1 file từ máy
- **Upload nhiều ảnh**: Chọn nhiều file cùng lúc
- **Nhập link**: Nhập URL ảnh trực tiếp

### **Bước 4: Xem preview**
- Ảnh sẽ hiển thị preview ngay lập tức
- Có thể xóa ảnh bằng nút "Xóa"

### **Bước 5: Lưu sản phẩm**
- Click "Lưu sản phẩm"
- Tất cả ảnh sẽ được lưu vào database

## 📋 **Định dạng ảnh hỗ trợ:**
- ✅ JPG/JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ✅ BMP

## 📏 **Giới hạn:**
- **Kích thước**: Tối đa 5MB mỗi ảnh
- **Số lượng**: Không giới hạn (khuyến nghị tối đa 10 ảnh)
- **Upload nhiều**: Tối đa 5 ảnh mỗi lần

## 🔄 **Backend API:**

### **Upload 1 ảnh:**
```
POST /api/upload
Content-Type: multipart/form-data
Body: { image: File }
Response: { filePath: "/uploads/filename.jpg" }
```

### **Upload nhiều ảnh:**
```
POST /api/upload/multiple
Content-Type: multipart/form-data
Body: { images: File[] }
Response: { filePaths: ["/uploads/file1.jpg", "/uploads/file2.jpg"] }
```

## 📁 **Cấu trúc file:**

### **Backend:**
- `BE/routes/upload.js` - Upload routes
- `BE/uploads/` - Thư mục lưu ảnh

### **Frontend:**
- `ADMIN/src/services/uploadService.ts` - Upload service
- `ADMIN/src/pages/ProductForm.tsx` - UI upload

## 🎨 **Giao diện:**

### **Upload Section:**
```
┌─────────────────────────────────────┐
│ [Upload 1 ảnh] [Upload nhiều ảnh]  │
└─────────────────────────────────────┘
```

### **Image List:**
```
┌─────────────────────────────────────┐
│ Hình 1                    [Xóa]    │
│ [Input field for URL]              │
│ [Preview Image]                    │
└─────────────────────────────────────┘
```

## 🚀 **Ưu điểm:**

### ✅ **Dễ sử dụng:**
- Drag & drop hoặc click để chọn
- Preview ảnh ngay lập tức
- Hỗ trợ nhiều định dạng

### ✅ **Linh hoạt:**
- Upload từ máy tính
- Nhập link ảnh
- Upload nhiều ảnh cùng lúc

### ✅ **An toàn:**
- Kiểm tra định dạng file
- Giới hạn kích thước
- Xử lý lỗi upload

## 🎯 **Kết quả:**

Sau khi upload, ảnh sẽ được lưu trong database dưới dạng array:
```json
{
  "HinhAnh": [
    "/uploads/1640995200000-product1.jpg",
    "/uploads/1640995201000-product2.jpg",
    "/uploads/1640995202000-product3.jpg"
  ]
}
```

Và hiển thị trong danh sách sản phẩm với preview ảnh đầu tiên! 🎉
