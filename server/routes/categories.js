const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category-controller');

// Lấy tất cả danh mục
router.get('/', categoryController.getAllCategories);

// Lấy chi tiết danh mục theo ID
router.get('/:id', categoryController.getCategoryById);

// Thêm danh mục mới (chỉ admin)
router.post('/', categoryController.addCategory);

// Cập nhật danh mục (chỉ admin)
router.put('/:id', categoryController.updateCategory);

// Xóa danh mục (chỉ admin)
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;