/**
 * Payment Controller
 * Handles payment operations and webhooks
 */

const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

class PaymentController {
  /**
   * Create payment order
   */
  async createPaymentOrder(req, res) {
    try {
      const { bookingId } = req.body;
      const customerId = req.user.userId;

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: 'Booking ID is required'
        });
      }

      const result = await paymentService.createPaymentOrder(bookingId, customerId);

      res.json(result);
    } catch (error) {
      logger.error('Create payment order error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle payment success
   */
  async handlePaymentSuccess(req, res) {
    try {
      const result = await paymentService.handlePaymentSuccess(req.body);

      res.json(result);
    } catch (error) {
      logger.error('Handle payment success error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(req, res) {
    try {
      const result = await paymentService.handlePaymentFailure(req.body);

      res.json(result);
    } catch (error) {
      logger.error('Handle payment failure error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Razorpay webhook handler
   */
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const payload = req.body;

      // Verify webhook signature
      const isValid = await paymentService.verifyPaymentWebhook(payload, signature);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }

      const event = payload.event;

      switch (event) {
        case 'payment.captured':
          await paymentService.handlePaymentSuccess(payload.payload.payment.entity);
          break;
        
        case 'payment.failed':
          await paymentService.handlePaymentFailure(payload.payload.payment.entity);
          break;
        
        case 'refund.processed':
          // Handle refund processed
          break;
        
        default:
          logger.info(`Unhandled webhook event: ${event}`);
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error) {
      logger.error('Webhook handler error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Initiate refund (Admin/Provider)
   */
  async initiateRefund(req, res) {
    try {
      const { paymentId } = req.params;
      const { amount, notes } = req.body;

      const result = await paymentService.initiateRefund(paymentId, amount, notes);

      res.json(result);
    } catch (error) {
      logger.error('Initiate refund error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.getPaymentDetails(paymentId);

      res.json({
        success: true,
        payment
      });
    } catch (error) {
      logger.error('Get payment details error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new PaymentController();