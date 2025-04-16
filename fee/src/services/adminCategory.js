import api from './api';

export const getCategories = async (page = 1, limit = 100) => {
  try {
    console.log('Fetching categories with params:', { page, limit });
    const response = await api.get('/categories', {
      params: { page, limit },
    });
    console.log('Categories response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const createCategory = async (data) => {
  try {
    console.log('Creating category with data:', data);
    const response = await api.post('/categories', data);
    console.log('Create category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const updateCategory = async (id, data) => {
  try {
    console.log('Updating category:', { id, data });
    const response = await api.put(`/categories/${id}`, data);
    console.log('Update category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    console.log('Deleting category:', id);
    const response = await api.delete(`/categories/${id}`);
    console.log('Delete category response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};