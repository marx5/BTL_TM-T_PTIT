import axios from 'axios';
import { API_URL } from '../config';

export const getActiveBanners = async () => {
    try {
        const response = await axios.get(`${API_URL}/banners/active`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Đã xảy ra lỗi khi tải banner';
    }
}; 