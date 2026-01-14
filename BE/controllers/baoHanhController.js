const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Internal function to get detailed warranty info
const getDetailedWarrantyById = async (baoHanhID) => {
    const query = `
        SELECT 
            bh.BaoHanhID,
            bh.NgayMua,
            bh.HanBaoHanh,
            bh.TrangThai,
            bh.GhiChu,
            sp.SanPhamID,
            sp.TenSanPham,
            sp.Model,
            sp.ThuongHieu,
            sp.BaoHanhThang,
            sp.HinhAnh,
            sp.MoTa,
            sp.GiaGoc,
            nd.HoTen,
            nd.SoDienThoai,
            nd.Email,
            nd.DiaChi,
            dh.DonHangID,
            dh.NgayDat,
            ct.SoLuong,
            ct.Gia,
            CASE 
                WHEN bh.HanBaoHanh >= NOW() THEN 'ConHan'
                ELSE 'HetHan'
            END as TrangThaiHienTai,
            DATEDIFF(bh.HanBaoHanh, NOW()) as SoNgayConLai,
            DATEDIFF(NOW(), bh.NgayMua) as SoNgayDaSuDung
        FROM BaoHanh bh
        JOIN SanPham sp ON bh.SanPhamID = sp.SanPhamID
        JOIN NguoiDung nd ON bh.KhachHangID = nd.UserID
        LEFT JOIN ChiTietDonHang ct ON bh.ChiTietID = ct.ChiTietID
        LEFT JOIN DonHang dh ON ct.DonHangID = dh.DonHangID
        WHERE bh.BaoHanhID = ?
    `;
    
    const results = await db.query(query, [baoHanhID]);
    
    if (results.length === 0) {
        const error = new Error('Không tìm thấy thông tin bảo hành');
        error.statusCode = 404;
        throw error;
    }
    
    // Process image to get first image if it's an array
    const warranty = results[0];
    if (warranty.HinhAnh) {
        try {
            // If it's a JSON string array, parse and take first image
            if (typeof warranty.HinhAnh === 'string' && warranty.HinhAnh.startsWith('[') && warranty.HinhAnh.endsWith(']')) {
                const images = JSON.parse(warranty.HinhAnh);
                warranty.HinhAnh = Array.isArray(images) && images.length > 0 ? images[0] : '';
            }
            // If it's already a single string, keep it as is
        } catch (e) {
            console.error("Error parsing HinhAnh JSON in warranty:", e);
            warranty.HinhAnh = ''; // fallback to empty string on error
        }
    }
    
    return warranty;
};

exports.getAllBaoHanhs = async (req, res) => {
    try {
        const query = `
            SELECT 
                bh.BaoHanhID,
                bh.NgayMua,
                bh.HanBaoHanh,
                bh.TrangThai,
                bh.GhiChu,
                sp.SanPhamID,
                sp.TenSanPham,
                sp.Model,
                sp.ThuongHieu,
                sp.BaoHanhThang,
                sp.HinhAnh,
                nd.HoTen,
                nd.SoDienThoai,
                nd.Email,
                dh.DonHangID,
                CASE 
                    WHEN bh.HanBaoHanh >= NOW() THEN 'ConHan'
                    ELSE 'HetHan'
                END as TrangThaiHienTai,
                DATEDIFF(bh.HanBaoHanh, NOW()) as SoNgayConLai
            FROM BaoHanh bh
            LEFT JOIN SanPham sp ON bh.SanPhamID = sp.SanPhamID
            LEFT JOIN NguoiDung nd ON bh.KhachHangID = nd.UserID
            LEFT JOIN ChiTietDonHang ct ON bh.ChiTietID = ct.ChiTietID
            LEFT JOIN DonHang dh ON ct.DonHangID = dh.DonHangID
            ORDER BY bh.NgayMua DESC
        `;
        
        const results = await db.query(query);
        
        // Process images to get first image if it's an array
        const processedResults = results.map(warranty => {
            if (warranty.HinhAnh) {
                try {
                    // If it's a JSON string array, parse and take first image
                    if (typeof warranty.HinhAnh === 'string' && warranty.HinhAnh.startsWith('[') && warranty.HinhAnh.endsWith(']')) {
                        const images = JSON.parse(warranty.HinhAnh);
                        warranty.HinhAnh = Array.isArray(images) && images.length > 0 ? images[0] : '';
                    }
                } catch (e) {
                    console.error("Error parsing HinhAnh JSON in warranty list:", e);
                    warranty.HinhAnh = '';
                }
            }
            return warranty;
        });
        
        res.json(processedResults);
    } catch (error) {
        console.error('Error in getAllBaoHanhs:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getBaoHanhById = (req, res) => {
    db.query('SELECT * FROM BaoHanh WHERE BaoHanhID = ?', [req.params.id], (err, results) => {
        if (err) res.status(500).send(err);
        else if (results.length === 0) res.status(404).send('BaoHanh not found');
        else res.json(results[0]);
    });
};

exports.createBaoHanh = (req, res) => {
    const baoHanhId = uuidv4(); // Generate UUID for BaoHanhID
    const newBaoHanh = { BaoHanhID: baoHanhId, ...req.body }; // Add BaoHanhID to the body
    db.query('INSERT INTO BaoHanh SET ?', newBaoHanh, (err, results) => {
        if (err) res.status(500).send(err);
        else res.status(201).json({ BaoHanhID: baoHanhId, ...newBaoHanh }); // Return generated BaoHanhID
    });
};

exports.updateBaoHanh = async (req, res) => {
    try {
        const { TrangThai, GhiChu } = req.body;
        const { id: baoHanhID } = req.params;
        
        // Xác thực quyền sở hữu trước khi cho phép cập nhật
        const ownershipQuery = `
            SELECT bh.KhachHangID, nd.SoDienThoai, nd.Email
            FROM BaoHanh bh
            JOIN NguoiDung nd ON bh.KhachHangID = nd.UserID
            WHERE bh.BaoHanhID = ?
        `;
        
        const ownershipResult = await db.query(ownershipQuery, [baoHanhID]);
        
        if (ownershipResult.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bảo hành' });
        }
        
        // Kiểm tra xác thực quyền sở hữu
        const { soDienThoai, email } = req.query;
        const warrantyOwner = ownershipResult[0];
        
        // Chỉ cho phép cập nhật nếu thông tin khách hàng khớp
        if (soDienThoai && warrantyOwner.SoDienThoai !== soDienThoai) {
            return res.status(403).json({ 
                error: 'Bạn không có quyền cập nhật bảo hành này. Vui lòng sử dụng thông tin khách hàng chính xác.' 
            });
        }
        
        if (email && warrantyOwner.Email !== email) {
            return res.status(403).json({ 
                error: 'Bạn không có quyền cập nhật bảo hành này. Vui lòng sử dụng thông tin khách hàng chính xác.' 
            });
        }

        const updateData = { TrangThai, GhiChu };

        const results = await db.query('UPDATE BaoHanh SET ? WHERE BaoHanhID = ?', [updateData, baoHanhID]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bảo hành để cập nhật' });
        }

        // Fetch the full, updated warranty details and return them
        const updatedWarranty = await getDetailedWarrantyById(baoHanhID);
        res.json(updatedWarranty);

    } catch (err) {
        console.error('Error updating warranty:', err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Lỗi server khi cập nhật bảo hành' });
    }
};

exports.deleteBaoHanh = async (req, res) => {
    try {
        const { id } = req.params;

        // First check if the warranty exists and its current status
        const checkQuery = `
            SELECT BaoHanhID, HanBaoHanh,
                CASE
                    WHEN HanBaoHanh >= NOW() THEN 'ConHan'
                    ELSE 'HetHan'
                END as TrangThaiHienTai
            FROM BaoHanh
            WHERE BaoHanhID = ?
        `;

        const checkResults = await db.query(checkQuery, [id]);

        if (checkResults.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bảo hành' });
        }

        const warranty = checkResults[0];

        // Only allow deletion if warranty has expired
        if (warranty.TrangThaiHienTai === 'ConHan') {
            return res.status(400).json({
                error: 'Không thể xóa bảo hành còn hạn. Chỉ có thể xóa bảo hành đã hết hạn.'
            });
        }

        // Proceed with deletion
        const deleteResults = await db.query('DELETE FROM BaoHanh WHERE BaoHanhID = ?', [id]);

        if (deleteResults.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bảo hành để xóa' });
        }

        res.status(200).json({ message: 'Xóa bảo hành thành công' });

    } catch (error) {
        console.error('Error deleting warranty:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa bảo hành' });
    }
};

// Warranty lookup by customer phone number or email
exports.getBaoHanhByCustomer = async (req, res) => {
    try {
        const { soDienThoai, email } = req.query;
        
        if (!soDienThoai && !email) {
            return res.status(400).json({ error: 'Vui lòng cung cấp số điện thoại hoặc email' });
        }
        
        // Thêm validation để đảm bảo thông tin hợp lệ
        if (soDienThoai && soDienThoai.length < 10) {
            return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
        }
        
        if (email && !email.includes('@')) {
            return res.status(400).json({ error: 'Email không hợp lệ' });
        }
        
        let whereClause = '';
        let params = [];
        
        if (soDienThoai && email) {
            whereClause = 'WHERE nd.SoDienThoai = ? OR nd.Email = ?';
            params = [soDienThoai, email];
        } else if (soDienThoai) {
            whereClause = 'WHERE nd.SoDienThoai = ?';
            params = [soDienThoai];
        } else {
            whereClause = 'WHERE nd.Email = ?';
            params = [email];
        }
        
        const query = `
            SELECT 
                bh.BaoHanhID,
                bh.NgayMua,
                bh.HanBaoHanh,
                bh.TrangThai,
                sp.TenSanPham,
                sp.Model,
                sp.ThuongHieu,
                sp.BaoHanhThang,
                sp.HinhAnh,
                nd.HoTen,
                nd.SoDienThoai,
                nd.Email,
                dh.DonHangID,
                CASE 
                    WHEN bh.HanBaoHanh >= NOW() THEN 'ConHan'
                    ELSE 'HetHan'
                END as TrangThaiHienTai
            FROM BaoHanh bh
            JOIN SanPham sp ON bh.SanPhamID = sp.SanPhamID
            JOIN NguoiDung nd ON bh.KhachHangID = nd.UserID
            LEFT JOIN ChiTietDonHang ct ON bh.ChiTietID = ct.ChiTietID
            LEFT JOIN DonHang dh ON ct.DonHangID = dh.DonHangID
            ${whereClause}
            ORDER BY bh.NgayMua DESC
        `;
        
        console.log('Executing warranty query:', query);
        console.log('Query params:', params);
        
        const results = await db.query(query, params);
        console.log('Raw warranty results:', results);
        
        // Process images to get first image if it's an array
        const processedResults = results.map(warranty => {
            if (warranty.HinhAnh) {
                try {
                    // If it's a JSON string array, parse and take first image
                    if (typeof warranty.HinhAnh === 'string' && warranty.HinhAnh.startsWith('[') && warranty.HinhAnh.endsWith(']')) {
                        const images = JSON.parse(warranty.HinhAnh);
                        warranty.HinhAnh = Array.isArray(images) && images.length > 0 ? images[0] : '';
                    }
                    // If it's already a single string, keep it as is
                } catch (e) {
                    console.error("Error parsing HinhAnh JSON in warranty list:", e);
                    warranty.HinhAnh = ''; // fallback to empty string on error
                }
            }
            return warranty;
        });
        
        console.log('Processed warranty results:', processedResults);
        res.json(processedResults);
    } catch (error) {
        console.error('Error in getBaoHanhByCustomer:', error);
        res.status(500).json({ error: 'Lỗi server khi tra cứu bảo hành' });
    }
};

// Test endpoint to check warranty data
exports.testWarrantyData = async (req, res) => {
    try {
        const testQuery = `
            SELECT 
                bh.BaoHanhID,
                bh.NgayMua,
                bh.HanBaoHanh,
                bh.TrangThai,
                sp.TenSanPham,
                nd.HoTen,
                nd.SoDienThoai,
                nd.Email
            FROM BaoHanh bh
            JOIN SanPham sp ON bh.SanPhamID = sp.SanPhamID
            JOIN NguoiDung nd ON bh.KhachHangID = nd.UserID
            LIMIT 5
        `;
        
        const results = await db.query(testQuery);
        console.log('Test warranty data:', results);
        res.json({ 
            message: 'Test warranty data', 
            count: results.length, 
            data: results 
        });
    } catch (error) {
        console.error('Error in testWarrantyData:', error);
        res.status(500).json({ error: 'Lỗi server khi test dữ liệu bảo hành' });
    }
};

// Warranty lookup by product information
exports.getBaoHanhByProduct = async (req, res) => {
    try {
        const { tenSanPham, model, thuongHieu } = req.query;
        
        if (!tenSanPham && !model && !thuongHieu) {
            return res.status(400).json({ error: 'Vui lòng cung cấp thông tin sản phẩm' });
        }
        
        let whereConditions = [];
        let params = [];
        
        if (tenSanPham) {
            whereConditions.push('sp.TenSanPham LIKE ?');
            params.push(`%${tenSanPham}%`);
        }
        if (model) {
            whereConditions.push('sp.Model LIKE ?');
            params.push(`%${model}%`);
        }
        if (thuongHieu) {
            whereConditions.push('sp.ThuongHieu LIKE ?');
            params.push(`%${thuongHieu}%`);
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const query = `
            SELECT 
                bh.BaoHanhID,
                bh.NgayMua,
                bh.HanBaoHanh,
                bh.TrangThai,
                sp.TenSanPham,
                sp.Model,
                sp.ThuongHieu,
                sp.BaoHanhThang,
                sp.HinhAnh,
                nd.HoTen,
                nd.SoDienThoai,
                nd.Email,
                dh.DonHangID,
                CASE 
                    WHEN bh.HanBaoHanh >= NOW() THEN 'ConHan'
                    ELSE 'HetHan'
                END as TrangThaiHienTai,
                DATEDIFF(bh.HanBaoHanh, NOW()) as SoNgayConLai
            FROM BaoHanh bh
            JOIN SanPham sp ON bh.SanPhamID = sp.SanPhamID
            JOIN NguoiDung nd ON bh.KhachHangID = nd.UserID
            LEFT JOIN ChiTietDonHang ct ON bh.ChiTietID = ct.ChiTietID
            LEFT JOIN DonHang dh ON ct.DonHangID = dh.DonHangID
            ${whereClause}
            ORDER BY bh.NgayMua DESC
        `;
        
        const results = await db.query(query, params);
        
        // Process images to get first image if it's an array
        const processedResults = results.map(warranty => {
            if (warranty.HinhAnh) {
                try {
                    // If it's a JSON string array, parse and take first image
                    if (typeof warranty.HinhAnh === 'string' && warranty.HinhAnh.startsWith('[') && warranty.HinhAnh.endsWith(']')) {
                        const images = JSON.parse(warranty.HinhAnh);
                        warranty.HinhAnh = Array.isArray(images) && images.length > 0 ? images[0] : '';
                    }
                    // If it's already a single string, keep it as is
                } catch (e) {
                    console.error("Error parsing HinhAnh JSON in warranty product list:", e);
                    warranty.HinhAnh = ''; // fallback to empty string on error
                }
            }
            return warranty;
        });
        
        res.json(processedResults);
    } catch (error) {
        console.error('Error in getBaoHanhByProduct:', error);
        res.status(500).json({ error: 'Lỗi server khi tra cứu bảo hành theo sản phẩm' });
    }
};

// Get warranty status with comprehensive information
exports.getWarrantyStatus = async (req, res) => {
    try {
        const { baoHanhID } = req.params;
        const warrantyDetails = await getDetailedWarrantyById(baoHanhID);
        res.json(warrantyDetails);
    } catch (error) {
        console.error('Error in getWarrantyStatus:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({ error: error.message || 'Lỗi server khi lấy trạng thái bảo hành' });
    }
};

// Get warranty statistics for customer
exports.getCustomerWarrantyStats = async (req, res) => {
    try {
        const { khachHangID } = req.params;
        
        const query = `
            SELECT 
                COUNT(*) as TongSoBaoHanh,
                SUM(CASE WHEN bh.HanBaoHanh >= NOW() THEN 1 ELSE 0 END) as ConHan,
                SUM(CASE WHEN bh.HanBaoHanh < NOW() THEN 1 ELSE 0 END) as HetHan,
                SUM(CASE WHEN bh.TrangThai = 'DangSua' THEN 1 ELSE 0 END) as DangSua
            FROM BaoHanh bh
            WHERE bh.KhachHangID = ?
        `;
        
        const results = await db.query(query, [khachHangID]);
        res.json(results[0] || { TongSoBaoHanh: 0, ConHan: 0, HetHan: 0, DangSua: 0 });
    } catch (error) {
        console.error('Error in getCustomerWarrantyStats:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thống kê bảo hành' });
    }
};

// Lookup warranties by Order ID
exports.getBaoHanhByOrderId = async (req, res) => {
    try {
        const { donHangID } = req.params;
        
        const query = `
            SELECT 
                bh.BaoHanhID,
                bh.NgayMua,
                bh.HanBaoHanh,
                bh.TrangThai,
                sp.TenSanPham,
                sp.Model,
                sp.ThuongHieu,
                sp.BaoHanhThang,
                sp.HinhAnh,
                sp.GiaGoc,
                nd.HoTen,
                nd.SoDienThoai,
                nd.Email,
                dh.DonHangID,
                dh.NgayDat,
                ct.ChiTietID,
                ct.SoLuong,
                ct.Gia,
                CASE 
                    WHEN bh.HanBaoHanh >= NOW() THEN 'ConHan'
                    ELSE 'HetHan'
                END as TrangThaiHienTai,
                DATEDIFF(bh.HanBaoHanh, NOW()) as SoNgayConLai,
                DATEDIFF(NOW(), bh.NgayMua) as SoNgayDaSuDung
            FROM BaoHanh bh
            JOIN ChiTietDonHang ct ON bh.ChiTietID = ct.ChiTietID
            JOIN DonHang dh ON ct.DonHangID = dh.DonHangID
            JOIN SanPham sp ON bh.SanPhamID = sp.SanPhamID
            JOIN NguoiDung nd ON bh.KhachHangID = nd.UserID
            WHERE dh.DonHangID = ?
            ORDER BY bh.NgayMua DESC
        `;
        
        const results = await db.query(query, [donHangID]);
        
        // Process images to get first image if it's an array
        const processedResults = results.map(warranty => {
            if (warranty.HinhAnh) {
                try {
                    // If it's a JSON string array, parse and take first image
                    if (typeof warranty.HinhAnh === 'string' && warranty.HinhAnh.startsWith('[') && warranty.HinhAnh.endsWith(']')) {
                        const images = JSON.parse(warranty.HinhAnh);
                        warranty.HinhAnh = Array.isArray(images) && images.length > 0 ? images[0] : '';
                    }
                    // If it's already a single string, keep it as is
                } catch (e) {
                    console.error("Error parsing HinhAnh JSON in warranty order list:", e);
                    warranty.HinhAnh = ''; // fallback to empty string on error
                }
            }
            return warranty;
        });
        
        res.json(processedResults);
    } catch (error) {
        console.error('Error in getBaoHanhByOrderId:', error);
        res.status(500).json({ error: 'Lỗi server khi tra cứu bảo hành theo đơn hàng' });
    }
};

// Quick lookup by order ID (simplified version for mobile)
exports.quickLookupByOrder = async (req, res) => {
    try {
        const { donHangID } = req.query;
        
        if (!donHangID) {
            return res.status(400).json({ error: 'Vui lòng cung cấp mã đơn hàng' });
        }
        
        // First check if order exists and is completed
        const orderCheck = `
            SELECT DonHangID, TrangThai, NgayDat, KhachHangID 
            FROM DonHang 
            WHERE DonHangID = ?
        `;
        
        const orderResults = await db.query(orderCheck, [donHangID]);
        
        if (orderResults.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }
        
        const order = orderResults[0];
        
        if (order.TrangThai !== 'HoanThanh') {
            return res.status(400).json({ 
                error: 'Đơn hàng chưa hoàn thành nên chưa có thông tin bảo hành',
                orderStatus: order.TrangThai
            });
        }
        
        // Get warranty information
        const warrantyQuery = `
            SELECT 
                bh.BaoHanhID,
                bh.NgayMua,
                bh.HanBaoHanh,
                bh.TrangThai,
                sp.TenSanPham,
                sp.Model,
                sp.ThuongHieu,
                sp.BaoHanhThang,
                sp.HinhAnh,
                ct.SoLuong,
                ct.Gia,
                CASE 
                    WHEN bh.HanBaoHanh >= NOW() THEN 'ConHan'
                    ELSE 'HetHan'
                END as TrangThaiHienTai,
                DATEDIFF(bh.HanBaoHanh, NOW()) as SoNgayConLai
            FROM BaoHanh bh
            JOIN ChiTietDonHang ct ON bh.ChiTietID = ct.ChiTietID
            JOIN SanPham sp ON bh.SanPhamID = sp.SanPhamID
            WHERE ct.DonHangID = ?
            ORDER BY sp.TenSanPham
        `;
        
        const warranties = await db.query(warrantyQuery, [donHangID]);
        
        // Process images to get first image if it's an array
        const processedWarranties = warranties.map(warranty => {
            if (warranty.HinhAnh) {
                try {
                    // If it's a JSON string array, parse and take first image
                    if (typeof warranty.HinhAnh === 'string' && warranty.HinhAnh.startsWith('[') && warranty.HinhAnh.endsWith(']')) {
                        const images = JSON.parse(warranty.HinhAnh);
                        warranty.HinhAnh = Array.isArray(images) && images.length > 0 ? images[0] : '';
                    }
                    // If it's already a single string, keep it as is
                } catch (e) {
                    console.error("Error parsing HinhAnh JSON in quick lookup:", e);
                    warranty.HinhAnh = ''; // fallback to empty string on error
                }
            }
            return warranty;
        });
        
        res.json({
            donHangID: donHangID,
            ngayDat: order.NgayDat,
            trangThaiDonHang: order.TrangThai,
            soLuongBaoHanh: processedWarranties.length,
            danhSachBaoHanh: processedWarranties
        });
        
    } catch (error) {
        console.error('Error in quickLookupByOrder:', error);
        res.status(500).json({ error: 'Lỗi server khi tra cứu nhanh theo đơn hàng' });
    }
};

// Create warranty manually for completed order items
exports.createWarrantyForOrderItem = async (req, res) => {
    try {
        const { chiTietID } = req.body;
        
        if (!chiTietID) {
            return res.status(400).json({ error: 'Vui lòng cung cấp ChiTietID' });
        }
        
        // Get order item details
        const itemQuery = `
            SELECT 
                ct.ChiTietID,
                ct.SanPhamID,
                dh.KhachHangID,
                dh.NgayDat,
                dh.TrangThai,
                sp.BaoHanhThang
            FROM ChiTietDonHang ct
            JOIN DonHang dh ON ct.DonHangID = dh.DonHangID
            JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
            WHERE ct.ChiTietID = ?
        `;
        
        const itemResults = await db.query(itemQuery, [chiTietID]);
        
        if (itemResults.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy chi tiết đơn hàng' });
        }
        
        const item = itemResults[0];
        
        if (item.TrangThai !== 'HoanThanh') {
            return res.status(400).json({ error: 'Đơn hàng chưa hoàn thành' });
        }
        
        if (!item.BaoHanhThang || item.BaoHanhThang <= 0) {
            return res.status(400).json({ error: 'Sản phẩm này không có bảo hành' });
        }
        
        // Check if warranty already exists
        const existingWarranty = await db.query(
            'SELECT BaoHanhID FROM BaoHanh WHERE ChiTietID = ?', 
            [chiTietID]
        );
        
        if (existingWarranty.length > 0) {
            return res.status(400).json({ error: 'Bảo hành cho sản phẩm này đã tồn tại' });
        }
        
        // Create warranty
        const warrantyID = uuidv4();
        const purchaseDate = new Date(item.NgayDat);
        const warrantyEndDate = new Date(purchaseDate);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + item.BaoHanhThang);
        
        const warrantyData = {
            BaoHanhID: warrantyID,
            ChiTietID: item.ChiTietID,
            SanPhamID: item.SanPhamID,
            KhachHangID: item.KhachHangID,
            NgayMua: purchaseDate,
            HanBaoHanh: warrantyEndDate,
            TrangThai: 'ConHan'
        };
        
        await db.query('INSERT INTO BaoHanh SET ?', warrantyData);
        
        res.status(201).json({
            BaoHanhID: warrantyID,
            message: 'Tạo bảo hành thành công',
            ...warrantyData
        });
        
    } catch (error) {
        console.error('Error in createWarrantyForOrderItem:', error);
        res.status(500).json({ error: 'Lỗi server khi tạo bảo hành' });
    }
};