const fs = require('fs');
const path = require('path');
const ordersFile = path.join(__dirname, '../data/orders.json');
const productsFile = path.join(__dirname, '../data/products.json');
const cartsFile = path.join(__dirname, '../data/carts.json');

// Đọc dữ liệu đơn hàng từ file
const getOrders = () => {
  try {
    if (!fs.existsSync(ordersFile)) {
      fs.writeFileSync(ordersFile, JSON.stringify([]), 'utf8');
      return [];
    }
    const data = fs.readFileSync(ordersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
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

// Đọc dữ liệu giỏ hàng từ file
const getCarts = () => {
  try {
    const data = fs.readFileSync(cartsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

// Lưu dữ liệu đơn hàng vào file
const saveOrders = (orders) => {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
};

// Lưu dữ liệu sản phẩm vào file
const saveProducts = (products) => {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
};

// Lưu dữ liệu giỏ hàng vào file
const saveCarts = (carts) => {
  fs.writeFileSync(cartsFile, JSON.stringify(carts, null, 2), 'utf8');
};

// Lấy tất cả đơn hàng
exports.getAllOrders = (req, res) => {
  try {
    const orders = getOrders();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng', error: error.message });
  }
};

// Lấy đơn hàng theo ID
exports.getOrderById = (req, res) => {
  try {
    const { id } = req.params;
    const orders = getOrders();
    
    const order = orders.find(order => order.id === id);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết đơn hàng', error: error.message });
  }
};

// Tạo đơn hàng mới
exports.createOrder = (req, res) => {
  try {
    const { userId, shippingInfo, paymentMethod } = req.body;
    
    // Lấy giỏ hàng của người dùng
    const carts = getCarts();
    const cart = carts[userId || 'guest'];
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }
    
    // Kiểm tra tồn kho
    const products = getProducts();
    
    for (const item of cart.items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        return res.status(400).json({ message: `Sản phẩm "${item.name}" không tồn tại` });
      }
      
      // Nếu sản phẩm có theo dõi tồn kho
      if (product.stock !== undefined && product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Sản phẩm "${item.name}" chỉ còn ${product.stock} sản phẩm trong kho` 
        });
      }
    }
    
    // Tạo mã đơn hàng
    const orderCode = 'DH' + new Date().getFullYear() + 
      String(new Date().getMonth() + 1).padStart(2, '0') +
      String(new Date().getDate()).padStart(2, '0') +
      String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    // Tạo đơn hàng mới
    const newOrder = {
      id: orderCode,
      userId: userId || 'guest',
      items: cart.items,
      shippingInfo,
      paymentMethod,
      subtotal: cart.total,
      shippingFee: 30000, // Phí vận chuyển cố định, có thể tính toán dựa trên địa chỉ
      discount: 0, // Giảm giá, có thể áp dụng mã giảm giá
      total: cart.total + 30000, // Tổng = subtotal + shippingFee - discount
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Lưu đơn hàng
    const orders = getOrders();
    orders.push(newOrder);
    saveOrders(orders);
    
    // Cập nhật tồn kho
    cart.items.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.productId);
      if (productIndex !== -1 && products[productIndex].stock !== undefined) {
        products[productIndex].stock -= item.quantity;
      }
    });
    saveProducts(products);
    
    // Xóa giỏ hàng
    carts[userId || 'guest'] = { items: [], total: 0 };
    saveCarts(carts);
    
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng', error: error.message });
  }
};

// Cập nhật trạng thái đơn hàng
exports.updateOrderStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Trạng thái đơn hàng là bắt buộc' });
    }
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
    }
    
    const orders = getOrders();
    const orderIndex = orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    const oldStatus = orders[orderIndex].status;
    
    // Kiểm tra logic chuyển trạng thái
    if (oldStatus === 'completed' && status !== 'completed') {
      return res.status(400).json({ message: 'Không thể thay đổi trạng thái của đơn hàng đã hoàn thành' });
    }
    
    if (oldStatus === 'cancelled' && status !== 'cancelled') {
      return res.status(400).json({ message: 'Không thể thay đổi trạng thái của đơn hàng đã hủy' });
    }
    
    // Xử lý khi đơn hàng bị hủy
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      // Hoàn trả lại tồn kho
      const products = getProducts();
      
      orders[orderIndex].items.forEach(item => {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1 && products[productIndex].stock !== undefined) {
          products[productIndex].stock += item.quantity;
        }
      });
      
      saveProducts(products);
    }
    
    // Cập nhật trạng thái
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    // Ghi log cập nhật
    if (!orders[orderIndex].statusHistory) {
      orders[orderIndex].statusHistory = [];
    }
    
    orders[orderIndex].statusHistory.push({
      status,
      time: new Date().toISOString(),
      user: req.body.updatedBy || 'admin'
    });
    
    saveOrders(orders);
    
    res.status(200).json(orders[orderIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng', error: error.message });
  }
};

// Xóa đơn hàng (chỉ admin)
exports.deleteOrder = (req, res) => {
  try {
    const { id } = req.params;
    let orders = getOrders();
    
    const orderIndex = orders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Kiểm tra nếu đơn hàng đã hoàn thành hoặc đang giao, không cho xóa
    if (['completed', 'shipped'].includes(orders[orderIndex].status)) {
      return res.status(400).json({ 
        message: 'Không thể xóa đơn hàng đã hoàn thành hoặc đang giao hàng' 
      });
    }
    
    // Nếu đơn hàng đang ở trạng thái pending hoặc processing, hoàn trả lại tồn kho
    if (['pending', 'processing'].includes(orders[orderIndex].status)) {
      const products = getProducts();
      
      orders[orderIndex].items.forEach(item => {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1 && products[productIndex].stock !== undefined) {
          products[productIndex].stock += item.quantity;
        }
      });
      
      saveProducts(products);
    }
    
    // Xóa đơn hàng
    orders.splice(orderIndex, 1);
    saveOrders(orders);
    
    res.status(200).json({ message: 'Xóa đơn hàng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa đơn hàng', error: error.message });
  }
};

// Lấy báo cáo doanh thu
exports.getRevenueReport = (req, res) => {
  try {
    const { fromDate, toDate, groupBy } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp khoảng thời gian' });
    }
    
    const orders = getOrders();
    const products = getProducts();
    
    // Lọc đơn hàng theo khoảng thời gian và trạng thái (chỉ tính đơn hàng hoàn thành)
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= new Date(fromDate) && 
             orderDate <= new Date(toDate) && 
             order.status === 'completed';
    });
    
    // Xử lý nhóm theo loại khác nhau
    let reportData = [];
    
    switch (groupBy) {
      case 'daily':
        // Nhóm theo ngày
        const dailyData = {};
        
        filteredOrders.forEach(order => {
          const date = new Date(order.createdAt).toISOString().split('T')[0];
          
          if (!dailyData[date]) {
            dailyData[date] = {
              time: date,
              orders: 0,
              revenue: 0,
              cost: 0
            };
          }
          
          dailyData[date].orders += 1;
          dailyData[date].revenue += order.total;
          
          // Tính giá vốn
          order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product && product.cost) {
              dailyData[date].cost += product.cost * item.quantity;
            } else {
              // Giả định giá vốn = 80% giá bán nếu không có thông tin
              dailyData[date].cost += (item.price * 0.8) * item.quantity;
            }
          });
        });
        
        reportData = Object.values(dailyData);
        break;
        
      case 'monthly':
        // Nhóm theo tháng
        const monthlyData = {};
        
        filteredOrders.forEach(order => {
          const date = new Date(order.createdAt);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              time: monthYear,
              orders: 0,
              revenue: 0,
              cost: 0
            };
          }
          
          monthlyData[monthYear].orders += 1;
          monthlyData[monthYear].revenue += order.total;
          
          // Tính giá vốn
          order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product && product.cost) {
              monthlyData[monthYear].cost += product.cost * item.quantity;
            } else {
              // Giả định giá vốn = 80% giá bán nếu không có thông tin
              monthlyData[monthYear].cost += (item.price * 0.8) * item.quantity;
            }
          });
        });
        
        reportData = Object.values(monthlyData);
        break;
        
      case 'category':
        // Nhóm theo danh mục
        const categoryData = {};
        
        filteredOrders.forEach(order => {
          order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            
            if (product) {
              const categoryId = product.category;
              
              if (!categoryData[categoryId]) {
                categoryData[categoryId] = {
                  categoryId,
                  categoryName: categoryId, // Trong thực tế sẽ lấy tên danh mục
                  quantity: 0,
                  revenue: 0
                };
              }
              
              categoryData[categoryId].quantity += item.quantity;
              categoryData[categoryId].revenue += item.price * item.quantity;
            }
          });
        });
        
        reportData = Object.values(categoryData);
        break;
        
      case 'product':
        // Nhóm theo sản phẩm
        const productData = {};
        
        filteredOrders.forEach(order => {
          order.items.forEach(item => {
            if (!productData[item.productId]) {
              productData[item.productId] = {
                productId: item.productId,
                productName: item.name,
                quantity: 0,
                revenue: 0
              };
            }
            
            productData[item.productId].quantity += item.quantity;
            productData[item.productId].revenue += item.price * item.quantity;
          });
        });
        
        reportData = Object.values(productData);
        
        // Sắp xếp theo doanh thu giảm dần
        reportData.sort((a, b) => b.revenue - a.revenue);
        break;
        
      default:
        // Mặc định không nhóm
        reportData = filteredOrders.map(order => ({
          id: order.id,
          time: order.createdAt,
          revenue: order.total
        }));
    }
    
    // Tính tổng số liệu
    const summary = {
      totalOrders: filteredOrders.length,
      totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
      totalCost: 0, // Sẽ tính dựa trên từng chi tiết item
      totalProfit: 0 // Sẽ tính = totalRevenue - totalCost
    };
    
    // Tính tổng giá vốn
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && product.cost) {
          summary.totalCost += product.cost * item.quantity;
        } else {
          // Giả định giá vốn = 80% giá bán nếu không có thông tin
          summary.totalCost += (item.price * 0.8) * item.quantity;
        }
      });
    });
    
    summary.totalProfit = summary.totalRevenue - summary.totalCost;
    
    // Thêm lợi nhuận vào từng mục trong báo cáo (nếu có cost)
    reportData.forEach(item => {
      if (item.revenue !== undefined && item.cost !== undefined) {
        item.profit = item.revenue - item.cost;
      }
    });
    
    res.status(200).json({
      summary,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy báo cáo doanh thu', error: error.message });
  }
};