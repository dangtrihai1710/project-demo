document.addEventListener('DOMContentLoaded', function() {
    // Tải danh sách sản phẩm nổi bật
    loadFeaturedProducts();
    
    // Tải danh mục nổi bật
    loadFeaturedCategories();
    
    // Khởi tạo các sự kiện và chức năng khác
    initializeEvents();
});

// Tải danh sách sản phẩm nổi bật
async function loadFeaturedProducts() {
    const products = await fetchProducts();
    
    if (products.length > 0) {
        // Hiển thị các sản phẩm nổi bật trên trang chủ
        const featuredProducts = products.slice(0, 6); // Lấy tối đa 6 sản phẩm
        displayProducts(featuredProducts, '.product-list');
    }
}

// Tải danh mục nổi bật
async function loadFeaturedCategories() {
    try {
        // Lấy danh mục nổi bật
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
            throw new Error('Không thể tải danh mục');
        }
        
        const categories = await response.json();
        
        // Lọc danh mục nổi bật
        const featuredCategories = categories.filter(category => category.featured && category.parentId === null);
        
        // Hiển thị tối đa 3 danh mục nổi bật
        const categoryContainer = document.querySelector('.row.mb-4 .col-12').nextElementSibling.parentElement;
        
        if (categoryContainer && featuredCategories.length > 0) {
            // Xóa nội dung cũ
            categoryContainer.innerHTML = `
                <div class="col-12">
                    <h2 class="border-bottom pb-2">Danh mục nổi bật</h2>
                </div>
            `;
            
            // Hiển thị danh mục nổi bật
            featuredCategories.slice(0, 3).forEach(category => {
                const categoryColumn = document.createElement('div');
                categoryColumn.className = 'col-md-4 mb-3';
                categoryColumn.innerHTML = `
                    <div class="card text-center h-100">
                        <div class="card-body">
                            <i class="bi ${getCategoryIcon(category.id)} fs-1 text-primary"></i>
                            <h5 class="card-title mt-3">${category.name}</h5>
                            <p class="card-text">${category.description}</p>
                            <a href="/category.html?id=${category.id}" class="btn btn-outline-primary">Xem thêm</a>
                        </div>
                    </div>
                `;
                categoryContainer.appendChild(categoryColumn);
            });
        }
    } catch (error) {
        console.error('Error loading featured categories:', error);
    }
}

// Lấy icon tương ứng cho từng danh mục
function getCategoryIcon(categoryId) {
    const icons = {
        'laptop': 'bi-laptop',
        'pc': 'bi-pc-display',
        'components': 'bi-cpu',
        'monitor': 'bi-display',
        'gaming-gear': 'bi-controller',
        'networking': 'bi-router',
        'default': 'bi-box'
    };
    
    return icons[categoryId] || icons['default'];
}

// Khởi tạo các sự kiện
function initializeEvents() {
    // Xử lý sự kiện tìm kiếm
    const searchForm = document.querySelector('form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="search"]');
            if (searchInput && searchInput.value.trim()) {
                // Chuyển hướng đến trang tìm kiếm với tham số query
                window.location.href = `/search.html?q=${encodeURIComponent(searchInput.value.trim())}`;
            }
        });
    }
    
    // Kiểm tra trạng thái đăng nhập và cập nhật UI
    checkAuthAndUpdateUI();
}

// Kiểm tra trạng thái đăng nhập và cập nhật UI
async function checkAuthAndUpdateUI() {
    const isLoggedIn = await checkAuthStatus();
    
    // Cập nhật UI tùy thuộc vào trạng thái đăng nhập
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (isLoggedIn && user) {
            // Người dùng đã đăng nhập
            const dropdownMenu = userDropdown.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.innerHTML = `
                    <li><a class="dropdown-item" href="/account.html">Tài khoản của tôi</a></li>
                    <li><a class="dropdown-item" href="/orders.html">Đơn hàng của tôi</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logout-btn">Đăng xuất</a></li>
                `;
                
                // Thêm sự kiện đăng xuất
                const logoutBtn = dropdownMenu.querySelector('#logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', handleLogout);
                }
            }
            
            // Cập nhật icon và tên người dùng
            const navLink = userDropdown.querySelector('.nav-link');
            if (navLink) {
                navLink.innerHTML = `
                    <i class="bi bi-person-check"></i> ${user.username}
                `;
            }
        }
    }
}

// Xử lý đăng xuất
async function handleLogout(e) {
    e.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (token && user) {
            // Gọi API đăng xuất
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'user-id': user.id
                }
            });
        }
        
        // Xóa thông tin người dùng khỏi localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Hiển thị thông báo thành công
        showAlert('Đăng xuất thành công!', 'success');
        
        // Chuyển hướng về trang chủ
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
    } catch (error) {
        console.error('Error logging out:', error);
        
        // Trong trường hợp lỗi, vẫn xóa thông tin người dùng và chuyển hướng
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

// Thêm sản phẩm vào giỏ hàng - Định nghĩa toàn cục để có thể truy cập từ HTML
window.addToCart = async function(productId, quantity = 1) {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (user && token) {
        try {
            // Người dùng đã đăng nhập, thêm vào giỏ hàng trên máy chủ
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'user-id': user.id
                },
                body: JSON.stringify({ productId, quantity })
            });
            
            if (!response.ok) {
                throw new Error('Không thể thêm sản phẩm vào giỏ hàng');
            }
            
            // Cập nhật hiển thị số lượng sản phẩm trong giỏ hàng
            updateCartCount();
            
            // Hiển thị thông báo thành công
            showAlert('Đã thêm sản phẩm vào giỏ hàng!', 'success');
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            showAlert('Không thể thêm sản phẩm vào giỏ hàng!', 'danger');
        }
    } else {
        try {
            // Người dùng chưa đăng nhập, thêm vào giỏ hàng cục bộ
            // Lấy thông tin sản phẩm từ API
            const response = await fetch('/api/products/' + productId);
            
            if (!response.ok) {
                throw new Error('Không thể lấy thông tin sản phẩm');
            }
            
            const product = await response.json();
            
            // Lấy giỏ hàng hiện tại từ localStorage hoặc tạo mới nếu chưa có
            let cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };
            
            // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
            const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
            
            if (existingItemIndex !== -1) {
                // Nếu sản phẩm đã có, tăng số lượng
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                // Nếu sản phẩm chưa có, thêm mới
                cart.items.push({
                    id: Date.now().toString(), // ID duy nhất cho item trong giỏ hàng
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    image: product.image || '/images/product-placeholder.jpg',
                    quantity: quantity
                });
            }
            
            // Tính lại tổng giá trị giỏ hàng
            cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            
            // Lưu giỏ hàng vào localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Cập nhật hiển thị số lượng sản phẩm trong giỏ hàng
            updateCartCount();
            
            // Hiển thị thông báo thành công
            showAlert('Đã thêm sản phẩm vào giỏ hàng!', 'success');
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            showAlert('Không thể thêm sản phẩm vào giỏ hàng!', 'danger');
        }
    }
};

// Format tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Hiển thị thông báo
function showAlert(message, type = 'info') {
    const alertBox = document.createElement('div');
    alertBox.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertBox.setAttribute('role', 'alert');
    alertBox.style.zIndex = '1050';
    alertBox.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertBox);
    
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => {
            alertBox.remove();
        }, 300);
    }, 3000);
}