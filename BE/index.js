const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');

// Routers
const nguoiDungRouter = require('./routes/users');
const danhMucRouter = require('./routes/danhMuc');
const sanPhamRouter = require('./routes/sanPham');
const khuyenMaiRouter = require('./routes/khuyenMai');
const donHangRouter = require('./routes/donHang');
const baoHanhRouter = require('./routes/baoHanh');
const tonKhoRouter = require('./routes/tonKho');
const uploadRouter = require('./routes/upload');
const gioHangRouter = require('./routes/gioHang'); // Added

const app = express();

// Enable CORS for all origins
app.use(cors());

// Body parser
app.use(bodyParser.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Swagger setup
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Quan Ly Dien May API',
            version: '1.0.0',
        },
        components: {
            schemas: {
                NguoiDung: {
                    type: 'object',
                    properties: {
                        UserID: { type: 'string', format: 'uuid' },
                        HoTen: { type: 'string' },
                        TenDangNhap: { type: 'string' },
                        MatKhau: { type: 'string' },
                        Email: { type: 'string' },
                        SoDienThoai: { type: 'string' },
                        DiaChi: { type: 'string' },
                        VaiTro: { type: 'string', enum: ['KhachHang', 'NhanVien'] },
                        NgayTao: { type: 'string', format: 'date' },
                        HinhAnh: { type: 'string', description: 'URL or path to the image' },
                    }
                },
                DanhMuc: {
                    type: 'object',
                    properties: {
                        DanhMucID: { type: 'integer' },
                        TenDanhMuc: { type: 'string', example: 'Tivi' },
                        MoTa: { type: 'string', nullable: true },
                        ParentID: { type: 'integer', nullable: true }, 
                    },
                    required: ['TenDanhMuc']
                },
                SanPham: {
                    type: 'object',
                    properties: {
                        SanPhamID: { type: 'string', format: 'uuid' },
                        TenSanPham: { type: 'string' },
                        DanhMucID: { type: 'string', format: 'uuid' },
                        Model: { type: 'string' },
                        ThuongHieu: { type: 'string' },
                        MoTa: { type: 'string' },
                        GiaGoc: { type: 'number', format: 'decimal' },
                        GiamGia: { type: 'number', format: 'decimal' },
                        BaoHanhThang: { type: 'integer' },
                        HinhAnh: { type: 'string', description: 'URL or path to the image' },
                        ThuocTinh: { type: 'object' }
                    }
                },
                KhuyenMai: {
                    type: 'object',
                    properties: {
                        KhuyenMaiID: { type: 'string', format: 'uuid' },
                        MaKhuyenMai: { type: 'string' },
                        MoTa: { type: 'string' },
                        PhanTramGiam: { type: 'number', format: 'decimal' },
                        GiamToiDa: { type: 'number', format: 'decimal' },
                        NgayBatDau: { type: 'string', format: 'date' },
                        NgayKetThuc: { type: 'string', format: 'date' },
                        GioiHanSuDung: { type: 'integer' },
                    }
                },
                DonHang: {
                    type: 'object',
                    properties: {
                        DonHangID: { type: 'string', format: 'uuid' },
                        KhachHangID: { type: 'string', format: 'uuid' },
                        NhanVienID: { type: 'string', format: 'uuid' },
                        NgayDat: { type: 'string', format: 'date-time' },
                        TrangThai: { type: 'string', enum: ['ChuaXuLy', 'DangGiao', 'HoanThanh', 'Huy'] },
                        TongTien: { type: 'number', format: 'decimal' },
                        KhuyenMaiID: { type: 'string', format: 'uuid' },
                        GiamGia: { type: 'number', format: 'decimal' },
                        ThanhTien: { type: 'number', format: 'decimal' },
                    }
                },
                ChiTietDonHang: {
                    type: 'object',
                    properties: {
                        ChiTietID: { type: 'string', format: 'uuid' },
                        DonHangID: { type: 'string', format: 'uuid' },
                        SanPhamID: { type: 'string', format: 'uuid' },
                        SoLuong: { type: 'integer' },
                        Gia: { type: 'number', format: 'decimal' },
                    }
                },
                BaoHanh: {
                    type: 'object',
                    properties: {
                        BaoHanhID: { type: 'string', format: 'uuid' },
                        DonHangID: { type: 'string', format: 'uuid' },
                        SanPhamID: { type: 'string', format: 'uuid' },
                        KhachHangID: { type: 'string', format: 'uuid' },
                        NgayMua: { type: 'string', format: 'date-time' },
                        HanBaoHanh: { type: 'string', format: 'date-time' },
                        TrangThai: { type: 'string', enum: ['ConHan', 'HetHan', 'DangSua'] },
                    }
                },
                GiaoDichKho: {
                    type: 'object',
                    properties: {
                        GiaoDichID: { type: 'string', format: 'uuid' },
                        SanPhamID: { type: 'string', format: 'uuid' },
                        LoaiGiaoDich: { type: 'string', enum: ['Nhap', 'Xuat'] },
                        SoLuong: { type: 'integer' },
                        NgayGiaoDich: { type: 'string', format: 'date-time' },
                        NguoiThucHien: { type: 'string', format: 'uuid' },
                        SoThamChieu: { type: 'string' },
                        GhiChu: { type: 'string' },
                    }
                },
                TonKho: {
                    type: 'object',
                    properties: {
                        SanPhamID: { type: 'string', format: 'uuid' },
                        SoLuongTon: { type: 'integer' },
                    }
                },
                GioHang: {
                    type: 'object',
                    properties: {
                        GioHangID: { type: 'string', format: 'uuid' },
                        KhachHangID: { type: 'string', format: 'uuid' },
                        SanPhamID: { type: 'string', format: 'uuid' },
                        SoLuong: { type: 'integer' },
                        NgayTao: { type: 'string', format: 'date-time' },
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js'],
};
const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/users', nguoiDungRouter);
app.use('/api/danhmuc', danhMucRouter);
app.use('/api/sanpham', sanPhamRouter);
app.use('/api/khuyenmai', khuyenMaiRouter);
app.use('/api/donhang', donHangRouter);
app.use('/api/baohanh', baoHanhRouter);
app.use('/api/tonkho', tonKhoRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/giohang', gioHangRouter); // Added


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});
