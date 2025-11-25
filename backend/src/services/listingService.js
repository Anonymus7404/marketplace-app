/**
 * Listing Service
 * Handles listing creation, management, and business logic
 */

const { Listing, Provider, Category, User } = require('../../models');
const logger = require('../utils/logger');

class ListingService {
  /**
 * Create new listing
 */
  async createListing(providerId, listingData) {
    try {
      // Verify provider exists and is approved
      const provider = await Provider.findOne({
        where: {
          id: providerId,
          is_approved: true
        }
      });

      if (!provider) {
        throw new Error('Provider not found or not approved');
      }

      // Verify category exists
      const category = await Category.findByPk(listingData.category_id);
      if (!category) {
        throw new Error('Category not found');
      }

      // Create listing
      const listing = await Listing.create({
        provider_id: providerId,
        category_id: listingData.category_id,
        title: listingData.title,
        description: listingData.description,
        location: listingData.location || {},
        price_model: listingData.price_model || {},
        photos: listingData.photos || [],
        policies: listingData.policies || {},
        deposit_amount: listingData.deposit_amount || 0,
        is_active: true,
        is_featured: false
      });

      logger.info(`Listing created: ${listing.title} by provider: ${providerId}`);

      return {
        success: true,
        listing: await this.enrichListingData(listing)
      };
    } catch (error) {
      logger.error('Create listing error:', error);
      throw error;
    }
  }

  /**
   * Get listing by ID
   */
  async getListingById(listingId) {
    try {
      const listing = await Listing.findByPk(listingId, {
        include: [
          {
            model: Provider,
            include: [{
              model: User,
              attributes: ['id', 'name', 'phone', 'profile_picture']
            }]
          },
          {
            model: Category,
            attributes: ['id', 'name', 'type', 'icon']
          }
        ]
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      return await this.enrichListingData(listing);
    } catch (error) {
      logger.error('Get listing error:', error);
      throw error;
    }
  }

  /**
   * Update listing
   */
  async updateListing(listingId, providerId, updateData) {
    try {
      const listing = await Listing.findOne({
        where: {
          id: listingId,
          provider_id: providerId
        }
      });

      if (!listing) {
        throw new Error('Listing not found or access denied');
      }

      // Fields that can be updated
      const allowedUpdates = {
        title: updateData.title,
        description: updateData.description,
        category_id: updateData.category_id,
        location: updateData.location,
        price_model: updateData.price_model,
        photos: updateData.photos,
        policies: updateData.policies,
        deposit_amount: updateData.deposit_amount,
        is_active: updateData.is_active
      };

      // Remove undefined fields
      Object.keys(allowedUpdates).forEach(key => {
        if (allowedUpdates[key] === undefined) {
          delete allowedUpdates[key];
        }
      });

      await listing.update(allowedUpdates);

      return await this.enrichListingData(listing);
    } catch (error) {
      logger.error('Update listing error:', error);
      throw error;
    }
  }

  /**
   * Delete listing (soft delete)
   */
  async deleteListing(listingId, providerId) {
    try {
      const listing = await Listing.findOne({
        where: {
          id: listingId,
          provider_id: providerId
        }
      });

      if (!listing) {
        throw new Error('Listing not found or access denied');
      }

      await listing.update({ is_active: false });

      return {
        success: true,
        message: 'Listing deleted successfully'
      };
    } catch (error) {
      logger.error('Delete listing error:', error);
      throw error;
    }
  }

  /**
   * Get provider's listings
   */
  async getProviderListings(providerId, filters = {}) {
    try {
      const whereClause = { provider_id: providerId };

      if (filters.is_active !== undefined) {
        whereClause.is_active = filters.is_active;
      }

      const listings = await Listing.findAll({
        where: whereClause,
        include: [
          {
            model: Category,
            attributes: ['id', 'name', 'type', 'icon']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return await Promise.all(
        listings.map(listing => this.enrichListingData(listing))
      );
    } catch (error) {
      logger.error('Get provider listings error:', error);
      throw error;
    }
  }

  /**
   * Get all active listings (for customers)
   */
  async getAllActiveListings(filters = {}) {
    try {
      const whereClause = { is_active: true };

      if (filters.category_id) {
        whereClause.category_id = filters.category_id;
      }

      const listings = await Listing.findAll({
        where: whereClause,
        include: [
          {
            model: Provider,
            include: [{
              model: User,
              attributes: ['id', 'name', 'profile_picture']
            }]
          },
          {
            model: Category,
            attributes: ['id', 'name', 'type', 'icon']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50
      });

      return await Promise.all(
        listings.map(listing => this.enrichListingData(listing))
      );
    } catch (error) {
      logger.error('Get all listings error:', error);
      throw error;
    }
  }

  /**
   * Enrich listing data with additional information
   */
  async enrichListingData(listing) {
    const listingObj = listing.toJSON ? listing.toJSON() : listing;

    // Calculate average rating (will implement later)
    listingObj.average_rating = 4.5; // Placeholder
    listingObj.review_count = 12; // Placeholder

    // Add calculated fields
    if (listingObj.price_model) {
      listingObj.starting_price = this.calculateStartingPrice(listingObj.price_model);
    }

    // Remove sensitive data
    const { deletedAt, ...enriched } = listingObj;
    return enriched;
  }

  /**
   * Calculate starting price from price model
   */
  calculateStartingPrice(priceModel) {
    if (!priceModel) return 0;

    if (priceModel.hourly) return priceModel.hourly;
    if (priceModel.daily) return priceModel.daily;
    if (priceModel.fixed) return priceModel.fixed;

    return 0;
  }
}

module.exports = new ListingService();