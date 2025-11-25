/**
 * Payment Service with Razorpay Integration
 * Handles payment processing, commission calculation, and payout management
 */

const Razorpay = require('razorpay');
const { Payment, Booking, Listing, Provider } = require('../../models');
const logger = require('../utils/logger');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    this.platformFeePercentage = 0.03; // 3%
    this.gatewayFeePercentage = 0.02; // 2%
  }

  /**
   * Create payment order for booking
   */
  async createPaymentOrder(bookingId, customerId) {
    try {
      // Verify booking exists and belongs to customer
      const booking = await Booking.findOne({
        where: { 
          id: bookingId,
          customer_id: customerId,
          status: 'pending_payment'
        },
        include: [{
          model: Listing,
          include: [Provider]
        }]
      });

      if (!booking) {
        throw new Error('Booking not found or already processed');
      }

      // Calculate fees and payout
      const paymentBreakdown = this.calculatePaymentBreakdown(booking.total_amount);
      
      // Create Razorpay order
      const order = await this.razorpay.orders.create({
        amount: Math.round(paymentBreakdown.total_amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `booking_${bookingId}_${Date.now()}`,
        notes: {
          booking_id: bookingId,
          customer_id: customerId,
          provider_id: booking.provider_id
        },
        payment_capture: 1 // Auto capture payment
      });

      // Create payment record
      const payment = await Payment.create({
        booking_id: bookingId,
        razorpay_order_id: order.id,
        amount: paymentBreakdown.total_amount,
        gateway_fee: paymentBreakdown.gateway_fee,
        platform_fee: paymentBreakdown.platform_fee,
        payout_amount: paymentBreakdown.payout_amount,
        status: 'created',
        currency: 'INR'
      });

      logger.info(`Payment order created: ${order.id} for booking: ${bookingId}`);

      return {
        success: true,
        order_id: order.id,
        amount: paymentBreakdown.total_amount,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        payment_id: payment.id,
        breakdown: paymentBreakdown
      };
    } catch (error) {
      logger.error('Create payment order error:', error);
      throw error;
    }
  }

  /**
   * Calculate payment breakdown with fees
   */
  calculatePaymentBreakdown(bookingAmount) {
    const platform_fee = Math.round(bookingAmount * this.platformFeePercentage * 100) / 100;
    const gateway_fee = Math.round(bookingAmount * this.gatewayFeePercentage * 100) / 100;
    const payout_amount = Math.round((bookingAmount - platform_fee - gateway_fee) * 100) / 100;
    const total_amount = bookingAmount;

    return {
      booking_amount: bookingAmount,
      platform_fee,
      platform_fee_percentage: `${(this.platformFeePercentage * 100)}%`,
      gateway_fee,
      gateway_fee_percentage: `${(this.gatewayFeePercentage * 100)}%`,
      payout_amount,
      total_amount
    };
  }

  /**
   * Verify payment webhook
   */
  async verifyPaymentWebhook(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (expectedSignature === signature) {
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Verify webhook signature error:', error);
      return false;
    }
  }

  /**
   * Handle payment success
   */
  async handlePaymentSuccess(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Verify payment signature
      const text = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        throw new Error('Payment signature verification failed');
      }

      // Get payment details from Razorpay
      const payment = await this.razorpay.payments.fetch(razorpay_payment_id);
      
      // Find payment record
      const paymentRecord = await Payment.findOne({
        where: { razorpay_order_id },
        include: [{
          model: Booking,
          include: [Listing]
        }]
      });

      if (!paymentRecord) {
        throw new Error('Payment record not found');
      }

      if (paymentRecord.status === 'captured') {
        logger.warn(`Payment already captured: ${razorpay_payment_id}`);
        return { success: true, message: 'Payment already processed' };
      }

      // Update payment record
      await paymentRecord.update({
        razorpay_payment_id: payment.id,
        status: 'captured',
        captured_at: new Date(),
        payment_method: payment.method,
        bank: payment.bank,
        wallet: payment.wallet
      });

      // Update booking status
      await paymentRecord.Booking.update({
        status: 'confirmed',
        payment_status: 'paid',
        confirmed_at: new Date()
      });

      logger.info(`Payment successful: ${razorpay_payment_id} for booking: ${paymentRecord.booking_id}`);

      // TODO: Send notifications to customer and provider

      return {
        success: true,
        payment_id: paymentRecord.id,
        booking_id: paymentRecord.booking_id,
        message: 'Payment successful and booking confirmed'
      };
    } catch (error) {
      logger.error('Handle payment success error:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailure(paymentData) {
    try {
      const { razorpay_order_id, error } = paymentData;

      // Find payment record
      const paymentRecord = await Payment.findOne({
        where: { razorpay_order_id }
      });

      if (paymentRecord) {
        await paymentRecord.update({
          status: 'failed',
          error_code: error.code,
          error_description: error.description,
          failed_at: new Date()
        });

        // Update booking status
        await Booking.update({
          status: 'payment_failed',
          payment_status: 'failed'
        }, {
          where: { id: paymentRecord.booking_id }
        });

        logger.info(`Payment failed: ${razorpay_order_id}`);
      }

      return { success: true, message: 'Payment failure handled' };
    } catch (error) {
      logger.error('Handle payment failure error:', error);
      throw error;
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(paymentId, amount, notes = '') {
    try {
      const payment = await Payment.findByPk(paymentId, {
        include: [Booking]
      });

      if (!payment || payment.status !== 'captured') {
        throw new Error('Payment not found or not captured');
      }

      const refundAmount = amount || payment.amount;
      
      // Create Razorpay refund
      const refund = await this.razorpay.payments.refund(payment.razorpay_payment_id, {
        amount: Math.round(refundAmount * 100),
        notes: {
          reason: notes,
          booking_id: payment.booking_id
        }
      });

      // Update payment record
      await payment.update({
        refund_status: 'processed',
        refund_amount: refundAmount,
        refund_id: refund.id,
        refunded_at: new Date()
      });

      // Update booking if full refund
      if (refundAmount === payment.amount) {
        await payment.Booking.update({
          status: 'refunded',
          payment_status: 'refunded'
        });
      }

      logger.info(`Refund initiated: ${refund.id} for payment: ${paymentId}`);

      return {
        success: true,
        refund_id: refund.id,
        amount: refundAmount,
        status: refund.status
      };
    } catch (error) {
      logger.error('Initiate refund error:', error);
      throw error;
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId) {
    try {
      const payment = await Payment.findByPk(paymentId, {
        include: [{
          model: Booking,
          include: [Listing]
        }]
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      return payment;
    } catch (error) {
      logger.error('Get payment details error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();