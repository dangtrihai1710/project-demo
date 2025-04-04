// Hiển thị giỏ hàng trên trang giỏ hàng
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xem đang ở trang giỏ hàng không
    if (window.location.pathname.includes('/cart.html') || window.location.pathname.endsWith('/cart')) {
        displayCart();
    }
    
    // Cập nhật số lượng sản phẩm trong giỏ hàng trên header
    updateCartCount();
});

// Lấy giỏ hàng từ máy chủ hoặc localStorage
async function getCart() {
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
            
            if (!response.ok) {
                throw new Error('Không thể lấy giỏ hàng từ máy chủ');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching cart from server:', error);
            return { items: [], total: 0 };
        }
    } else {
        // Người dùng chưa đăng nhập, lấy giỏ hàng từ localStorage
        return JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };
    }
}

// Hiển thị giỏ hàng
async function displayCart() {
    // Lấy dữ liệu giỏ hàng
    const cart = await getCart();
    
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCart = document.getElementById('empty-cart');
    
    if (!cartItemsContainer) {
        console.error('Không tìm thấy phần tử #cart-items');
        return;
    }
    
    // Kiểm tra giỏ hàng trống
    if (cart.items.length === 0) {
        cartItemsContainer.innerHTML = '';
        if (cartSummary) cartSummary.classList.add('d-none');
        if (emptyCart) emptyCart.classList.remove('d-none');
        return;
    }
    
    // Hiển thị các sản phẩm trong giỏ hàng
    let cartHTML = `
        <div class="table-responsive">
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th scope="col">Sản phẩm</th>
                        <th scope="col">Giá</th>
                        <th scope="col">Số lượng</th>
                        <th scope="col">Tổng</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    cart.items.forEach(item => {
        cartHTML += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.image || '/images/product-placeholder.jpg'}" alt="${item.name}" class="img-thumbnail me-3" style="width: 80px;">
                        <div>
                            <h6 class="mb-0">${item.name}</h6>
                            <small class="text-muted">Mã: ${item.productId}</small>
                        </div>
                    </div>
                </td>
                <td>${formatCurrency(item.price)}</td>
                <td>
                    <div class="input-group" style="width: 130px;">
                        <button class="btn btn-outline-secondary btn-sm" type="button" 
                            onclick="updateCartItemQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" class="form-control form-control-sm text-center" value="${item.quantity}" min="1"
                            onchange="updateCartItemQuantity('${item.id}', this.value)">
                        <button class="btn btn-outline-secondary btn-sm" type="button"
                            onclick="updateCartItemQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                </td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
                <td>
                    <button class="btn btn-outline-danger btn-sm" onclick="removeCartItem('${item.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    cartHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    cartItemsContainer.innerHTML = cartHTML;
    
    // Hiển thị tổng thanh toán
    if (cartSummary) {
        cartSummary.classList.remove('d-none');
        document.getElementById('subtotal').textContent = formatCurrency(cart.total);
        document.getElementById('discount').textContent = formatCurrency(0);
        document.getElementById('shipping').textContent = formatCurrency(0);
        document.getElementById('total').textContent = formatCurrency(cart.total);
    }
    
    if (emptyCart) emptyCart.classList.add('d-none');
    
    // Thiết lập sự kiện cho nút xóa giỏ hàng
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
                clearCart();
            }
        });
    }
}

// Cập nhật số lượng sản phẩm trong giỏ hàng
async function updateCartItemQuantity(itemId, quantity) {
    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity < 0) quantity = 0;
    
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (user && token) {
        try {
            // Người dùng đã đăng nhập, cập nhật trên máy chủ
            const response = await fetch(`/api/cart/update/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'user-id': user.id
                },
                body: JSON.stringify({ quantity })
            });
            
            if (!response.ok) {
                throw new Error('Không thể cập nhật giỏ hàng');
            }
            
            // Cập nhật hiển thị
            displayCart();
            updateCartCount();
            
        } catch (error) {
            console.error('Error updating cart:', error);
            showAlert('Không thể cập nhật giỏ hàng', 'danger');
        }
    } else {
        // Người dùng chưa đăng nhập, cập nhật giỏ hàng cục bộ
        // Lấy giỏ hàng từ localStorage
        const cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };
        
        // Tìm index của sản phẩm cần cập nhật
        const itemIndex = cart.items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) return;
        
        if (quantity === 0) {
            // Nếu số lượng = 0, xóa sản phẩm khỏi giỏ hàng
            cart.items.splice(itemIndex, 1);
        } else {
            // Cập nhật số lượng
            cart.items[itemIndex].quantity = quantity;
        }
        
        // Tính lại tổng giá trị giỏ hàng
        cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Lưu giỏ hàng vào localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Cập nhật hiển thị
        displayCart();
        updateCartCount();
    }
}

// Xóa sản phẩm khỏi giỏ hàng
async function removeCartItem(itemId) {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (user && token) {
            try {
                // Người dùng đã đăng nhập, xóa trên máy chủ
                const response = await fetch(`/api/cart/remove/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-id': user.id
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Không thể xóa sản phẩm khỏi giỏ hàng');
                }
                
                // Cập nhật hiển thị
                displayCart();
                updateCartCount();
                
                // Hiển thị thông báo
                showAlert('Đã xóa sản phẩm khỏi giỏ hàng!', 'success');
                
            } catch (error) {
                console.error('Error removing item from cart:', error);
                showAlert('Không thể xóa sản phẩm khỏi giỏ hàng', 'danger');
            }
        } else {
            // Người dùng chưa đăng nhập, xóa khỏi giỏ hàng cục bộ
            // Lấy giỏ hàng từ localStorage
            const cart = JSON.parse(localStorage.getItem('cart')) || { items: [], total: 0 };
            
            // Lọc ra các sản phẩm không bị xóa
            cart.items = cart.items.filter(item => item.id !== itemId);
            
            // Tính lại tổng giá trị giỏ hàng
            cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            
            // Lưu giỏ hàng vào localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Cập nhật hiển thị
            displayCart();
            updateCartCount();
            
            // Hiển thị thông báo
            showAlert('Đã xóa sản phẩm khỏi giỏ hàng!', 'success');
        }
    }
}

// Xóa toàn bộ giỏ hàng
async function clearCart() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (user && token) {
        try {
            // Người dùng đã đăng nhập, xóa giỏ hàng trên máy chủ
            const response = await fetch('/api/cart/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'user-id': user.id
                }
            });
            
            if (!response.ok) {
                throw new Error('Không thể xóa toàn bộ giỏ hàng');
            }
            
            // Cập nhật hiển thị
            displayCart();
            updateCartCount();
            
            // Hiển thị thông báo
            showAlert('Đã xóa toàn bộ giỏ hàng!', 'success');
            
        } catch (error) {
            console.error('Error clearing cart:', error);
            showAlert('Không thể xóa toàn bộ giỏ hàng', 'danger');
        }
    } else {
        // Người dùng chưa đăng nhập, xóa giỏ hàng cục bộ
        // Tạo giỏ hàng trống
        const emptyCart = { items: [], total: 0 };
        
        // Lưu giỏ hàng trống vào localStorage
        localStorage.setItem('cart', JSON.stringify(emptyCart));
        
        // Cập nhật hiển thị
        displayCart();
        updateCartCount();
        
        // Hiển thị thông báo
        showAlert('Đã xóa toàn bộ giỏ hàng!', 'success');
    }
}

// Cập nhật số lượng sản phẩm hiển thị trên icon giỏ hàng
async function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const cart = await getCart();
        cartCountElement.textContent = cart.items.length;
    }
}

// Thêm sản phẩm vào giỏ hàng
async function addToCart(productId, quantity = 1) {
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
}

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