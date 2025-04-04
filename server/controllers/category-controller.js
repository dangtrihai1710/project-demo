const fs = require('fs');
const path = require('path');
const categoriesFile = path.join(__dirname, '../data/categories.json');
const productsFile = path.join(__dirname, '../data/products.json');

// Đọc dữ liệu danh mục từ file
const getCategories = () => {
  try {
    const data = fs.readFileSync(categoriesFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Lỗi đọc file categories.json:', error);
    return [];
  }
};

// Đọc dữ liệu sản phẩm từ file
const getProducts = () => {
  try {
    const data = fs.readFileSync(productsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Lỗi đọc file products.json:', error);
    return [];
  }
};

// Lưu dữ liệu danh mục vào file
const saveCategories = (categories) => {
  fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2), 'utf8');
};

// Lấy tất cả danh mục
exports.getAllCategories = (req, res) => {
  try {
    const categories = getCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục', error: error.message });
  }
};

// Lấy danh mục chính (danh mục cha)
exports.getMainCategories = (req, res) => {
  try {
    const categories = getCategories();
    const mainCategories = categories.filter(category => category.parentId === null);
    res.status(200).json(mainCategories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục chính', error: error.message });
  }
};

// Lấy danh mục con của một danh mục
exports.getSubCategories = (req, res) => {
  try {
    const { categoryId } = req.params;
    const categories = getCategories();
    const subCategories = categories.filter(category => category.parentId === categoryId);
    res.status(200).json(subCategories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục con', error: error.message });
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
    
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết danh mục', error: error.message });
  }
};

// Lấy chi tiết danh mục theo slug
exports.getCategoryBySlug = (req, res) => {
  try {
    const { slug } = req.params;
    const categories = getCategories();
    
    const category = categories.find(category => category.slug === slug);
    
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết danh mục', error: error.message });
  }
};

// Lấy sản phẩm theo danh mục
exports.getProductsByCategory = (req, res) => {
  try {
    const { categoryId } = req.params;
    const categories = getCategories();
    const products = getProducts();
    
    // Kiểm tra xem danh mục có tồn tại không
    const category = categories.find(category => category.id === categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    // Lấy tất cả danh mục con (nếu có)
    const allSubCategories = categories.filter(cat => cat.parentId === categoryId).map(cat => cat.id);
    
    // Danh sách tất cả danh mục cần lọc (bao gồm danh mục hiện tại và danh mục con)
    const allCategories = [categoryId, ...allSubCategories];
    
    // Lọc sản phẩm theo danh mục
    const categoryProducts = products.filter(product => allCategories.includes(product.category));
    
    res.status(200).json(categoryProducts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm theo danh mục', error: error.message });
  }
};

// Thêm danh mục mới (chỉ admin)
exports.addCategory = (req, res) => {
  try {
    const { name, description, image, slug, parentId, featured, order } = req.body;
    const categories = getCategories();
    
    // Kiểm tra xem slug đã tồn tại chưa
    if (categories.some(category => category.slug === slug)) {
      return res.status(400).json({ message: 'Slug đã tồn tại, vui lòng chọn slug khác' });
    }
    
    // Tạo danh mục mới
    const newCategory = {
      id: slug, // Sử dụng slug làm id
      name,
      description,
      image,
      slug,
      parentId: parentId || null,
      featured: featured || false,
      order: order || categories.length + 1
    };
    
    categories.push(newCategory);
    saveCategories(categories);
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm danh mục mới', error: error.message });
  }
};

// Cập nhật danh mục (chỉ admin)
exports.updateCategory = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, slug, parentId, featured, order } = req.body;
    let categories = getCategories();
    
    // Tìm vị trí danh mục cần cập nhật
    const index = categories.findIndex(category => category.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    // Kiểm tra xem slug mới đã tồn tại chưa (nếu thay đổi slug)
    if (slug && slug !== categories[index].slug && categories.some(category => category.slug === slug)) {
      return res.status(400).json({ message: 'Slug đã tồn tại, vui lòng chọn slug khác' });
    }
    
    // Cập nhật thông tin danh mục
    categories[index] = {
      ...categories[index],
      name: name || categories[index].name,
      description: description || categories[index].description,
      image: image || categories[index].image,
      slug: slug || categories[index].slug,
      parentId: parentId !== undefined ? parentId : categories[index].parentId,
      featured: featured !== undefined ? featured : categories[index].featured,
      order: order || categories[index].order
    };
    
    saveCategories(categories);
    
    res.status(200).json(categories[index]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật danh mục', error: error.message });
  }
};

// Xóa danh mục (chỉ admin)
exports.deleteCategory = (req, res) => {
  try {
    const { id } = req.params;
    let categories = getCategories();
    
    // Kiểm tra xem danh mục có tồn tại không
    const categoryIndex = categories.findIndex(category => category.id === id);
    
    if (categoryIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    
    // Kiểm tra xem danh mục có danh mục con không
    const hasChildren = categories.some(category => category.parentId === id);
    
    if (hasChildren) {
      return res.status(400).json({ message: 'Không thể xóa danh mục này vì nó có chứa danh mục con' });
    }
    
    // Xóa danh mục
    categories.splice(categoryIndex, 1);
    saveCategories(categories);
    
    res.status(200).json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa danh mục', error: error.message });
  }
};