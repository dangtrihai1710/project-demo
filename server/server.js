const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để xử lý JSON và form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
  // Trong thực tế, bạn sẽ kiểm tra JWT token và quyền của người dùng
  // Đây chỉ là demo đơn giản
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Không có token xác thực' });
  }
  
  // Phân tích token từ header Authorization: Bearer <token>
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
  
  // Trong thực tế, bạn sẽ xác thực token và kiểm tra quyền admin
  // Đây chỉ là demo, nên chúng ta giả định token 'admin-token' có quyền admin
  if (token !== 'admin-token') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }
  
  next();
};

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);

// API Routes dành riêng cho Admin với middleware kiểm tra quyền
app.use('/api/admin/products', isAdmin, productRoutes);
app.use('/api/admin/categories', isAdmin, categoryRoutes);
app.use('/api/admin/orders', isAdmin, orderRoutes);

// Route cho các tệp HTML
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cart.html'));
});

app.get('/product-detail.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/product-detail.html'));
});

// Serve index.html cho tất cả các route frontend khác
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});