const fs = require('fs');
const path = require('path');
const cartsFile = path.join(__dirname, '../data/carts.json');
const productsFile = path.join(__dirname, '../data/products.json');

// Đọc dữ liệu giỏ hàng từ file
const getCarts = () => {
  try {
    if (!fs.existsSync(cartsFile)) {
      fs.writeFileSync(cartsFile, JSON.stringify({}), 'utf8');
      return {};
    }
    const data = fs.readFileSync(cartsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

// Đọc dữ liệu sản phẩm từ file
const getProducts = () => {
  try {
    const data = fs.readFileSync(productsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Lưu dữ liệu giỏ hàng vào file
const saveCarts = (carts) => {
  fs.writeFileSync(cartsFile, JSON.stringify(carts, null, 2), 'utf8');
};

// Middleware xác thực người dùng
exports.authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để truy cập giỏ hàng' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Trong ứng dụng thực tế, bạn sẽ xác thực JWT token ở đây
  // và trích xuất userId từ token
  
  // Ở đây chúng ta lấy userId từ headers
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'Không thể xác định người dùng' });
  }
  
  // Lưu userId vào req để sử dụng trong các middleware tiếp theo
  req.userId = userId;
  next();
};

// Lấy giỏ hàng của người dùng
exports.getCart = (req, res) => {
  try {
    const userId = req.userId; // Lấy từ middleware xác thực
    const carts = getCarts();
    
    // Nếu giỏ hàng chưa tồn tại, tạo mới
    if (!carts[userId]) {
      carts[userId] = { items: [], total: 0 };
      saveCarts(carts);
    }
    
    res.status(200).json(carts[userId]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy giỏ hàng', error: error.message });
  }
};

// Thêm sản phẩm vào giỏ hàng
exports.addToCart = (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.userId; // Lấy từ middleware xác thực
    const carts = getCarts();
    const products = getProducts();
    
    // Tìm sản phẩm theo ID
    const product = products.find(product => product.id === productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    // Nếu giỏ hàng chưa tồn tại, tạo mới
    if (!carts[userId]) {
      carts[userId] = { items: [], total: 0 };
    }
    
    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = carts[userId].items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex !== -1) {
      // Nếu đã có, tăng số lượng
      carts[userId].items[existingItemIndex].quantity += quantity;
    } else {
      // Nếu chưa có, thêm mới
      carts[userId].items.push({
        id: Date.now().toString(),
        productId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity
      });
    }
    
    // Tính lại tổng giá trị giỏ hàng
    carts[userId].total = carts[userId].items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    saveCarts(carts);
    
    res.status(200).json(carts[userId]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm vào giỏ hàng', error: error.message });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
exports.updateCartItem = (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.userId; // Lấy từ middleware xác thực
    const carts = getCarts();
    
    if (!carts[userId]) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }
    
    // Tìm vị trí sản phẩm trong giỏ hàng
    const itemIndex = carts[userId].items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }
    
    // Cập nhật số lượng
    carts[userId].items[itemIndex].quantity = quantity;
    
    // Xóa sản phẩm nếu số lượng <= 0
    if (quantity <= 0) {
      carts[userId].items.splice(itemIndex, 1);
    }
    
    // Tính lại tổng giá trị giỏ hàng
    carts[userId].total = carts[userId].items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    saveCarts(carts);
    
    res.status(200).json(carts[userId]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật giỏ hàng', error: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // Lấy từ middleware xác thực
    const carts = getCarts();
    
    if (!carts[userId]) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }
    
    // Lọc ra các sản phẩm không bị xóa
    carts[userId].items = carts[userId].items.filter(item => item.id !== id);
    
    // Tính lại tổng giá trị giỏ hàng
    carts[userId].total = carts[userId].items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    saveCarts(carts);
    
    res.status(200).json(carts[userId]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng', error: error.message });
  }
};

// Xóa toàn bộ giỏ hàng
exports.clearCart = (req, res) => {
  try {
    const userId = req.userId; // Lấy từ middleware xác thực
    const carts = getCarts();
    
    if (!carts[userId]) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }
    
    // Làm trống giỏ hàng
    carts[userId] = { items: [], total: 0 };
    saveCarts(carts);
    
    res.status(200).json(carts[userId]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa toàn bộ giỏ hàng', error: error.message });
  }
};

// Đồng bộ hóa giỏ hàng cục bộ với giỏ hàng trên máy chủ
exports.syncCart = (req, res) => {
  try {
    const localCart = req.body;
    const userId = req.userId; // Lấy từ middleware xác thực
    const carts = getCarts();
    
    // Nếu giỏ hàng chưa tồn tại, sử dụng giỏ hàng cục bộ
    if (!carts[userId]) {
      carts[userId] = localCart;
      saveCarts(carts);
      return res.status(200).json(carts[userId]);
    }
    
    // Nếu đã có giỏ hàng trên máy chủ, hợp nhất hai giỏ hàng
    localCart.items.forEach(localItem => {
      const existingItemIndex = carts[userId].items.findIndex(item => item.productId === localItem.productId);
      
      if (existingItemIndex !== -1) {
        // Nếu sản phẩm đã có, tăng số lượng
        carts[userId].items[existingItemIndex].quantity += localItem.quantity;
      } else {
        // Nếu sản phẩm chưa có, thêm mới
        carts[userId].items.push({
          id: Date.now().toString() + '-' + localItem.productId,
          productId: localItem.productId,
          name: localItem.name,
          price: localItem.price,
          image: localItem.image,
          quantity: localItem.quantity
        });
      }
    });
    
    // Tính lại tổng giá trị giỏ hàng
    carts[userId].total = carts[userId].items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    saveCarts(carts);
    
    res.status(200).json(carts[userId]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đồng bộ giỏ hàng', error: error.message });
  }
};