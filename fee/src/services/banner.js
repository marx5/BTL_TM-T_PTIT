import api from './api';

const API_BASE_URL = 'http://localhost:3456';

const cleanImageUrl = (url) => {
    if (!url) return null;
    return url.replace(/\\/g, '/').replace(/^uploads\//, '');
};

const processBannerImages = (banner) => {
    if (!banner) return null;
    console.log('Processing banner:', banner); // Debug log
    const processedBanner = {
        ...banner,
        imageUrl: banner.imageUrl ? `${API_BASE_URL}/uploads/${cleanImageUrl(banner.imageUrl)}` : null
    };
    console.log('Processed banner:', processedBanner); // Debug log
    return processedBanner;
};

export const getActiveBanners = async () => {
    try {
        const response = await api.get('/banners/active');
        console.log('Banner API Response:', response.data); // Debug log
        const banners = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('Banners array:', banners); // Debug log
        const processedBanners = banners.map(processBannerImages);
        console.log('Processed banners:', processedBanners); // Debug log
        return processedBanners;
    } catch (error) {
        console.error('Error fetching banners:', error);
        return [];
    }
}; 