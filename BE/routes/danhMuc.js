const express = require('express');
const router = express.Router();
const danhMucController = require('../controllers/danhMucController');

/**
 * @swagger
 * /api/danhmuc:
 *   get:
 *     tags:
 *       - DanhMuc
 *     summary: Lấy danh sách danh mục
 *     description: Trả về toàn bộ danh mục sản phẩm trong hệ thống.
 *     responses:
 *       200:
 *         description: Thành công - trả về danh sách danh mục
 *       500:
 *         description: Lỗi server
 */
// Get all categories
router.get('/', danhMucController.getAllCategories);

// Get category by ID
router.get('/:id', danhMucController.getCategoryById);

// Create a new category
router.post('/', danhMucController.createCategory);

// Update a category
router.put('/:id', danhMucController.updateCategory);

// Delete a category
router.delete('/:id', danhMucController.deleteCategory);

module.exports = router;