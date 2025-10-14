const db = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.getAllDonHangs = async (req, res) => {
    try {
        const query = `
            SELECT 
                dh.*,
                nd.HoTen,
                nd.SoDienThoai,
                nd.DiaChi,
                nd.Email,
                km.MaKhuyenMai,
                km.MoTa as KhuyenMaiMoTa,
                km.PhanTramGiam
            FROM DonHang dh 
            LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID 
            LEFT JOIN KhuyenMai km ON dh.KhuyenMaiID = km.KhuyenMaiID
            ORDER BY dh.NgayDat DESC
        `;
        
        const results = await db.query(query);
        res.json(results);
    } catch (error) {
        console.error('Database error in getAllDonHangs:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách đơn hàng' });
    }
};

exports.getDonHangById = async (req, res) => {
    try {
        const query = `
            SELECT 
                dh.*,
                nd.HoTen,
                nd.SoDienThoai,
                nd.DiaChi,
                nd.Email,
                km.MaKhuyenMai,
                km.MoTa as KhuyenMaiMoTa,
                km.PhanTramGiam
            FROM DonHang dh 
            LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID 
            LEFT JOIN KhuyenMai km ON dh.KhuyenMaiID = km.KhuyenMaiID
            WHERE dh.DonHangID = ?
        `;
        
        const results = await db.query(query, [req.params.id]);
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }
        
        const donHang = results[0];
        
        // Get order details from ChiTietDonHang with full product info
        const detailQuery = `
            SELECT 
                ct.*,
                sp.TenSanPham,
                sp.HinhAnh,
                sp.GiaGoc,
                sp.GiamGia as ProductGiamGia,
                sp.MoTa
            FROM ChiTietDonHang ct 
            LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID 
            WHERE ct.DonHangID = ?
        `;
        
        try {
            const detailResults = await db.query(detailQuery, [req.params.id]);
            donHang.chiTiet = detailResults;
        } catch (detailError) {
            console.error('Error getting order details:', detailError);
            donHang.chiTiet = [];
        }
        
        res.json(donHang);
    } catch (error) {
        console.error('Database error in getDonHangById:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy thông tin đơn hàng' });
    }
};

exports.getDonHangsByCustomerId = async (req, res) => {
    const customerId = req.params.customerId;
    
    try {
        const query = `
            SELECT 
                dh.*,
                nd.HoTen,
                nd.SoDienThoai,
                nd.DiaChi,
                nd.Email,
                km.MaKhuyenMai,
                km.MoTa as KhuyenMaiMoTa,
                km.PhanTramGiam
            FROM DonHang dh 
            LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID 
            LEFT JOIN KhuyenMai km ON dh.KhuyenMaiID = km.KhuyenMaiID
            WHERE dh.KhachHangID = ? 
            ORDER BY dh.NgayDat DESC
        `;
        
        const results = await db.query(query, [customerId]);
        res.json(results);
    } catch (error) {
        console.error('Database error in getDonHangsByCustomerId:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu đơn hàng' });
    }
};

exports.createDonHang = async (req, res) => {
    const donHangId = uuidv4(); // Generate UUID for DonHangID
    let connection = null;

    try {
        // Get connection from pool
        connection = await new Promise((resolve, reject) => {
            db.pool.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });

        // Start transaction
        await new Promise((resolve, reject) => {
            connection.beginTransaction((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // First, check inventory availability for all items
        if (req.body.chiTiet && Array.isArray(req.body.chiTiet)) {
            for (const item of req.body.chiTiet) {
                const inventoryResults = await new Promise((resolve, reject) => {
                    connection.query('SELECT SoLuongTon FROM TonKho WHERE SanPhamID = ?', [item.sanPhamId], (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    });
                });

                if (inventoryResults.length === 0) {
                    await new Promise((resolve, reject) => {
                        connection.rollback(() => resolve());
                    });
                    connection.release();
                    return res.status(400).json({
                        error: `Sản phẩm ${item.sanPhamId} không có trong kho`
                    });
                }

                const currentStock = inventoryResults[0].SoLuongTon;
                if (currentStock < item.soLuong) {
                    await new Promise((resolve, reject) => {
                        connection.rollback(() => resolve());
                    });
                    connection.release();
                    return res.status(400).json({
                        error: `Sản phẩm ${item.sanPhamId} chỉ còn ${currentStock} sản phẩm trong kho`
                    });
                }
            }
        }

        // Only save fields that exist in DonHang table
        const donHangData = {
            DonHangID: donHangId,
            KhachHangID: req.body.khachHangId,
            TongTien: req.body.tongTien,
            TrangThai: 'ChuaXuLy', // Default status
            PhuongThucThanhToan: req.body.phuongThucThanhToan || 'COD', // Default to COD
            GiamGia: req.body.giaTriKhuyenMai || 0
        };

        // Calculate ThanhTien (final amount after discount)
        donHangData.ThanhTien = donHangData.TongTien - (donHangData.GiamGia || 0);

        // Insert order
        await new Promise((resolve, reject) => {
            connection.query('INSERT INTO DonHang SET ?', donHangData, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // Create ChiTietDonHang records
        if (req.body.chiTiet && Array.isArray(req.body.chiTiet)) {
            for (const item of req.body.chiTiet) {
                const chiTietId = uuidv4();
                const chiTietData = {
                    ChiTietID: chiTietId,
                    DonHangID: donHangId,
                    SanPhamID: item.sanPhamId,
                    SoLuong: item.soLuong,
                    Gia: item.donGia
                };

                await new Promise((resolve, reject) => {
                    connection.query('INSERT INTO ChiTietDonHang SET ?', chiTietData, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            }

            // Update inventory quantities
            for (const item of req.body.chiTiet) {
                await new Promise((resolve, reject) => {
                    const updateQuery = 'UPDATE TonKho SET SoLuongTon = SoLuongTon - ? WHERE SanPhamID = ?';
                    connection.query(updateQuery, [item.soLuong, item.sanPhamId], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            }
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
            connection.commit((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Release connection
        connection.release();

        res.status(201).json({
            DonHangID: donHangId,
            message: 'Đơn hàng đã được tạo thành công'
        });

    } catch (error) {
        console.error('Error creating order:', error);

        // Rollback transaction and release connection
        if (connection) {
            await new Promise((resolve, reject) => {
                connection.rollback(() => resolve());
            });
            connection.release();
        }

        res.status(500).json({ error: 'Lỗi server khi tạo đơn hàng' });
    }
};

exports.updateDonHang = async (req, res) => {
    try {
        // Check if status is being changed to 'HoanThanh'
        const isCompletingOrder = req.body.TrangThai === 'HoanThanh';
        
        const results = await db.query('UPDATE DonHang SET ? WHERE DonHangID = ?', [req.body, req.params.id]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }
        
        // If order is being completed, auto-create warranties
        if (isCompletingOrder) {
            createWarrantiesForOrder(req.params.id);
        }
        
        res.json({ DonHangID: req.params.id, ...req.body });
    } catch (error) {
        console.error('Database error in updateDonHang:', error);
        res.status(500).json({ error: 'Lỗi server khi cập nhật đơn hàng' });
    }
};

// Function to auto-create warranties when order is completed
const createWarrantiesForOrder = async (donHangID) => {
    try {
        // Get order details, including quantity (SoLuong)
        const orderQuery = `
            SELECT 
                dh.KhachHangID, 
                dh.NgayDat,
                ct.ChiTietID,
                ct.SanPhamID,
                ct.SoLuong,
                sp.BaoHanhThang
            FROM DonHang dh
            JOIN ChiTietDonHang ct ON dh.DonHangID = ct.DonHangID
            JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
            WHERE dh.DonHangID = ? AND sp.BaoHanhThang > 0
        `;
        
        const orderItems = await db.query(orderQuery, [donHangID]);
        
        // Create warranty for each individual item
        for (const item of orderItems) {
            try {
                // Check if warranties already exist for this ChiTietID to prevent duplicates
                const existing = await db.query(
                    'SELECT BaoHanhID FROM BaoHanh WHERE ChiTietID = ?', 
                    [item.ChiTietID]
                );
                
                // Only create if no warranties exist for this line item yet
                if (existing.length === 0) {
                    // Loop for the quantity of each item to create individual warranties
                    for (let i = 0; i < item.SoLuong; i++) {
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
                        console.log(`Warranty ${i + 1}/${item.SoLuong} created for ChiTietID: ${item.ChiTietID}`);
                    }
                }
            } catch (itemError) {
                console.error('Error processing warranty for item:', itemError);
            }
        }
    } catch (error) {
        console.error('Error in createWarrantiesForOrder:', error);
    }
};

exports.deleteDonHang = async (req, res) => {
    try {
        const results = await db.query('DELETE FROM DonHang WHERE DonHangID = ?', [req.params.id]);
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Database error in deleteDonHang:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa đơn hàng' });
    }
};

exports.cancelDonHang = async (req, res) => {
    let connection = null;

    try {
        // Get connection from pool
        connection = await new Promise((resolve, reject) => {
            db.pool.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });

        // Start transaction
        await new Promise((resolve, reject) => {
            connection.beginTransaction((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // First check if the order exists and can be cancelled
        const orderResults = await new Promise((resolve, reject) => {
            connection.query('SELECT TrangThai FROM DonHang WHERE DonHangID = ?', [req.params.id], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (orderResults.length === 0) {
            await new Promise((resolve, reject) => {
                connection.rollback(() => resolve());
            });
            connection.release();
            return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
        }

        const currentStatus = orderResults[0].TrangThai;

        // Check if order can be cancelled (only ChuaXuLy orders)
        if (currentStatus !== 'ChuaXuLy') {
            await new Promise((resolve, reject) => {
                connection.rollback(() => resolve());
            });
            connection.release();
            return res.status(400).json({
                error: 'Không thể hủy đơn hàng ở trạng thái này',
                currentStatus: currentStatus
            });
        }

        // Get order details before cancelling to restore inventory
        const orderDetailsQuery = `
            SELECT SanPhamID, SoLuong
            FROM ChiTietDonHang
            WHERE DonHangID = ?
        `;

        const orderDetails = await new Promise((resolve, reject) => {
            connection.query(orderDetailsQuery, [req.params.id], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // Update order status to Huy
        await new Promise((resolve, reject) => {
            connection.query('UPDATE DonHang SET TrangThai = "Huy" WHERE DonHangID = ?', [req.params.id], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // Restore inventory quantities
        for (const item of orderDetails) {
            await new Promise((resolve, reject) => {
                const restoreQuery = 'UPDATE TonKho SET SoLuongTon = SoLuongTon + ? WHERE SanPhamID = ?';
                connection.query(restoreQuery, [item.SoLuong, item.SanPhamID], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
            connection.commit((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Release connection
        connection.release();

        res.json({
            message: 'Đơn hàng đã được hủy thành công',
            orderId: req.params.id
        });

    } catch (error) {
        console.error('Error cancelling order:', error);

        // Rollback transaction and release connection
        if (connection) {
            await new Promise((resolve, reject) => {
                connection.rollback(() => resolve());
            });
            connection.release();
        }

        res.status(500).json({ error: 'Lỗi khi hủy đơn hàng' });
    }
};