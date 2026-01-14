const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Tạo payment request cho các nhà cung cấp khác nhau
router.post('/vietqr/create', paymentController.createVietQRPayment);
router.post('/card/create', paymentController.createCardPayment);

// MoMo Payment Routes
router.post('/momo/create', paymentController.createMoMoPayment);
router.get('/momo/callback', paymentController.handleMoMoCallback);
router.post('/momo/ipn', paymentController.handleMoMoIPN);
router.post('/momo/check-status', paymentController.checkMoMoTransactionStatus);
router.get('/momo/config', paymentController.checkMoMoConfig);

// Parse VietQR content để lấy thông tin thanh toán
router.post('/vietqr/parse', paymentController.parseVietQRContent);

// Kiểm tra cấu hình VietQR
router.get('/vietqr/config', paymentController.checkVietQRConfig);

// Test VietQR API
router.post('/vietqr/test', paymentController.testVietQRAPI);

// Lấy thông tin thanh toán
router.get('/status/:paymentId', paymentController.getPaymentStatus);
router.post('/vietqr/update-status', paymentController.updateVietQRPaymentStatus);
router.get('/methods', paymentController.getPaymentMethods);

// Xác nhận thanh toán và gửi QR code qua email
router.post('/confirm-payment', paymentController.confirmPayment);

// Admin endpoints
router.get('/transactions', paymentController.getAllTransactions);
router.get('/stats', paymentController.getPaymentStats);
router.get('/report', paymentController.getPaymentReport);
router.get('/export', paymentController.exportPaymentReport);
router.get('/order/:orderId', paymentController.getPaymentByOrderId);
router.post('/orders-status', paymentController.getPaymentStatusesForOrders);

module.exports = router;

