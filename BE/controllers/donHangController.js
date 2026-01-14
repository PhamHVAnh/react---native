const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

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
        console.log('Creating order with data:', JSON.stringify(req.body, null, 2));
        console.log('Payment method:', req.body.phuongThucThanhToan);
        
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
            TrangThai: req.body.trangThai || 'ChuaXuLy', // Use provided status or default
            PhuongThucThanhToan: req.body.phuongThucThanhToan || 'COD', // Hỗ trợ: COD, CARD, QR
            GiamGia: req.body.giaTriKhuyenMai || 0
        };

        // Calculate ThanhTien (final amount after discount)
        donHangData.ThanhTien = donHangData.TongTien - (donHangData.GiamGia || 0);
        
        console.log('Creating order with payment method:', donHangData.PhuongThucThanhToan);

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

        // Gửi email hóa đơn bất đồng bộ để không block response
        const customerEmail = req.body.email || req.body.userEmail;
        console.log('=== COD EMAIL DEBUG ===');
        console.log('Customer email:', customerEmail);
        console.log('Order ID:', donHangId);
        console.log('Customer ID:', req.body.khachHangId);
        console.log('========================');
        
        if (customerEmail) {
            // Gửi email bất đồng bộ để không block response
            setImmediate(async () => {
                try {
                    // Lấy thông tin chi tiết đơn hàng để gửi email
                    const orderRowsResult = await db.query(
                        `SELECT dh.*, nd.HoTen, nd.SoDienThoai, nd.DiaChi, nd.Email as UserEmail,
                                ct.*, sp.TenSanPham, sp.HinhAnh 
                         FROM DonHang dh
                         LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID
                         LEFT JOIN ChiTietDonHang ct ON dh.DonHangID = ct.DonHangID
                         LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
                         WHERE dh.DonHangID = ?
                         ORDER BY ct.ChiTietID`,
                        [donHangId]
                    );

                    // Xử lý kết quả query đúng cách - orderRowsResult là array của rows
                    const orderRows = orderRowsResult;
                    console.log('Order rows found:', orderRows.length);
                    
                    // Nếu không tìm thấy đơn hàng, thử lấy thông tin từ request
                    if (orderRows.length === 0) {
                        console.log('No order found in database, using request data');
                        
                        const orderData = {
                            DonHangID: donHangId,
                            maDonHang: `DH${donHangId}`,
                            hoTen: req.body.hoTen || 'Khách hàng',
                            soDienThoai: req.body.soDienThoai || 'N/A',
                            diaChi: req.body.diaChi || 'N/A',
                            email: customerEmail,
                            tongTien: req.body.tongTien || 0,
                            phiVanChuyen: 0, // Miễn phí vận chuyển
                            giaTriKhuyenMai: req.body.giaTriKhuyenMai || 0,
                            ngayDat: new Date(),
                            phuongThucThanhToan: req.body.phuongThucThanhToan || 'COD',
                            chiTiet: (req.body.chiTiet || []).map(item => ({
                                tenSanPham: item.tenSanPham || 'Sản phẩm',
                                soLuong: item.soLuong || 1,
                                donGia: item.donGia || 0,
                                thanhTien: (item.soLuong || 1) * (item.donGia || 0)
                            }))
                        };

                        const paymentData = {
                            method: 'Thanh toán khi nhận hàng (COD)',
                            status: 'Chưa thanh toán',
                            isPaid: false,
                            transactionRef: `COD_${donHangId}`,
                            cardInfo: null
                        };

                        console.log('Sending COD invoice email with request data to:', customerEmail);
                        const emailResult = await emailService.sendInvoiceEmail(
                            orderData, 
                            paymentData,
                            customerEmail
                        );
                        console.log('COD invoice email result:', emailResult);
                    } else if (orderRows.length > 0) {
                        // Ưu tiên thông tin từ request nếu có, fallback về database
                        const orderData = {
                            DonHangID: orderRows[0].DonHangID,
                            maDonHang: `DH${orderRows[0].DonHangID}`,
                            hoTen: req.body.hoTen || orderRows[0].HoTen || 'Khách hàng',
                            soDienThoai: req.body.soDienThoai || orderRows[0].SoDienThoai || 'N/A',
                            diaChi: req.body.diaChi || orderRows[0].DiaChi || 'N/A',
                            email: customerEmail || orderRows[0].UserEmail,
                            tongTien: orderRows[0].TongTien || 0,
                            phiVanChuyen: 0, // Miễn phí vận chuyển
                            giaTriKhuyenMai: orderRows[0].GiamGia || 0,
                            ngayDat: orderRows[0].NgayDat,
                            phuongThucThanhToan: orderRows[0].PhuongThucThanhToan || 'COD',
                            chiTiet: orderRows.map(row => ({
                                tenSanPham: row.TenSanPham || 'Sản phẩm',
                                soLuong: row.SoLuong || 1,
                                donGia: row.Gia || 0,
                                thanhTien: (row.SoLuong || 1) * (row.Gia || 0)
                            }))
                        };

                        // Determine payment method display text and status
                        let paymentMethod = 'Thanh toán khi nhận hàng (COD)';
                        let paymentStatus = 'Chưa thanh toán';
                        let isPaid = false;
                        
                        // Lấy trạng thái thanh toán thực tế từ bảng PaymentTransactions
                        let actualPaymentStatus = null;
                        let transactionRef = `${orderRows[0].PhuongThucThanhToan}_${donHangId}`;
                        
                        try {
                            const paymentResult = await db.query(
                                `SELECT Status, TransactionRef FROM PaymentTransactions WHERE OrderID = ? ORDER BY CreatedAt DESC LIMIT 1`,
                                [donHangId]
                            );
                            
                            console.log('=== PAYMENT STATUS DEBUG ===');
                            console.log('OrderID:', donHangId);
                            console.log('Payment result:', paymentResult);
                            
                            if (paymentResult && paymentResult.length > 0) {
                                actualPaymentStatus = paymentResult[0].Status;
                                transactionRef = paymentResult[0].TransactionRef || transactionRef;
                                console.log('Actual payment status:', actualPaymentStatus);
                                console.log('Transaction ref:', transactionRef);
                            } else {
                                console.log('No payment record found for order:', donHangId);
                            }
                            console.log('========================');
                        } catch (error) {
                            console.error('Error fetching payment status:', error);
                        }
                        
                        if (orderRows[0].PhuongThucThanhToan === 'CARD') {
                            paymentMethod = 'Thanh toán bằng thẻ';
                            paymentStatus = actualPaymentStatus === 'SUCCESS' ? 'Thành công' : 
                                          actualPaymentStatus === 'PENDING' ? 'Chưa xử lý' :
                                          actualPaymentStatus === 'FAILED' ? 'Thất bại' :
                                          actualPaymentStatus === 'CANCELLED' ? 'Đã hủy' : 'Thành công';
                            isPaid = actualPaymentStatus === 'SUCCESS';
                        } else if (orderRows[0].PhuongThucThanhToan === 'QR') {
                            paymentMethod = 'Chuyển khoản ngân hàng - VietQR';
                            paymentStatus = actualPaymentStatus === 'SUCCESS' ? 'Thành công' : 
                                          actualPaymentStatus === 'PENDING' ? 'Chưa xử lý' :
                                          actualPaymentStatus === 'FAILED' ? 'Thất bại' :
                                          actualPaymentStatus === 'CANCELLED' ? 'Đã hủy' : 'Chưa xử lý';
                            isPaid = actualPaymentStatus === 'SUCCESS';
                        } else if (orderRows[0].PhuongThucThanhToan === 'MOMO') {
                            paymentMethod = 'Ví điện tử MoMo';
                            paymentStatus = actualPaymentStatus === 'SUCCESS' ? 'Thành công' : 
                                          actualPaymentStatus === 'PENDING' ? 'Chưa xử lý' :
                                          actualPaymentStatus === 'FAILED' ? 'Thất bại' :
                                          actualPaymentStatus === 'CANCELLED' ? 'Đã hủy' : 'Thành công';
                            isPaid = actualPaymentStatus === 'SUCCESS';
                        }
                        
                        console.log('=== PAYMENT MAPPING DEBUG ===');
                        console.log('Payment method:', paymentMethod);
                        console.log('Payment status:', paymentStatus);
                        console.log('Is paid:', isPaid);
                        console.log('==============================');
                        
                        const paymentData = {
                            method: paymentMethod,
                            status: paymentStatus,
                            isPaid: isPaid,
                            transactionRef: transactionRef,
                            cardInfo: orderRows[0].PhuongThucThanhToan === 'CARD' ? {
                                type: 'Card',
                                last4: '****'
                            } : null
                        };

                        // Gửi email hóa đơn (cho cả COD và các phương thức khác)
                        const emailToSend = customerEmail || orderRows[0].UserEmail;
                        console.log('Attempting to send invoice email to:', emailToSend);
                        
                        if (!emailToSend) {
                            console.error('No customer email found for order:', donHangId);
                        } else {
                            const emailResult = await emailService.sendInvoiceEmail(
                                orderData, 
                                paymentData,
                                emailToSend
                            );
                            console.log('Order invoice email result:', emailResult);
                        }
                    }
                } catch (emailError) {
                    console.error('Error sending order invoice email:', emailError);
                    // Không throw error để không ảnh hưởng đến việc tạo đơn hàng
                }
            });
        }

        res.status(201).json({
            DonHangID: donHangId,
            message: 'Đơn hàng đã được tạo thành công và email hóa đơn đã được gửi'
        });

    } catch (error) {
        console.error('Error creating order:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
        });

        // Rollback transaction and release connection
        if (connection) {
            await new Promise((resolve, reject) => {
                connection.rollback(() => resolve());
            });
            connection.release();
        }

        res.status(500).json({ 
            error: 'Lỗi server khi tạo đơn hàng',
            details: error.message 
        });
    }
};

// Gửi email hóa đơn cho đơn hàng đã tạo
exports.sendOrderInvoiceEmail = async (req, res) => {
    try {
        const { orderId, customerEmail } = req.body;
        
        if (!orderId || !customerEmail) {
            return res.status(400).json({
                success: false,
                message: 'OrderId và customerEmail là bắt buộc'
            });
        }

        console.log('=== SEND INVOICE EMAIL DEBUG ===');
        console.log('Order ID:', orderId);
        console.log('Customer Email:', customerEmail);
        console.log('================================');

        // Lấy thông tin đơn hàng từ database
        const orderRowsResult = await db.query(
            `SELECT dh.*, nd.HoTen, nd.SoDienThoai, nd.DiaChi, nd.Email as UserEmail,
                    ct.*, sp.TenSanPham, sp.HinhAnh, sp.GiaGoc,
                    km.MaKhuyenMai, km.MoTa as KhuyenMaiMoTa, km.PhanTramGiam
             FROM DonHang dh
             LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID
             LEFT JOIN ChiTietDonHang ct ON dh.DonHangID = ct.DonHangID
             LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
             LEFT JOIN KhuyenMai km ON dh.KhuyenMaiID = km.KhuyenMaiID
             WHERE dh.DonHangID = ?
             ORDER BY ct.ChiTietID`,
            [orderId]
        );
        
        // Xử lý kết quả query đúng cách - orderRowsResult là array của rows
        const orderRows = orderRowsResult;

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Debug: Log dữ liệu từ database
        console.log('=== DATABASE DEBUG ===');
        console.log('Total rows:', orderRows.length);
        console.log('First row:', JSON.stringify(orderRows[0], null, 2));
        console.log('Gia from ChiTietDonHang:', orderRows[0].Gia);
        console.log('GiaGoc from SanPham:', orderRows[0].GiaGoc);
        console.log('GiamGia from DonHang:', orderRows[0].GiamGia);
        console.log('TongTien from DonHang:', orderRows[0].TongTien);
        console.log('PhanTramGiam from KhuyenMai:', orderRows[0].PhanTramGiam);
        console.log('MaKhuyenMai:', orderRows[0].MaKhuyenMai);
        
        // Debug từng row trong orderRows
        orderRows.forEach((row, index) => {
            console.log(`Row ${index}:`, {
                TenSanPham: row.TenSanPham,
                SoLuong: row.SoLuong,
                Gia: row.Gia,
                GiaGoc: row.GiaGoc,
                ChiTietID: row.ChiTietID,
                SanPhamID: row.SanPhamID
            });
        });
        console.log('=====================');

        // Tính toán giảm giá từ bảng KhuyenMai nếu có
        let calculatedDiscount = 0;
        if (orderRows[0].PhanTramGiam && orderRows[0].PhanTramGiam > 0) {
            const phanTramGiam = parseFloat(orderRows[0].PhanTramGiam);
            const tongTien = orderRows[0].TongTien || 0;
            calculatedDiscount = Math.round((tongTien * phanTramGiam) / 100);
            console.log('Calculated discount from KhuyenMai:', calculatedDiscount);
        }

        // Lấy giảm giá: Ưu tiên GiamGia từ DonHang, fallback về calculatedDiscount
        const finalDiscount = orderRows[0].GiamGia || calculatedDiscount || 0;
        console.log('Final discount:', finalDiscount);

        // Ưu tiên thông tin từ request nếu có, fallback về database
        const orderData = {
            DonHangID: orderRows[0].DonHangID,
            maDonHang: `DH${orderRows[0].DonHangID}`,
            hoTen: req.body.hoTen || orderRows[0].HoTen || 'Khách hàng',
            soDienThoai: req.body.soDienThoai || orderRows[0].SoDienThoai || 'N/A',
            diaChi: req.body.diaChi || orderRows[0].DiaChi || 'N/A',
            email: customerEmail,
            tongTien: orderRows[0].TongTien || 0,
            phiVanChuyen: 0, // Miễn phí vận chuyển
            giaTriKhuyenMai: finalDiscount,
            GiamGia: finalDiscount,
            ngayDat: orderRows[0].NgayDat,
            phuongThucThanhToan: orderRows[0].PhuongThucThanhToan || 'COD',
            chiTiet: orderRows.map(row => {
                // Ưu tiên lấy Gia từ ChiTietDonHang (giá thực tế khách hàng đã mua)
                const donGia = row.Gia || 0;
                const soLuong = row.SoLuong || 1;
                const thanhTien = soLuong * donGia;
                
                console.log('Mapping chi tiet:', {
                    tenSanPham: row.TenSanPham,
                    soLuong: soLuong,
                    donGia: donGia,
                    thanhTien: thanhTien
                });
                
                return {
                    tenSanPham: row.TenSanPham || 'Sản phẩm',
                    soLuong: soLuong,
                    donGia: donGia,
                    Gia: donGia,
                    thanhTien: thanhTien
                };
            })
        };
        
        console.log('Final orderData:', JSON.stringify(orderData, null, 2));

        // Determine payment method display text and status
        let paymentMethod = 'Thanh toán khi nhận hàng (COD)';
        let paymentStatus = 'Chưa thanh toán';
        let isPaid = false;
        
        if (orderRows[0].PhuongThucThanhToan === 'CARD') {
            paymentMethod = 'Thanh toán bằng thẻ';
            paymentStatus = 'Thành công';
            isPaid = true;
        } else if (orderRows[0].PhuongThucThanhToan === 'QR') {
            paymentMethod = 'Chuyển khoản ngân hàng - VietQR';
            paymentStatus = 'Chờ thanh toán';
        } else if (orderRows[0].PhuongThucThanhToan === 'MOMO') {
            paymentMethod = 'Ví điện tử MoMo';
            paymentStatus = 'Thành công';
            isPaid = true;
        }
        
        const paymentData = {
            method: paymentMethod,
            status: paymentStatus,
            isPaid: isPaid,
            transactionRef: `${orderRows[0].PhuongThucThanhToan}_${orderId}`,
            cardInfo: orderRows[0].PhuongThucThanhToan === 'CARD' ? {
                type: 'Card',
                last4: '****'
            } : null
        };

        // Gửi email hóa đơn
        console.log('Sending invoice email to:', customerEmail);
        const emailResult = await emailService.sendInvoiceEmail(
            orderData, 
            paymentData,
            customerEmail
        );
        
        console.log('Invoice email result:', emailResult);

        res.json({
            success: true,
            message: 'Email hóa đơn đã được gửi thành công',
            emailResult: emailResult
        });

    } catch (error) {
        console.error('Error sending invoice email:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi email hóa đơn',
            error: error.message
        });
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