import api from './api';

export const login = async (email, password) => {
  try {
    // Gửi yêu cầu đăng nhập
    const response = await api.post('/auth/login', { email, password });

    // Kiểm tra cấu trúc của response (response.data nếu nó chứa token)
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      console.log('Token đã được lưu:', response.data.token);
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error; // Để có thể xử lý lỗi ngoài component
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const verifyEmail = async (token) => {
  const response = await api.get(`/auth/verify-email?token=${token}`);
  return response;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', {
    token,
    newPassword,
  });
  return response;
};

export const getProfile = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/users/me', userData);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};
