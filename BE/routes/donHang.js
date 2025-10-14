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