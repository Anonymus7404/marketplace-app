/**
 * Search Routes
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Public routes
router.get('/', searchController.searchListings);
router.get('/autocomplete', searchController.autocomplete);
router.get('/featured', searchController.getFeaturedListings);
router.get('/category/:categoryId', searchController.getListingsByCategory);

module.exports = router;