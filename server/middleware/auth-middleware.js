// Middleware để xác thực người dùng
exports.authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để truy cập' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Trong ứng dụng thực tế, bạn sẽ xác thực JWT token ở đây
  // và trích xuất userId từ token
  
  // Ở đây chúng ta lấy userId từ headers để đơn giản hóa
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'Không thể xác định người dùng' });
  }
  
  // Lưu userId vào req để sử dụng trong các middleware tiếp theo
  req.userId = userId;
  req.isAuthenticated = true;
  
  next();
};

// Middleware kiểm tra vai trò admin
exports.requireAdmin = (req, res, next) => {
  // Đảm bảo người dùng đã được xác thực
  if (!req.isAuthenticated || !req.userId) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để truy cập' });
  }
  
  // Trong ứng dụng thực tế, bạn sẽ kiểm tra vai trò của người dùng
  // từ cơ sở dữ liệu hoặc từ token JWT
  
  // Ở đây chúng ta giả định admin có userId = 1
  if (req.userId !== '1') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }
  
  next();
};