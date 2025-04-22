const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Tạo thanh toán cho đơn hàng bằng momo
 *     tags: [Thanh toán]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: integer
 *                 description: ID đơn hàng
 *               paymentMethod:
 *                 type: string
 *                 enum: [momo]
 *                 description: Phương thức thanh toán
 *             required:
 *               - orderId
 *               - paymentMethod
 *     responses:
 *       200:
 *         description: Thanh toán đã được tạo với URL phê duyệt momo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thanh toán đã được tạo
 *                 paymentId:
 *                   type: string
 *                 approvalUrl:
 *                   type: string
 *       401:
 *         description: Không được phép truy cập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Không được phép truy cập
 */
router.post('/', auth, paymentController.createPayment);

/**
 * @swagger
 * /api/payments/success:
 *   get:
 *     summary: Xử lý thanh toán momo thành công
 *     tags: [Thanh toán]
 *     parameters:
 *       - name: paymentId
 *         in: query
 *         required: true
 *         description: ID thanh toán momo
 *         schema:
 *           type: string
 *       - name: PayerID
 *         in: query
 *         required: true
 *         description: ID người thanh toán momo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thanh toán hoàn tất
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thanh toán hoàn tất
 *                 payment:
 *                   type: object
 */
router.get('/success', paymentController.paymentSuccess);

/**
 * @swagger
 * /api/payments/cancel:
 *   get:
 *     summary: Xử lý hủy thanh toán momo
 *     tags: [Thanh toán]
 *     responses:
 *       200:
 *         description: Thanh toán đã bị hủy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thanh toán đã bị hủy
 */
router.get('/cancel', paymentController.paymentCancel);

/**
 * @swagger
 * /api/payments/{orderId}:
 *   get:
 *     summary: Lấy trạng thái thanh toán của đơn hàng
 *     tags: [Thanh toán]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         description: ID đơn hàng
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết thanh toán
 *       401:
 *         description: Không được phép truy cập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Không được phép truy cập
 */
router.get('/:orderId', auth, paymentController.getPayment);

module.exports = router;