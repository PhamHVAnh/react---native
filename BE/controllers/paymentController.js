const db = require('../db');
const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const os = require('os');

/**
 * Lấy địa chỉ IP động của máy từ network interfaces
 * Ưu tiên IPv4, loại bỏ localhost và internal IPs
 */
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  // Ưu tiên các interface theo thứ tự: Wi-Fi, Ethernet, khác
  const priorityOrder = ['Wi-Fi', 'Ethernet', 'en0', 'eth0', 'wlan0'];
  
  // Thử tìm IP từ các interface ưu tiên trước
  for (const name of priorityOrder) {
    const iface = interfaces[name];
    if (iface) {
      for (const addr of iface) {
        // Chỉ lấy IPv4, không phải internal, không phải localhost
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
  }
  
  // Nếu không tìm thấy từ priority list, quét tất cả interfaces
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  
  // Fallback về localhost nếu không tìm thấy
  return '192.168.1.240'; // Fallback IP
}

// Cấu hình thanh toán VietQR
const PAYMENT_CONFIG = {
  VIETQR: {
    API_URL: process.env.VIETQR_API_URL || 'https://api.vietqr.io/v2/generate',
    CLIENT_ID: process.env.VIETQR_CLIENT_ID || 'qph79DT',
    API_KEY: process.env.VIETQR_API_KEY || 'https://api.vietqr.io/image/970422-927241616-qph79DT.jpg?accountName=PHAM%20HOANG%20VIET%20ANH&amount=999999999&addInfo=vip',
    ACCOUNT_NO: process.env.VIETQR_ACCOUNT_NO || '927241616',
    ACCOUNT_NAME: process.env.VIETQR_ACCOUNT_NAME || 'PHAM HOANG VIET ANH',
    BANK_CODE: process.env.VIETQR_BANK_CODE || '970422',
    // URL template cho VietQR image
    IMAGE_URL_TEMPLATE: 'https://api.vietqr.io/image/{bankCode}-{accountNo}-{clientId}.jpg'
  },
  MOMO: {
    PARTNER_CODE: process.env.MOMO_PARTNER_CODE || 'MOMO',
    ACCESS_KEY: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    SECRET_KEY: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    ENDPOINT: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    REDIRECT_URL: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment/momo/callback',
    IPN_URL: process.env.MOMO_IPN_URL || 'http://localhost:3000/payment/momo/ipn',
  }
};


// Log cấu hình để debug

// Tạo QR code thanh toán (VietQR)
exports.createVietQRPayment = async (req, res) => {
  try {
    const { orderId, amount, orderDescription, bankCode, customerEmail } = req.body;
    
    // Validate input data
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đơn hàng hoặc số tiền'
      });
    }
    
    const orderIdVietQR = `VIETQR_${Date.now()}`;
    
    const qrData = {
      accountNo: process.env.VIETQR_ACCOUNT_NO || PAYMENT_CONFIG.VIETQR.ACCOUNT_NO,
      accountName: process.env.VIETQR_ACCOUNT_NAME || PAYMENT_CONFIG.VIETQR.ACCOUNT_NAME,
      acqId: bankCode || process.env.VIETQR_BANK_CODE || PAYMENT_CONFIG.VIETQR.BANK_CODE,
      amount: Math.round(parseFloat(amount)), // Đảm bảo số tiền là số nguyên, làm tròn để tránh số thập phân
      addInfo: orderDescription,
      format: "text",
      template: "compact"
    };

    // Tạo VietQR URL theo format chuẩn để có thể lấy được thông tin số tiền
    const clientId = process.env.VIETQR_CLIENT_ID || PAYMENT_CONFIG.VIETQR.CLIENT_ID;
    const qrImageUrl = PAYMENT_CONFIG.VIETQR.IMAGE_URL_TEMPLATE
      .replace('{bankCode}', qrData.acqId)
      .replace('{accountNo}', qrData.accountNo)
      .replace('{clientId}', clientId) + 
      `?accountName=${encodeURIComponent(qrData.accountName)}&amount=${Math.round(parseFloat(amount))}&addInfo=${encodeURIComponent(orderDescription)}`;
    
    // Tạo QR content cho hiển thị (text format) - sử dụng giá trị thực
    const qrContent = `${qrData.accountName}\nSố tài khoản: ${qrData.accountNo}\nSố tiền: ${Math.round(parseFloat(amount))} VND\nNội dung: ${orderDescription}`;
    
    // Validate các tham số trước khi gọi API
    const validatedAmount = Math.round(parseFloat(amount));
    if (isNaN(validatedAmount) || validatedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Số tiền không hợp lệ'
      });
    }

    // Validate orderDescription
    const validatedDescription = orderDescription ? orderDescription.substring(0, 100) : 'Thanh toan don hang'; // Giới hạn 100 ký tự
    
    // Tạo QR code bằng VietQR API thực tế
    let qrCodeBase64 = null;
    try {
      // Thử tạo QR code bằng VietQR API trước
      const apiUrl = process.env.VIETQR_API_URL || PAYMENT_CONFIG.VIETQR.API_URL;
      const apiKey = process.env.VIETQR_API_KEY || PAYMENT_CONFIG.VIETQR.API_KEY;
      
      const requestData = {
        acqId: qrData.acqId,
        accountNo: qrData.accountNo,
        accountName: qrData.accountName,
        amount: validatedAmount.toString(), // Sử dụng validated amount
        addInfo: validatedDescription, // Sử dụng validated description
        template: "compact" // Sử dụng template thay vì qrType
      };
      
      const vietQRResponse = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey
        }
      });
      
      if (vietQRResponse.data && vietQRResponse.data.data && vietQRResponse.data.data.qrDataURL) {
        qrCodeBase64 = vietQRResponse.data.data.qrDataURL;
      } else {
        throw new Error('VietQR API response invalid');
      }
    } catch (apiError) {
      
      // Fallback: Tạo QR code bằng QRCode library với VietQR URL
      const QRCode = require('qrcode');
      try {
        // Thử tạo QR content theo chuẩn VietQR trước
        const fallbackQRContent = `970422|00|${qrData.accountNo}|${validatedAmount}|${validatedDescription}`;
        
        qrCodeBase64 = await QRCode.toDataURL(fallbackQRContent, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          width: 300,
          margin: 2
        });
      } catch (qrError) {
        
        // Fallback thứ 2: Sử dụng VietQR URL
        try {
          qrCodeBase64 = await QRCode.toDataURL(qrImageUrl, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2
          });
        } catch (urlError) {
          return res.status(500).json({
            success: false,
            error: 'Không thể tạo QR code thanh toán',
            message: urlError.message
          });
        }
      }
    }
    
    // Kiểm tra QR code có được tạo thành công không
    if (!qrCodeBase64) {
      return res.status(500).json({
        success: false,
        error: 'Không thể tạo QR code thanh toán',
        message: 'QR code generation failed'
      });
    }
    
    const paymentId = uuidv4();
    
    try {
      await db.query(
        `INSERT INTO PaymentTransactions 
         (PaymentID, OrderID, PaymentMethod, Amount, Status, PaymentProvider, 
          TransactionRef, QRCode, QRContent, CreatedAt, UpdatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [paymentId, orderId, 'QR', parseInt(amount), 'PENDING', 'VietQR', orderIdVietQR, qrImageUrl, qrContent]
      );
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi lưu thông tin thanh toán',
        error: dbError.message
      });
    }

    // Gửi email hóa đơn ngay sau khi tạo QR (trước khi thanh toán)
    if (customerEmail && orderId) {
      try {
        const orderRowsResult = await db.query(
          `SELECT dh.*, nd.HoTen, nd.SoDienThoai, nd.DiaChi, nd.Email as UserEmail,
                  ct.*, sp.TenSanPham, sp.HinhAnh 
           FROM DonHang dh
           LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID
           LEFT JOIN ChiTietDonHang ct ON dh.DonHangID = ct.DonHangID
           LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
           WHERE dh.DonHangID = ?`,
          [orderId]
        );

        const orderRows = Array.isArray(orderRowsResult[0]) ? orderRowsResult[0] : [orderRowsResult[0]];

        if (orderRows && orderRows.length > 0 && orderRows[0]) {
          const orderData = {
            DonHangID: orderRows[0].DonHangID,
            maDonHang: `DH${orderRows[0].DonHangID}`,
            hoTen: orderRows[0].HoTen || 'Khách hàng',
            soDienThoai: orderRows[0].SoDienThoai || 'N/A',
            diaChi: orderRows[0].DiaChi || 'N/A',
            email: customerEmail || orderRows[0].UserEmail,
            tongTien: orderRows[0].TongTien || 0,
            phiVanChuyen: 30000,
            giaTriKhuyenMai: orderRows[0].GiamGia || 0,
            ngayDat: orderRows[0].NgayDat,
            chiTiet: orderRows.map(row => ({
              tenSanPham: row.TenSanPham || 'Sản phẩm',
              soLuong: row.SoLuong || 1,
              donGia: row.Gia || 0,
              thanhTien: (row.SoLuong || 1) * (row.Gia || 0)
            }))
          };

          const paymentData = {
            method: 'Chuyển khoản ngân hàng - VietQR',
            status: 'Chưa xử lý', // Sử dụng trạng thái thực tế từ database
            transactionRef: orderIdVietQR,
            vietQRCode: qrCodeBase64,
            isVietQR: true, // Thêm flag để hiển thị QR section
            cardInfo: {
              type: 'VietQR',
              last4: qrData.accountNo.slice(-4)
            }
          };

          // Gửi email hóa đơn đầy đủ với PDF đính kèm
          const emailToSend = customerEmail || orderRows[0].UserEmail;
          
          if (!emailToSend) {
          } else {
            // Gửi email hóa đơn đầy đủ với PDF đính kèm
            const emailResult = await emailService.sendInvoiceEmail(
              orderData,
              paymentData,
              emailToSend
            );
            if (emailResult.success) {
            } else {
            }
          }
        }
      } catch (emailError) {
        // Không throw error để không ảnh hưởng đến tạo QR
      }
    }

    res.json({
      success: true,
      qrCode: qrCodeBase64,
      qrImageUrl: qrImageUrl,
      qrContent: qrContent,
      paymentId,
      transactionRef: orderIdVietQR,
      amount: amount,
      orderDescription: orderDescription,
      accountNo: qrData.accountNo,
      accountName: qrData.accountName,
      message: 'QR Code đã được tạo thành công và email hóa đơn đã được gửi'
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Không thể tạo QR code thanh toán',
      error: error.message
    });
  }
};

// Kiểm tra cấu hình VietQR
exports.checkVietQRConfig = async (req, res) => {
  try {
    const config = {
      clientId: PAYMENT_CONFIG.VIETQR.CLIENT_ID,
      accountNo: PAYMENT_CONFIG.VIETQR.ACCOUNT_NO,
      accountName: PAYMENT_CONFIG.VIETQR.ACCOUNT_NAME,
      bankCode: PAYMENT_CONFIG.VIETQR.BANK_CODE,
      apiUrl: PAYMENT_CONFIG.VIETQR.API_URL,
      hasApiKey: !!PAYMENT_CONFIG.VIETQR.API_KEY,
      imageUrlTemplate: PAYMENT_CONFIG.VIETQR.IMAGE_URL_TEMPLATE
    };
    
    // Tạo test URL
    const testUrl = PAYMENT_CONFIG.VIETQR.IMAGE_URL_TEMPLATE
      .replace('{bankCode}', config.bankCode)
      .replace('{accountNo}', config.accountNo)
      .replace('{clientId}', config.clientId) + 
      `?accountName=${encodeURIComponent(config.accountName)}&amount=100000&addInfo=test`;
    
    res.json({
      success: true,
      config: config,
      testUrl: testUrl,
      message: 'Cấu hình VietQR đã được kiểm tra'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi kiểm tra cấu hình VietQR'
    });
  }
};

// Test VietQR API với các tham số khác nhau
exports.testVietQRAPI = async (req, res) => {
  try {
    const { amount = 100000, description = 'Test payment' } = req.body;
    
    const testData = {
      acqId: PAYMENT_CONFIG.VIETQR.BANK_CODE,
      accountNo: PAYMENT_CONFIG.VIETQR.ACCOUNT_NO,
      accountName: PAYMENT_CONFIG.VIETQR.ACCOUNT_NAME,
      amount: Math.round(parseFloat(amount)).toString(),
      addInfo: description.substring(0, 100),
      template: "compact"
    };
    
    const apiUrl = PAYMENT_CONFIG.VIETQR.API_URL;
    const apiKey = PAYMENT_CONFIG.VIETQR.API_KEY;
    const clientId = PAYMENT_CONFIG.VIETQR.CLIENT_ID;
    
    try {
      const response = await axios.post(apiUrl, testData, {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientId,
          'x-api-key': apiKey
        },
        timeout: 10000 // 10 second timeout
      });
      
      res.json({
        success: true,
        message: 'VietQR API test thành công',
        response: {
          status: response.status,
          data: response.data
        }
      });
      
    } catch (apiError) {
      
      res.json({
        success: false,
        message: 'VietQR API test thất bại',
        error: {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          message: apiError.message
        }
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi test VietQR API',
      message: error.message
    });
  }
};

// Parse VietQR URL để lấy thông tin thanh toán
exports.parseVietQRContent = async (req, res) => {
  try {
    const { qrUrl } = req.body;
    
    if (!qrUrl) {
      return res.status(400).json({
        success: false,
        error: 'QR URL không được để trống'
      });
    }
    
    try {
      // Parse VietQR URL để lấy thông tin
      const url = new URL(qrUrl);
      const params = new URLSearchParams(url.search);
      
      const accountName = params.get('accountName');
      const amount = params.get('amount');
      const addInfo = params.get('addInfo');
      
      // Lấy account number từ URL path
      const pathParts = url.pathname.split('/');
      const accountNo = pathParts[pathParts.length - 1]?.replace('.jpg', '');
      
      res.json({
        success: true,
        data: {
          accountNo,
          accountName,
          amount: amount ? parseInt(amount) : null,
          description: addInfo,
          originalUrl: qrUrl
        }
      });
      
    } catch (parseError) {
      res.status(400).json({
        success: false,
        error: 'Không thể parse QR URL',
        message: parseError.message
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi parse QR URL'
    });
  }
};

// Lấy trạng thái thanh toán
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    
    const payment = await db.query(
      `SELECT * FROM PaymentTransactions WHERE PaymentID = ?`,
      [paymentId]
    );

    if (payment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán'
      });
    }

    res.json({
      success: true,
      payment: payment[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy trạng thái thanh toán'
    });
  }
};

// Lấy thông tin thanh toán theo OrderID
exports.getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // First try to find payment with exact OrderID match
    let payment = await db.query(
      `SELECT * FROM PaymentTransactions WHERE OrderID = ? ORDER BY CreatedAt DESC LIMIT 1`,
      [orderId]
    );
    
    // If no direct match, try to find by matching the order info
    if (payment.length === 0) {
      // Get order info first
      const orderInfo = await db.query(
        `SELECT * FROM DonHang WHERE DonHangID = ?`,
        [orderId]
      );
      
      if (orderInfo.length > 0) {
        const order = orderInfo[0];
        
        // Try to find payment by matching amount and date (within 1 hour)
        const orderDate = new Date(order.NgayDat);
        const oneHourBefore = new Date(orderDate.getTime() - 60 * 60 * 1000);
        const oneHourAfter = new Date(orderDate.getTime() + 60 * 60 * 1000);
        
        payment = await db.query(
          `SELECT *, ABS(TIMESTAMPDIFF(SECOND, CreatedAt, ?)) as time_diff
           FROM PaymentTransactions 
           WHERE PaymentMethod = ? 
           AND Amount = ? 
           AND CreatedAt BETWEEN ? AND ?
           ORDER BY time_diff ASC LIMIT 1`,
          [orderDate, order.PhuongThucThanhToan, order.TongTien, oneHourBefore, oneHourAfter]
        );
      }
    }

    if (payment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin thanh toán cho đơn hàng này'
      });
    }

    res.json({
      success: true,
      data: payment[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin thanh toán'
    });
  }
};

// Lấy trạng thái thanh toán cho nhiều đơn hàng cùng lúc
exports.getPaymentStatusesForOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách Order IDs không hợp lệ'
      });
    }
    
    // Get all orders info first
    const placeholders = orderIds.map(() => '?').join(',');
    const orders = await db.query(
      `SELECT * FROM DonHang WHERE DonHangID IN (${placeholders})`,
      orderIds
    );
    
    const paymentStatuses = {};
    
    // Process each order
    for (const order of orders) {
      const orderId = order.DonHangID;
      
      // First try direct match
      let payment = await db.query(
        `SELECT * FROM PaymentTransactions WHERE OrderID = ? ORDER BY CreatedAt DESC LIMIT 1`,
        [orderId]
      );
      
      // If no direct match, try matching by amount and date
      if (payment.length === 0) {
        const orderDate = new Date(order.NgayDat);
        const oneHourBefore = new Date(orderDate.getTime() - 60 * 60 * 1000);
        const oneHourAfter = new Date(orderDate.getTime() + 60 * 60 * 1000);
        
        payment = await db.query(
          `SELECT *, ABS(TIMESTAMPDIFF(SECOND, CreatedAt, ?)) as time_diff
           FROM PaymentTransactions 
           WHERE PaymentMethod = ? 
           AND Amount = ? 
           AND CreatedAt BETWEEN ? AND ?
           ORDER BY time_diff ASC LIMIT 1`,
          [orderDate, order.PhuongThucThanhToan, order.TongTien, oneHourBefore, oneHourAfter]
        );
      }
      
      if (payment.length > 0) {
        paymentStatuses[orderId] = {
          status: payment[0].Status,
          paymentId: payment[0].PaymentID,
          amount: payment[0].Amount,
          createdAt: payment[0].CreatedAt
        };
      } else {
        paymentStatuses[orderId] = {
          status: 'NO_PAYMENT_RECORD',
          paymentId: null,
          amount: null,
          createdAt: null
        };
      }
    }
    
    res.json({
      success: true,
      data: paymentStatuses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy trạng thái thanh toán'
    });
  }
};

// Cập nhật trạng thái thanh toán VietQR (manual confirmation)
exports.updateVietQRPaymentStatus = async (req, res) => {
  try {
    const { transactionRef, status } = req.body;
    
    if (!transactionRef || !status) {
      return res.status(400).json({
        success: false,
        message: 'TransactionRef and status are required'
      });
    }

    // Cập nhật trạng thái thanh toán
    await db.query(
      `UPDATE PaymentTransactions 
       SET Status = ?, UpdatedAt = NOW() 
       WHERE TransactionRef = ?`,
      [status, transactionRef]
    );
    

    // Nếu thanh toán thành công, gửi email hóa đơn
    if (status === 'SUCCESS') {
      try {
        const emailService = require('../services/emailService');
        
        // Lấy thông tin đơn hàng để gửi email
        const orderRowsResult = await db.query(
          `SELECT dh.*, nd.HoTen, nd.SoDienThoai, nd.DiaChi, nd.Email as UserEmail,
                  ct.*, sp.TenSanPham, sp.HinhAnh 
           FROM DonHang dh
           LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID
           LEFT JOIN ChiTietDonHang ct ON dh.DonHangID = ct.DonHangID
           LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
           WHERE dh.DonHangID = (SELECT OrderID FROM PaymentTransactions WHERE TransactionRef = ?)`,
          [transactionRef]
        );

        const orderRows = Array.isArray(orderRowsResult[0]) ? orderRowsResult[0] : [orderRowsResult[0]];

        if (orderRows && orderRows.length > 0 && orderRows[0]) {
          const orderData = {
            DonHangID: orderRows[0].DonHangID,
            maDonHang: `DH${orderRows[0].DonHangID}`,
            hoTen: orderRows[0].HoTen || 'Khách hàng',
            soDienThoai: orderRows[0].SoDienThoai || 'N/A',
            diaChi: orderRows[0].DiaChi || 'N/A',
            email: orderRows[0].UserEmail,
            tongTien: orderRows[0].TongTien || 0,
            phiVanChuyen: 30000,
            giaTriKhuyenMai: orderRows[0].GiamGia || 0,
            ngayDat: orderRows[0].NgayDat,
            chiTiet: orderRows.map(row => ({
              tenSanPham: row.TenSanPham || 'Sản phẩm',
              soLuong: row.SoLuong || 1,
              donGia: row.Gia || 0,
              thanhTien: (row.SoLuong || 1) * (row.Gia || 0)
            }))
          };

          const statusMap = {
            'SUCCESS': 'Thành công',
            'PENDING': 'Chưa xử lý', 
            'FAILED': 'Thất bại',
            'CANCELLED': 'Đã hủy'
          };
          
          const paymentData = {
            method: 'VietQR',
            status: statusMap[status] || 'Thành công',
            transactionRef: transactionRef,
            cardInfo: {
              type: 'VietQR',
              last4: 'N/A'
            }
          };

          // Gửi email hóa đơn và cập nhật trạng thái đơn hàng
          if (orderRows[0].UserEmail) {
            await emailService.sendInvoiceEmail(
              orderData,
              paymentData,
              orderRows[0].UserEmail
            );
          }

          // Cập nhật trạng thái đơn hàng chỉ khi thanh toán thành công
          if (status === 'SUCCESS') {
            await db.query(
              `UPDATE DonHang SET TrangThai = 'DaThanhToan' WHERE DonHangID = ?`,
              [orderRows[0].DonHangID]
            );
          }
        }
      } catch (emailError) {
        // Không throw error để không ảnh hưởng đến thanh toán
      }
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái thanh toán'
    });
  }
};

// Tạo thanh toán bằng thẻ
exports.createCardPayment = async (req, res) => {
  try {
    const { orderId, amount, orderDescription, cardDetails, customerInfo } = req.body;
    
    
    // Validate input data
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đơn hàng hoặc số tiền'
      });
    }
    
    if (!cardDetails || !cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.cardholderName) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin thẻ không đầy đủ'
      });
    }
    
    // Validate amount
    const validatedAmount = Math.round(parseFloat(amount));
    if (isNaN(validatedAmount) || validatedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền không hợp lệ'
      });
    }

    // Validate expiry date
    if (!validateExpiryDate(cardDetails.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Ngày hết hạn thẻ không hợp lệ hoặc đã hết hạn'
      });
    }

    // Simulate card processing (in real implementation, integrate with payment gateway)
    const cardId = `CARD_${Date.now()}`;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Nếu thẻ hợp lệ (đã qua validate), thanh toán luôn thành công
    const isSuccess = true;
    
    // Save payment info to database
    const paymentId = uuidv4();
    
    await db.query(
      `INSERT INTO PaymentTransactions 
       (PaymentID, OrderID, PaymentMethod, Amount, Status, PaymentProvider, 
        TransactionRef, CustomerInfo, CreatedAt, UpdatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        paymentId, 
        orderId, 
        'CARD', 
        validatedAmount, 
        isSuccess ? 'SUCCESS' : 'FAILED', 
        'Card Gateway', 
        cardId,
        JSON.stringify({
          ...customerInfo,
          cardLast4: cardDetails.cardNumber.slice(-4),
          cardType: getCardType(cardDetails.cardNumber)
        })
      ]
    );

    if (isSuccess) {
      // Update order status if payment successful (chỉ nếu orderId thực sự tồn tại)
      if (!orderId.startsWith('TEMP_')) {
        await db.query(
          `UPDATE DonHang SET TrangThai = 'DaThanhToan' WHERE DonHangID = ?`,
          [orderId]
        );
      }

      // Gửi email hóa đơn bất đồng bộ nếu thanh toán thành công
      setImmediate(async () => {
          try {
            let orderRows = [];
            
            if (orderId.startsWith('TEMP_')) {
              // Tạo dữ liệu giả cho TEMP order để gửi email
              orderRows = [{
                DonHangID: orderId,
                HoTen: customerInfo?.name || 'Khách hàng',
                SoDienThoai: customerInfo?.phone || 'N/A',
                DiaChi: 'Địa chỉ sẽ được cập nhật khi tạo đơn hàng thực',
                UserEmail: customerInfo?.email || 'N/A',
                TongTien: amount,
                GiamGia: 0,
                NgayDat: new Date(),
                PhuongThucThanhToan: 'CARD',
                TenSanPham: 'Sản phẩm từ giỏ hàng',
                SoLuong: 1,
                Gia: amount,
                HinhAnh: null
              }];
            } else {
              // Lấy thông tin đơn hàng thực từ database
              const [dbOrderRows] = await db.query(
                `SELECT dh.*, nd.HoTen, nd.SoDienThoai, nd.DiaChi, nd.Email as UserEmail,
                        ct.*, sp.TenSanPham, sp.HinhAnh 
                 FROM DonHang dh
                 LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID
                 LEFT JOIN ChiTietDonHang ct ON dh.DonHangID = ct.DonHangID
                 LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
                 WHERE dh.DonHangID = ?`,
                [orderId]
              );
              orderRows = dbOrderRows;
            }

            if (orderRows.length > 0) {
              const orderData = {
                DonHangID: orderRows[0].DonHangID,
                maDonHang: `DH${orderRows[0].DonHangID}`,
                hoTen: orderRows[0].HoTen || 'Khách hàng',
                soDienThoai: orderRows[0].SoDienThoai || 'N/A',
                diaChi: orderRows[0].DiaChi || 'N/A',
                email: customerInfo?.email || orderRows[0].UserEmail,
                tongTien: orderRows[0].TongTien || 0,
                phiVanChuyen: 0, // Miễn phí vận chuyển
                giaTriKhuyenMai: orderRows[0].GiamGia || 0,
                ngayDat: orderRows[0].NgayDat,
                chiTiet: orderRows.map(row => ({
                  tenSanPham: row.TenSanPham || 'Sản phẩm',
                  soLuong: row.SoLuong || 1,
                  donGia: row.Gia || 0,
                  thanhTien: (row.SoLuong || 1) * (row.Gia || 0)
                }))
              };

              // Lấy trạng thái thanh toán thực tế từ database
              let actualCardPaymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';
              
              const cardStatusMap = {
                'SUCCESS': 'Thành công',
                'PENDING': 'Chưa xử lý', 
                'FAILED': 'Thất bại',
                'CANCELLED': 'Đã hủy'
              };
              
              const paymentData = {
                method: 'Thanh toán bằng thẻ',
                status: cardStatusMap[actualCardPaymentStatus] || 'Thành công',
                transactionRef: cardId,
                cardInfo: {
                  type: getCardType(cardDetails.cardNumber),
                  last4: cardDetails.cardNumber.slice(-4)
                }
              };

              // Gửi email hóa đơn
              const cardEmailToSend = customerInfo?.email || orderRows[0].UserEmail;
              
              if (!cardEmailToSend) {
              } else {
                const emailResult = await emailService.sendInvoiceEmail(
                  orderData, 
                  paymentData, 
                  cardEmailToSend
                );
              }
            }
          } catch (emailError) {
            // Không throw error để không ảnh hưởng đến thanh toán
          }
        });
      }

    res.json({
      success: isSuccess,
      paymentId,
      transactionRef: cardId,
      message: isSuccess ? 'Thanh toán bằng thẻ thành công' : 'Thanh toán bằng thẻ thất bại',
      paymentMethod: 'CARD',
      paymentMethodName: 'Thanh toán bằng thẻ',
      cardInfo: {
        last4: cardDetails.cardNumber.slice(-4),
        type: getCardType(cardDetails.cardNumber)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể xử lý thanh toán bằng thẻ',
      error: error.message
    });
  }
};

// Helper function to detect card type
function getCardType(cardNumber) {
  const num = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(num)) return 'Visa';
  if (/^5[1-5]/.test(num)) return 'Mastercard';
  if (/^3[47]/.test(num)) return 'American Express';
  if (/^35/.test(num)) return 'JCB';
  if (/^6/.test(num)) return 'Discover';
  
  return 'Unknown';
}

// Helper function to validate expiry date
function validateExpiryDate(expiryDate) {
  if (!expiryDate || expiryDate.length !== 5) {
    return false;
  }

  const [monthStr, yearStr] = expiryDate.split('/');
  const month = parseInt(monthStr, 10);
  const year = parseInt('20' + yearStr, 10); // Convert 2-digit year to 4-digit

  // Check if month is valid (1-12)
  if (month < 1 || month > 12) {
    return false;
  }

  // Check if year is valid (current year onwards)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

  // If year is less than current year, it's expired
  if (year < currentYear) {
    return false;
  }

  // If year is current year, check if month has passed
  if (year === currentYear && month < currentMonth) {
    return false;
  }

  // If year is too far in the future (more than 10 years), consider invalid
  if (year > currentYear + 10) {
    return false;
  }

  return true;
}

// Lấy danh sách các phương thức thanh toán có sẵn
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'COD',
        name: 'Thanh toán khi nhận hàng',
        description: 'Thanh toán bằng tiền mặt khi nhận hàng',
        icon: 'cash-outline',
        enabled: true
      },
      {
        id: 'CARD',
        name: 'Thanh toán bằng thẻ',
        description: 'Thanh toán bằng thẻ tín dụng/ghi nợ',
        icon: 'card',
        enabled: true,
        requiresCardDetails: true,
        supportsCardTypes: ['Visa', 'Mastercard', 'JCB', 'American Express']
      },
      {
        id: 'QR',
        name: 'QR Code ngân hàng',
        description: 'Quét mã QR để thanh toán qua ngân hàng',
        icon: 'qr-code',
        enabled: true,
        supportsQR: true
      },
      {
        id: 'MOMO',
        name: 'Ví điện tử MoMo',
        description: 'Thanh toán qua ví điện tử MoMo',
        icon: 'wallet',
        enabled: !!(PAYMENT_CONFIG.MOMO.PARTNER_CODE && PAYMENT_CONFIG.MOMO.ACCESS_KEY && PAYMENT_CONFIG.MOMO.SECRET_KEY),
        supportsMoMo: true
      }
    ];

    res.json({
      success: true,
      paymentMethods
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phương thức thanh toán'
    });
  }
};

// Lấy danh sách tất cả giao dịch thanh toán (cho admin)
exports.getAllTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentMethod, 
      startDate, 
      endDate,
      search
    } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    
    if (status) {
      whereConditions.push('pt.Status = ?');
      queryParams.push(status);
    }
    
    if (paymentMethod) {
      whereConditions.push('pt.PaymentMethod = ?');
      queryParams.push(paymentMethod);
    }
    
    if (startDate) {
      whereConditions.push('DATE(pt.CreatedAt) >= ?');
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('DATE(pt.CreatedAt) <= ?');
      queryParams.push(endDate);
    }
    
    if (search) {
      
      whereConditions.push(`(
        pt.PaymentID LIKE ? OR 
        pt.OrderID LIKE ? OR 
        pt.TransactionRef LIKE ? OR
        nd.HoTen LIKE ? OR
        nd.SoDienThoai LIKE ? OR
        nd.Email LIKE ? OR
        nd.DiaChi LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Đếm tổng số records - bao gồm cả giao dịch thanh toán và đơn hàng COD
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT pt.PaymentID
        FROM PaymentTransactions pt
        LEFT JOIN donhang dh ON pt.OrderID = dh.DonHangID
        LEFT JOIN nguoidung nd ON dh.KhachHangID = nd.UserID
        ${whereClause}
        UNION ALL
        SELECT CONCAT('COD_', dh.DonHangID) as PaymentID
        FROM donhang dh
        LEFT JOIN nguoidung nd ON dh.KhachHangID = nd.UserID
        WHERE dh.PhuongThucThanhToan = 'COD'
        ${whereClause.replace(/pt\./g, 'dh.')}
      ) as combined
    `;
    const countResult = await db.query(countQuery, queryParams);
    const total = countResult[0].total;
    
    // Lấy dữ liệu - bao gồm cả giao dịch thanh toán và đơn hàng COD
    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        pt.PaymentID,
        pt.OrderID,
        pt.PaymentMethod,
        pt.Amount,
        pt.Status,
        pt.PaymentProvider,
        pt.TransactionRef,
        pt.PaymentUrl,
        pt.QRCode,
        pt.QRContent,
        pt.BankCode,
        pt.CustomerInfo,
        pt.CreatedAt,
        pt.UpdatedAt,
        nd.HoTen,
        nd.SoDienThoai,
        nd.Email,
        nd.DiaChi
      FROM PaymentTransactions pt
      LEFT JOIN donhang dh ON pt.OrderID = dh.DonHangID
      LEFT JOIN nguoidung nd ON dh.KhachHangID = nd.UserID
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        CONCAT('COD_', dh.DonHangID) as PaymentID,
        dh.DonHangID as OrderID,
        'COD' as PaymentMethod,
        dh.ThanhTien as Amount,
        CASE 
          WHEN dh.TrangThai = 'HoanThanh' THEN 'SUCCESS'
          WHEN dh.TrangThai = 'Huy' THEN 'CANCELLED'
          ELSE 'PENDING'
        END as Status,
        'COD' as PaymentProvider,
        CONCAT('COD_', dh.DonHangID) as TransactionRef,
        NULL as PaymentUrl,
        NULL as QRCode,
        NULL as QRContent,
        NULL as BankCode,
        NULL as CustomerInfo,
        dh.NgayDat as CreatedAt,
        dh.NgayDat as UpdatedAt,
        nd.HoTen,
        nd.SoDienThoai,
        nd.Email,
        nd.DiaChi
      FROM donhang dh
      LEFT JOIN nguoidung nd ON dh.KhachHangID = nd.UserID
      WHERE dh.PhuongThucThanhToan = 'COD'
      ${whereClause.replace(/pt\./g, 'dh.')}
      
      ORDER BY CreatedAt DESC 
      LIMIT ? OFFSET ?
    `;
    
    const transactions = await db.query(dataQuery, [...queryParams, parseInt(limit), offset]);
    
    res.json({
      success: true,
      data: transactions,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giao dịch thanh toán'
    });
  }
};

// Lấy thống kê thanh toán (cho admin)
exports.getPaymentStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(Amount) as totalAmount,
        SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) as successCount,
        SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN Status = 'FAILED' THEN 1 ELSE 0 END) as failedCount,
        SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledCount
      FROM PaymentTransactions
    `;
    
    const result = await db.query(statsQuery);
    const stats = result[0];
    
    const successRate = stats.totalTransactions > 0 
      ? Math.round((stats.successCount / stats.totalTransactions) * 100) 
      : 0;
    
    res.json({
      success: true,
      totalTransactions: stats.totalTransactions || 0,
      totalAmount: stats.totalAmount || 0,
      successRate: successRate,
      pendingCount: stats.pendingCount || 0,
      successCount: stats.successCount || 0,
      failedCount: stats.failedCount || 0,
      cancelledCount: stats.cancelledCount || 0
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê thanh toán'
    });
  }
};

// Lấy báo cáo thanh toán theo khoảng thời gian
exports.getPaymentReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin ngày bắt đầu và kết thúc'
      });
    }
    
    // Lấy giao dịch trong khoảng thời gian
    const transactionsQuery = `
      SELECT * FROM PaymentTransactions 
      WHERE DATE(CreatedAt) BETWEEN ? AND ?
      ORDER BY CreatedAt DESC
    `;
    
    const transactions = await db.query(transactionsQuery, [startDate, endDate]);
    
    // Lấy thống kê
    const statsQuery = `
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(Amount) as totalAmount,
        SUM(CASE WHEN Status = 'SUCCESS' THEN 1 ELSE 0 END) as successCount,
        SUM(CASE WHEN Status = 'PENDING' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN Status = 'FAILED' THEN 1 ELSE 0 END) as failedCount,
        SUM(CASE WHEN Status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledCount
      FROM PaymentTransactions
      WHERE DATE(CreatedAt) BETWEEN ? AND ?
    `;
    
    const statsResult = await db.query(statsQuery, [startDate, endDate]);
    const stats = statsResult[0];
    
    const successRate = stats.totalTransactions > 0 
      ? Math.round((stats.successCount / stats.totalTransactions) * 100) 
      : 0;
    
    // Lấy dữ liệu biểu đồ theo ngày
    const chartQuery = `
      SELECT 
        DATE(CreatedAt) as date,
        SUM(Amount) as amount,
        COUNT(*) as count
      FROM PaymentTransactions
      WHERE DATE(CreatedAt) BETWEEN ? AND ?
      GROUP BY DATE(CreatedAt)
      ORDER BY DATE(CreatedAt)
    `;
    
    const chartData = await db.query(chartQuery, [startDate, endDate]);
    
    res.json({
      success: true,
      transactions: transactions,
      stats: {
        totalTransactions: stats.totalTransactions || 0,
        totalAmount: stats.totalAmount || 0,
        successRate: successRate,
        pendingCount: stats.pendingCount || 0,
        successCount: stats.successCount || 0,
        failedCount: stats.failedCount || 0,
        cancelledCount: stats.cancelledCount || 0
      },
      chartData: chartData.map(row => ({
        date: row.date,
        amount: row.amount,
        count: row.count
      }))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy báo cáo thanh toán'
    });
  }
};

// Xuất báo cáo thanh toán
exports.exportPaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin ngày bắt đầu và kết thúc'
      });
    }
    
    // Lấy dữ liệu giao dịch
    const transactionsQuery = `
      SELECT 
        pt.*,
        dh.TrangThai as OrderStatus,
        nd.HoTen as CustomerName,
        nd.Email as CustomerEmail
      FROM PaymentTransactions pt
      LEFT JOIN DonHang dh ON pt.OrderID = dh.DonHangID
      LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID
      WHERE DATE(pt.CreatedAt) BETWEEN ? AND ?
      ORDER BY pt.CreatedAt DESC
    `;
    
    const transactions = await db.query(transactionsQuery, [startDate, endDate]);
    
    if (format === 'excel') {
      // Tạo Excel file (cần cài đặt thêm thư viện xlsx)
      const XLSX = require('xlsx');
      
      const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
        'Mã giao dịch': t.PaymentID,
        'Đơn hàng': t.OrderID,
        'Phương thức': t.PaymentMethod,
        'Số tiền': t.Amount,
        'Trạng thái': t.Status,
        'Nhà cung cấp': t.PaymentProvider,
        'Mã tham chiếu': t.TransactionRef,
        'Khách hàng': t.CustomerName,
        'Email': t.CustomerEmail,
        'Trạng thái đơn hàng': t.OrderStatus,
        'Ngày tạo': t.CreatedAt,
        'Ngày cập nhật': t.UpdatedAt
      })));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo thanh toán');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="payment-report-${startDate}-${endDate}.xlsx"`);
      res.send(buffer);
    } else {
      // Trả về JSON nếu không phải Excel
      res.json({
        success: true,
        data: transactions
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xuất báo cáo thanh toán'
    });
  }
};

// Xác nhận thanh toán và gửi hóa đơn đầy đủ qua email
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId, qrCode, qrContent, qrImageUrl, amount, orderDescription, customerEmail } = req.body;

    if (!paymentId || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      });
    }
    
    // Không cập nhật trạng thái thanh toán thành SUCCESS - để admin cập nhật
    // Trạng thái sẽ vẫn là PENDING để admin có thể cập nhật
    
    // Không cập nhật trạng thái - để admin cập nhật

    // Gửi email xác nhận thanh toán với QR code
    try {
      const emailResult = await emailService.sendEmail({
        template: 'payment-confirmation',
        to: customerEmail,
        subject: `Xác nhận thanh toán thành công - ${paymentId}`,
        data: {
          to: customerEmail,
          amount: amount,
          orderDescription: orderDescription,
          qrCode: qrCode, // Base64 fallback
          qrImageUrl: qrImageUrl, // VietQR URL - ưu tiên
          qrContent: qrContent,
          paymentId: paymentId
        }
      });
      if (emailResult.success) {
      } else {
      }
    } catch (emailError) {
      // Không fail toàn bộ request nếu email không gửi được
    }

    // Lấy thông tin đơn hàng để gửi hóa đơn đầy đủ
    try {
      const orderRowsResult = await db.query(
        `SELECT dh.*, nd.HoTen, nd.SoDienThoai, nd.DiaChi, nd.Email as UserEmail,
                ct.*, sp.TenSanPham, sp.HinhAnh 
         FROM DonHang dh
         LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID
         LEFT JOIN ChiTietDonHang ct ON dh.DonHangID = ct.DonHangID
         LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
         WHERE dh.DonHangID = (SELECT OrderID FROM PaymentTransactions WHERE PaymentID = ?)`,
        [paymentId]
      );

      const orderRows = Array.isArray(orderRowsResult[0]) ? orderRowsResult[0] : [orderRowsResult[0]];

      if (orderRows && orderRows.length > 0 && orderRows[0]) {
        const orderData = {
          DonHangID: orderRows[0].DonHangID,
          maDonHang: `DH${orderRows[0].DonHangID}`,
          hoTen: orderRows[0].HoTen || 'Khách hàng',
          soDienThoai: orderRows[0].SoDienThoai || 'N/A',
          diaChi: orderRows[0].DiaChi || 'N/A',
          email: customerEmail || orderRows[0].UserEmail,
          tongTien: orderRows[0].TongTien || 0,
          phiVanChuyen: 30000,
          giaTriKhuyenMai: orderRows[0].GiamGia || 0,
          ngayDat: orderRows[0].NgayDat,
          chiTiet: orderRows.map(row => ({
            tenSanPham: row.TenSanPham || 'Sản phẩm',
            soLuong: row.SoLuong || 1,
            donGia: row.Gia || 0,
            thanhTien: (row.SoLuong || 1) * (row.Gia || 0)
          }))
        };

        // Lấy trạng thái thanh toán thực tế từ database
        let actualPaymentStatus = 'PENDING';
        try {
          const paymentStatusResult = await db.query(
            `SELECT Status FROM PaymentTransactions WHERE PaymentID = ?`,
            [paymentId]
          );
          
          if (paymentStatusResult && paymentStatusResult.length > 0) {
            actualPaymentStatus = paymentStatusResult[0].Status;
          }
        } catch (error) {
        }
        
        const statusMap = {
          'SUCCESS': 'Thành công',
          'PENDING': 'Chưa xử lý', 
          'FAILED': 'Thất bại',
          'CANCELLED': 'Đã hủy'
        };
        
        const paymentData = {
          method: 'VietQR',
          status: statusMap[actualPaymentStatus] || 'Chưa xử lý',
          transactionRef: paymentId,
          cardInfo: {
            type: 'VietQR',
            last4: 'N/A'
          }
        };

        // Gửi email hóa đơn đầy đủ
        const emailResult = await emailService.sendInvoiceEmail(
          orderData,
          paymentData,
          customerEmail
        );

        // Không cập nhật trạng thái đơn hàng - để admin cập nhật
      } else {
        // Nếu không tìm thấy đơn hàng, tạo dữ liệu đơn hàng giả lập để gửi email hóa đơn đầy đủ
        
        // Lấy thông tin khách hàng từ database nếu có
        let customerInfo = {
          hoTen: 'Khách hàng',
          soDienThoai: 'N/A',
          diaChi: 'N/A'
        };
        
        try {
          // Thử lấy thông tin khách hàng từ database
          const customerResult = await db.query(
            'SELECT HoTen, SoDienThoai, DiaChi FROM NguoiDung WHERE Email = ? LIMIT 1',
            [customerEmail]
          );
          
          if (customerResult && customerResult.length > 0) {
            customerInfo = {
              hoTen: customerResult[0].HoTen || 'Khách hàng',
              soDienThoai: customerResult[0].SoDienThoai || 'N/A',
              diaChi: customerResult[0].DiaChi || 'N/A'
            };
          }
        } catch (dbError) {
        }

        const fallbackOrderData = {
          DonHangID: `TEMP_${Date.now()}`,
          maDonHang: `DH${Date.now()}`,
          hoTen: customerInfo.hoTen,
          soDienThoai: customerInfo.soDienThoai,
          diaChi: customerInfo.diaChi,
          email: customerEmail,
          tongTien: amount,
          phiVanChuyen: 30000,
          giaTriKhuyenMai: 0,
          ngayDat: new Date(),
          phuongThucThanhToan: 'QR',
          chiTiet: [{
            tenSanPham: orderDescription || 'Sản phẩm',
            soLuong: 1,
            donGia: amount,
            thanhTien: amount
          }]
        };

        // Lấy trạng thái thanh toán thực tế từ database
        let actualPaymentStatus = 'PENDING';
        try {
          const paymentStatusResult = await db.query(
            `SELECT Status FROM PaymentTransactions WHERE PaymentID = ?`,
            [paymentId]
          );
          
          if (paymentStatusResult && paymentStatusResult.length > 0) {
            actualPaymentStatus = paymentStatusResult[0].Status;
          }
        } catch (error) {
        }

        const statusMap = {
          'SUCCESS': 'Thành công',
          'PENDING': 'Chưa xử lý', 
          'FAILED': 'Thất bại',
          'CANCELLED': 'Đã hủy'
        };

        const fallbackPaymentData = {
          method: 'Chuyển khoản ngân hàng - VietQR',
          status: statusMap[actualPaymentStatus] || 'Chưa xử lý',
          isPaid: actualPaymentStatus === 'SUCCESS',
          transactionRef: paymentId,
          cardInfo: null
        };
        
        const emailResult = await emailService.sendInvoiceEmail(
          fallbackOrderData,
          fallbackPaymentData,
          customerEmail
        );
      }
    } catch (emailError) {
      // Không fail toàn bộ request nếu email không gửi được
    }

    res.json({
      success: true,
      message: 'Mã QR đã được gửi về email của bạn. Vui lòng thanh toán và chờ admin xác nhận.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận thanh toán',
      error: error.message
    });
  }
};

// ==================== MOMO PAYMENT FUNCTIONS ====================

/**
 * Tạo chữ ký HMAC SHA256 cho MoMo
 */
function createMoMoSignature(rawData, secretKey) {
  return crypto.createHmac('sha256', secretKey)
    .update(rawData)
    .digest('hex');
}

/**
 * Tạo thanh toán MoMo
 */
exports.createMoMoPayment = async (req, res) => {
  try {
    
    const { orderId, amount, orderDescription, customerEmail, orderData } = req.body;
    
    // Validate input data
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đơn hàng hoặc số tiền'
      });
    }

    // Tạo đơn hàng trong database trước khi gọi MoMo API
    if (!orderData) {
    } else {
      try {
        const parsedOrderData = typeof orderData === 'string' ? JSON.parse(orderData) : orderData;
        
        // Kiểm tra đơn hàng đã tồn tại chưa
        const existingOrder = await db.query(
          `SELECT DonHangID FROM DonHang WHERE DonHangID = ?`,
          [orderId]
        );
        
        if (existingOrder && existingOrder.length > 0) {
        } else {
          // Insert vào bảng DonHang - theo cấu trúc từ donHangController
          const donHangData = {
            DonHangID: orderId,
            KhachHangID: parsedOrderData.khachHangId,
            TongTien: parsedOrderData.tongTien,
            TrangThai: 'ChuaXuLy',
            // Database đã có MOMO trong ENUM
            PhuongThucThanhToan: parsedOrderData.phuongThucThanhToan || 'COD',
            GiamGia: parsedOrderData.giaTriKhuyenMai || 0
          };
          
          // Calculate ThanhTien
          donHangData.ThanhTien = donHangData.TongTien - (donHangData.GiamGia || 0);
          
          await db.query('INSERT INTO DonHang SET ?', donHangData);

          // Insert chi tiết đơn hàng - theo cấu trúc từ donHangController
          if (parsedOrderData.chiTiet && parsedOrderData.chiTiet.length > 0) {
            for (const item of parsedOrderData.chiTiet) {
              const chiTietId = require('uuid').v4();
              const chiTietData = {
                ChiTietID: chiTietId,
                DonHangID: orderId,
                SanPhamID: item.sanPhamId,
                SoLuong: item.soLuong,
                Gia: item.donGia
              };
              await db.query('INSERT INTO ChiTietDonHang SET ?', chiTietData);
            }
            
            // Trừ số lượng kho ngay sau khi tạo đơn hàng (giống COD/CARD/QR)
            for (const item of parsedOrderData.chiTiet) {
              await db.query(
                'UPDATE TonKho SET SoLuongTon = SoLuongTon - ? WHERE SanPhamID = ?',
                [item.soLuong, item.sanPhamId]
              );
            }
          } else {
          }
        }
      } catch (orderError) {
        // THROW ERROR để dừng lại, không cho phép tạo payment nếu đơn hàng thất bại
        return res.status(500).json({
          success: false,
          message: 'Không thể tạo đơn hàng trong hệ thống. Vui lòng thử lại.',
          error: orderError.message
        });
      }
    }

    // Kiểm tra cấu hình MoMo
    if (!PAYMENT_CONFIG.MOMO.PARTNER_CODE || !PAYMENT_CONFIG.MOMO.ACCESS_KEY || !PAYMENT_CONFIG.MOMO.SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Cấu hình MoMo chưa được thiết lập. Vui lòng liên hệ quản trị viên.'
      });
    }
//wifi 
    const partnerCode = PAYMENT_CONFIG.MOMO.PARTNER_CODE;
    const accessKey = PAYMENT_CONFIG.MOMO.ACCESS_KEY;
    const secretKey = PAYMENT_CONFIG.MOMO.SECRET_KEY;
    const requestId = `MOMO_${orderId}_${Date.now()}`;
    const orderIdMoMo = `ORDER_${orderId}_${Date.now()}`;
    const orderInfo = orderDescription || `Thanh toán đơn hàng ${orderId}`;
    
    // Lấy IP động của máy
    const localIP = getLocalIPAddress();
    const expoPort = process.env.EXPO_PORT || '8081';
    
    // QUAN TRỌNG: Redirect trực tiếp đến order-success với IP động
    // Expo Go hỗ trợ exp:// scheme
    // Format: exp://IP:PORT/--/path?params
    // Path phải khớp với file structure: (screens)/order-success
    const redirectUrl = `exp://${localIP}:${expoPort}/--/(screens)/order-success?orderId=${orderId}&fromPayment=true`;
    
    // IPN URL - Để xử lý webhook từ MoMo (optional, cần public URL)
    const ipnUrl = PAYMENT_CONFIG.MOMO.IPN_URL || `exp://${localIP}:${expoPort}/--/(screens)/payment-ipn?orderId=${orderId}`;
    
    
    const requestType = "captureWallet";
    const extraData = ""; // Có thể thêm thông tin bổ sung nếu cần
    const autoCapture = true;
    const lang = 'vi';

    // Tạo chữ ký theo format của MoMo
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderIdMoMo}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = createMoMoSignature(rawSignature, secretKey);

    // Tạo request body cho MoMo
    const requestBody = {
      partnerCode: partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId: requestId,
      amount: parseInt(amount),
      orderId: orderIdMoMo,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      signature: signature
    };

    try {
      // Gọi API MoMo để tạo thanh toán
      const momoResponse = await axios.post(PAYMENT_CONFIG.MOMO.ENDPOINT, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (momoResponse.data && momoResponse.data.resultCode === 0) {
        // Lưu thông tin thanh toán vào database
        const paymentId = uuidv4();
        
        await db.query(
          `INSERT INTO PaymentTransactions 
           (PaymentID, OrderID, PaymentMethod, Amount, Status, PaymentProvider, 
            TransactionRef, PaymentURL, CreatedAt, UpdatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [paymentId, orderId, 'MOMO', parseInt(amount), 'PENDING', 'MoMo', requestId, momoResponse.data.payUrl]
        );

        // Gửi email hóa đơn ngay sau khi tạo thanh toán MoMo (tương tự VietQR)
        if (customerEmail && orderId) {
          try {
            const orderRowsResult = await db.query(
              `SELECT dh.*, nd.HoTen, nd.SoDienThoai, nd.DiaChi, nd.Email as UserEmail,
                      ct.*, sp.TenSanPham, sp.HinhAnh 
               FROM DonHang dh
               LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID
               LEFT JOIN ChiTietDonHang ct ON dh.DonHangID = ct.DonHangID
               LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
               WHERE dh.DonHangID = ?`,
              [orderId]
            );

            const orderRows = Array.isArray(orderRowsResult[0]) ? orderRowsResult[0] : [orderRowsResult[0]];

            if (orderRows && orderRows.length > 0 && orderRows[0]) {
              const orderData = {
                DonHangID: orderRows[0].DonHangID,
                maDonHang: `DH${orderRows[0].DonHangID}`,
                hoTen: orderRows[0].HoTen || 'Khách hàng',
                soDienThoai: orderRows[0].SoDienThoai || 'N/A',
                diaChi: orderRows[0].DiaChi || 'N/A',
                email: customerEmail || orderRows[0].UserEmail,
                tongTien: orderRows[0].TongTien || 0,
                phiVanChuyen: 30000,
                giaTriKhuyenMai: orderRows[0].GiamGia || 0,
                ngayDat: orderRows[0].NgayDat,
                chiTiet: orderRows.map(row => ({
                  tenSanPham: row.TenSanPham || 'Sản phẩm',
                  soLuong: row.SoLuong || 1,
                  donGia: row.Gia || 0,
                  thanhTien: (row.SoLuong || 1) * (row.Gia || 0)
                }))
              };

              // Trong email ban đầu, trạng thái là PENDING hoặc user sẽ thanh toán
              // Tuy nhiên để trải nghiệm tốt hơn và vì Admin đã coi PENDING là SUCCESS với MoMo,
              // ta có thể để trạng thái là "Đang chờ thanh toán" hoặc "Chờ xác nhận"
              const paymentData = {
                method: 'Ví điện tử MoMo',
                status: 'Chờ thanh toán', // Email xác nhận đã đặt đơn
                transactionRef: requestId,
                payUrl: momoResponse.data.payUrl,
                cardInfo: {
                  type: 'MoMo',
                  last4: 'N/A'
                }
              };

              const emailToSend = customerEmail || orderRows[0].UserEmail;
              if (emailToSend) {
                await emailService.sendInvoiceEmail(
                  orderData,
                  paymentData,
                  emailToSend
                );
              }
            }
          } catch (emailError) {
            // Không throw error để flow chính vẫn tiếp tục
          }
        }

        // Trả về URL thanh toán cho client
        res.json({
          success: true,
          paymentId: paymentId,
          payUrl: momoResponse.data.payUrl,
          deeplink: momoResponse.data.deeplink,
          qrCodeUrl: momoResponse.data.qrCodeUrl,
          transactionRef: requestId,
          message: 'Tạo thanh toán MoMo thành công'
        });

      } else {
        res.status(400).json({
          success: false,
          message: momoResponse.data.message || 'Không thể tạo thanh toán MoMo',
          resultCode: momoResponse.data.resultCode
        });
      }

    } catch (momoError) {
      console.error('MoMo API Error:', {
        message: momoError.message,
        response: momoError.response?.data,
        status: momoError.response?.status,
        requestBody: requestBody
      });
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gọi API MoMo',
        error: momoError.response?.data || momoError.message
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể tạo thanh toán MoMo',
      error: error.message
    });
  }
};

/**
 * Xử lý callback từ MoMo (khi user quay lại từ app MoMo)
 */
exports.handleMoMoCallback = async (req, res) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = req.query;

    // Verify signature
    const rawSignature = `accessKey=${PAYMENT_CONFIG.MOMO.ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = createMoMoSignature(rawSignature, PAYMENT_CONFIG.MOMO.SECRET_KEY);

    if (signature !== expectedSignature) {
      return res.status(400).send('Invalid signature');
    }

    // Cập nhật trạng thái thanh toán
    const status = resultCode === '0' ? 'SUCCESS' : 'FAILED';
    
    await db.query(
      `UPDATE PaymentTransactions 
       SET Status = ?, TransactionID = ?, UpdatedAt = NOW() 
       WHERE TransactionRef = ?`,
      [status, transId, requestId]
    );

    // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng
    if (status === 'SUCCESS') {
      const payment = await db.query(
        `SELECT OrderID FROM PaymentTransactions WHERE TransactionRef = ?`,
        [requestId]
      );

      if (payment.length > 0) {
        const orderId = payment[0].OrderID;
        
        // Cập nhật trạng thái đơn hàng thành DaThanhToan
        await db.query(
          `UPDATE DonHang SET TrangThai = 'DaThanhToan' WHERE DonHangID = ?`,
          [orderId]
        );

        // Gửi email hóa đơn
        try {
          const orderRowsResult = await db.query(
            `SELECT dh.*, nd.HoTen, nd.SoDienThoai, nd.DiaChi, nd.Email as UserEmail,
                    ct.*, sp.TenSanPham, sp.HinhAnh 
             FROM DonHang dh
             LEFT JOIN NguoiDung nd ON dh.KhachHangID = nd.UserID
             LEFT JOIN ChiTietDonHang ct ON dh.DonHangID = ct.DonHangID
             LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
             WHERE dh.DonHangID = ?`,
            [orderId]
          );

          const orderRows = Array.isArray(orderRowsResult[0]) ? orderRowsResult[0] : [orderRowsResult[0]];

          if (orderRows && orderRows.length > 0 && orderRows[0]) {
            const orderData = {
              DonHangID: orderRows[0].DonHangID,
              maDonHang: `DH${orderRows[0].DonHangID}`,
              hoTen: orderRows[0].HoTen || 'Khách hàng',
              soDienThoai: orderRows[0].SoDienThoai || 'N/A',
              diaChi: orderRows[0].DiaChi || 'N/A',
              email: orderRows[0].UserEmail,
              tongTien: orderRows[0].TongTien || 0,
              phiVanChuyen: 30000,
              giaTriKhuyenMai: orderRows[0].GiamGia || 0,
              ngayDat: orderRows[0].NgayDat,
              chiTiet: orderRows.map(row => ({
                tenSanPham: row.TenSanPham || 'Sản phẩm',
                soLuong: row.SoLuong || 1,
                donGia: row.Gia || 0,
                thanhTien: (row.SoLuong || 1) * (row.Gia || 0)
              }))
            };

            const paymentData = {
              method: 'Ví điện tử MoMo',
              status: 'Thành công',
              transactionRef: transId,
              cardInfo: {
                type: 'MoMo',
                last4: 'N/A'
              }
            };

            if (orderRows[0].UserEmail) {
              await emailService.sendInvoiceEmail(
                orderData,
                paymentData,
                orderRows[0].UserEmail
              );
            }
          }
        } catch (emailError) {
        }
      }
    }

    // Redirect về trang kết quả thanh toán trong Expo app
    // Sử dụng deep link scheme: fe://
    const redirectUrl = status === 'SUCCESS' 
      ? `fe://payment-result?status=success&orderId=${orderId}&transId=${transId}&paymentMethod=MOMO`
      : `fe://payment-result?status=failed&orderId=${orderId}&message=${encodeURIComponent(message)}&paymentMethod=MOMO`;
    res.redirect(redirectUrl);

  } catch (error) {
    res.status(500).send('Internal server error');
  }
};

/**
 * Xử lý IPN (Instant Payment Notification) từ MoMo
 */
exports.handleMoMoIPN = async (req, res) => {
  try {

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = req.body;

    // Verify signature
    const rawSignature = `accessKey=${PAYMENT_CONFIG.MOMO.ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = createMoMoSignature(rawSignature, PAYMENT_CONFIG.MOMO.SECRET_KEY);

    if (signature !== expectedSignature) {
      return res.status(204).json({
        message: 'Invalid signature'
      });
    }

    // Cập nhật trạng thái thanh toán
    const status = resultCode === 0 ? 'SUCCESS' : 'FAILED';
    
    await db.query(
      `UPDATE PaymentTransactions 
       SET Status = ?, TransactionID = ?, UpdatedAt = NOW() 
       WHERE TransactionRef = ?`,
      [status, transId, requestId]
    );

    // Nếu thanh toán thành công, cập nhật trạng thái đơn hàng
    if (status === 'SUCCESS') {
      const payment = await db.query(
        `SELECT OrderID FROM PaymentTransactions WHERE TransactionRef = ?`,
        [requestId]
      );

      if (payment.length > 0) {
        const orderId = payment[0].OrderID;
        
        // Cập nhật trạng thái đơn hàng thành DaThanhToan
        await db.query(
          `UPDATE DonHang SET TrangThai = 'DaThanhToan' WHERE DonHangID = ?`,
          [orderId]
        );
      }
    }

    // Trả về response cho MoMo
    res.status(204).json({
      message: 'Success'
    });

  } catch (error) {
    res.status(204).json({
      message: 'Error'
    });
  }
};

/**
 * Kiểm tra trạng thái giao dịch MoMo
 */
exports.checkMoMoTransactionStatus = async (req, res) => {
  try {
    const { orderId, requestId } = req.body;

    if (!orderId || !requestId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin orderId hoặc requestId'
      });
    }

    const partnerCode = PAYMENT_CONFIG.MOMO.PARTNER_CODE;
    const accessKey = PAYMENT_CONFIG.MOMO.ACCESS_KEY;
    const secretKey = PAYMENT_CONFIG.MOMO.SECRET_KEY;

    // Tạo chữ ký
    const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
    const signature = createMoMoSignature(rawSignature, secretKey);

    const requestBody = {
      partnerCode: partnerCode,
      requestId: requestId,
      orderId: orderId,
      signature: signature,
      lang: 'vi'
    };

    // Gọi API kiểm tra trạng thái
    const momoResponse = await axios.post(
      'https://test-payment.momo.vn/v2/gateway/api/query',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: momoResponse.data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái giao dịch MoMo',
      error: error.message
    });
  }
};

/**
 * Kiểm tra cấu hình MoMo
 */
exports.checkMoMoConfig = async (req, res) => {
  try {
    const config = {
      partnerCode: PAYMENT_CONFIG.MOMO.PARTNER_CODE,
      hasAccessKey: !!PAYMENT_CONFIG.MOMO.ACCESS_KEY,
      hasSecretKey: !!PAYMENT_CONFIG.MOMO.SECRET_KEY,
      endpoint: PAYMENT_CONFIG.MOMO.ENDPOINT,
      redirectUrl: PAYMENT_CONFIG.MOMO.REDIRECT_URL,
      ipnUrl: PAYMENT_CONFIG.MOMO.IPN_URL,
      isConfigured: !!(PAYMENT_CONFIG.MOMO.PARTNER_CODE && PAYMENT_CONFIG.MOMO.ACCESS_KEY && PAYMENT_CONFIG.MOMO.SECRET_KEY)
    };

    res.json({
      success: true,
      config: config,
      message: 'Cấu hình MoMo đã được kiểm tra'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi kiểm tra cấu hình MoMo'
    });
  }
};