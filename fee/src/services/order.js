import api from './api';
import axios from 'axios';

export const createOrder = async (data, token) => {
  const response = await api.post('/orders', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const buyNow = async (data, token) => {
  const response = await api.post('/orders/buy-now', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const getUserOrders = async (userId, page = 1, limit = 10) => {
  try {
    const response = await api.get('/orders/my-orders/history', {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    // Log response để debug
    console.log('API Response:', response);
    
    // Kiểm tra response.data tồn tại và là mảng
    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response from server');
    }

    // Chuyển đổi mảng dữ liệu thô thành cấu trúc mong muốn
    const orders = response.data.map(order => ({
      _id: order[0]?._id || order.id,
      status: order[4] || 'pending',
      total: order[2]?.total || 0,
      createdAt: order[5] || new Date().toISOString(),
      // Thêm các trường khác nếu cần
    }));

    return {
      orders,
      totalPages: Math.ceil(response.data.length / limit),
      currentPage: page,
      totalOrders: response.data.length
    };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    // Trả về dữ liệu mặc định khi có lỗi
    return {
      orders: [],
      totalPages: 1,
      currentPage: 1,
      totalOrders: 0
    };
  }
};

export const getOrderById = async (id, token) => {
  const response = await api.get(`/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createPayment = async (data, token) => {
  const response = await api.post('/payments', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getOrders = async (token) => {
  const response = await api.get('/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
