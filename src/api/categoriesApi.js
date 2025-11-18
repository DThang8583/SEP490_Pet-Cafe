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
 * Get all product categories from official API
 * @param {Object} params - { page_index, page_size, is_active }
 * @returns {Promise<Object>} { data, pagination }
 */
export const getAllCategories = async (params = {}) => {
    const {
        page_index = 0,
        page_size = 10,
        is_active = null
    } = params;

    try {
        const queryParams = {};
        // Support both IsActive (from old code) and is_active
        if (params.IsActive !== undefined) {
            queryParams.IsActive = params.IsActive;
        } else if (is_active !== null) {
            queryParams.IsActive = is_active;
        }

        const response = await apiClient.get('/product-categories', {
            params: queryParams,
            timeout: 10000
        });

        const responseData = response.data;
        if (responseData?.data && Array.isArray(responseData.data)) {
            return {
                data: responseData.data,
                pagination: responseData.pagination || createPagination(
                    responseData.data.length,
                    page_size,
                    page_index
                )
            };
        }

        if (Array.isArray(responseData)) {
            return {
                data: responseData,
                pagination: createPagination(responseData.length, page_size, page_index)
            };
        }

        return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
        } catch (error) {
        console.error('Failed to fetch categories from API:', error);
            return {
            data: [],
            pagination: createPagination(0, page_size, page_index)
        };
    }
};

/**
 * Get category by ID from official API
 * @param {string} categoryId
 * @returns {Promise<Object>} Category object
 */
export const getCategoryById = async (categoryId) => {
        try {
        const response = await apiClient.get(`/product-categories/${categoryId}`, { timeout: 10000 });

        if (!response.data) {
            throw new Error('Không tìm thấy danh mục');
        }

            return response.data;
        } catch (error) {
        console.error('Failed to fetch category from API:', error);
        if (error.response?.status === 404) {
                throw new Error('Không tìm thấy danh mục');
            }
        throw error;
    }
};

/**
 * Create new product category using official API
 * @param {Object} categoryData - { name, description, image_file, image_url }
 * @returns {Promise<Object>} Created category
 */
export const createCategory = async (categoryData) => {
    try {
        const name = categoryData.name?.trim();
        const description = categoryData.description?.trim();

        if (!name) {
            throw new Error('Tên danh mục là bắt buộc');
        }
        if (!description) {
            throw new Error('Mô tả là bắt buộc');
        }

        let imageUrl = categoryData.image_url || null;
        if (categoryData.image_file) {
            imageUrl = await uploadImageFile(categoryData.image_file);
        }

        const requestData = {
            name,
            description,
            image_url: imageUrl
        };

        const response = await apiClient.post('/product-categories', requestData, { timeout: 10000 });

            return {
                success: true,
            data: response.data,
            message: 'Tạo danh mục thành công'
        };
    } catch (error) {
        console.error('Failed to create category:', error);
        throw error;
        }
};

/**
 * Update product category using official API
 * @param {string} categoryId
 * @param {Object} categoryData - { name?, description?, image_file?, image_url?, is_active? }
 * @returns {Promise<Object>} Updated category
 */
export const updateCategory = async (categoryId, categoryData) => {
    try {
        const requestData = {};

        if (categoryData.name !== undefined) {
            const name = categoryData.name.trim();
            if (!name) {
                throw new Error('Tên danh mục không được rỗng');
            }
            requestData.name = name;
        }

        if (categoryData.description !== undefined) {
            requestData.description = categoryData.description.trim();
        }

        if (categoryData.is_active !== undefined) {
            requestData.is_active = categoryData.is_active;
        }

        let imageUrl = categoryData.image_url;
        if (categoryData.image_file) {
            imageUrl = await uploadImageFile(categoryData.image_file);
        }

        if (imageUrl !== undefined) {
            requestData.image_url = imageUrl;
            }

        const response = await apiClient.put(`/product-categories/${categoryId}`, requestData, { timeout: 10000 });

            return {
                success: true,
            data: response.data,
            message: 'Cập nhật danh mục thành công'
        };
        } catch (error) {
        console.error('Failed to update category:', error);
        if (error.response?.status === 404) {
                throw new Error('Không tìm thấy danh mục');
            }
        throw error;
    }
};

/**
 * Delete product category using official API
 * @param {string} categoryId
 * @returns {Promise<Object>} { success, message }
 */
export const deleteCategory = async (categoryId) => {
    try {
        await apiClient.delete(`/product-categories/${categoryId}`, { timeout: 10000 });

            return {
                success: true,
                message: 'Xóa danh mục thành công'
            };
    } catch (error) {
        console.error('Failed to delete category:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy danh mục');
        }
        throw error;
    }
};

/**
 * Toggle category active status using official API
 * @param {string} categoryId
 * @param {boolean} disable - Optional: if true, disable; if false, enable. If not provided, toggles current status
 * @returns {Promise<Object>} Updated category
 */
export const toggleCategoryStatus = async (categoryId, disable = null) => {
    try {
        const currentCategory = await getCategoryById(categoryId);

        const newStatus = disable !== null ? !disable : !currentCategory.is_active;

        const updatedCategory = await updateCategory(categoryId, {
            name: currentCategory.name,
            description: currentCategory.description,
            image_url: currentCategory.image_url,
            is_active: newStatus
        });

        return updatedCategory;
    } catch (error) {
        console.error('Failed to toggle category status:', error);
        throw error;
    }
};

export default {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
};
