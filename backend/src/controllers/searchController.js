/**
 * Search Controller
 * Handles search and discovery operations
 */

const searchService = require('../services/searchService');
const listingService = require('../services/listingService');
const logger = require('../utils/logger');

class SearchController {
  /**
   * Search listings
   */
  async searchListings(req, res) {
    try {
      const {
        q: query,
        category,
        lat,
        lng,
        max_distance,
        min_price,
        max_price,
        min_rating,
        page,
        limit
      } = req.query;

      const searchParams = {
        query,
        category,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined,
        max_distance: max_distance ? parseInt(max_distance) : undefined,
        min_price: min_price ? parseFloat(min_price) : undefined,
        max_price: max_price ? parseFloat(max_price) : undefined,
        min_rating: min_rating ? parseFloat(min_rating) : undefined,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      };

      const result = await searchService.searchListings(searchParams);

      res.json(result);
    } catch (error) {
      logger.error('Search listings error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Autocomplete search
   */
  async autocomplete(req, res) {
    try {
      const { q: query } = req.query;
      
      if (!query || query.length < 2) {
        return res.json({
          success: true,
          suggestions: []
        });
      }

      const suggestions = await searchService.autocomplete(query);

      res.json({
        success: true,
        suggestions
      });
    } catch (error) {
      logger.error('Autocomplete error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get featured listings
   */
  async getFeaturedListings(req, res) {
    try {
      const listings = await listingService.getAllActiveListings({
        limit: 10
      });

      // Filter featured listings (in real app, would have featured flag)
      const featured = listings
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 8);

      res.json({
        success: true,
        listings: featured,
        count: featured.length
      });
    } catch (error) {
      logger.error('Get featured listings error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get listings by category
   */
  async getListingsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const { page, limit } = req.query;

      const listings = await listingService.getAllActiveListings({
        category_id: categoryId,
        limit: limit ? parseInt(limit) : 20
      });

      res.json({
        success: true,
        listings,
        count: listings.length
      });
    } catch (error) {
      logger.error('Get listings by category error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SearchController();