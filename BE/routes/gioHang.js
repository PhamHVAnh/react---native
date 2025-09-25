const express = require('express');
const router = express.Router();
const gioHangController = require('../controllers/gioHangController');

/**
 * @swagger
 * tags:
 *   name: GioHang
 *   summary: Shopping Cart management
 */

/**
 * @swagger
 * /api/giohang:
 *   post:
 *     summary: Add an item to the shopping cart or update its quantity
 *     tags: [GioHang]
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
 *                 format: uuid
 *                 description: ID of the customer
 *               SanPhamID:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product
 *               SoLuong:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of the product to add/update (defaults to 1)
 *     responses:
 *       200:
 *         description: Cart item quantity updated.
 *       201:
 *         description: Item added to cart.
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', gioHangController.addItemToCart);

/**
 * @swagger
 * /api/giohang/{khachHangID}:
 *   get:
 *     summary: Get all items in a customer's shopping cart
 *     tags: [GioHang]
 *     parameters:
 *       - in: path
 *         name: khachHangID
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the customer
 *     responses:
 *       200:
 *         description: A list of cart items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   GioHangID: { type: 'string', format: 'uuid' }
 *                   KhachHangID: { type: 'string', format: 'uuid' }
 *                   SanPhamID: { type: 'string', format: 'uuid' }
 *                   SoLuong: { type: 'integer' }
 *                   NgayTao: { type: 'string', format: 'date-time' }
 *                   TenSanPham: { type: 'string' }
 *                   HinhAnh: { type: 'string' }
 *                   GiaGoc: { type: 'number' }
 *                   GiamGia: { type: 'number' }
 *       400:
 *         description: KhachHangID is required
 *       500:
 *         description: Server error
 */
router.get('/:khachHangID', gioHangController.getCartItems);

/**
 * @swagger
 * /api/giohang/{gioHangID}:
 *   put:
 *     summary: Update the quantity of an item in the shopping cart
 *     tags: [GioHang]
 *     parameters:
 *       - in: path
 *         name: gioHangID
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the cart item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - SoLuong
 *             properties:
 *               SoLuong:
 *                 type: integer
 *                 minimum: 1
 *                 description: New quantity for the cart item
 *     responses:
 *       200:
 *         description: Cart item quantity updated.
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.put('/:gioHangID', gioHangController.updateCartItemQuantity);

/**
 * @swagger
 * /api/giohang/{gioHangID}:
 *   delete:
 *     summary: Remove an item from the shopping cart
 *     tags: [GioHang]
 *     parameters:
 *       - in: path
 *         name: gioHangID
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the cart item to remove
 *     responses:
 *       200:
 *         description: Cart item removed.
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.delete('/:gioHangID', gioHangController.removeCartItem);

module.exports = router;