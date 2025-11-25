/**
 * Provider Service
 * Handles provider onboarding, profile management, and business operations
 */

const { Provider, User, Category } = require('../../models');
const logger = require('../utils/logger');

class ProviderService {
  /**
   * Register as a provider
   */
  async registerProvider(userId, providerData) {
    try {
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already a provider
      const existingProvider = await Provider.findOne({ 
        where: { user_id: userId } 
      });

      if (existingProvider) {
        throw new Error('User is already registered as a provider');
      }

      // Create provider profile
      const provider = await Provider.create({
        user_id: userId,
        business_name: providerData.business_name,
        categories: providerData.categories || [],
        documents: providerData.documents || {},
        approval_status: 'pending',
        is_approved: false
      });

      // Update user type to provider
      await user.update({ user_type: 'provider' });

      logger.info(`Provider registered: ${provider.id} for user: ${userId}`);

      return {
        success: true,
        provider: this.sanitizeProvider(provider),
        message: 'Provider registration submitted for approval'
      };
    } catch (error) {
      logger.error('Provider registration error:', error);
      throw error;
    }
  }

  /**
   * Get provider profile
   */
  async getProviderProfile(userId) {
    try {
      const provider = await Provider.findOne({
        where: { user_id: userId },
        include: [{
          model: User,
          attributes: ['id', 'name', 'phone', 'email', 'profile_picture']
        }]
      });

      if (!provider) {
        throw new Error('Provider profile not found');
      }

      return this.sanitizeProvider(provider);
    } catch (error) {
      logger.error('Get provider profile error:', error);
      throw error;
    }
  }

  /**
   * Update provider profile
   */
  async updateProviderProfile(userId, updateData) {
    try {
      const provider = await Provider.findOne({ 
        where: { user_id: userId } 
      });

      if (!provider) {
        throw new Error('Provider profile not found');
      }

      // Fields that can be updated
      const allowedUpdates = {
        business_name: updateData.business_name,
        categories: updateData.categories,
        documents: updateData.documents
      };

      // Remove undefined fields
      Object.keys(allowedUpdates).forEach(key => {
        if (allowedUpdates[key] === undefined) {
          delete allowedUpdates[key];
        }
      });

      await provider.update(allowedUpdates);

      return this.sanitizeProvider(provider);
    } catch (error) {
      logger.error('Update provider profile error:', error);
      throw error;
    }
  }

  /**
   * Get all providers (for admin)
   */
  async getAllProviders(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.approval_status) {
        whereClause.approval_status = filters.approval_status;
      }

      const providers = await Provider.findAll({
        where: whereClause,
        include: [{
          model: User,
          attributes: ['id', 'name', 'phone', 'email', 'profile_picture']
        }],
        order: [['createdAt', 'DESC']]
      });

      return providers.map(provider => this.sanitizeProvider(provider));
    } catch (error) {
      logger.error('Get all providers error:', error);
      throw error;
    }
  }

  /**
   * Approve/Reject provider (admin only)
   */
  async updateProviderStatus(providerId, status, adminNotes = '') {
    try {
      const provider = await Provider.findByPk(providerId);
      
      if (!provider) {
        throw new Error('Provider not found');
      }

      await provider.update({
        approval_status: status,
        is_approved: status === 'approved',
        admin_notes: adminNotes
      });

      return this.sanitizeProvider(provider);
    } catch (error) {
      logger.error('Update provider status error:', error);
      throw error;
    }
  }

  /**
   * Remove sensitive data from provider object
   */
  sanitizeProvider(provider) {
    const providerObj = provider.toJSON ? provider.toJSON() : provider;
    const { deletedAt, ...sanitized } = providerObj;
    return sanitized;
  }
}

module.exports = new ProviderService();