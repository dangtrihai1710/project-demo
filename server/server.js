const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để xử lý JSON và form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware xác thực toàn cục
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.isAuthenticated = false;
    req.userId = null;
  } else {
    const token = authHeader.split(' ')[1];
    
    // Trong ứng dụng thực tế, bạn sẽ giải mã JWT token để lấy userId
    // Ở đây chúng ta giả định token hợp lệ nếu nó chứa 'demo-token'
    const isTokenValid = token && token.includes('demo-token');
    
    req.isAuthenticated = isTokenValid;
    req.userId = req.headers['user-id'] || null;
  }
  
  next();
};

// Áp dụng middleware xác thực cho tất cả các routes
app.use(authenticate);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const authRoutes = require('./routes/auth');

app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/auth', authRoutes);

// Serve components
app.get('/components/:name', (req, res) => {
  const componentName = req.params.name;
  res.sendFile(path.join(__dirname, `../public/components/${componentName}`));
});

// Serve index.html cho tất cả các route frontend
app.get('*', (req, res) => {
  if (req.url.endsWith('.html')) {
    const htmlFile = req.url.substring(1);
    res.sendFile(path.join(__dirname, '../public', htmlFile));
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});