/**
 * Payment Routes
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.post('/create-order', authMiddleware, paymentController.createPaymentOrder);
router.get('/:paymentId', authMiddleware, paymentController.getPaymentDetails);

// Webhook routes (no auth required)
router.post('/webhook', paymentController.handleWebhook);
router.post('/success', paymentController.handlePaymentSuccess);
router.post('/failure', paymentController.handlePaymentFailure);

// Admin routes
router.post('/:paymentId/refund', authMiddleware, paymentController.initiateRefund);

module.exports = router;