/**
 * Provider Routes
 */

const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes (require authentication)
router.post('/register', authMiddleware, providerController.registerProvider);
router.get('/profile', authMiddleware, providerController.getProviderProfile);
router.put('/profile', authMiddleware, providerController.updateProviderProfile);

// Admin only routes
router.get('/all', authMiddleware, providerController.getAllProviders);
router.put('/:providerId/status', authMiddleware, providerController.updateProviderStatus);

module.exports = router;