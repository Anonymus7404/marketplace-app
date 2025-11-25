/**
 * Booking Controller
 * Handles booking operations and management
 */

const bookingService = require('../services/bookingService');
const logger = require('../utils/logger');

class BookingController {
  /**
   * Create new booking
   */
  async createBooking(req, res) {
    try {
      const customerId = req.user.userId;
      const result = await bookingService.createBooking(customerId, req.body);

      res.status(201).json(result);
    } catch (error) {
      logger.error('Create booking error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.userId;
      
      const booking = await bookingService.getBookingById(bookingId, userId);

      res.json({
        success: true,
        booking
      });
    } catch (error) {
      logger.error('Get booking error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get customer's bookings
   */
  async getCustomerBookings(req, res) {
    try {
      const customerId = req.user.userId;
      const filters = {
        status: req.query.status,
        limit: parseInt(req.query.limit) || 50
      };

      const bookings = await bookingService.getCustomerBookings(customerId, filters);

      res.json({
        success: true,
        bookings,
        count: bookings.length
      });
    } catch (error) {
      logger.error('Get customer bookings error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get provider's bookings
   */
  async getProviderBookings(req, res) {
    try {
      const providerId = req.user.userId; // Assuming user is provider
      const filters = {
        status: req.query.status,
        limit: parseInt(req.query.limit) || 50
      };

      const bookings = await bookingService.getProviderBookings(providerId, filters);

      res.json({
        success: true,
        bookings,
        count: bookings.length
      });
    } catch (error) {
      logger.error('Get provider bookings error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.userId;
      const { status, notes } = req.body;

      const booking = await bookingService.updateBookingStatus(
        bookingId, 
        userId, 
        status, 
        notes
      );

      res.json({
        success: true,
        booking,
        message: `Booking status updated to ${status}`
      });
    } catch (error) {
      logger.error('Update booking status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.userId;
      const { cancellation_reason } = req.body;

      const result = await bookingService.cancelBooking(
        bookingId, 
        userId, 
        cancellation_reason
      );

      res.json(result);
    } catch (error) {
      logger.error('Cancel booking error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get booking availability
   */
  async checkAvailability(req, res) {
    try {
      const { listingId, start_date, end_date } = req.query;

      // This would check calendar availability
      // For now, return basic available response
      res.json({
        success: true,
        available: true,
        message: 'Dates are available for booking'
      });
    } catch (error) {
      logger.error('Check availability error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new BookingController();