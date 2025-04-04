const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart-controller');
const authMiddleware = require('../middleware/auth-middleware');

// Áp dụng middleware xác thực cho tất cả routes giỏ hàng
router.use(authMiddleware.authenticateUser);

// Lấy giỏ hàng của người dùng
router.get('/', cartController.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', cartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update/:id', cartController.updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:id', cartController.removeFromCart);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', cartController.clearCart);

// Đồng bộ giỏ hàng cục bộ với giỏ hàng trên máy chủ
router.post('/sync', cartController.syncCart);

module.exports = router;