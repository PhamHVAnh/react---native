# Tính năng Tìm kiếm - Hệ thống Quản lý Điện máy

## Tổng quan
Hệ thống đã được tích hợp đầy đủ tính năng tìm kiếm nâng cao cho tất cả các entity trong admin panel.

## Backend API

### 1. Tìm kiếm tổng hợp (Global Search)
**Endpoint:** `GET /api/search`

**Parameters:**
- `query` (required): Từ khóa tìm kiếm (tối thiểu 2 ký tự)
- `type` (optional): Loại tìm kiếm (`products`, `users`, `orders`, `categories`, `promotions`, `warranties`, `all`)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "users": [...],
    "orders": [...],
    "categories": [...],
    "promotions": [...],
    "warranties": [...]
  },
  "totalResults": 25,
  "query": "samsung"
}
```

### 2. Tìm kiếm nâng cao (Advanced Search)
**Endpoint:** `POST /api/search/advanced`

**Body:**
```json
{
  "query": "samsung",
  "type": "products",
  "minPrice": 1000000,
  "maxPrice": 5000000,
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "status": "active",
  "limit": 50,
  "offset": 0
}
```

## Frontend Components

### 1. SearchBox Component
- Tìm kiếm tổng hợp với dropdown kết quả
- Hiển thị kết quả từ tất cả các entity
- Click vào kết quả để navigate đến trang tương ứng
- Debounce 300ms để tối ưu performance

**Sử dụng:**
```tsx
<SearchBox 
  onItemClick={handleSearchItemClick}
  placeholder="Tìm kiếm sản phẩm, đơn hàng, khách hàng..."
/>
```

### 2. SearchBar Component
- Tìm kiếm trong từng trang cụ thể
- Bộ lọc nhanh (Quick filters)
- Modal tìm kiếm nâng cao
- Hiển thị trạng thái bộ lọc hiện tại

**Sử dụng:**
```tsx
<SearchBar
  onSearch={handleSearch}
  onReset={handleResetSearch}
  searchType="products"
  loading={searchLoading}
/>
```

### 3. AdvancedSearchModal Component
- Modal tìm kiếm với nhiều bộ lọc
- Hỗ trợ tìm kiếm theo khoảng thời gian
- Lọc theo giá, trạng thái, vai trò
- Pagination với limit/offset

## Tính năng đã tích hợp

### ✅ Backend
- [x] API tìm kiếm tổng hợp
- [x] API tìm kiếm nâng cao
- [x] Tìm kiếm sản phẩm với filter giá
- [x] Tìm kiếm đơn hàng với filter trạng thái và thời gian
- [x] Tìm kiếm người dùng với filter vai trò
- [x] Tìm kiếm bảo hành với filter trạng thái
- [x] Swagger documentation

### ✅ Frontend
- [x] SearchBox trong MainLayout (header)
- [x] SearchBar cho từng trang
- [x] AdvancedSearchModal
- [x] SearchService với TypeScript
- [x] Tích hợp vào trang Products
- [x] UI/UX responsive và đẹp mắt

### ✅ Tích hợp
- [x] Tìm kiếm tổng hợp từ header
- [x] Tìm kiếm nâng cao cho sản phẩm
- [x] Navigation tự động khi click kết quả
- [x] Loading states và error handling
- [x] Debounce để tối ưu performance

## Cách sử dụng

### 1. Tìm kiếm tổng hợp
1. Click vào ô tìm kiếm ở header
2. Nhập từ khóa (tối thiểu 2 ký tự)
3. Xem kết quả trong dropdown
4. Click vào kết quả để chuyển đến trang tương ứng

### 2. Tìm kiếm trong trang cụ thể
1. Sử dụng SearchBar ở đầu mỗi trang
2. Nhập từ khóa và click "Tìm kiếm"
3. Sử dụng bộ lọc nhanh nếu có
4. Click "Lọc nâng cao" để mở modal với nhiều tùy chọn

### 3. Tìm kiếm nâng cao
1. Click "Lọc nâng cao" trong SearchBar
2. Nhập từ khóa tìm kiếm
3. Chọn các bộ lọc phù hợp:
   - **Sản phẩm**: Giá min/max
   - **Đơn hàng**: Khoảng thời gian, trạng thái
   - **Người dùng**: Vai trò
   - **Bảo hành**: Trạng thái, ngày mua
4. Click "Tìm kiếm"

## Ví dụ sử dụng

### Tìm kiếm sản phẩm Samsung với giá từ 2-10 triệu
```json
POST /api/search/advanced
{
  "query": "samsung",
  "type": "products",
  "minPrice": 2000000,
  "maxPrice": 10000000
}
```

### Tìm kiếm đơn hàng chưa xử lý trong tháng này
```json
POST /api/search/advanced
{
  "query": "",
  "type": "orders",
  "status": "ChuaXuLy",
  "dateFrom": "2024-01-01",
  "dateTo": "2024-01-31"
}
```

## Lưu ý kỹ thuật

1. **Performance**: Debounce 300ms cho tìm kiếm real-time
2. **Security**: API advanced search yêu cầu authentication
3. **UX**: Loading states, error handling, empty states
4. **Responsive**: Tối ưu cho mobile và desktop
5. **TypeScript**: Full type safety cho frontend

## Mở rộng trong tương lai

- [ ] Tìm kiếm full-text với MySQL
- [ ] Lưu lịch sử tìm kiếm
- [ ] Gợi ý từ khóa (autocomplete)
- [ ] Tìm kiếm theo vị trí địa lý
- [ ] Export kết quả tìm kiếm
- [ ] Tìm kiếm theo tag/category

