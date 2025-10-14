const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Wishlist:
 *       type: object
 *       properties:
 *         YeuThichID:
 *           type: string
 *           description: ID của wishlist item
 *         KhachHangID:
 *           type: string
 *           description: ID của khách hàng
 *         SanPhamID:
 *           type: string
 *           description: ID của sản phẩm
 *         NgayTao:
 *           type: string
 *           format: date-time
 *           description: Ngày tạo
 */

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Thêm sản phẩm vào wishlist
 *     tags: [Wishlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - KhachHangID
 *               - SanPhamID
 *             properties:
 *               KhachHangID:
 *                 type: string
 *                 description: ID của khách hàng
 *               SanPhamID:
 *                 type: string
 *                 description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Thêm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post('/', wishlistController.addToWishlist);

/**
 * @swagger
 * /api/wishlist/{khachHangID}:
 *   get:
 *     summary: Lấy danh sách wishlist của khách hàng
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: khachHangID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của khách hàng
 *     responses:
 *       200:
 *         description: Danh sách wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Wishlist'
 *       500:
 *         description: Lỗi server
 */
router.get('/:khachHangID', wishlistController.getWishlistItems);

/**
 * @swagger
 * /api/wishlist/status:
 *   get:
 *     summary: Kiểm tra trạng thái wishlist của sản phẩm
 *     tags: [Wishlist]
 *     parameters:
 *       - in: query
 *         name: KhachHangID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của khách hàng
 *       - in: query
 *         name: SanPhamID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Trạng thái wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isInWishlist:
 *                   type: boolean
 *                 yeuThichID:
 *                   type: string
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.get('/status/:khachHangID/:sanPhamID', wishlistController.checkWishlistStatus);

/**
 * @swagger
 * /api/wishlist/{yeuThichID}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi wishlist
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: yeuThichID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của wishlist item
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy item
 *       500:
 *         description: Lỗi server
 */
router.delete('/:yeuThichID', wishlistController.removeFromWishlist);

/**
 * @swagger
 * /api/wishlist/clear/{khachHangID}:
 *   delete:
 *     summary: Xóa tất cả wishlist của khách hàng
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: khachHangID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của khách hàng
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       500:
 *         description: Lỗi server
 */
router.delete('/clear/:khachHangID', wishlistController.clearWishlist);

module.exports = router;
