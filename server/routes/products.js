const express = require('express');
const router = express.Router();
const productController = require('../controllers/product-controller');
const authMiddleware = require('../middleware/auth-middleware');

// Lấy tất cả sản phẩm
router.get('/', productController.getAllProducts);

// Lấy chi tiết sản phẩm theo ID
router.get('/:id', productController.getProductById);

// Thêm sản phẩm mới (chỉ admin)
router.post('/', authMiddleware.authenticateUser, authMiddleware.requireAdmin, productController.addProduct);

// Cập nhật sản phẩm (chỉ admin)
router.put('/:id', authMiddleware.authenticateUser, authMiddleware.requireAdmin, productController.updateProduct);

// Xóa sản phẩm (chỉ admin)
router.delete('/:id', authMiddleware.authenticateUser, authMiddleware.requireAdmin, productController.deleteProduct);

module.exports = router;