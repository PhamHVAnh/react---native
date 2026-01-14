const db = require('../db');

// Thống kê tổng quan
exports.getDashboardStats = async (req, res) => {
    try {
        // Thống kê tổng quan
        const totalStatsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM NguoiDung WHERE VaiTro = 'KhachHang') as totalUsers,
                (SELECT COUNT(*) FROM SanPham) as totalProducts,
                (SELECT COUNT(*) FROM DonHang) as totalOrders,
                (SELECT COUNT(*) FROM BaoHanh) as totalWarranties,
                (SELECT COUNT(*) FROM KhuyenMai WHERE NgayBatDau <= NOW() AND NgayKetThuc >= NOW()) as activePromotions
        `;
        
        const totalStats = await db.query(totalStatsQuery);
        
        // Thống kê doanh thu
        const revenueQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN TrangThai = 'HoanThanh' THEN ThanhTien ELSE 0 END), 0) as completedRevenue,
                COALESCE(SUM(CASE WHEN TrangThai = 'DangGiao' THEN ThanhTien ELSE 0 END), 0) as pendingRevenue,
                COALESCE(SUM(ThanhTien), 0) as totalRevenue,
                COALESCE(SUM(CASE WHEN TrangThai = 'HoanThanh' THEN 1 ELSE 0 END), 0) as completedOrders,
                COALESCE(SUM(CASE WHEN TrangThai = 'ChuaXuLy' THEN 1 ELSE 0 END), 0) as pendingOrders,
                COALESCE(SUM(CASE WHEN TrangThai = 'Huy' THEN 1 ELSE 0 END), 0) as cancelledOrders
            FROM DonHang
        `;
        
        const revenueStats = await db.query(revenueQuery);
        
        // Thống kê đơn hàng theo tháng (6 tháng gần nhất)
        const monthlyOrdersQuery = `
            SELECT 
                DATE_FORMAT(NgayDat, '%Y-%m') as month,
                COUNT(*) as orderCount,
                SUM(CASE WHEN TrangThai = 'HoanThanh' THEN ThanhTien ELSE 0 END) as revenue
            FROM DonHang 
            WHERE NgayDat >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(NgayDat, '%Y-%m')
            ORDER BY month ASC
        `;
        
        const monthlyStats = await db.query(monthlyOrdersQuery);
        
        // Top 5 sản phẩm bán chạy nhất
        const topProductsQuery = `
            SELECT 
                sp.SanPhamID,
                sp.TenSanPham,
                sp.ThuongHieu,
                sp.GiaGoc,
                sp.HinhAnh,
                SUM(ct.SoLuong) as totalSold,
                SUM(ct.SoLuong * ct.Gia) as totalRevenue
            FROM ChiTietDonHang ct
            JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
            JOIN DonHang dh ON ct.DonHangID = dh.DonHangID
            WHERE dh.TrangThai = 'HoanThanh'
            GROUP BY sp.SanPhamID, sp.TenSanPham, sp.ThuongHieu, sp.GiaGoc, sp.HinhAnh
            ORDER BY totalSold DESC
            LIMIT 5
        `;
        
        const topProducts = await db.query(topProductsQuery);
        
        // Thống kê đơn hàng theo trạng thái
        const orderStatusQuery = `
            SELECT 
                TrangThai,
                COUNT(*) as count,
                SUM(ThanhTien) as totalAmount
            FROM DonHang
            GROUP BY TrangThai
        `;
        
        const orderStatusStats = await db.query(orderStatusQuery);
        
        // Thống kê khách hàng mới (30 ngày gần nhất)
        const newCustomersQuery = `
            SELECT COUNT(*) as newCustomers
            FROM NguoiDung 
            WHERE NgayTao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND VaiTro = 'KhachHang'
        `;
        
        const newCustomers = await db.query(newCustomersQuery);
        
        res.json({
            totalStats: totalStats[0],
            revenueStats: revenueStats[0],
            monthlyStats,
            topProducts,
            orderStatusStats,
            newCustomers: newCustomers[0].newCustomers
        });
        
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thống kê dashboard' });
    }
};

// Thống kê chi tiết doanh thu theo khoảng thời gian
exports.getRevenueStats = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day', comparePrevious = false } = req.query;
        
        let dateFormat, interval;
        switch (groupBy) {
            case 'hour':
                dateFormat = '%Y-%m-%d %H:00:00';
                interval = 'HOUR';
                break;
            case 'week':
                dateFormat = '%Y-%u';
                interval = 'WEEK';
                break;
            case 'month':
                dateFormat = '%Y-%m';
                interval = 'MONTH';
                break;
            case 'year':
                dateFormat = '%Y';
                interval = 'YEAR';
                break;
            default:
                dateFormat = '%Y-%m-%d';
                interval = 'DAY';
        }
        
        let whereClause = '';
        let params = [];
        
        if (startDate && endDate) {
            whereClause = 'WHERE NgayDat BETWEEN ? AND ?';
            params = [startDate, endDate];
        }
        
        const query = `
            SELECT 
                DATE_FORMAT(NgayDat, '${dateFormat}') as period,
                COUNT(*) as orderCount,
                SUM(CASE WHEN TrangThai = 'HoanThanh' THEN ThanhTien ELSE 0 END) as completedRevenue,
                SUM(CASE WHEN TrangThai = 'DangGiao' THEN ThanhTien ELSE 0 END) as pendingRevenue,
                SUM(ThanhTien) as totalRevenue,
                AVG(ThanhTien) as avgOrderValue
            FROM DonHang 
            ${whereClause}
            GROUP BY DATE_FORMAT(NgayDat, '${dateFormat}')
            ORDER BY period ASC
        `;
        
        const results = await db.query(query, params);
        
        // If comparePrevious is requested, get previous period data
        if (comparePrevious === 'true' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const duration = end.getTime() - start.getTime();
            
            // Calculate previous period dates
            const prevEnd = new Date(start.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - duration);
            
            const prevQuery = `
                SELECT 
                    DATE_FORMAT(NgayDat, '${dateFormat}') as period,
                    COUNT(*) as orderCount,
                    SUM(CASE WHEN TrangThai = 'HoanThanh' THEN ThanhTien ELSE 0 END) as completedRevenue,
                    SUM(CASE WHEN TrangThai = 'DangGiao' THEN ThanhTien ELSE 0 END) as pendingRevenue,
                    SUM(ThanhTien) as totalRevenue,
                    AVG(ThanhTien) as avgOrderValue
                FROM DonHang 
                WHERE NgayDat BETWEEN ? AND ?
                GROUP BY DATE_FORMAT(NgayDat, '${dateFormat}')
                ORDER BY period ASC
            `;
            
            const prevResults = await db.query(prevQuery, [
                prevStart.toISOString().slice(0, 10),
                prevEnd.toISOString().slice(0, 10)
            ]);
            
            res.json({
                current: results,
                previous: prevResults,
                comparison: {
                    currentTotalRevenue: results.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
                    previousTotalRevenue: prevResults.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
                    currentTotalOrders: results.reduce((sum, r) => sum + (r.orderCount || 0), 0),
                    previousTotalOrders: prevResults.reduce((sum, r) => sum + (r.orderCount || 0), 0)
                }
            });
        } else {
            res.json(results);
        }
        
    } catch (error) {
        console.error('Error in getRevenueStats:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thống kê doanh thu' });
    }
};

// Thống kê sản phẩm
exports.getProductStats = async (req, res) => {
    try {
        // Top sản phẩm bán chạy
        const topSellingQuery = `
            SELECT 
                sp.SanPhamID,
                sp.TenSanPham,
                sp.ThuongHieu,
                sp.GiaGoc,
                sp.HinhAnh,
                SUM(ct.SoLuong) as totalSold,
                SUM(ct.SoLuong * ct.Gia) as totalRevenue,
                COUNT(DISTINCT ct.DonHangID) as orderCount
            FROM ChiTietDonHang ct
            JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
            JOIN DonHang dh ON ct.DonHangID = dh.DonHangID
            WHERE dh.TrangThai = 'HoanThanh'
            GROUP BY sp.SanPhamID, sp.TenSanPham, sp.ThuongHieu, sp.GiaGoc, sp.HinhAnh
            ORDER BY totalSold DESC
            LIMIT 10
        `;
        
        // Thống kê theo danh mục
        const categoryStatsQuery = `
            SELECT 
                dm.TenDanhMuc,
                COUNT(DISTINCT sp.SanPhamID) as productCount,
                SUM(ct.SoLuong) as totalSold,
                SUM(ct.SoLuong * ct.Gia) as totalRevenue
            FROM ChiTietDonHang ct
            JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
            JOIN DonHang dh ON ct.DonHangID = dh.DonHangID
            LEFT JOIN DanhMuc dm ON sp.DanhMucID = dm.DanhMucID
            WHERE dh.TrangThai = 'HoanThanh'
            GROUP BY dm.DanhMucID, dm.TenDanhMuc
            ORDER BY totalRevenue DESC
        `;
        
        // Thống kê tồn kho
        const inventoryStatsQuery = `
            SELECT 
                sp.SanPhamID,
                sp.TenSanPham,
                tk.SoLuongTon,
                sp.GiaGoc,
                (tk.SoLuongTon * sp.GiaGoc) as inventoryValue
            FROM SanPham sp
            LEFT JOIN TonKho tk ON sp.SanPhamID = tk.SanPhamID
            ORDER BY inventoryValue DESC
            LIMIT 10
        `;
        
        const [topSelling, categoryStats, inventoryStats] = await Promise.all([
            db.query(topSellingQuery),
            db.query(categoryStatsQuery),
            db.query(inventoryStatsQuery)
        ]);
        
        res.json({
            topSelling,
            categoryStats,
            inventoryStats
        });
        
    } catch (error) {
        console.error('Error in getProductStats:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thống kê sản phẩm' });
    }
};

// Thống kê khách hàng
exports.getCustomerStats = async (req, res) => {
    try {
        // Top khách hàng mua nhiều nhất
        const topCustomersQuery = `
            SELECT 
                nd.UserID,
                nd.HoTen,
                nd.Email,
                nd.SoDienThoai,
                COUNT(dh.DonHangID) as totalOrders,
                SUM(dh.ThanhTien) as totalSpent,
                MAX(dh.NgayDat) as lastOrderDate
            FROM NguoiDung nd
            JOIN DonHang dh ON nd.UserID = dh.KhachHangID
            WHERE nd.VaiTro = 'KhachHang'
            GROUP BY nd.UserID, nd.HoTen, nd.Email, nd.SoDienThoai
            ORDER BY totalSpent DESC
            LIMIT 10
        `;
        
        // Thống kê khách hàng theo tháng (6 tháng gần nhất)
        const monthlyCustomersQuery = `
            SELECT 
                DATE_FORMAT(NgayTao, '%Y-%m') as month,
                COUNT(*) as newCustomers
            FROM NguoiDung 
            WHERE NgayTao >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            AND VaiTro = 'KhachHang'
            GROUP BY DATE_FORMAT(NgayTao, '%Y-%m')
            ORDER BY month ASC
        `;
        
        // Thống kê khách hàng theo loại
        const customerTypeQuery = `
            SELECT 
                CASE 
                    WHEN totalSpent >= 10000000 THEN 'VIP'
                    WHEN totalSpent >= 5000000 THEN 'Gold'
                    WHEN totalSpent >= 1000000 THEN 'Silver'
                    ELSE 'Bronze'
                END as customerType,
                COUNT(*) as count,
                AVG(totalSpent) as avgSpent
            FROM (
                SELECT 
                    nd.UserID,
                    COALESCE(SUM(dh.ThanhTien), 0) as totalSpent
                FROM NguoiDung nd
                LEFT JOIN DonHang dh ON nd.UserID = dh.KhachHangID
                WHERE nd.VaiTro = 'KhachHang'
                GROUP BY nd.UserID
            ) customerStats
            GROUP BY customerType
            ORDER BY avgSpent DESC
        `;
        
        const [topCustomers, monthlyCustomers, customerTypes] = await Promise.all([
            db.query(topCustomersQuery),
            db.query(monthlyCustomersQuery),
            db.query(customerTypeQuery)
        ]);
        
        res.json({
            topCustomers,
            monthlyCustomers,
            customerTypes
        });
        
    } catch (error) {
        console.error('Error in getCustomerStats:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thống kê khách hàng' });
    }
};

// Thống kê bảo hành
exports.getWarrantyStats = async (req, res) => {
    try {
        // Thống kê bảo hành theo trạng thái
        const warrantyStatusQuery = `
            SELECT 
                TrangThai,
                COUNT(*) as count
            FROM BaoHanh
            GROUP BY TrangThai
        `;
        
        // Thống kê bảo hành sắp hết hạn (30 ngày tới)
        const expiringWarrantiesQuery = `
            SELECT 
                bh.BaoHanhID,
                bh.NgayMua,
                bh.HanBaoHanh,
                sp.TenSanPham,
                nd.HoTen,
                nd.SoDienThoai,
                DATEDIFF(bh.HanBaoHanh, NOW()) as daysRemaining
            FROM BaoHanh bh
            JOIN SanPham sp ON bh.SanPhamID = sp.SanPhamID
            JOIN NguoiDung nd ON bh.KhachHangID = nd.UserID
            WHERE bh.HanBaoHanh BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
            AND bh.TrangThai = 'ConHan'
            ORDER BY daysRemaining ASC
            LIMIT 20
        `;
        
        // Thống kê bảo hành theo tháng
        const monthlyWarrantiesQuery = `
            SELECT 
                DATE_FORMAT(NgayMua, '%Y-%m') as month,
                COUNT(*) as warrantyCount
            FROM BaoHanh
            WHERE NgayMua >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(NgayMua, '%Y-%m')
            ORDER BY month ASC
        `;
        
        const [warrantyStatus, expiringWarranties, monthlyWarranties] = await Promise.all([
            db.query(warrantyStatusQuery),
            db.query(expiringWarrantiesQuery),
            db.query(monthlyWarrantiesQuery)
        ]);
        
        res.json({
            warrantyStatus,
            expiringWarranties,
            monthlyWarranties
        });
        
    } catch (error) {
        console.error('Error in getWarrantyStats:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thống kê bảo hành' });
    }
};
