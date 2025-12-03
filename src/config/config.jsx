import axios from 'axios';

// Resolve API base URL with sensible fallbacks
// Priority: VITE_API_BASE_URL env > window.__API_BASE_URL__ > Azure backend URL
export const API_BASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
        ? import.meta.env.VITE_API_BASE_URL
        : (typeof window !== 'undefined' && window.__API_BASE_URL__)
            ? window.__API_BASE_URL__
            : 'https://petcafes.azurewebsites.net/api';

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

        // Don't set Content-Type for FormData - browser will set it automatically with boundary
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        // Log request details for /teams endpoint in development
        if (process.env.NODE_ENV === 'development' && config.url?.includes('/teams') && config.method === 'post') {
            console.log('=== API Request Interceptor ===');
            console.log('URL:', config.baseURL + config.url);
            console.log('Method:', config.method);
            console.log('Headers:', JSON.stringify(config.headers, null, 2));
            console.log('Data (raw):', config.data);
            console.log('Data (stringified):', JSON.stringify(config.data, null, 2));
            console.log('=============================');
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


