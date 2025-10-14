# Admin Panel - Hệ thống quản lý điện máy

Admin panel cho hệ thống quản lý cửa hàng điện máy, được xây dựng với React, TypeScript, Ant Design và Vite.

## Tính năng

- ✅ Đăng nhập và xác thực
- ✅ Dashboard với thống kê tổng quan
- ✅ Quản lý người dùng (CRUD)
- ✅ Quản lý danh mục sản phẩm (CRUD)
- ✅ Quản lý sản phẩm (CRUD)
- ✅ Quản lý khuyến mãi (CRUD)
- ✅ Quản lý đơn hàng (Xem & Cập nhật trạng thái)
- ✅ Quản lý bảo hành (Xem & Cập nhật trạng thái)
- ✅ Quản lý tồn kho (Xem)

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview production build
npm run preview
```

## Cấu trúc dự án

```
ADMIN/
├── src/
│   ├── components/        # Shared components
│   │   ├── MainLayout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Users.tsx
│   │   ├── Categories.tsx
│   │   ├── Products.tsx
│   │   ├── Promotions.tsx
│   │   ├── Orders.tsx
│   │   ├── Warranties.tsx
│   │   └── Inventory.tsx
│   ├── services/          # API services
│   │   ├── api.ts
│   │   ├── userService.ts
│   │   ├── categoryService.ts
│   │   ├── productService.ts
│   │   ├── promotionService.ts
│   │   ├── orderService.ts
│   │   ├── warrantyService.ts
│   │   ├── inventoryService.ts
│   │   └── uploadService.ts
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── package.json
└── README.md
```

## Công nghệ sử dụng

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Ant Design** - UI component library
- **React Router** - Routing
- **Axios** - HTTP client
- **Day.js** - Date manipulation

## API Configuration

Mặc định, admin panel kết nối tới backend API tại `http://localhost:3000/api`. Bạn có thể thay đổi trong file `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

## Đăng nhập

Chỉ các tài khoản có vai trò **NhanVien** mới có thể đăng nhập vào admin panel.

## License

MIT
