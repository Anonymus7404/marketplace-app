/**
 * Listing Controller
 * Handles listing management and operations
 */

const listingService = require('../services/listingService');
const providerService = require('../services/providerService');
const logger = require('../utils/logger');

class ListingController {
  /**
   * Create new listing
   */
  async createListing(req, res) {
    try {
      const userId = req.user.userId;
      
      // Get provider ID for this user
      const provider = await providerService.getProviderProfile(userId);
      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider profile not found. Please register as provider first.'
        });
      }

      const result = await listingService.createListing(provider.id, req.body);

      res.status(201).json(result);
    } catch (error) {
      logger.error('Create listing error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get listing by ID
   */
  async getListingById(req, res) {
    try {
      const { listingId } = req.params;
      const listing = await listingService.getListingById(listingId);

      res.json({
        success: true,
        listing
      });
    } catch (error) {
      logger.error('Get listing error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update listing
   */
  async updateListing(req, res) {
    try {
      const userId = req.user.userId;
      const { listingId } = req.params;
      
      // Get provider ID for this user
      const provider = await providerService.getProviderProfile(userId);
      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider profile not found'
        });
      }

      const listing = await listingService.updateListing(
        listingId, 
        provider.id, 
        req.body
      );

      res.json({
        success: true,
        listing,
        message: 'Listing updated successfully'
      });
    } catch (error) {
      logger.error('Update listing error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete listing
   */
  async deleteListing(req, res) {
    try {
      const userId = req.user.userId;
      const { listingId } = req.params;
      
      // Get provider ID for this user
      const provider = await providerService.getProviderProfile(userId);
      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider profile not found'
        });
      }

      const result = await listingService.deleteListing(listingId, provider.id);

      res.json(result);
    } catch (error) {
      logger.error('Delete listing error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get provider's listings
   */
  async getProviderListings(req, res) {
    try {
      const userId = req.user.userId;
      
      // Get provider ID for this user
      const provider = await providerService.getProviderProfile(userId);
      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider profile not found'
        });
      }

      const filters = {
        is_active: req.query.is_active
      };

      const listings = await listingService.getProviderListings(provider.id, filters);

      res.json({
        success: true,
        listings,
        count: listings.length
      });
    } catch (error) {
      logger.error('Get provider listings error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all active listings (for customers)
   */
  async getAllListings(req, res) {
    try {
      const filters = {
        category_id: req.query.category_id,
        limit: parseInt(req.query.limit) || 50
      };

      const listings = await listingService.getAllActiveListings(filters);

      res.json({
        success: true,
        listings,
        count: listings.length
      });
    } catch (error) {
      logger.error('Get all listings error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ListingController();