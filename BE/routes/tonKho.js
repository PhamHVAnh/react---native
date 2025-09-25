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

module.exports = router;