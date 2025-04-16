import api from './api';

// Lấy giỏ hàng của user hiện tại
export const getCart = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Vui lòng đăng nhập để xem giỏ hàng');
  }
  const response = await api.get('/cart', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Lấy giỏ hàng của user bất kỳ (chỉ admin)
export const getUserCart = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await api.get('/cart/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user cart:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (variantId, quantity = 1) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
  }
  const response = await api.post('/cart', { variantId, quantity }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItem = async (id, quantity) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Vui lòng đăng nhập để cập nhật giỏ hàng');
  }
  const response = await api.put(`/cart/${id}`, { quantity }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Xóa sản phẩm khỏi giỏ hàng
export const deleteCartItem = async (id) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng');
  }
  const response = await api.delete(`/cart/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
