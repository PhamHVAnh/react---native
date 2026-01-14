const express = require('express');
const router = express.Router();
const thongKeController = require('../controllers/thongKeController');

/**
 * @swagger
 * tags:
 *   name: ThongKe
 *   summary: Statistics and analytics
 */

/**
 * @swagger
 * /api/thongke/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [ThongKe]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalStats:
 *                   type: object
 *                 revenueStats:
 *                   type: object
 *                 monthlyStats:
 *                   type: array
 *                 topProducts:
 *                   type: array
 *                 orderStatusStats:
 *                   type: array
 *                 newCustomers:
 *                   type: number
 */
router.get('/dashboard', thongKeController.getDashboardStats);

/**
 * @swagger
 * /api/thongke/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [ThongKe]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for revenue analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for revenue analysis
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month, year]
 *         description: Grouping period for revenue data
 *     responses:
 *       200:
 *         description: Revenue statistics
 */
router.get('/revenue', thongKeController.getRevenueStats);

/**
 * @swagger
 * /api/thongke/products:
 *   get:
 *     summary: Get product statistics
 *     tags: [ThongKe]
 *     responses:
 *       200:
 *         description: Product statistics
 */
router.get('/products', thongKeController.getProductStats);

/**
 * @swagger
 * /api/thongke/customers:
 *   get:
 *     summary: Get customer statistics
 *     tags: [ThongKe]
 *     responses:
 *       200:
 *         description: Customer statistics
 */
router.get('/customers', thongKeController.getCustomerStats);

/**
 * @swagger
 * /api/thongke/warranties:
 *   get:
 *     summary: Get warranty statistics
 *     tags: [ThongKe]
 *     responses:
 *       200:
 *         description: Warranty statistics
 */
router.get('/warranties', thongKeController.getWarrantyStats);

module.exports = router;
