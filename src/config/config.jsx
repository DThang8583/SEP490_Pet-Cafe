import axios from 'axios';

// Resolve API base URL with sensible fallbacks
// Priority: VITE_API_BASE_URL env > window.__API_BASE_URL__ > Azure backend URL
export const API_BASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
        ? import.meta.env.VITE_API_BASE_URL
        : (typeof window !== 'undefined' && window.__API_BASE_URL__)
            ? window.__API_BASE_URL__
            : 'https://petcafe-htc6ddabayh6h4dz.southeastasia-01.azurewebsites.net/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5 minutes
    headers: {
        'Accept': '*/*'
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
});

// Request interceptor: attach bearer token and set appropriate Content-Type
apiClient.interceptors.request.use(
    async (config) => {
        // Prefer authToken (used across project), fallback to token
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
        } else {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: normalize common connectivity errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            return Promise.reject({
                response: {
                    data: {
                        success: false,
                        message: 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.'
                    }
                }
            });
        }

        if (error.message === 'Network Error') {
            return Promise.reject({
                response: {
                    data: {
                        success: false,
                        message: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.'
                    }
                }
            });
        }

        return Promise.reject(error);
    }
);

export default apiClient;


