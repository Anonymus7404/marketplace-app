/**
 * Category Routes
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/type/:type', categoryController.getCategoriesByType);
router.get('/:categoryId', categoryController.getCategoryById);

// Admin only routes (add admin middleware later)
router.post('/', authMiddleware, categoryController.createCategory);
router.put('/:categoryId', authMiddleware, categoryController.updateCategory);
router.delete('/:categoryId', authMiddleware, categoryController.deleteCategory);

module.exports = router;