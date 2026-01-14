const express = require('express');
const router = express.Router();
const baoHanhController = require('../controllers/baoHanhController');
const { default: warrantyRateLimit, clearAllRateLimits } = require('../middleware/warrantyRateLimit');

/**
 * @swagger
 * tags:
 *   name: BaoHanh
 *   summary: Warranty management
 */

/**
 * @swagger
 * /api/baohanh:
 *   get:
 *     summary: Retrieve a list of warranties
 *     tags: [BaoHanh]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BaoHanh'
 */
router.get('/', baoHanhController.getAllBaoHanhs);

/**
 * @swagger
 * /api/baohanh/{id}:
 *   get:
 *     summary: Get a warranty by ID
 *     tags: [BaoHanh]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaoHanh'
 *       404:
 *         summary: Warranty not found
 */
router.get('/:id', baoHanhController.getBaoHanhById);

/**
 * @swagger
 * /api/baohanh:
 *   post:
 *     summary: Create a new warranty
 *     tags: [BaoHanh]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BaoHanh'
 *     responses:
 *       201:
 *         summary: Created
 */
router.post('/', baoHanhController.createBaoHanh);

/**
 * @swagger
 * /api/baohanh/{id}:
 *   put:
 *     summary: Update a warranty
 *     tags: [BaoHanh]
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
 *             $ref: '#/components/schemas/BaoHanh'
 *     responses:
 *       200:
 *         summary: Updated
 *       404:
 *         summary: Warranty not found
 */
router.put('/:id', baoHanhController.updateBaoHanh);

/**
 * @swagger
 * /api/baohanh/{id}:
 *   delete:
 *     summary: Delete a warranty
 *     tags: [BaoHanh]
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
 *         summary: Warranty not found
 */
router.delete('/:id', baoHanhController.deleteBaoHanh);

/**
 * @swagger
 * /api/baohanh/lookup/customer:
 *   get:
 *     summary: Lookup warranties by customer phone or email
 *     tags: [BaoHanh]
 *     parameters:
 *       - in: query
 *         name: soDienThoai
 *         schema:
 *           type: string
 *         description: Customer phone number
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Customer email
 *     responses:
 *       200:
 *         description: List of warranties found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   BaoHanhID:
 *                     type: string
 *                   NgayMua:
 *                     type: string
 *                   HanBaoHanh:
 *                     type: string
 *                   TrangThai:
 *                     type: string
 *                   TenSanPham:
 *                     type: string
 *                   Model:
 *                     type: string
 *                   ThuongHieu:
 *                     type: string
 *                   HoTen:
 *                     type: string
 *                   TrangThaiHienTai:
 *                     type: string
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.get('/test', baoHanhController.testWarrantyData);
router.get('/lookup/customer', warrantyRateLimit, baoHanhController.getBaoHanhByCustomer);

/**
 * @swagger
 * /api/baohanh/lookup/product:
 *   get:
 *     summary: Lookup warranties by product information
 *     tags: [BaoHanh]
 *     parameters:
 *       - in: query
 *         name: tenSanPham
 *         schema:
 *           type: string
 *         description: Product name
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Product model
 *       - in: query
 *         name: thuongHieu
 *         schema:
 *           type: string
 *         description: Product brand
 *     responses:
 *       200:
 *         description: List of warranties found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
router.get('/lookup/product', warrantyRateLimit, baoHanhController.getBaoHanhByProduct);

/**
 * @swagger
 * /api/baohanh/status/{baoHanhID}:
 *   get:
 *     summary: Get comprehensive warranty status information
 *     tags: [BaoHanh]
 *     parameters:
 *       - in: path
 *         name: baoHanhID
 *         schema:
 *           type: string
 *         required: true
 *         description: Warranty ID
 *     responses:
 *       200:
 *         description: Comprehensive warranty information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 BaoHanhID:
 *                   type: string
 *                 NgayMua:
 *                   type: string
 *                 HanBaoHanh:
 *                   type: string
 *                 TrangThai:
 *                   type: string
 *                 TenSanPham:
 *                   type: string
 *                 Model:
 *                   type: string
 *                 ThuongHieu:
 *                   type: string
 *                 HoTen:
 *                   type: string
 *                 SoDienThoai:
 *                   type: string
 *                 Email:
 *                   type: string
 *                 TrangThaiHienTai:
 *                   type: string
 *                 SoNgayConLai:
 *                   type: integer
 *                 SoNgayDaSuDung:
 *                   type: integer
 *       404:
 *         description: Warranty not found
 *       500:
 *         description: Server error
 */
router.get('/status/:baoHanhID', baoHanhController.getWarrantyStatus);

/**
 * @swagger
 * /api/baohanh/stats/{khachHangID}:
 *   get:
 *     summary: Get warranty statistics for a customer
 *     tags: [BaoHanh]
 *     parameters:
 *       - in: path
 *         name: khachHangID
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Warranty statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 TongSoBaoHanh:
 *                   type: integer
 *                 ConHan:
 *                   type: integer
 *                 HetHan:
 *                   type: integer
 *                 DangSua:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/stats/:khachHangID', baoHanhController.getCustomerWarrantyStats);

/**
 * @swagger
 * /api/baohanh/order/{donHangID}:
 *   get:
 *     summary: Get warranties by order ID
 *     tags: [BaoHanh]
 *     parameters:
 *       - in: path
 *         name: donHangID
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: List of warranties for the order
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/order/:donHangID', baoHanhController.getBaoHanhByOrderId);

/**
 * @swagger
 * /api/baohanh/quick-lookup:
 *   get:
 *     summary: Quick warranty lookup by order ID
 *     tags: [BaoHanh]
 *     parameters:
 *       - in: query
 *         name: donHangID
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID for quick lookup
 *     responses:
 *       200:
 *         description: Quick warranty lookup result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 donHangID:
 *                   type: string
 *                 ngayDat:
 *                   type: string
 *                 trangThaiDonHang:
 *                   type: string
 *                 soLuongBaoHanh:
 *                   type: integer
 *                 danhSachBaoHanh:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad request or order not completed
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/quick-lookup', baoHanhController.quickLookupByOrder);

/**
 * @swagger
 * /api/baohanh/create-from-order:
 *   post:
 *     summary: Manually create warranty for completed order item
 *     tags: [BaoHanh]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chiTietID:
 *                 type: string
 *                 description: Order detail ID
 *             required:
 *               - chiTietID
 *     responses:
 *       201:
 *         description: Warranty created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 BaoHanhID:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request or validation error
 *       404:
 *         description: Order detail not found
 *       500:
 *         description: Server error
 */
router.post('/create-from-order', baoHanhController.createWarrantyForOrderItem);

// Reset rate limit endpoint (for development)
router.post('/reset-rate-limit', (req, res) => {
  try {
    clearAllRateLimits();
    res.json({ message: 'Rate limit đã được reset' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi reset rate limit' });
  }
});

module.exports = router;
