// Lấy danh sách sản phẩm
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Lấy thông tin chi tiết sản phẩm
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }
        const product = await response.json();
        displayProductDetails(product);
        return product;
    } catch (error) {
        console.error('Error fetching product details:', error);
        // Hiển thị thông báo lỗi
        document.getElementById('product-info').innerHTML = `
            <div class="alert alert-danger">
                Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.
            </div>
        `;
        return null;
    }
}

// Hiển thị danh sách sản phẩm
function displayProducts(products, containerSelector = '.product-list') {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col-md-4 col-sm-6 mb-4 product-card';
        productCard.innerHTML = `
            <div class="card h-100">
                <img src="${product.image || '/images/product-placeholder.jpg'}" class="card-img-top product-image" alt="${product.name}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title product-name">${product.name}</h5>
                    <p class="card-text text-truncate">${product.description}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold text-primary product-price" data-price="${product.price}">${formatCurrency(product.price)}</span>
                            <span class="badge bg-success">Còn hàng</span>
                        </div>
                        <div class="d-grid gap-2">
                            <a href="/product-detail.html?id=${product.id}" class="btn btn-outline-primary">Xem chi tiết</a>
                            <button class="btn btn-primary add-to-cart-btn" onclick="addToCart('${product.id}')" data-product-id="${product.id}">
                                <i class="bi bi-cart-plus"></i> Thêm vào giỏ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
    
    // Đảm bảo tất cả nút "Thêm vào giỏ" đều có sự kiện click
    attachAddToCartEvents();
}

// Gắn sự kiện cho các nút "Thêm vào giỏ"
function attachAddToCartEvents() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        const productId = button.getAttribute('data-product-id');
        button.onclick = function() {
            addToCart(productId);
        };
    });
}

// Hiển thị chi tiết sản phẩm
function displayProductDetails(product) {
    // Hiển thị hình ảnh sản phẩm
    document.getElementById('product-image').innerHTML = `
        <img src="${product.image || '/images/product-placeholder.jpg'}" class="img-fluid" alt="${product.name}">
    `;
    
    // Hiển thị thông tin sản phẩm
    document.getElementById('product-info').innerHTML = `
        <h1>${product.name}</h1>
        <div class="mb-3">
            <span class="badge bg-success">Còn hàng</span>
            <span class="badge bg-info">Bảo hành 12 tháng</span>
        </div>
        <div class="fs-2 fw-bold text-primary mb-3">
            ${formatCurrency(product.price)}
        </div>
        <div class="mb-3">
            <p>${product.description}</p>
        </div>
        <div class="d-flex align-items-center">
            <label for="quantity" class="me-2">Số lượng:</label>
            <div class="input-group" style="width: 130px;">
                <button class="btn btn-outline-secondary" type="button" onclick="decreaseQuantity()">-</button>
                <input type="number" id="quantity" class="form-control text-center" value="1" min="1">
                <button class="btn btn-outline-secondary" type="button" onclick="increaseQuantity()">+</button>
            </div>
        </div>
    `;
    
    // Hiển thị mô tả sản phẩm
    document.getElementById('product-description').innerHTML = `
        <p>${product.description}</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, eget aliquam nisl nisl sit amet nisl.</p>
    `;
    
    // Hiển thị thông số kỹ thuật
    document.getElementById('product-specs').innerHTML = `
        <table class="table">
            <tbody>
                <tr>
                    <th scope="row">Thương hiệu</th>
                    <td>Brand XYZ</td>
                </tr>
                <tr>
                    <th scope="row">Model</th>
                    <td>XYZ-123</td>
                </tr>
                <tr>
                    <th scope="row">Bảo hành</th>
                    <td>12 tháng</td>
                </tr>
                <tr>
                    <th scope="row">Xuất xứ</th>
                    <td>Chính hãng</td>
                </tr>
            </tbody>
        </table>
    `;
    
    // Hiển thị đánh giá
    document.getElementById('product-reviews').innerHTML = `
        <div class="mb-4">
            <h5>Đánh giá sản phẩm</h5>
            <div class="d-flex align-items-center mb-2">
                <div class="me-2">
                    <i class="bi bi-star-fill text-warning"></i>
                    <i class="bi bi-star-fill text-warning"></i>
                    <i class="bi bi-star-fill text-warning"></i>
                    <i class="bi bi-star-fill text-warning"></i>
                    <i class="bi bi-star-half text-warning"></i>
                </div>
                <span>4.5/5 (10 đánh giá)</span>
            </div>
        </div>
        <div class="mb-3">
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <div>
                            <strong>Nguyễn Văn A</strong>
                            <div>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star text-warning"></i>
                            </div>
                        </div>
                        <small class="text-muted">15/06/2023</small>
                    </div>
                    <p class="mb-0">Sản phẩm tốt, đóng gói cẩn thận, giao hàng nhanh!</p>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <div>
                            <strong>Trần Thị B</strong>
                            <div>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                                <i class="bi bi-star-fill text-warning"></i>
                            </div>
                        </div>
                        <small class="text-muted">10/06/2023</small>
                    </div>
                    <p class="mb-0">Sản phẩm chất lượng, rất hài lòng với dịch vụ!</p>
                </div>
            </div>
        </div>
        <div>
            <h5>Viết đánh giá</h5>
            <form>
                <div class="mb-3">
                    <label>Đánh giá của bạn:</label>
                    <div>
                        <i class="bi bi-star fs-5" data-rating="1"></i>
                        <i class="bi bi-star fs-5" data-rating="2"></i>
                        <i class="bi bi-star fs-5" data-rating="3"></i>
                        <i class="bi bi-star fs-5" data-rating="4"></i>
                        <i class="bi bi-star fs-5" data-rating="5"></i>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="reviewContent" class="form-label">Nội dung đánh giá</label>
                    <textarea class="form-control" id="reviewContent" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Gửi đánh giá</button>
            </form>
        </div>
    `;
    
    // Thiết lập sự kiện cho nút "Thêm vào giỏ hàng"
    document.getElementById('add-to-cart-btn').addEventListener('click', function() {
        const quantity = parseInt(document.getElementById('quantity').value);
        addToCart(product.id, quantity);
    });
}

// Tăng số lượng sản phẩm
function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    quantityInput.value = parseInt(quantityInput.value) + 1;
}

// Giảm số lượng sản phẩm
function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
    }
}

// Format tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}