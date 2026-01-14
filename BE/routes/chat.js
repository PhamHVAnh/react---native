const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: API tư vấn khách hàng tự động
 */

/**
 * @swagger
 * /chat/send:
 *   post:
 *     summary: Gửi tin nhắn đến chatbot
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Tin nhắn của người dùng
 *     responses:
 *       200:
 *         description: Phản hồi từ chatbot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SanPham'
 */
router.post('/send', chatController.sendMessage);

module.exports = router;
