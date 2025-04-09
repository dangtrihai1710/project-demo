document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra trạng thái đăng nhập
    checkAdminAuth();
    
    // Khởi tạo các sự kiện
    initializeEvents();
    
    // Tải dữ liệu dashboard
    loadDashboard();
    
    // Tải danh sách danh mục cho dropdown
    loadCategories();
});

// Kiểm tra quyền admin
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || user.role !== 'admin') {
        // Nếu không phải admin, chuyển hướng về trang đăng nhập
        showAlert('Bạn không có quyền truy cập trang này!', 'danger');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return;
    }
    
    // Hiển thị tên admin
    document.getElementById('admin-username').textContent = user.username;
}

// Khởi tạo các sự kiện
function initializeEvents() {
    // Xử lý chuyển đổi giữa các tab
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Loại bỏ active class từ tất cả nav-link
            navLinks.forEach(item => item.classList.remove('active'));
            
            // Thêm active class vào link được click
            this.classList.add('active');
            
            // Lấy id section từ data attribute
            const sectionId = this.getAttribute('data-section');
            
            // Cập nhật tiêu đề
            document.getElementById('section-title').textContent = this.textContent.trim();
            
            // Ẩn tất cả section
            document.querySelectorAll('.section-content').forEach(section => {
                section.classList.remove('active');
            });
            
            // Hiển thị section tương ứng
            document.getElementById(`${sectionId}-section`).classList.add('active');
            
            // Tải dữ liệu cho từng section
            switch(sectionId) {
                case 'products':
                    loadProducts();
                    break;
                case 'categories':
                    loadCategoriesList();
                    break;
                case 'orders':
                    loadOrders();
                    break;
                case 'revenue':
                    loadRevenueData();
                    break;
                case 'users':
                    loadUsers();
                    break;
            }
        });
    });
    
    // Xử lý đăng xuất
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('dropdown-logout').addEventListener('click', logout);
    
    // Form sản phẩm
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Form danh mục
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }
    
    // Form người dùng
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // Xử lý xem trước hình ảnh
    const productImage = document.getElementById('product-image');
    if (productImage) {
        productImage.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('image-preview').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Xử lý nút thêm sản phẩm
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            resetProductForm();
            document.getElementById('productModalLabel').textContent = 'Thêm sản phẩm mới';
        });
    }
    
    // Xử lý nút thêm danh mục
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            resetCategoryForm();
            document.getElementById('categoryModalLabel').textContent = 'Thêm danh mục mới';
        });
    }
    
    // Xử lý nút thêm người dùng
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            resetUserForm();
            document.getElementById('userModalLabel').textContent = 'Thêm người dùng mới';
            document.getElementById('password-help').textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
        });
    }
    
    // Xử lý tìm kiếm sản phẩm
    const searchProductsBtn = document.getElementById('search-products-btn');
    if (searchProductsBtn) {
        searchProductsBtn.addEventListener('click', function() {
            loadProducts(1);
        });
        
        document.getElementById('search-products').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loadProducts(1);
                e.preventDefault();
            }
        });
    }
    
    // Xử lý lọc danh mục
    const filterCategory = document.getElementById('filter-category');
    if (filterCategory) {
        filterCategory.addEventListener('change', function() {
            loadProducts(1);
        });
    }
    
    // Xử lý số sản phẩm trên một trang
    const productsPerPage = document.getElementById('products-per-page');
    if (productsPerPage) {
        productsPerPage.addEventListener('change', function() {
            loadProducts(1);
        });
    }
    
    // Xử lý update trạng thái đơn hàng
    const updateStatusBtn = document.getElementById('update-status-btn');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', updateOrderStatus);
    }
    
    // Xử lý báo cáo doanh thu
    const generateRevenueReportBtn = document.getElementById('generate-revenue-report');
    if (generateRevenueReportBtn) {
        generateRevenueReportBtn.addEventListener('click', generateRevenueReport);
    }
    
    // Xử lý xuất Excel báo cáo doanh thu
    const exportRevenueReportBtn = document.getElementById('export-revenue-report');
    if (exportRevenueReportBtn) {
        exportRevenueReportBtn.addEventListener('click', exportRevenueReport);
    }
    
    // Xử lý cập nhật biểu đồ doanh thu
    const updateRevenueChartBtn = document.getElementById('update-revenue-chart');
    if (updateRevenueChartBtn) {
        updateRevenueChartBtn.addEventListener('click', updateRevenueChart);
    }
    
    // Xử lý cập nhật biểu đồ doanh thu theo danh mục
    const updateCategoryRevenueBtn = document.getElementById('update-category-revenue');
    if (updateCategoryRevenueBtn) {
        updateCategoryRevenueBtn.addEventListener('click', updateCategoryRevenueChart);
    }
    
    // Xử lý cập nhật sản phẩm bán chạy
    const updateTopProductsBtn = document.getElementById('update-top-products');
    if (updateTopProductsBtn) {
        updateTopProductsBtn.addEventListener('click', updateTopProducts);
    }
}

// Tải dữ liệu dashboard
function loadDashboard() {
    // Tải số liệu thống kê tổng quan
    fetchDashboardStats();
    
    // Tải biểu đồ doanh thu
    createRevenueChart();
    
    // Tải biểu đồ danh mục
    createCategoryChart();
    
    // Tải đơn hàng gần đây
    loadRecentOrders();
}

// Tải số liệu thống kê tổng quan
function fetchDashboardStats() {
    try {
        // Trong tình huống thực tế, bạn sẽ lấy dữ liệu từ API
        // Demo: Hiển thị dữ liệu mẫu
        document.getElementById('total-products').textContent = '123';
        document.getElementById('today-orders').textContent = '7';
        document.getElementById('total-users').textContent = '456';
        document.getElementById('monthly-revenue').textContent = formatCurrency(45678000);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        showAlert('Không thể tải dữ liệu thống kê!', 'danger');
    }
}

// Tạo biểu đồ doanh thu
function createRevenueChart() {
    try {
        const ctx = document.getElementById('revenue-chart').getContext('2d');
        
        // Dữ liệu mẫu
        const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const revenue = [25000000, 30000000, 28000000, 32000000, 35000000, 40000000, 38000000, 42000000, 45000000, 50000000, 48000000, 52000000];
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: revenue,
                    backgroundColor: 'rgba(13, 110, 253, 0.6)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value, false);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating revenue chart:', error);
    }
}

// Tạo biểu đồ danh mục
function createCategoryChart() {
    try {
        const ctx = document.getElementById('category-chart').getContext('2d');
        
        // Dữ liệu mẫu
        const categories = ['Laptop', 'PC & Máy tính', 'Linh kiện', 'Màn hình', 'Gaming Gear'];
        const products = [45, 30, 25, 15, 35];
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: products,
                    backgroundColor: [
                        'rgba(13, 110, 253, 0.7)',
                        'rgba(220, 53, 69, 0.7)',
                        'rgba(25, 135, 84, 0.7)',
                        'rgba(255, 193, 7, 0.7)',
                        'rgba(111, 66, 193, 0.7)'
                    ],
                    borderColor: [
                        'rgba(13, 110, 253, 1)',
                        'rgba(220, 53, 69, 1)',
                        'rgba(25, 135, 84, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(111, 66, 193, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating category chart:', error);
    }
}

// Tải đơn hàng gần đây
function loadRecentOrders() {
    try {
        // Demo: Hiển thị dữ liệu mẫu
        const recentOrdersContainer = document.getElementById('recent-orders');
        
        const orders = [
            { id: 'DH2023001', customer: 'Nguyễn Văn A', date: '2023-07-15', status: 'completed', total: 15000000 },
            { id: 'DH2023002', customer: 'Trần Thị B', date: '2023-07-16', status: 'processing', total: 8500000 },
            { id: 'DH2023003', customer: 'Lê Văn C', date: '2023-07-16', status: 'pending', total: 12000000 },
            { id: 'DH2023004', customer: 'Phạm Thị D', date: '2023-07-17', status: 'shipped', total: 21000000 },
            { id: 'DH2023005', customer: 'Hoàng Văn E', date: '2023-07-17', status: 'cancelled', total: 5000000 }
        ];
        
        recentOrdersContainer.innerHTML = '';
        
        orders.forEach(order => {
            recentOrdersContainer.innerHTML += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.customer}</td>
                    <td>${formatDate(order.date)}</td>
                    <td>${getStatusBadge(order.status)}</td>
                    <td>${formatCurrency(order.total)}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewOrderDetails('${order.id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Xem chi tiết đơn hàng
function viewOrderDetails(orderId) {
    try {
        // Trong tình huống thực tế, bạn sẽ gọi API để lấy chi tiết đơn hàng
        
        // Demo: Hiển thị thông tin mẫu
        document.getElementById('order-id-display').textContent = orderId;
        document.getElementById('order-id').textContent = orderId;
        document.getElementById('order-date').textContent = '17/07/2023';
        document.getElementById('order-status').textContent = 'Đang xử lý';
        document.getElementById('order-payment-method').textContent = 'Thanh toán khi nhận hàng (COD)';
        document.getElementById('order-shipping-method').textContent = 'Giao hàng tiêu chuẩn';
        
        document.getElementById('customer-name').textContent = 'Nguyễn Văn A';
        document.getElementById('customer-email').textContent = 'nguyenvana@example.com';
        document.getElementById('customer-phone').textContent = '0987654321';
        document.getElementById('customer-address').textContent = '123 Đường ABC, Quận 1, TP. HCM';
        
        // Demo: Các sản phẩm trong đơn hàng
        const orderItems = document.getElementById('order-items');
        orderItems.innerHTML = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="/images/laptop-nitro-5.jpg" alt="Laptop Gaming Acer Nitro 5" class="img-thumbnail me-2" style="width: 50px;">
                        <div>Laptop Gaming Acer Nitro 5</div>
                    </div>
                </td>
                <td>22,990,000 ₫</td>
                <td>1</td>
                <td>22,990,000 ₫</td>
            </tr>
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="/images/mouse-g502.jpg" alt="Chuột Gaming Logitech G502 HERO" class="img-thumbnail me-2" style="width: 50px;">
                        <div>Chuột Gaming Logitech G502 HERO</div>
                    </div>
                </td>
                <td>1,790,000 ₫</td>
                <td>1</td>
                <td>1,790,000 ₫</td>
            </tr>
        `;
        
        document.getElementById('order-subtotal').textContent = '24,780,000 ₫';
        document.getElementById('order-shipping').textContent = '30,000 ₫';
        document.getElementById('order-discount').textContent = '0 ₫';
        document.getElementById('order-total').textContent = '24,810,000 ₫';
        
        // Hiển thị modal
        const orderDetailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
        orderDetailModal.show();
    } catch (error) {
        console.error('Error loading order details:', error);
        showAlert('Không thể tải chi tiết đơn hàng!', 'danger');
    }
}

// Cập nhật trạng thái đơn hàng
function updateOrderStatus() {
    try {
        const orderId = document.getElementById('order-id').textContent;
        const status = document.getElementById('update-order-status').value;
        
        // Trong tình huống thực tế, bạn sẽ gọi API để cập nhật trạng thái
        
        // Demo: Hiển thị thông báo thành công
        showAlert(`Đã cập nhật trạng thái đơn hàng ${orderId} thành ${getStatusText(status)}`, 'success');
        
        // Đóng modal
        const orderDetailModal = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
        orderDetailModal.hide();
        
        // Cập nhật lại danh sách đơn hàng
        if (document.getElementById('orders-section').classList.contains('active')) {
            loadOrders();
        } else {
            loadRecentOrders();
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showAlert('Không thể cập nhật trạng thái đơn hàng!', 'danger');
    }
}

// Tải danh sách danh mục
function loadCategories() {
    try {
        // Trong tình huống thực tế, bạn sẽ gọi API để lấy danh sách danh mục
        
        // Demo: Danh mục mẫu
        const categories = [
            { id: '1', name: 'Laptop' },
            { id: '2', name: 'PC & Máy tính' },
            { id: '3', name: 'Linh kiện máy tính' },
            { id: '4', name: 'Màn hình' },
            { id: '5', name: 'Gaming Gear' }
        ];
        
        // Cập nhật dropdown danh mục trong form sản phẩm
        const productCategory = document.getElementById('product-category');
        const filterCategory = document.getElementById('filter-category');
        
        if (productCategory) {
            productCategory.innerHTML = '<option value="">-- Chọn danh mục --</option>';
            categories.forEach(category => {
                productCategory.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }
        
        if (filterCategory) {
            filterCategory.innerHTML = '<option value="all">Tất cả</option>';
            categories.forEach(category => {
                filterCategory.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showAlert('Không thể tải danh sách danh mục!', 'danger');
    }
}

// Tải danh sách danh mục cho trang quản lý danh mục
function loadCategoriesList() {
    try {
        // Trong tình huống thực tế, bạn sẽ gọi API để lấy danh sách danh mục
        
        // Demo: Danh mục mẫu
        const categories = [
            { id: '1', name: 'Laptop', slug: 'laptop', productCount: 25, createdAt: '2023-01-01T00:00:00.000Z' },
            { id: '2', name: 'PC & Máy tính', slug: 'pc-may-tinh', productCount: 18, createdAt: '2023-01-02T00:00:00.000Z' },
            { id: '3', name: 'Linh kiện máy tính', slug: 'linh-kien-may-tinh', productCount: 42, createdAt: '2023-01-03T00:00:00.000Z' },
            { id: '4', name: 'Màn hình', slug: 'man-hinh', productCount: 15, createdAt: '2023-01-04T00:00:00.000Z' },
            { id: '5', name: 'Gaming Gear', slug: 'gaming-gear', productCount: 30, createdAt: '2023-01-05T00:00:00.000Z' }
        ];
        
        const categoriesListContainer = document.getElementById('categories-list');
        
        if (categoriesListContainer) {
            categoriesListContainer.innerHTML = '';
            
            categories.forEach(category => {
                categoriesListContainer.innerHTML += `
                    <tr>
                        <td>${category.id}</td>
                        <td>${category.name}</td>
                        <td>${category.slug}</td>
                        <td>${category.productCount}</td>
                        <td>${formatDate(category.createdAt)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary me-1" onclick="editCategory('${category.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="showDeleteCategoryConfirm('${category.id}', '${category.name}', ${category.productCount})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error('Error loading categories list:', error);
        showAlert('Không thể tải danh sách danh mục!', 'danger');
    }
}

// Tải danh sách sản phẩm
function loadProducts(page = 1) {
    try {
        // Các tham số tìm kiếm
        const search = document.getElementById('search-products').value;
        const category = document.getElementById('filter-category').value;
        const perPage = document.getElementById('products-per-page').value;
        
        // Trong tình huống thực tế, bạn sẽ gọi API với các tham số trên
        
        // Demo: Sản phẩm mẫu
        const products = [
            { id: '1', name: 'Laptop Gaming Acer Nitro 5', category: 'Laptop', price: 22990000, image: '/images/laptop-nitro-5.jpg', createdAt: '2023-01-15T14:30:00.000Z' },
            { id: '2', name: 'Chuột gaming Logitech G502 HERO', category: 'Gaming Gear', price: 1790000, image: '/images/mouse-g502.jpg', createdAt: '2023-01-20T09:15:00.000Z' },
            { id: '3', name: 'Bàn phím cơ Keychron K2', category: 'Gaming Gear', price: 2190000, image: '/images/keyboard-keychron.jpg', createdAt: '2023-01-25T11:45:00.000Z' },
            { id: '4', name: 'Màn hình Gaming ASUS TUF 27"', category: 'Màn hình', price: 7490000, image: '/images/monitor-asus.jpg', createdAt: '2023-02-01T08:20:00.000Z' },
            { id: '5', name: 'PC Gaming Intel Core i7', category: 'PC & Máy tính', price: 25990000, image: '/images/pc-gaming.jpg', createdAt: '2023-02-05T10:30:00.000Z' },
            { id: '6', name: 'Card đồ họa NVIDIA RTX 3070', category: 'Linh kiện máy tính', price: 18500000, image: '/images/gpu-rtx.jpg', createdAt: '2023-02-10T14:45:00.000Z' },
            { id: '7', name: 'Laptop Dell XPS 13', category: 'Laptop', price: 32990000, image: '/images/laptop-dell.jpg', createdAt: '2023-02-15T09:10:00.000Z' },
            { id: '8', name: 'Tai nghe Gaming HyperX Cloud II', category: 'Gaming Gear', price: 2490000, image: '/images/headset-hyperx.jpg', createdAt: '2023-02-20T11:25:00.000Z' },
            { id: '9', name: 'SSD Samsung 970 EVO 1TB', category: 'Linh kiện máy tính', price: 3590000, image: '/images/ssd-samsung.jpg', createdAt: '2023-02-25T15:40:00.000Z' },
            { id: '10', name: 'Laptop MSI GS66 Stealth', category: 'Laptop', price: 45990000, image: '/images/laptop-msi.jpg', createdAt: '2023-03-01T13:15:00.000Z' }
        ];
        
        // Lọc sản phẩm theo danh mục (nếu có)
        let filteredProducts = products;
        if (category && category !== 'all') {
            // Trong demo này, chúng ta sẽ lọc dựa trên tên danh mục
            // Trong thực tế, bạn sẽ lọc theo category ID
            const categoryName = document.getElementById('filter-category').options[document.getElementById('filter-category').selectedIndex].text;
            filteredProducts = products.filter(product => product.category === categoryName);
        }
        
        // Lọc sản phẩm theo từ khóa tìm kiếm (nếu có)
        if (search) {
            filteredProducts = filteredProducts.filter(product => 
                product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.id.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        // Phân trang
        const totalProducts = filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / perPage);
        
        // Tính chỉ số bắt đầu và kết thúc
        const startIndex = (page - 1) * perPage;
        const endIndex = Math.min(startIndex + parseInt(perPage), totalProducts);
        
        // Lấy sản phẩm cho trang hiện tại
        const currentProducts = filteredProducts.slice(startIndex, endIndex);
        
        // Hiển thị sản phẩm
        const productsListContainer = document.getElementById('products-list');
        productsListContainer.innerHTML = '';
        
        currentProducts.forEach(product => {
            productsListContainer.innerHTML += `
                <tr>
                    <td>${product.id}</td>
                    <td>
                        <img src="${product.image}" alt="${product.name}" class="img-thumbnail">
                    </td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${formatDate(product.createdAt)}</td>
                    <td>
                        <div class="d-flex">
                            <button class="btn btn-sm btn-primary me-1" onclick="editProduct('${product.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="showDeleteProductConfirm('${product.id}', '${product.name}')">
                                <i class="bi bi-trash"></i>
                            </button>
                            <button class="btn btn-sm btn-info ms-1" onclick="viewProductDetails('${product.id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        // Cập nhật thông tin hiển thị
        document.getElementById('products-showing-info').textContent = 
            `Hiển thị ${startIndex + 1}-${endIndex} trên ${totalProducts} sản phẩm`;
        
        // Tạo phân trang
        renderPagination('products-pagination', totalPages, page, loadProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Không thể tải danh sách sản phẩm!', 'danger');
    }
}

// Xem chi tiết sản phẩm
function viewProductDetails(productId) {
    // Trong tình huống thực tế, bạn sẽ chuyển hướng đến trang chi tiết sản phẩm
    window.open(`/product-detail.html?id=${productId}`, '_blank');
}

// Hàm khởi tạo trang admin
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra quyền admin
    if (!checkAdminAuth()) {
        return;
    }
    
    // Khởi tạo biểu đồ và tải dữ liệu
    loadDashboard();
    
    // Khởi tạo datepicker cho các trường ngày tháng
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        // Đặt giá trị mặc định cho trường ngày là ngày hiện tại
        if (input.id === 'revenue-to-date' || input.id === 'filter-to-date') {
            input.valueAsDate = new Date();
        }
        // Đặt giá trị mặc định cho trường từ ngày là 30 ngày trước
        if (input.id === 'revenue-from-date' || input.id === 'filter-from-date') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            input.valueAsDate = thirtyDaysAgo;
        }
    });
    
    // Đặt giá trị mặc định cho trường tháng
    const monthInput = document.getElementById('revenue-month');
    if (monthInput) {
        const date = new Date();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        monthInput.value = `${year}-${month.toString().padStart(2, '0')}`;
    }
});