/**
 * Search Service with Elasticsearch
 * Advanced search functionality with filters and geolocation
 */

const { Client } = require('@elastic/elasticsearch');
const { Listing, Provider, Category, User } = require('../../models');
const logger = require('../utils/logger');

class SearchService {
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
    this.indexName = 'listings';
    this.init().catch(error => {
      logger.error('Elasticsearch initialization error:', error);
    });
  }

  /**
   * Initialize Elasticsearch index
   */
  async init() {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  custom_analyzer: {
                    tokenizer: 'standard',
                    filter: ['lowercase', 'asciifolding']
                  }
                }
              }
            },
            mappings: {
              properties: {
                id: { type: 'keyword' },
                title: { 
                  type: 'text',
                  analyzer: 'custom_analyzer',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                description: { 
                  type: 'text',
                  analyzer: 'custom_analyzer' 
                },
                category: { type: 'keyword' },
                category_id: { type: 'keyword' },
                provider_name: { type: 'text' },
                location: { 
                  type: 'geo_point' 
                },
                city: { type: 'keyword' },
                price: { type: 'float' },
                rating: { type: 'float' },
                is_active: { type: 'boolean' },
                is_featured: { type: 'boolean' },
                created_at: { type: 'date' },
                tags: { type: 'keyword' }
              }
            }
          }
        });
        logger.info('✅ Elasticsearch index created');
      }

      // Sync existing listings
      await this.syncAllListings();
    } catch (error) {
      logger.error('Elasticsearch init error:', error);
    }
  }

  /**
   * Sync all listings to Elasticsearch
   */
  async syncAllListings() {
    try {
      const listings = await Listing.findAll({
        where: { is_active: true },
        include: [
          {
            model: Provider,
            include: [{ model: User, attributes: ['name'] }]
          },
          {
            model: Category,
            attributes: ['name']
          }
        ]
      });

      const body = listings.flatMap(listing => [
        { index: { _index: this.indexName, _id: listing.id } },
        this.prepareListingForIndex(listing)
      ]);

      if (body.length > 0) {
        await this.client.bulk({ refresh: true, body });
        logger.info(`✅ Synced ${listings.length} listings to Elasticsearch`);
      }
    } catch (error) {
      logger.error('Sync listings error:', error);
    }
  }

  /**
   * Index a single listing
   */
  async indexListing(listing) {
    try {
      await this.client.index({
        index: this.indexName,
        id: listing.id,
        body: this.prepareListingForIndex(listing),
        refresh: true
      });
    } catch (error) {
      logger.error('Index listing error:', error);
    }
  }

  /**
   * Delete listing from index
   */
  async deleteListingFromIndex(listingId) {
    try {
      await this.client.delete({
        index: this.indexName,
        id: listingId
      });
    } catch (error) {
      // Ignore if document doesn't exist
      if (error.statusCode !== 404) {
        logger.error('Delete from index error:', error);
      }
    }
  }

  /**
   * Prepare listing data for Elasticsearch
   */
  prepareListingForIndex(listing) {
    const listingData = listing.toJSON ? listing.toJSON() : listing;
    
    return {
      id: listingData.id,
      title: listingData.title,
      description: listingData.description,
      category: listingData.Category?.name,
      category_id: listingData.category_id,
      provider_name: listingData.Provider?.User?.name,
      location: listingData.location?.coordinates 
        ? { 
            lat: listingData.location.coordinates.latitude,
            lon: listingData.location.coordinates.longitude
          }
        : undefined,
      city: listingData.location?.city,
      price: listingData.price_model?.hourly || listingData.price_model?.daily || listingData.price_model?.fixed || 0,
      rating: listingData.average_rating || 0,
      is_active: listingData.is_active,
      is_featured: listingData.is_featured,
      created_at: listingData.createdAt,
      tags: this.extractTags(listingData)
    };
  }

  /**
   * Extract search tags from listing
   */
  extractTags(listingData) {
    const tags = [];
    
    if (listingData.title) {
      tags.push(...listingData.title.toLowerCase().split(' '));
    }
    
    if (listingData.Category?.name) {
      tags.push(listingData.Category.name.toLowerCase());
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Search listings with advanced filters
   */
  async searchListings(searchParams) {
    try {
      const {
        query = '',
        category,
        location,
        max_distance = 50, // km
        min_price,
        max_price,
        min_rating,
        page = 1,
        limit = 20
      } = searchParams;

      const from = (page - 1) * limit;

      const mustConditions = [
        { term: { is_active: true } }
      ];

      // Text search
      if (query) {
        mustConditions.push({
          multi_match: {
            query: query,
            fields: ['title^3', 'description^2', 'provider_name', 'tags'],
            fuzziness: 'AUTO'
          }
        });
      }

      // Category filter
      if (category) {
        mustConditions.push({
          term: { category: category }
        });
      }

      // Price range filter
      if (min_price !== undefined || max_price !== undefined) {
        const priceRange = {};
        if (min_price !== undefined) priceRange.gte = min_price;
        if (max_price !== undefined) priceRange.lte = max_price;
        
        mustConditions.push({
          range: { price: priceRange }
        });
      }

      // Rating filter
      if (min_rating !== undefined) {
        mustConditions.push({
          range: { rating: { gte: min_rating } }
        });
      }

      const body = {
        query: {
          bool: {
            must: mustConditions
          }
        },
        sort: [
          { is_featured: { order: 'desc' } },
          { _score: { order: 'desc' } },
          { created_at: { order: 'desc' } }
        ],
        from: from,
        size: limit
      };

      // Add location filter if provided
      if (location && location.lat && location.lng) {
        body.query.bool.filter = {
          geo_distance: {
            distance: `${max_distance}km`,
            location: {
              lat: location.lat,
              lon: location.lng
            }
          }
        };
      }

      const response = await this.client.search({
        index: this.indexName,
        body: body
      });

      const listings = response.body.hits.hits.map(hit => ({
        ...hit._source,
        _score: hit._score
      }));

      return {
        success: true,
        listings,
        total: response.body.hits.total.value,
        page,
        limit,
        totalPages: Math.ceil(response.body.hits.total.value / limit)
      };
    } catch (error) {
      logger.error('Search listings error:', error);
      throw new Error('Search failed');
    }
  }

  /**
   * Autocomplete search suggestions
   */
  async autocomplete(query, size = 5) {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ['title', 'category', 'provider_name'],
              type: 'phrase_prefix'
            }
          },
          size: size,
          _source: ['title', 'category', 'provider_name']
        }
      });

      return response.body.hits.hits.map(hit => hit._source);
    } catch (error) {
      logger.error('Autocomplete error:', error);
      return [];
    }
  }
}

module.exports = new SearchService();