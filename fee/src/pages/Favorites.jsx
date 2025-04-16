import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { getFavorites, removeFromFavorites } from '../services/favorite';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/product/ProductCard';
import toast from 'react-hot-toast';

const Favorites = () => {
    const navigate = useNavigate();
    const { token, user, loading } = useAuth();
    const { data: favorites, loading: favoritesLoading, error: favoritesError, callApi: fetchFavorites } = useApi();

    useEffect(() => {
        if (loading) return;
        if (!token || !user) {
            toast.error('Vui lòng đăng nhập để xem sản phẩm yêu thích.');
            navigate('/login');
            return;
        }
        fetchFavorites(getFavorites, token);
    }, [token, user, loading, navigate, fetchFavorites]);

    const handleRemoveFromFavorites = async (productId) => {
        try {
            await removeFromFavorites(productId, token);
            toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích.');
            fetchFavorites(getFavorites, token);
        } catch (err) {
            toast.error(err.message || 'Không thể xóa sản phẩm khỏi danh sách yêu thích.');
        }
    };

    if (loading || favoritesLoading) return <div className="text-center mt-10">Đang tải...</div>;
    if (favoritesError) return <div className="text-red-500 text-center mt-10">{favoritesError}</div>;
    if (!favorites || favorites.length === 0) return <div className="text-center mt-10">Bạn chưa có sản phẩm yêu thích nào.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Sản phẩm yêu thích</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.map((favorite) => (
                    <div key={favorite.Product.id} className="relative">
                        <ProductCard product={favorite.Product} />
                        <button
                            onClick={() => handleRemoveFromFavorites(favorite.Product.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                        >
                            Xóa
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Favorites;