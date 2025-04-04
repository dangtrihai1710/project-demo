document.addEventListener('DOMContentLoaded', function() {
    // Lấy slug danh mục từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');
    
    if (categoryId) {
        // Tải thông tin danh mục và sản phẩm
        loadCategoryPage(categoryId);
    } else {
        // Nếu không có id, hiển thị tất cả sản phẩm
        loadAllProducts();
    }
    
    // Tải danh mục cho sidebar
    loadCategorySidebar();
    
    // Thiết lập sự kiện
    setupEventListeners();
});

// Tải thông tin danh mục và sản phẩm trong danh mục
async function loadCategoryPage(categoryId) {
    try {
        // Lấy thông tin danh mục
        const categoryResponse = await fetch(`/api/categories/id/${categoryId}`);
        
        if (!categoryResponse.ok) {
            throw new Error('Không thể tải thông tin danh mục');
        }
        
        const category = await categoryResponse.json();
        
        // Hiển thị tiêu đề danh mục
        displayCategoryHeader(category);
        
        // Lấy sản phẩm trong danh mục
        const productsResponse = await fetch(`/api/categories/${categoryId}/products`);
        
        if (!productsResponse.ok) {
            throw new Error('Không thể tải sản phẩm');
        }
        
        const products = await productsResponse.json();
        
        // Hiển thị sản phẩm
        displayProducts(products);
        
        // Cập nhật tiêu đề trang
        document.title = `${category.name} - New Computer Store`;
        
    } catch (error) {
        console.error('Error loading category page:', error);
        displayError('Không thể tải trang danh mục. Vui lòng thử lại sau.');
    }
}

// Tải tất cả sản phẩm
async function loadAllProducts() {
    try {
        // Lấy tất cả sản phẩm
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error('Không thể tải sản phẩm');
        }
        
        const products = await response.json();
        
        // Hiển thị tiêu đề
        displayCategoryHeader({ name: 'Tất cả sản phẩm', description: 'Tất cả sản phẩm có sẵn tại cửa hàng' });
        
        // Hiển thị sản phẩm
        displayProducts(products);
        
        // Cập nhật tiêu đề trang
        document.title = 'Tất cả sản phẩm - New Computer Store';
        
    } catch (error) {
        console.error('Error loading products:', error);
        displayError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    }
}

// Hiển thị tiêu đề danh mục
function displayCategoryHeader(category) {
    const categoryHeader = document.getElementById('category-header');
    
    categoryHeader.innerHTML = `
        <div class="border-bottom pb-2 mb-4">
            <h1>${category.name}</h1>
            <p class="lead">${category.description || ''}</p>
        </div>
    `;
}

// Hiển thị sản phẩm
function displayProducts(products, viewMode = 'grid') {
    const productList = document.getElementById('product-list');
    const productCount = document.getElementById('product-count');
    const noProducts = document.getElementById('no-products');
    
    // Cập nhật số lượng sản phẩm
    productCount.textContent = `${products.length} sản phẩm`;
    
    // Kiểm tra xem có sản phẩm không
    if (products.length === 0) {
        productList.innerHTML = '';
        noProducts.classList.remove('d-none');
        document.getElementById('pagination-container').classList.add('d-none');
        return;
    }
    
    noProducts.classList.add('d-none');
    
    // Phân trang
    const itemsPerPage = 12;
    const currentPage = 1;
    const totalPages = Math.ceil(products.length / itemsPerPage);
    
    // Lấy sản phẩm cho trang hiện tại
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const currentProducts = products.slice(start, end);
    
    productList.innerHTML = '';
    
    if (viewMode === 'grid') {
        // Chế độ xem lưới
        currentProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'col-md-4 col-sm-6 mb-4';
            productCard.innerHTML = `
                <div class="card h-100">
                    <img src="${product.image || '/images/product-placeholder.jpg'}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: contain; padding: 1rem;">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-truncate">${product.description}</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="fw-bold text-primary">${formatCurrency(product.price)}</span>
                                <span class="badge bg-success">Còn hàng</span>
                            </div>
                            <div class="d-grid gap-2">
                                <a href="/product-detail.html?id=${product.id}" class="btn btn-outline-primary">Xem chi tiết</a>
                                <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
                                    <i class="bi bi-cart-plus"></i> Thêm vào giỏ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            productList.appendChild(productCard);
        });
    } else {
        // Chế độ xem danh sách
        currentProducts.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'col-12 mb-3';
            productItem.innerHTML = `
                <div class="card">
                    <div class="row g-0">
                        <div class="col-md-3">
                            <img src="${product.image || '/images/product-placeholder.jpg'}" class="img-fluid rounded-start" alt="${product.name}" style="height: 200px; object-fit: contain; padding: 1rem;">
                        </div>
                        <div class="col-md-9">
                            <div class="card-body h-100 d-flex flex-column">
                                <h5 class="card-title">${product.name}</h5>
                                <p class="card-text">${product.description}</p>
                                <div class="mt-auto">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="fw-bold text-primary">${formatCurrency(product.price)}</span>
                                        <div>
                                            <a href="/product-detail.html?id=${product.id}" class="btn btn-outline-primary me-2">Xem chi tiết</a>
                                            <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
                                                <i class="bi bi-cart-plus"></i> Thêm vào giỏ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            productList.appendChild(productItem);
        });
    }
    
    // Tạo phân trang
    createPagination(currentPage, totalPages, products);
    
    // Gán sự kiện cho các nút thêm vào giỏ hàng
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            addToCart(productId);
        });
    });
}

// Tạo phân trang
function createPagination(currentPage, totalPages, allProducts) {
    const paginationElement = document.getElementById('pagination');
    const paginationContainer = document.getElementById('pagination-container');
    
    if (totalPages <= 1) {
        paginationContainer.classList.add('d-none');
        return;
    }
    
    paginationContainer.classList.remove('d-none');
    paginationElement.innerHTML = '';
    
    // Nút Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous" data-page="${currentPage - 1}">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    paginationElement.appendChild(prevLi);
    
    // Các trang
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        paginationElement.appendChild(li);
    }
    
    // Nút Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next" data-page="${currentPage + 1}">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    paginationElement.appendChild(nextLi);
    
    // Gắn sự kiện click cho các nút phân trang
    paginationElement.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            if (page >= 1 && page <= totalPages) {
                // Tính toán sản phẩm cho trang được chọn
                const itemsPerPage = 12;
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const currentProducts = allProducts.slice(start, end);
                
                // Hiển thị sản phẩm
                const productList = document.getElementById('product-list');
                productList.innerHTML = '';
                
                // Lấy chế độ xem hiện tại
                const viewMode = document.getElementById('grid-view').classList.contains('active') ? 'grid' : 'list';
                
                // Hiển thị sản phẩm với chế độ xem hiện tại
                displayProducts(allProducts, viewMode);
                
                // Cập nhật phân trang
                createPagination(page, totalPages, allProducts);
                
                // Cuộn lên đầu danh sách sản phẩm
                productList.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Tải danh mục cho sidebar
async function loadCategorySidebar() {
    try {
        // Lấy tất cả danh mục
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
            throw new Error('Không thể tải danh mục');
        }
        
        const categories = await response.json();
        
        // Lọc danh mục chính (không có parentId)
        const mainCategories = categories.filter(category => category.parentId === null);
        
        // Hiển thị danh mục
        const categorySidebar = document.getElementById('category-sidebar');
        categorySidebar.innerHTML = '';
        
        // Thêm mục "Tất cả sản phẩm"
        const allProductsItem = document.createElement('a');
        allProductsItem.href = '/category.html';
        allProductsItem.className = 'list-group-item list-group-item-action';
        allProductsItem.textContent = 'Tất cả sản phẩm';
        categorySidebar.appendChild(allProductsItem);
        
        // Hiển thị danh mục chính
        mainCategories.forEach(category => {
            const categoryItem = document.createElement('a');
            categoryItem.href = `/category.html?id=${category.id}`;
            categoryItem.className = 'list-group-item list-group-item-action';
            categoryItem.textContent = category.name;
            categorySidebar.appendChild(categoryItem);
            
            // Lọc danh mục con
            const subCategories = categories.filter(subCat => subCat.parentId === category.id);
            
            // Hiển thị danh mục con (nếu có)
            subCategories.forEach(subCategory => {
                const subCategoryItem = document.createElement('a');
                subCategoryItem.href = `/category.html?id=${subCategory.id}`;
                subCategoryItem.className = 'list-group-item list-group-item-action ps-4';
                subCategoryItem.textContent = subCategory.name;
                categorySidebar.appendChild(subCategoryItem);
            });
        });
        
        // Highlight danh mục hiện tại
        const currentCategoryId = new URLSearchParams(window.location.search).get('id');
        
        if (currentCategoryId) {
            const activeItem = categorySidebar.querySelector(`a[href="/category.html?id=${currentCategoryId}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        } else {
            // Nếu không có id, highlight "Tất cả sản phẩm"
            allProductsItem.classList.add('active');
        }
        
    } catch (error) {
        console.error('Error loading category sidebar:', error);
        document.getElementById('category-sidebar').innerHTML = `
            <div class="list-group-item text-danger">
                <i class="bi bi-exclamation-triangle"></i> Không thể tải danh mục
            </div>
        `;
    }
}

// Thiết lập sự kiện
function setupEventListeners() {
    // Sự kiện cho nút chuyển chế độ xem
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    
    gridViewBtn.addEventListener('click', function() {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        
        // Lấy sản phẩm hiện tại và hiển thị lại với chế độ xem lưới
        reloadProductsWithCurrentFilters('grid');
    });
    
    listViewBtn.addEventListener('click', function() {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        
        // Lấy sản phẩm hiện tại và hiển thị lại với chế độ xem danh sách
        reloadProductsWithCurrentFilters('list');
    });
    
    // Đặt chế độ xem lưới là mặc định
    gridViewBtn.classList.add('active');
    
    // Sự kiện cho nút sắp xếp
    const sortSelect = document.getElementById('sort-select');
    
    sortSelect.addEventListener('change', function() {
        // Lấy sản phẩm hiện tại và sắp xếp lại
        reloadProductsWithCurrentFilters();
    });
    
    // Sự kiện cho nút áp dụng bộ lọc
    const applyFilterBtn = document.getElementById('apply-filter');
    
    applyFilterBtn.addEventListener('click', function() {
        // Lấy sản phẩm hiện tại và lọc lại
        reloadProductsWithCurrentFilters();
    });
}

// Tải lại sản phẩm với bộ lọc hiện tại
async function reloadProductsWithCurrentFilters(viewMode) {
    try {
        // Lấy categoryId từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('id');
        
        // Lấy sản phẩm (tất cả hoặc theo danh mục)
        let products;
        
        if (categoryId) {
            const response = await fetch(`/api/categories/${categoryId}/products`);
            if (!response.ok) throw new Error('Không thể tải sản phẩm');
            products = await response.json();
        } else {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Không thể tải sản phẩm');
            products = await response.json();
        }
        
        // Áp dụng bộ lọc
        products = applyFilters(products);
        
        // Áp dụng sắp xếp
        products = applySorting(products);
        
        // Hiển thị sản phẩm với chế độ xem đã chọn
        if (!viewMode) {
            // Nếu không có viewMode được chỉ định, lấy từ trạng thái nút
            viewMode = document.getElementById('grid-view').classList.contains('active') ? 'grid' : 'list';
        }
        
        displayProducts(products, viewMode);
        
    } catch (error) {
        console.error('Error reloading products:', error);
        displayError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    }
}

// Áp dụng bộ lọc cho sản phẩm
function applyFilters(products) {
    // Lọc theo khoảng giá
    const priceFilters = Array.from(document.querySelectorAll('.price-filter:checked')).map(checkbox => checkbox.value);
    
    if (priceFilters.length > 0) {
        products = products.filter(product => {
            return priceFilters.some(filter => {
                const [min, max] = filter.split('-').map(Number);
                return (product.price >= min && (max ? product.price <= max : true));
            });
        });
    }
    
    // Lọc theo khuyến mãi
    const discountFilter = document.getElementById('hasDiscount').checked;
    
    if (discountFilter) {
        products = products.filter(product => product.discount && product.discount > 0);
    }
    
    return products;
}

// Áp dụng sắp xếp cho sản phẩm
function applySorting(products) {
    const sortType = document.getElementById('sort-select').value;
    
    switch (sortType) {
        case 'newest':
            // Sắp xếp theo thời gian tạo (mới nhất trước)
            return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        case 'price-asc':
            // Sắp xếp theo giá tăng dần
            return products.sort((a, b) => a.price - b.price);
        
        case 'price-desc':
            // Sắp xếp theo giá giảm dần
            return products.sort((a, b) => b.price - a.price);
        
        case 'name-asc':
            // Sắp xếp theo tên A-Z
            return products.sort((a, b) => a.name.localeCompare(b.name));
        
        case 'name-desc':
            // Sắp xếp theo tên Z-A
            return products.sort((a, b) => b.name.localeCompare(a.name));
        
        default:
            return products;
    }
}

// Hiển thị thông báo lỗi
function displayError(message) {
    const productList = document.getElementById('product-list');
    
    productList.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="bi bi-exclamation-triangle text-danger fs-1"></i>
            <h3 class="mt-3">Lỗi</h3>
            <p>${message}</p>
        </div>
    `;
    
    document.getElementById('pagination-container').classList.add('d-none');
}

// Format tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}