/**
 * Provider Controller
 * Handles provider registration and profile management
 */

const providerService = require('../services/providerService');
const logger = require('../utils/logger');

class ProviderController {
  /**
   * Register as a provider
   */
  async registerProvider(req, res) {
    try {
      const { business_name, categories, documents } = req.body;
      const userId = req.user.userId;

      // Validate required fields
      if (!business_name) {
        return res.status(400).json({
          success: false,
          error: 'Business name is required'
        });
      }

      const result = await providerService.registerProvider(userId, {
        business_name,
        categories,
        documents
      });

      res.status(201).json(result);
    } catch (error) {
      logger.error('Provider registration error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get provider profile
   */
  async getProviderProfile(req, res) {
    try {
      const userId = req.user.userId;
      const provider = await providerService.getProviderProfile(userId);

      res.json({
        success: true,
        provider
      });
    } catch (error) {
      logger.error('Get provider profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update provider profile
   */
  async updateProviderProfile(req, res) {
    try {
      const userId = req.user.userId;
      const provider = await providerService.updateProviderProfile(userId, req.body);

      res.json({
        success: true,
        provider,
        message: 'Provider profile updated successfully'
      });
    } catch (error) {
      logger.error('Update provider profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all providers (Admin only)
   */
  async getAllProviders(req, res) {
    try {
      const filters = {
        approval_status: req.query.status
      };

      const providers = await providerService.getAllProviders(filters);

      res.json({
        success: true,
        providers,
        count: providers.length
      });
    } catch (error) {
      logger.error('Get all providers error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update provider status (Admin only)
   */
  async updateProviderStatus(req, res) {
    try {
      const { providerId } = req.params;
      const { status, admin_notes } = req.body;

      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Use: approved, rejected, or pending'
        });
      }

      const provider = await providerService.updateProviderStatus(
        providerId, 
        status, 
        admin_notes
      );

      res.json({
        success: true,
        provider,
        message: `Provider ${status} successfully`
      });
    } catch (error) {
      logger.error('Update provider status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ProviderController();