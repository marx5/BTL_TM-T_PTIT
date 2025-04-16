import api from './api';
import { toast } from 'react-toastify';

// Lấy danh sách banner
export const getBanners = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/banners', {
      params: { page, limit },
    });
    return response;
  } catch (error) {
    console.error('Lỗi khi gọi API lấy banners:', error);
    toast.error(error.message || 'Có lỗi xảy ra trong quá trình lấy banners.');
    throw error;
  }
};

// Thêm banner mới
export const createBanner = async (data) => {
  const response = await api.post('/banners', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};

// Cập nhật banner
export const updateBanner = async (id, data) => {
  const response = await api.put(`/banners/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};

// Xóa banner
export const deleteBanner = async (id) => {
  const response = await api.delete(`/banners/${id}`);
  return response;
};
