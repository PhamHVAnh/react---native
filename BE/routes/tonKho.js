const express = require('express');
const router = express.Router();
const tonKhoController = require('../controllers/tonKhoController');

/**
 * @swagger
 * tags:
 *   name: TonKho
 *   summary: Inventory management
 */

/**
 * @swagger
 * /api/tonkho:
 *   get:
 *     summary: Retrieve a list of inventory records
 *     tags: [TonKho]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TonKho'
 */
router.get('/', tonKhoController.getAllTonKhos);

/**
 * @swagger
 * /api/tonkho/{id}:
 *   get:
 *     summary: Get an inventory record by product ID
 *     tags: [TonKho]
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
 *               $ref: '#/components/schemas/TonKho'
 *       404:
 *         summary: Inventory record not found
 */
router.get('/:id', tonKhoController.getTonKhoById);

/**
 * @swagger
 * /api/tonkho/batch-check:
 *   post:
 *     summary: Check inventory for multiple products at once
 *     tags: [TonKho]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["uuid1", "uuid2", "uuid3"]
 *     responses:
 *       200:
 *         description: Batch inventory check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   SanPhamID:
 *                     type: string
 *                   SoLuongTon:
 *                     type: integer
 */
router.post('/batch-check', tonKhoController.checkBatchInventory);

/**
 * @swagger
 * /api/tonkho/{id}:
 *   put:
 *     summary: Update inventory quantity for a product
 *     tags: [TonKho]
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
 *             type: object
 *             properties:
 *               SoLuongTon:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 */
router.put('/:id', tonKhoController.updateTonKho);

/**
 * @swagger
 * /api/tonkho/populate:
 *   post:
 *     summary: Populate inventory data for existing products
 *     tags: [TonKho]
 *     responses:
 *       200:
 *         description: Inventory data populated successfully
 */
router.post('/populate', tonKhoController.populateInventory);

module.exports = router;