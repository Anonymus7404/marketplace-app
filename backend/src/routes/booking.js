/**
 * Booking Routes
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.post('/', authMiddleware, bookingController.createBooking);
router.get('/customer/my-bookings', authMiddleware, bookingController.getCustomerBookings);
router.get('/provider/my-bookings', authMiddleware, bookingController.getProviderBookings);
router.get('/:bookingId', authMiddleware, bookingController.getBookingById);
router.put('/:bookingId/status', authMiddleware, bookingController.updateBookingStatus);
router.post('/:bookingId/cancel', authMiddleware, bookingController.cancelBooking);
router.get('/availability/check', authMiddleware, bookingController.checkAvailability);

module.exports = router;