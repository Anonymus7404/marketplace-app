/**
 * Category Controller
 * Handles category management
 */

const categoryService = require('../services/categoryService');
const logger = require('../utils/logger');

class CategoryController {
  /**
   * Create category (Admin only)
   */
  async createCategory(req, res) {
    try {
      const { name, type, description, icon, attributes_schema } = req.body;

      if (!name || !type) {
        return res.status(400).json({
          success: false,
          error: 'Name and type are required'
        });
      }

      const result = await categoryService.createCategory({
        name,
        type,
        description,
        icon,
        attributes_schema
      });

      res.status(201).json(result);
    } catch (error) {
      logger.error('Create category error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all categories
   */
  async getAllCategories(req, res) {
    try {
      const filters = {
        type: req.query.type
      };

      const categories = await categoryService.getAllCategories(filters);

      res.json({
        success: true,
        categories,
        count: categories.length
      });
    } catch (error) {
      logger.error('Get all categories error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(req, res) {
    try {
      const { categoryId } = req.params;
      const category = await categoryService.getCategoryById(categoryId);

      res.json({
        success: true,
        category
      });
    } catch (error) {
      logger.error('Get category error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update category (Admin only)
   */
  async updateCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const category = await categoryService.updateCategory(categoryId, req.body);

      res.json({
        success: true,
        category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      logger.error('Update category error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete category (Admin only)
   */
  async deleteCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const result = await categoryService.deleteCategory(categoryId);

      res.json(result);
    } catch (error) {
      logger.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get categories by type
   */
  async getCategoriesByType(req, res) {
    try {
      const { type } = req.params;
      const categories = await categoryService.getCategoriesByType(type);

      res.json({
        success: true,
        categories,
        count: categories.length
      });
    } catch (error) {
      logger.error('Get categories by type error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CategoryController();