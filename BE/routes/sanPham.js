const express = require('express');
const router = express.Router();
const sanPhamController = require('../controllers/sanPhamController');

/**
 * @swagger
 * tags:
 *   name: SanPham
 *   summary: Product management
 */

/**
 * @swagger
 * /api/sanpham:
 *   get:
 *     summary: Retrieve a list of products
 *     tags: [SanPham]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SanPham'
 */
router.get('/', sanPhamController.getAllSanPhams);

/**
 * @swagger
 * /api/sanpham/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm theo tên hoặc mô tả
 *     tags: [SanPham]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Từ khóa tìm kiếm (TenSanPham hoặc MoTa)
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm tìm được
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SanPham'
 *       400:
 *         description: Thiếu query parameter
 */
router.get('/search', sanPhamController.searchSanPham);

/**
 * @swagger
 * /api/sanpham/category/{categoryId}:
 *   get:
 *     summary: Lấy sản phẩm theo danh mục (bao gồm danh mục con)
 *     tags: [SanPham]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của danh mục
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm trong danh mục và danh mục con
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SanPham'
 *       500:
 *         description: Lỗi server
 */
router.get('/category/:categoryId', sanPhamController.getSanPhamByCategory);

/**
 * @swagger
 * /api/sanpham/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [SanPham]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SanPham'
 *       404:
 *         summary: Product not found
 */
router.get('/:id', sanPhamController.getSanPhamById);

/**
 * @swagger
 * /api/sanpham:
 *   post:
 *     summary: Create a new product
 *     tags: [SanPham]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SanPham'
 *     responses:
 *       201:
 *         summary: Created
 */
router.post('/', sanPhamController.createSanPham);

/**
 * @swagger
 * /api/sanpham/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [SanPham]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SanPham'
 *     responses:
 *       200:
 *         summary: Updated
 *       404:
 *         summary: Product not found
 */
router.put('/:id', sanPhamController.updateSanPham);

/**
 * @swagger
 * /api/sanpham/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [SanPham]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       204:
 *         summary: Deleted
 *       404:
 *         summary: Product not found
 */
router.delete('/:id', sanPhamController.deleteSanPham);

module.exports = router;
