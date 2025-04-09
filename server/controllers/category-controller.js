const fs = require('fs');
const path = require('path');
const categoriesFile = path.join(__dirname, '../data/categories.json');
const productsFile = path.join(__dirname, '../data/products.json');

// Đọc dữ liệu danh mục từ file
const getCategories = () => {
  try {
    if (!fs.existsSync(categoriesFile)) {
      fs.writeFileSync(categoriesFile, JSON.stringify([]), 'utf8');
      return [];
    }
    const data = fs.readFileSync(categoriesFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Đọc dữ liệu sản phẩm từ file
const getProducts = () => {
  try {
    if (!fs.existsSync(productsFile)) {
      return [];
    }
    const data = fs.readFileSync(productsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Lưu dữ liệu danh mục vào file
const saveCategories = (categories) => {
  fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2), 'utf8');
};

// Lưu dữ liệu sản phẩm vào file
const saveProducts = (products) => {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');
};

// Tạo slug từ tên danh mục
const createSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
};

// Lấy tất cả danh mục
exports.getAllCategories = (req, res) => {
  try {
    const categories = getCategories();
    const products = getProducts();
    
    // Đếm số sản phẩm trong từng danh mục
    const categoriesWithProductCount = categories.map(category => {
      const productCount = products.filter(product => product.category === category.id).length;
      return { ...category, productCount };
    });
    
    res.status(200).json(categoriesWithProductCount);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục', error: error.message });
  }
};

// Lấy chi tiết danh mục theo ID
exports.getCategoryById = (req, res) => {
  try {
    const { id } = req.params;
    const categories = getCategories();
    
    const category = categories.find(category => category.id === id);
    
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    // Đếm số sản phẩm trong danh mục
    const products = getProducts();
    const productCount = products.filter(product => product.category === id).length;
    
    res.status(200).json({ ...category, productCount });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết danh mục', error: error.message });
  }
};

// Thêm danh mục mới
exports.addCategory = (req, res) => {
  try {
    const { name, slug, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }
    
    const categories = getCategories();
    
    // Kiểm tra tên danh mục đã tồn tại chưa
    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    }
    
    // Tạo slug nếu không được cung cấp
    const categorySlug = slug ? slug : createSlug(name);
    
    // Kiểm tra slug đã tồn tại chưa
    if (categories.some(cat => cat.slug === categorySlug)) {
      return res.status(400).json({ message: 'Slug đã tồn tại' });
    }
    
    // Tạo danh mục mới
    const newCategory = {
      id: Date.now().toString(),
      name,
      slug: categorySlug,
      description: description || '',
      createdAt: new Date().toISOString()
    };
    
    categories.push(newCategory);
    saveCategories(categories);
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm danh mục mới', error: error.message });
  }
};

// Cập nhật danh mục
exports.updateCategory = (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }
    
    let categories = getCategories();
    
    // Tìm vị trí danh mục cần cập nhật
    const index = categories.findIndex(category => category.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    // Kiểm tra tên danh mục đã tồn tại chưa (loại trừ danh mục hiện tại)
    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== id)) {
      return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
    }
    
    // Tạo slug nếu không được cung cấp hoặc đã thay đổi tên
    const categorySlug = slug ? slug : (
      name !== categories[index].name ? createSlug(name) : categories[index].slug
    );
    
    // Kiểm tra slug đã tồn tại chưa (loại trừ danh mục hiện tại)
    if (categories.some(cat => cat.slug === categorySlug && cat.id !== id)) {
      return res.status(400).json({ message: 'Slug đã tồn tại' });
    }
    
    // Cập nhật thông tin danh mục
    categories[index] = {
      ...categories[index],
      name,
      slug: categorySlug,
      description: description || categories[index].description,
      updatedAt: new Date().toISOString()
    };
    
    saveCategories(categories);
    
    // Đếm số sản phẩm trong danh mục
    const products = getProducts();
    const productCount = products.filter(product => product.category === id).length;
    
    res.status(200).json({ ...categories[index], productCount });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật danh mục', error: error.message });
  }
};

// Xóa danh mục
exports.deleteCategory = (req, res) => {
  try {
    const { id } = req.params;
    let categories = getCategories();
    let products = getProducts();
    
    // Kiểm tra xem danh mục có tồn tại không
    const category = categories.find(category => category.id === id);
    
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    // Kiểm tra và xử lý các sản phẩm thuộc danh mục này
    const productsInCategory = products.filter(product => product.category === id);
    
    // Lấy danh sách đơn hàng
    // Trong một ứng dụng thực tế, bạn sẽ cần kiểm tra xem có sản phẩm nào 
    // thuộc danh mục này đã được đặt hàng hay không
    const ordersFile = path.join(__dirname, '../data/orders.json');
    let orders = [];
    
    if (fs.existsSync(ordersFile)) {
      try {
        const ordersData = fs.readFileSync(ordersFile, 'utf8');
        orders = JSON.parse(ordersData);
      } catch (error) {
        // Nếu không đọc được file orders.json, giả định không có đơn hàng
      }
    }
    
    // Kiểm tra xem có sản phẩm nào trong danh mục này đã được đặt hàng chưa
    let hasOrderedProducts = false;
    
    if (productsInCategory.length > 0 && orders.length > 0) {
      // Lấy tất cả ID sản phẩm thuộc danh mục
      const productIds = productsInCategory.map(product => product.id);
      
      // Kiểm tra từng đơn hàng xem có chứa sản phẩm thuộc danh mục này không
      hasOrderedProducts = orders.some(order => {
        // Kiểm tra trong các item của đơn hàng
        return order.items && order.items.some(item => productIds.includes(item.productId));
      });
    }
    
    // Nếu có sản phẩm đã được đặt hàng, không cho phép xóa danh mục
    if (hasOrderedProducts) {
      return res.status(400).json({ 
        message: 'Không thể xóa danh mục này vì có sản phẩm đã được đặt hàng.',
        solution: 'Vui lòng đánh dấu danh mục là không hoạt động thay vì xóa.'
      });
    }
    
    // Lọc ra các danh mục không bị xóa
    categories = categories.filter(category => category.id !== id);
    
    // Xóa tất cả sản phẩm thuộc danh mục này
    products = products.filter(product => product.category !== id);
    
    // Lưu lại dữ liệu
    saveCategories(categories);
    saveProducts(products);
    
    res.status(200).json({ 
      message: 'Xóa danh mục thành công',
      deletedProductCount: productsInCategory.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa danh mục', error: error.message });
  }
};