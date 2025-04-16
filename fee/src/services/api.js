import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:3456'),
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        if (currentPath !== '/admin/login') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
        }
      } else if (currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      toast.error('Vui lòng đăng nhập lại');
    }
    // Handle 403 Forbidden
    else if (error.response?.status === 403) {
      if (window.location.pathname.startsWith('/admin')) {
        toast.error('Bạn không có quyền truy cập trang này');
        window.location.href = '/admin/login';
      } else {
        toast.error('Bạn không có quyền thực hiện thao tác này');
      }
    }
    // Handle 429 Too Many Requests
    else if (error.response?.status === 429) {
      toast.error('Quá nhiều yêu cầu, vui lòng thử lại sau');
    }
    // Handle other errors
    else {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3456';
  return `${baseUrl}/api/${path}`;
};

export default api;
