/**
 * Category Service
 * Manages service categories and their attributes
 */

const { Category } = require('../../models');
const logger = require('../utils/logger');

class CategoryService {
  /**
   * Create new category
   */
  async createCategory(categoryData) {
    try {
      const category = await Category.create({
        name: categoryData.name,
        type: categoryData.type,
        description: categoryData.description,
        icon: categoryData.icon,
        attributes_schema: categoryData.attributes_schema || {},
        is_active: true
      });

      logger.info(`Category created: ${category.name}`);

      return {
        success: true,
        category: this.sanitizeCategory(category)
      };
    } catch (error) {
      logger.error('Create category error:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getAllCategories(filters = {}) {
    try {
      const whereClause = { is_active: true };
      
      if (filters.type) {
        whereClause.type = filters.type;
      }

      const categories = await Category.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
      });

      return categories.map(category => this.sanitizeCategory(category));
    } catch (error) {
      logger.error('Get all categories error:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId) {
    try {
      const category = await Category.findByPk(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }

      return this.sanitizeCategory(category);
    } catch (error) {
      logger.error('Get category error:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(categoryId, updateData) {
    try {
      const category = await Category.findByPk(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }

      await category.update(updateData);

      return this.sanitizeCategory(category);
    } catch (error) {
      logger.error('Update category error:', error);
      throw error;
    }
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId) {
    try {
      const category = await Category.findByPk(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }

      await category.update({ is_active: false });

      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      logger.error('Delete category error:', error);
      throw error;
    }
  }

  /**
   * Get categories by type
   */
  async getCategoriesByType(type) {
    try {
      const categories = await Category.findAll({
        where: { 
          type: type,
          is_active: true 
        },
        order: [['name', 'ASC']]
      });

      return categories.map(category => this.sanitizeCategory(category));
    } catch (error) {
      logger.error('Get categories by type error:', error);
      throw error;
    }
  }

  /**
   * Remove sensitive data
   */
  sanitizeCategory(category) {
    const categoryObj = category.toJSON ? category.toJSON() : category;
    const { deletedAt, ...sanitized } = categoryObj;
    return sanitized;
  }
}

module.exports = new CategoryService();