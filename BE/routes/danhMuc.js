const express = require('express');
const router = express.Router();
const danhMucController = require('../controllers/danhMucController');

// Get all categories
router.get('/', danhMucController.getAllCategories);

// Get category by ID
router.get('/:id', danhMucController.getCategoryById);

// Create a new category
router.post('/', danhMucController.createCategory);

// Update a category
router.put('/:id', danhMucController.updateCategory);

// Delete a category
router.delete('/:id', danhMucController.deleteCategory);

module.exports = router;
