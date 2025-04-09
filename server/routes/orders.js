const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order-controller');

// Lấy tất cả đơn hàng (chỉ admin)
router.get('/', orderController.getAllOrders);

// Lấy báo cáo doanh thu (chỉ admin)
router.get('/revenue', orderController.getRevenueReport);

// Lấy chi tiết đơn hàng theo ID
router.get('/:id', orderController.getOrderById);

// Tạo đơn hàng mới
router.post('/', orderController.createOrder);

// Cập nhật trạng thái đơn hàng (chỉ admin)
router.put('/:id/status', orderController.updateOrderStatus);

// Xóa đơn hàng (chỉ admin)
router.delete('/:id', orderController.deleteOrder);

module.exports = router;