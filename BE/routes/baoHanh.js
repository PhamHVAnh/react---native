const express = require('express');
const router = express.Router();
const baoHanhController = require('../controllers/baoHanhController');

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
 *           type: integer
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

module.exports = router;