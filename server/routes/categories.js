const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category-controller');
const authMiddleware = require('../middleware/auth-middleware');

// Lấy tất cả danh mục
router.get('/', categoryController.getAllCategories);

// Lấy danh mục chính (danh mục cha)
router.get('/main', categoryController.getMainCategories);

// Lấy danh mục con của một danh mục
router.get('/sub/:categoryId', categoryController.getSubCategories);

// Lấy chi tiết danh mục theo ID
router.get('/id/:id', categoryController.getCategoryById);

// Lấy chi tiết danh mục theo slug
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Lấy sản phẩm theo danh mục
router.get('/:categoryId/products', categoryController.getProductsByCategory);

// Các route dưới đây yêu cầu đăng nhập và quyền admin
// Thêm danh mục mới (chỉ admin)
router.post('/', authMiddleware.authenticateUser, authMiddleware.requireAdmin, categoryController.addCategory);

// Cập nhật danh mục (chỉ admin)
router.put('/:id', authMiddleware.authenticateUser, authMiddleware.requireAdmin, categoryController.updateCategory);

// Xóa danh mục (chỉ admin)
router.delete('/:id', authMiddleware.authenticateUser, authMiddleware.requireAdmin, categoryController.deleteCategory);

module.exports = router;