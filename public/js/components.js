document.addEventListener('DOMContentLoaded', function() {
    // Load header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        fetch('/components/header.html')
            .then(response => response.text())
            .then(data => {
                headerContainer.innerHTML = data;
                // Sau khi tải header, kiểm tra trạng thái đăng nhập
                checkLoginStatus();
                // Cập nhật số lượng trong giỏ hàng
                updateCartCount();
                // Tải danh mục cho menu dropdown
                loadCategoriesForMenu();
            })
            .catch(error => console.error('Error loading header:', error));
    }
    
    // Load footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('/components/footer.html')
            .then(response => response.text())
            .then(data => {
                footerContainer.innerHTML = data;
            })
            .catch(error => console.error('Error loading footer:', error));
    }
});

// Tải danh mục cho menu dropdown
async function loadCategoriesForMenu() {
    try {
        // Lấy tất cả danh mục
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
            throw new Error('Không thể tải danh mục');
        }
        
        const categories = await response.json();
        
        // Lọc danh mục chính (không có parentId)
        const mainCategories = categories.filter(category => category.parentId === null);
        
        // Lấy dropdown sản phẩm
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        if (!dropdownMenu) {
            return;
        }
        
        // Xóa mục mặc định
        dropdownMenu.innerHTML = '';
        
        // Thêm các danh mục vào dropdown
        mainCategories.forEach(category => {
            const categoryItem = document.createElement('li');
            const categoryLink = document.createElement('a');
            categoryLink.href = `/category.html?id=${category.id}`;
            categoryLink.className = 'dropdown-item';
            categoryLink.textContent = category.name;
            categoryItem.appendChild(categoryLink);
            dropdownMenu.appendChild(categoryItem);
            
            // Lọc và hiển thị danh mục con trong submenu (nếu có)
            const subCategories = categories.filter(subCat => subCat.parentId === category.id);
            
            if (subCategories.length > 0 && dropdownMenu.classList.contains('dropdown-submenu')) {
                // Nếu có submenu, thêm vào
                const subMenu = document.createElement('ul');
                subMenu.className = 'dropdown-menu';
                
                subCategories.forEach(subCategory => {
                    const subItem = document.createElement('li');
                    const subLink = document.createElement('a');
                    subLink.href = `/category.html?id=${subCategory.id}`;
                    subLink.className = 'dropdown-item';
                    subLink.textContent = subCategory.name;
                    subItem.appendChild(subLink);
                    subMenu.appendChild(subItem);
                });
                
                categoryItem.appendChild(subMenu);
            }
        });
        
        // Thêm divider
        const divider = document.createElement('li');
        divider.innerHTML = '<hr class="dropdown-divider">';
        dropdownMenu.appendChild(divider);
        
        // Thêm mục "Tất cả sản phẩm"
        const allProductsItem = document.createElement('li');
        const allProductsLink = document.createElement('a');
        allProductsLink.href = '/category.html';
        allProductsLink.className = 'dropdown-item';
        allProductsLink.textContent = 'Tất cả sản phẩm';
        allProductsItem.appendChild(allProductsLink);
        dropdownMenu.appendChild(allProductsItem);
        
    } catch (error) {
        console.error('Error loading categories for menu:', error);
    }
}

// Kiểm tra trạng thái đăng nhập và cập nhật UI
async function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (user && token) {
        try {
            // Kiểm tra token còn hạn sử dụng không
            const response = await fetch('/api/auth/check', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'user-id': user.id
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.isAuthenticated) {
                // Token hợp lệ, cập nhật UI
                updateUIForLoggedInUser(user);
            } else {
                // Token không hợp lệ, xóa thông tin người dùng
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }
}

// Cập nhật UI cho người dùng đã đăng nhập
function updateUIForLoggedInUser(user) {
    setTimeout(() => {
        const userDropdown = document.getElementById('user-dropdown');
        if (userDropdown) {
            userDropdown.querySelector('.dropdown-menu').innerHTML = `
                <li><a class="dropdown-item" href="/account.html">Tài khoản của tôi</a></li>
                <li><a class="dropdown-item" href="/orders.html">Đơn hàng</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" onclick="logout()">Đăng xuất</a></li>
            `;
            
            // Thay đổi icon và thêm tên người dùng
            userDropdown.querySelector('.nav-link').innerHTML = `
                <i class="bi bi-person-check"></i> ${user.username}
            `;
        }
    }, 100);
}

// Cập nhật số lượng trong giỏ hàng
async function updateCartCount() {
    setTimeout(async () => {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            // Lấy giỏ hàng
            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');
            
            if (user && token) {
                try {
                    // Người dùng đã đăng nhập, lấy giỏ hàng từ máy chủ
                    const response = await fetch('/api/cart', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'user-id': user.id
                        }
                    });
                    
                    if (response.ok) {
                        const cart = await response.json();
                        cartCount.textContent = cart.items.length;
                    } else {
                        cartCount.textContent = '0';
                    }
                } catch (error) {
                    console.error('Error fetching cart count:', error);
                    cartCount.textContent = '0';
                }
            } else {
                // Người dùng chưa đăng nhập, lấy giỏ hàng từ localStorage
                const cart = JSON.parse(localStorage.getItem('cart')) || { items: [] };
                cartCount.textContent = cart.items.length;
            }
        }
    }, 100);
}

// Đăng xuất
async function logout() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        if (token && user) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'user-id': user.id
                }
            });
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Hiển thị thông báo
    const alertBox = document.createElement('div');
    alertBox.className = `alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertBox.setAttribute('role', 'alert');
    alertBox.innerHTML = `
        Đăng xuất thành công!
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
    
    // Chuyển hướng về trang chủ
    window.location.href = '/';
}