const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const db = require('../db');

// Test email connection
router.get('/test', async (req, res) => {
  try {
    const isConnected = await emailService.testConnection();
    res.json({
      success: isConnected,
      message: isConnected ? 'Email service is ready' : 'Email service connection failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test sending invoice email
router.post('/test-invoice', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Sample order data for testing
    const testOrderData = {
      DonHangID: 'TEST123',
      maDonHang: 'DH123456',
      hoTen: 'Nguyễn Văn Test',
      soDienThoai: '0123456789',
      diaChi: '123 Đường Test, Quận 1, TP.HCM',
      email: email,
      tongTien: 500000,
      phiVanChuyen: 30000,
      giaTriKhuyenMai: 50000,
      ngayDat: new Date(),
      chiTiet: [
        {
          tenSanPham: 'iPhone 15 Pro Max',
          soLuong: 1,
          donGia: 35000000,
          thanhTien: 35000000
        },
        {
          tenSanPham: 'AirPods Pro',
          soLuong: 1,
          donGia: 15000000,
          thanhTien: 15000000
        }
      ]
    };

    const testPaymentData = {
      method: 'Thanh toán bằng thẻ',
      status: 'Thành công',
      transactionRef: 'TXN123456789',
      cardInfo: {
        type: 'Visa',
        last4: '1234'
      }
    };

    const result = await emailService.sendInvoiceEmail(
      testOrderData,
      testPaymentData,
      email
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Gửi email hóa đơn sau khi thanh toán thành công
router.post('/send-invoice-after-payment', async (req, res) => {
  try {
    const { orderId, paymentData, customerEmail } = req.body;
    
    if (!orderId || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'OrderId and customerEmail are required'
      });
    }

    // Lấy thông tin đơn hàng từ database
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

    if (!orderRows || orderRows.length === 0 || !orderRows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const orderData = {
      DonHangID: orderRows[0].DonHangID,
      maDonHang: `DH${orderRows[0].DonHangID}`,
      hoTen: orderRows[0].HoTen || 'Khách hàng',
      soDienThoai: orderRows[0].SoDienThoai || 'N/A',
      diaChi: orderRows[0].DiaChi || 'N/A',
      email: customerEmail,
      tongTien: orderRows[0].TongTien || 0,
      phiVanChuyen: 30000, // Default shipping fee
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
    let actualPaymentStatus = null;
    let actualTransactionRef = paymentData.transactionRef;
    
    try {
      const paymentResult = await db.query(
        `SELECT Status, TransactionRef FROM PaymentTransactions WHERE OrderID = ? ORDER BY CreatedAt DESC LIMIT 1`,
        [orderId]
      );
      
      console.log('=== EMAIL INVOICE PAYMENT STATUS DEBUG ===');
      console.log('OrderID:', orderId);
      console.log('Payment result:', paymentResult);
      
      if (paymentResult && paymentResult.length > 0) {
        actualPaymentStatus = paymentResult[0].Status;
        actualTransactionRef = paymentResult[0].TransactionRef || actualTransactionRef;
        console.log('Actual payment status:', actualPaymentStatus);
        console.log('Actual transaction ref:', actualTransactionRef);
      } else {
        console.log('No payment record found for order:', orderId);
      }
      console.log('==========================================');
    } catch (error) {
      console.error('Error fetching payment status for email invoice:', error);
    }
    
    // Cập nhật paymentData với trạng thái thực tế
    const statusMap = {
      'SUCCESS': 'Thành công',
      'PENDING': 'Chưa xử lý', 
      'FAILED': 'Thất bại',
      'CANCELLED': 'Đã hủy'
    };
    
    const updatedPaymentData = {
      ...paymentData,
      status: actualPaymentStatus ? statusMap[actualPaymentStatus] || paymentData.status : paymentData.status,
      transactionRef: actualTransactionRef,
      isPaid: actualPaymentStatus === 'SUCCESS'
    };
    
    console.log('=== EMAIL INVOICE PAYMENT DATA DEBUG ===');
    console.log('Original payment data:', paymentData);
    console.log('Updated payment data:', updatedPaymentData);
    console.log('========================================');

    const result = await emailService.sendInvoiceEmail(
      orderData,
      updatedPaymentData,
      customerEmail
    );

    res.json(result);
  } catch (error) {
    console.error('Error sending invoice email after payment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test sending order confirmation email
router.post('/test-confirmation', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Sample order data for testing
    const testOrderData = {
      DonHangID: 'TEST123',
      maDonHang: 'DH123456',
      hoTen: 'Nguyễn Văn Test',
      soDienThoai: '0123456789',
      diaChi: '123 Đường Test, Quận 1, TP.HCM',
      email: email,
      tongTien: 500000,
      phiVanChuyen: 30000,
      giaTriKhuyenMai: 50000,
      ngayDat: new Date(),
      phuongThucThanhToan: 'COD',
      chiTiet: [
        {
          tenSanPham: 'iPhone 15 Pro Max',
          soLuong: 1,
          donGia: 35000000,
          thanhTien: 35000000
        }
      ]
    };

    const result = await emailService.sendOrderConfirmationEmail(
      testOrderData,
      email
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
