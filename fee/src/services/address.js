import api from './api';

export const getAddresses = async (token) => {
  const response = await api.get('/addresses', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const addAddress = async (data, token) => {
  const response = await api.post('/addresses', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const updateAddress = async (id, data, token) => {
  const response = await api.put(`/addresses/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const deleteAddress = async (id, token) => {
  const response = await api.delete(`/addresses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const setDefaultAddress = async (id, token) => {
  const response = await api.put(`/addresses/${id}/default`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};
