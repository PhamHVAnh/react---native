const express = require('express');
const router = express.Router();
const donHangController = require('../controllers/donHangController');

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
 *           type: integer
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
 *           type: integer
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

module.exports = router;