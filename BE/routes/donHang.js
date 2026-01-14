const express = require('express');
const router = express.Router();
const donHangController = require('../controllers/donHangController');
const pdfService = require('../services/pdfService');

/**
 * @swagger
 * tags:
 *   name: DonHang
 *   summary: Order management
 */

/**
 * @swagger
 * /api/donhang:
 *   get:
 *     summary: Retrieve a list of orders
 *     tags: [DonHang]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DonHang'
 */
router.get('/', donHangController.getAllDonHangs);

/**
 * @swagger
 * /api/donhang/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [DonHang]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DonHang'
 *       404:
 *         summary: Order not found
 */
router.get('/:id', donHangController.getDonHangById);

/**
 * @swagger
 * /api/donhang/customer/{customerId}:
 *   get:
 *     summary: Get orders by customer ID
 *     tags: [DonHang]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer UUID
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DonHang'
 */
router.get('/customer/:customerId', donHangController.getDonHangsByCustomerId);

/**
 * @swagger
 * /api/donhang:
 *   post:
 *     summary: Create a new order
 *     tags: [DonHang]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DonHang'
 *     responses:
 *       201:
 *         summary: Created
 */
router.post('/', donHangController.createDonHang);
router.post('/send-invoice-email', donHangController.sendOrderInvoiceEmail);

// Tạo và tải PDF hóa đơn theo DonHangID
router.get('/:id/invoice.pdf', async (req, res) => {
  try {
    const orderId = req.params.id;

    // Lấy dữ liệu đơn hàng chi tiết từ controller helper (reuse logic)
    // Truy vấn tương tự như sendOrderInvoiceEmail để đảm bảo dữ liệu chiTiet đầy đủ
    const db = require('../db');
    const rows = await db.query(
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

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Tính giảm giá
    let calculatedDiscount = 0;
    if (rows[0].PhanTramGiam && rows[0].PhanTramGiam > 0) {
      const phanTramGiam = parseFloat(rows[0].PhanTramGiam);
      const tongTien = rows[0].TongTien || 0;
      calculatedDiscount = Math.round((tongTien * phanTramGiam) / 100);
    }
    const finalDiscount = rows[0].GiamGia || calculatedDiscount || 0;

    // Build orderData & paymentData like email path
    const orderData = {
      DonHangID: rows[0].DonHangID,
      maDonHang: `DH${rows[0].DonHangID}`,
      hoTen: rows[0].HoTen || 'Khách hàng',
      soDienThoai: rows[0].SoDienThoai || 'N/A',
      diaChi: rows[0].DiaChi || 'N/A',
      email: rows[0].UserEmail || '',
      tongTien: rows[0].TongTien || 0,
      phiVanChuyen: 0,
      giaTriKhuyenMai: finalDiscount,
      GiamGia: finalDiscount,
      ngayDat: rows[0].NgayDat,
      phuongThucThanhToan: rows[0].PhuongThucThanhToan || 'COD',
      chiTiet: rows.map(r => {
        const donGia = r.Gia || 0;
        const soLuong = r.SoLuong || 1;
        const thanhTien = soLuong * donGia;
        return {
          tenSanPham: r.TenSanPham || 'Sản phẩm',
          soLuong,
          donGia,
          Gia: donGia,
          thanhTien
        };
      })
    };

    let paymentMethod = 'Thanh toán khi nhận hàng (COD)';
    let paymentStatus = 'Chưa thanh toán';
    let isPaid = false;
    if (rows[0].PhuongThucThanhToan === 'CARD') {
      paymentMethod = 'Thanh toán bằng thẻ';
      paymentStatus = 'Thành công';
      isPaid = true;
    } else if (rows[0].PhuongThucThanhToan === 'QR') {
      paymentMethod = 'Chuyển khoản ngân hàng - VietQR';
      paymentStatus = 'Chờ thanh toán';
    }

    const paymentData = {
      method: paymentMethod,
      status: paymentStatus,
      isPaid,
      transactionRef: `${rows[0].PhuongThucThanhToan}_${orderId}`,
      cardInfo: rows[0].PhuongThucThanhToan === 'CARD' ? { type: 'Card', last4: '****' } : null
    };

    // Tạo file PDF
    const result = await pdfService.createInvoicePDF(orderData, paymentData);
    if (!result.success) {
      return res.status(500).json({ message: 'Không tạo được PDF', error: result.error });
    }

    // Stream file về client
    const asInline = req.query.inline === '1' || req.query.preview === '1';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${asInline ? 'inline' : 'attachment'}; filename="${result.fileName}"`);
    const fs = require('fs');
    const stream = fs.createReadStream(result.filePath);
    stream.pipe(res);
    stream.on('error', () => {
      res.status(500).end();
    });
  } catch (err) {
    console.error('Error generating invoice PDF:', err);
    res.status(500).json({ message: 'Lỗi server khi tạo PDF' });
  }
});

/**
 * @swagger
 * /api/donhang/{id}:
 *   put:
 *     summary: Update an order
 *     tags: [DonHang]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DonHang'
 *     responses:
 *       200:
 *         summary: Updated
 *       404:
 *         summary: Order not found
 */
router.put('/:id', donHangController.updateDonHang);

/**
 * @swagger
 * /api/donhang/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [DonHang]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       204:
 *         summary: Deleted
 *       404:
 *         summary: Order not found
 */
router.delete('/:id', donHangController.deleteDonHang);

/**
 * @swagger
 * /api/donhang/{id}/cancel:
 *   put:
 *     summary: Cancel an order
 *     tags: [DonHang]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order UUID
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found
 *       400:
 *         description: Order cannot be cancelled
 */
router.put('/:id/cancel', donHangController.cancelDonHang);

module.exports = router;