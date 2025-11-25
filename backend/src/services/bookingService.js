/**
 * Booking Service
 * Handles booking creation, availability checks, and booking management
 */

const { Booking, Listing, Provider, User, Category } = require('../../models');
const logger = require('../utils/logger');
const redis = require('redis');
const { Op } = require('sequelize');

const redisClient = redis.createClient({
  socket: {
    host: '127.0.0.1',
    port: 6379,
  }
});

(async () => {
  try {
    await client.connect();
  } catch (err) {
  } finally {
    // redis.disconnect();
  }
})();

(async () => {
  try {
    await redisClient.connect();
    logger.info('✅ Redis connected for booking service');
  } catch (error) {
    logger.error('❌ Redis connection failed for booking:', error);
  }
})();

class BookingService {
  constructor() {
    this.BOOKING_LOCK_TIMEOUT = 30; // seconds
  }

  /**
  * Create new booking with availability check
  */
  async createBooking(customerId, bookingData) {
    let lockAcquired = false;
    const lockKey = `booking_lock:${bookingData.listing_id}:${bookingData.start_date}`;

    try {
      // Acquire distributed lock to prevent double booking
      lockAcquired = await redisClient.set(lockKey, 'locked', {
        NX: true,
        EX: this.BOOKING_LOCK_TIMEOUT
      });

      if (!lockAcquired) {
        throw new Error('Booking slot is currently being processed. Please try again.');
      }

      // Validate listing exists and is active
      const listing = await Listing.findOne({
        where: {
          id: bookingData.listing_id,
          is_active: true
        },
        include: [{
          model: Provider,
          as: 'Provider',
          include: [{
            model: User,
            as: 'User'
          }]
        }]
      });

      if (!listing) {
        throw new Error('Listing not found or inactive');
      }

      // Check if provider is approved
      if (!listing.Provider.is_approved) {
        throw new Error('Provider is not approved for bookings');
      }

      // Validate booking dates
      const startDate = new Date(bookingData.start_date);
      const endDate = new Date(bookingData.end_date);

      if (startDate >= endDate) {
        throw new Error('End date must be after start date');
      }

      if (startDate < new Date()) {
        throw new Error('Cannot book for past dates');
      }

      // Check for existing bookings (basic availability check)
      const existingBooking = await Booking.findOne({
        where: {
          listing_id: bookingData.listing_id,
          status: ['pending_payment', 'confirmed', 'in_progress'],
          [Op.or]: [
            {
              start_date: { [Op.between]: [startDate, endDate] }
            },
            {
              end_date: { [Op.between]: [startDate, endDate] }
            }
          ]
        }
      });

      if (existingBooking) {
        throw new Error('Selected dates are not available');
      }

      // Calculate total amount
      const totalAmount = this.calculateBookingAmount(listing, startDate, endDate, bookingData);
      const depositAmount = bookingData.deposit_required ? listing.deposit_amount : 0;

      // Create booking
      const booking = await Booking.create({
        listing_id: bookingData.listing_id,
        customer_id: customerId,
        provider_id: listing.provider_id,
        type: bookingData.type || 'service',
        start_date: startDate,
        end_date: endDate,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        status: 'pending_payment',
        payment_status: 'pending',
        customer_notes: bookingData.customer_notes,
        special_requirements: bookingData.special_requirements
      });

      logger.info(`Booking created: ${booking.id} for listing: ${bookingData.listing_id}`);

      return {
        success: true,
        booking: await this.enrichBookingData(booking),
        message: 'Booking created successfully. Please proceed to payment.'
      };

    } catch (error) {
      logger.error('Create booking error:', error);
      throw error;
    } finally {
      // Release lock
      if (lockAcquired) {
        await redisClient.del(lockKey);
      }
    }
  }

  /**
   * Calculate booking amount based on pricing model
   */
  calculateBookingAmount(listing, startDate, endDate, bookingData) {
    const priceModel = listing.price_model || {};
    const durationMs = endDate - startDate;
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationDays = durationHours / 24;

    let amount = 0;

    // Calculate based on pricing model
    if (priceModel.hourly && durationHours < 24) {
      amount = priceModel.hourly * Math.ceil(durationHours);
    } else if (priceModel.daily && durationDays >= 1) {
      amount = priceModel.daily * Math.ceil(durationDays);
    } else if (priceModel.fixed) {
      amount = priceModel.fixed;
    } else if (priceModel.packages && bookingData.package) {
      const selectedPackage = priceModel.packages.find(pkg => pkg.name === bookingData.package);
      amount = selectedPackage ? selectedPackage.price : 0;
    }

    // Add emergency charges if applicable
    if (bookingData.is_emergency && priceModel.emergency_surcharge) {
      amount += priceModel.emergency_surcharge;
    }

    return Math.max(amount, 0);
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId, userId = null) {
    try {
      const whereClause = { id: bookingId };

      // If user ID provided, ensure they have access to this booking
      if (userId) {
        whereClause[Op.or] = [
          { customer_id: userId },
          { provider_id: userId }
        ];
      }

      const booking = await Booking.findOne({
        where: whereClause,
        include: [
          {
            model: Listing,
            include: [
              {
                model: Provider,
                include: [{ model: User, attributes: ['id', 'name', 'phone', 'profile_picture'] }]
              },
              {
                model: Category,
                attributes: ['id', 'name', 'type']
              }
            ]
          },
          {
            model: User,
            as: 'Customer',
            attributes: ['id', 'name', 'phone', 'email', 'profile_picture']
          }
        ]
      });

      if (!booking) {
        throw new Error('Booking not found or access denied');
      }

      return await this.enrichBookingData(booking);
    } catch (error) {
      logger.error('Get booking error:', error);
      throw error;
    }
  }

  /**
   * Get customer's bookings
   */
  async getCustomerBookings(customerId, filters = {}) {
    try {
      const whereClause = { customer_id: customerId };

      if (filters.status) {
        whereClause.status = filters.status;
      }

      const bookings = await Booking.findAll({
        where: whereClause,
        include: [
          {
            model: Listing,
            include: [
              {
                model: Provider,
                include: [{ model: User, attributes: ['id', 'name', 'profile_picture'] }]
              },
              {
                model: Category,
                attributes: ['id', 'name', 'type', 'icon']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50
      });

      return await Promise.all(
        bookings.map(booking => this.enrichBookingData(booking))
      );
    } catch (error) {
      logger.error('Get customer bookings error:', error);
      throw error;
    }
  }

  /**
   * Get provider's bookings
   */
  async getProviderBookings(providerId, filters = {}) {
    try {
      const whereClause = { provider_id: providerId };

      if (filters.status) {
        whereClause.status = filters.status;
      }

      const bookings = await Booking.findAll({
        where: whereClause,
        include: [
          {
            model: Listing,
            attributes: ['id', 'title', 'photos']
          },
          {
            model: User,
            as: 'Customer',
            attributes: ['id', 'name', 'phone', 'profile_picture']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50
      });

      return await Promise.all(
        bookings.map(booking => this.enrichBookingData(booking))
      );
    } catch (error) {
      logger.error('Get provider bookings error:', error);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, userId, newStatus, notes = '') {
    try {
      const booking = await Booking.findOne({
        where: {
          id: bookingId,
          [Op.or]: [
            { customer_id: userId },
            { provider_id: userId }
          ]
        }
      });

      if (!booking) {
        throw new Error('Booking not found or access denied');
      }

      // Validate status transition
      const validTransitions = {
        pending_payment: ['cancelled'],
        confirmed: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: ['reviewed'],
        cancelled: [] // No further transitions from cancelled
      };

      if (!validTransitions[booking.status]?.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${booking.status} to ${newStatus}`);
      }

      await booking.update({
        status: newStatus,
        status_notes: notes,
        status_updated_at: new Date()
      });

      // Log status change
      logger.info(`Booking ${bookingId} status changed from ${booking.status} to ${newStatus}`);

      return await this.enrichBookingData(booking);
    } catch (error) {
      logger.error('Update booking status error:', error);
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId, userId, cancellationReason = '') {
    try {
      const booking = await this.getBookingById(bookingId, userId);

      if (!['pending_payment', 'confirmed'].includes(booking.status)) {
        throw new Error('Cannot cancel booking in current status');
      }

      // Calculate refund amount based on cancellation policy
      const refundAmount = this.calculateRefundAmount(booking);

      await booking.update({
        status: 'cancelled',
        cancellation_reason: cancellationReason,
        refund_amount: refundAmount,
        cancelled_at: new Date()
      });

      return {
        success: true,
        booking: await this.enrichBookingData(booking),
        refund_amount: refundAmount,
        message: 'Booking cancelled successfully'
      };
    } catch (error) {
      logger.error('Cancel booking error:', error);
      throw error;
    }
  }

  /**
   * Calculate refund amount based on cancellation policy
   */
  calculateRefundAmount(booking) {
    const now = new Date();
    const startDate = new Date(booking.start_date);
    const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);

    // Basic cancellation policy - can be enhanced
    if (hoursUntilStart > 48) {
      return booking.total_amount; // Full refund
    } else if (hoursUntilStart > 24) {
      return booking.total_amount * 0.5; // 50% refund
    } else {
      return 0; // No refund
    }
  }

  /**
   * Enrich booking data with additional information
   */
  async enrichBookingData(booking) {
    const bookingObj = booking.toJSON ? booking.toJSON() : booking;

    // Add calculated fields
    bookingObj.duration_hours = this.calculateDurationHours(
      bookingObj.start_date,
      bookingObj.end_date
    );

    bookingObj.is_upcoming = new Date(bookingObj.start_date) > new Date();
    bookingObj.is_ongoing = new Date(bookingObj.start_date) <= new Date() &&
      new Date(bookingObj.end_date) >= new Date();

    // Remove sensitive data
    const { deletedAt, ...enriched } = bookingObj;
    return enriched;
  }

  /**
   * Calculate duration in hours
   */
  calculateDurationHours(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return (end - start) / (1000 * 60 * 60);
  }
}

module.exports = new BookingService();