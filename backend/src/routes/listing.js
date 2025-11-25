/**
 * Listing Routes
 */

const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', listingController.getAllListings);
router.get('/:listingId', listingController.getListingById);

// Provider routes (require authentication)
router.post('/', authMiddleware, listingController.createListing);
router.get('/provider/my-listings', authMiddleware, listingController.getProviderListings);
router.put('/:listingId', authMiddleware, listingController.updateListing);
router.delete('/:listingId', authMiddleware, listingController.deleteListing);

module.exports = router;