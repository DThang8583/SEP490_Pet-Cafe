import apiClient from '../config/config';

/**
 * Upload a file to the server
 * @param {File} file - The file to upload
 * @returns {Promise<string>} File URL
 */
export const uploadFile = async (file) => {
    try {
        if (!file) {
            throw new Error('File is required');
        }

        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            throw new Error('File size must not exceed 5MB');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/files', formData, {
            timeout: 30000
        });

        // Handle different response structures
        const data = response.data;
        if (!data) {
            throw new Error('Invalid response from file upload API');
        }

        // Try different possible response structures
        if (typeof data === 'string') {
            return data;
        }
        if (data.url) {
            return data.url;
        }
        if (data.image_url) {
            return data.image_url;
        }
        if (data.data?.url) {
            return data.data.url;
        }

        throw new Error('Không thể lấy URL ảnh từ phản hồi API');
    } catch (error) {
        console.error('Failed to upload file:', error);
        throw error;
    }
};

/**
 * Get file by ID
 * @param {string} fileId
 * @returns {Promise<Object>} File data
 */
export const getFileById = async (fileId) => {
    try {
        const response = await apiClient.get(`/files/${fileId}`, { timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Failed to get file:', error);
        if (error.response?.status === 404) {
            throw new Error('Không tìm thấy file');
        }
        throw error;
    }
};

export default {
    uploadFile,
    getFileById
};

