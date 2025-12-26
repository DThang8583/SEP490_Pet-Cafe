import apiClient from '../config/config';
import { uploadFile } from './fileApi';

/**
 * Extract image URL from upload response
 * @param {string|Object} uploadResponse - Response from uploadFile
 * @returns {string|null} Image URL or null
 */
const extractImageUrl = (uploadResponse) => {
    if (!uploadResponse) return null;
    if (typeof uploadResponse === 'string') return uploadResponse;
    return uploadResponse.image_url || uploadResponse.url || uploadResponse.data?.image_url || uploadResponse.data?.url || null;
};

/**
 * Upload image file and return URL
 * @param {File} imageFile - Image file to upload
 * @returns {Promise<string|null>} Image URL or null
 */
const uploadImageFile = async (imageFile) => {
    if (!imageFile) return null;
    try {
        const uploadResponse = await uploadFile(imageFile);
        return extractImageUrl(uploadResponse);
    } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw new Error('Không thể tải ảnh lên. Vui lòng thử lại.');
        }
};

/**
 * Create pagination object
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Page size
 * @param {number} pageIndex - Page index
 * @returns {Object} Pagination object
 */
const createPagination = (totalItems, pageSize, pageIndex) => ({
    total_items_count: totalItems,
    page_size: pageSize,
    total_pages_count: Math.ceil(totalItems / pageSize) || 0,
    page_index: pageIndex,
    has_next: (pageIndex + 1) * pageSize < totalItems,
    has_previous: pageIndex > 0
});

/**
 * Get all products from official API
 * @param {Object} params - { IsActive, MinPrice, MaxPrice, MinCost, MaxCost, IsForPets, MinStockQuantity, MaxStockQuantity, PageIndex, PageSize }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllProducts = async (params = {}) => {
    const {
        IsActive,
        MinPrice,
        MaxPrice,
        MinCost,
        MaxCost,
        IsForPets,
        MinStockQuantity,
        MaxStockQuantity,
        PageIndex = 0,
        PageSize = 10
    } = params;

    try {
        const queryParams = {};
        if (IsActive !== undefined) queryParams.IsActive = IsActive;
        if (MinPrice !== undefined) queryParams.MinPrice = MinPrice;
        if (MaxPrice !== undefined) queryParams.MaxPrice = MaxPrice;
        if (MinCost !== undefined) queryParams.MinCost = MinCost;
        if (MaxCost !== undefined) queryParams.MaxCost = MaxCost;
        if (IsForPets !== undefined) queryParams.IsForPets = IsForPets;
        if (MinStockQuantity !== undefined) queryParams.MinStockQuantity = MinStockQuantity;
        if (MaxStockQuantity !== undefined) queryParams.MaxStockQuantity = MaxStockQuantity;
        // Backend expects `page` and `limit` query params (page is 0-based index).
        // Keep legacy PageIndex/PageSize for backward compatibility.
        if (PageIndex !== undefined) {
            queryParams.PageIndex = PageIndex;
            queryParams.page = PageIndex; // 0-based page index expected by API
        }
        if (PageSize !== undefined) {
            queryParams.PageSize = PageSize;
            queryParams.limit = PageSize;
        }

        const response = await apiClient.get('/products', {
            params: queryParams,
            timeout: 30000
        });

        const responseData = response.data;
        if (responseData?.data && Array.isArray(responseData.data)) {
            return {
                data: responseData.data,
                pagination: responseData.pagination || createPagination(
                    responseData.data.length,
                    PageSize,
                    PageIndex
                )
            };
        }

        if (Array.isArray(responseData)) {
            return {
                data: responseData,
                pagination: createPagination(responseData.length, PageSize, PageIndex)
            };
        }

        return {
            data: [],
            pagination: createPagination(0, PageSize, PageIndex)
        };
        } catch (error) {
        console.error('Error fetching products:', error);
        const message = error?.response?.data?.message || error?.message || 'Lỗi tải dữ liệu sản phẩm';
            throw new Error(message);
        }
};

/**
 * Get product by ID
 * @param {string} productId
 * @returns {Promise<Object>}
 */
export const getProductById = async (productId) => {
        try {
        const response = await apiClient.get(`/products/${productId}`, {
            timeout: 10000
        });
            return response.data;
        } catch (error) {
        console.error('Error fetching product by ID:', error);
        const message = error?.response?.data?.message || error?.message || 'Không thể tải thông tin sản phẩm';
            throw new Error(message);
        }
};

/**
 * Create a new product
 * @param {Object} productData - { name, category_id, description, price, cost, stock_quantity, min_stock_level, image_url, is_for_pets, thumbnails }
 * @returns {Promise<Object>}
 */
export const createProduct = async (productData) => {
        try {
        let imageUrl = productData.image_url || null;

        // If image_file is provided, upload it first
        if (productData.image_file) {
            imageUrl = await uploadImageFile(productData.image_file);
        }

        const payload = {
            name: productData.name,
            category_id: productData.category_id,
            description: productData.description || '',
            price: Number(productData.price) || 0,
            cost: Number(productData.cost) || 0,
            stock_quantity: Number(productData.stock_quantity) || 0,
            min_stock_level: Number(productData.min_stock_level) || 0,
            image_url: imageUrl || '',
            is_for_pets: productData.is_for_pets || false,
            thumbnails: productData.thumbnails || []
        };

        const response = await apiClient.post('/products', payload, {
            timeout: 30000
        });
            return response.data;
        } catch (error) {
        console.error('Error creating product:', error);
        const message = error?.response?.data?.message || error?.message || 'Không thể tạo sản phẩm';
        throw new Error(message);
    }
};

/**
 * Update an existing product
 * @param {string} productId
 * @param {Object} productData - { name, category_id, description, price, cost, stock_quantity, min_stock_level, image_url, is_for_pets, thumbnails, is_active }
 * @returns {Promise<Object>}
 */
export const updateProduct = async (productId, productData) => {
    try {
        let imageUrl = productData.image_url || null;

        // If image_file is provided, upload it first
        if (productData.image_file) {
            imageUrl = await uploadImageFile(productData.image_file);
        }

        const payload = {
            name: productData.name,
            category_id: productData.category_id,
            description: productData.description || '',
            price: Number(productData.price) || 0,
            cost: Number(productData.cost) || 0,
            stock_quantity: Number(productData.stock_quantity) || 0,
            min_stock_level: Number(productData.min_stock_level) || 0,
            image_url: imageUrl || '',
            is_for_pets: productData.is_for_pets || false,
            thumbnails: productData.thumbnails || [],
            is_active: productData.is_active !== undefined ? productData.is_active : true
        };

        const response = await apiClient.put(`/products/${productId}`, payload, {
            timeout: 30000
        });
            return response.data;
        } catch (error) {
        console.error('Error updating product:', error);
        const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật sản phẩm';
        throw new Error(message);
            }
};

/**
 * Delete a product
 * @param {string} productId
 * @returns {Promise<Object>}
 */
export const deleteProduct = async (productId) => {
        try {
        const response = await apiClient.delete(`/products/${productId}`, {
            timeout: 10000
        });
            return response.data;
        } catch (error) {
        console.error('Error deleting product:', error);
        const message = error?.response?.data?.message || error?.message || 'Không thể xóa sản phẩm';
        throw new Error(message);
    }
};

/**
 * Toggle product active status
 * @param {string} productId
 * @param {boolean} disable - true to disable, false to enable
 * @returns {Promise<Object>}
 */
export const toggleProductStatus = async (productId, disable) => {
    try {
        // First get the current product
        const currentProduct = await getProductById(productId);

        // Then update with toggled is_active status
        return await updateProduct(productId, {
            ...currentProduct,
            is_active: !disable
        });
    } catch (error) {
        console.error('Error toggling product status:', error);
        const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật trạng thái sản phẩm';
        throw new Error(message);
            }
};

/**
 * Update product stock quantity (if API supports it)
 * Note: This might need to use updateProduct instead if there's no dedicated endpoint
 * @param {string} productId
 * @param {number} stockQuantity
 * @returns {Promise<Object>}
 */
export const updateStockQuantity = async (productId, stockQuantity) => {
    try {
        // First get the current product
        const currentProduct = await getProductById(productId);

        // Then update with new stock_quantity
        return await updateProduct(productId, {
            ...currentProduct,
            stock_quantity: Number(stockQuantity) || 0
        });
    } catch (error) {
        console.error('Error updating stock quantity:', error);
        const message = error?.response?.data?.message || error?.message || 'Không thể cập nhật số lượng tồn kho';
        throw new Error(message);
        }
};

// Default export for backward compatibility
const productsApi = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    updateStockQuantity
};

export default productsApi;
