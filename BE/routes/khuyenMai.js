const express = require('express');
const router = express.Router();
const khuyenMaiController = require('../controllers/khuyenMaiController');

/**
 * @swagger
 * tags:
 *   name: KhuyenMai
 *   summary: Promotion management
 */

/**
 * @swagger
 * /api/khuyenmai:
 *   get:
 *     summary: Retrieve a list of promotions
 *     tags: [KhuyenMai]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/KhuyenMai'
 */
router.get('/', khuyenMaiController.getAllKhuyenMais);

// 🆕 Route lấy danh sách mã khuyến mãi còn hiệu lực
router.get('/active', khuyenMaiController.getActivePromotions);

// 🆕 Route lấy khuyến mãi theo mã
router.get('/code/:code', khuyenMaiController.getKhuyenMaiByCode);

// 🆕 Route kiểm tra tính hợp lệ của mã khuyến mãi
router.get('/validate/:code', khuyenMaiController.validatePromotion);

// 🆕 Route áp dụng mã khuyến mãi
router.post('/apply', khuyenMaiController.applyPromotion);

/**
 * @swagger
 * /api/khuyenmai/{id}:
 *   get:
 *     summary: Get a promotion by ID
 *     tags: [KhuyenMai]
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
 *               $ref: '#/components/schemas/KhuyenMai'
 *       404:
 *         summary: Promotion not found
 */
router.get('/:id', khuyenMaiController.getKhuyenMaiById);

/**
 * @swagger
 * /api/khuyenmai:
 *   post:
 *     summary: Create a new promotion
 *     tags: [KhuyenMai]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KhuyenMai'
 *     responses:
 *       201:
 *         summary: Created
 */
router.post('/', khuyenMaiController.createKhuyenMai);

/**
 * @swagger
 * /api/khuyenmai/{id}:
 *   put:
 *     summary: Update a promotion
 *     tags: [KhuyenMai]
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
 *             $ref: '#/components/schemas/KhuyenMai'
 *     responses:
 *       200:
 *         summary: Updated
 *       404:
 *         summary: Promotion not found
 */
router.put('/:id', khuyenMaiController.updateKhuyenMai);

/**
 * @swagger
 * /api/khuyenmai/{id}:
 *   delete:
 *     summary: Delete a promotion
 *     tags: [KhuyenMai]
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
 *         summary: Promotion not found
 */
router.delete('/:id', khuyenMaiController.deleteKhuyenMai);

module.exports = router;