import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { addToFavorites, removeFromFavorites, getFavorites } from '../../services/favorite';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3456';

const ProductCard = ({ product }) => {
  const { token, user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && token) {
        try {
          const favorites = await getFavorites(token);
          const isInFavorites = favorites.some(fav => fav.product.id === product.id);
          setIsFavorited(isInFavorites);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [user, token, product.id]);

  const handleFavoriteClick = async () => {
    if (!user || !token) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích.');
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(product.id, token);
        setIsFavorited(false);
        toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích.');
      } else {
        await addToFavorites(product.id, token);
        setIsFavorited(true);
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích.');
      }
    } catch (error) {
      console.error('Error handling favorite:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProductImage = () => {
    if (!product) return null;

    // Nếu có ProductImages
    if (product.ProductImages && product.ProductImages.length > 0) {
      const mainImage = product.ProductImages.find(img => img.isMain);
      if (mainImage?.url) {
        // Loại bỏ dấu gạch chéo ở đầu và thư mục Uploads nếu có
        const cleanUrl = mainImage.url.replace(/^\/+/, '').replace(/^Uploads\//, '');
        return mainImage.url.startsWith('http')
          ? mainImage.url
          : `${API_BASE_URL}/uploads/${cleanUrl}`;
      }
    }

    // Nếu có image trực tiếp
    if (product.image) {
      // Loại bỏ dấu gạch chéo ở đầu và thư mục Uploads nếu có
      const cleanUrl = product.image.replace(/^\/+/, '').replace(/^Uploads\//, '');
      return product.image.startsWith('http')
        ? product.image
        : `${API_BASE_URL}/uploads/${cleanUrl}`;
    }

    return null;
  };

  if (!product) return null;

  return (
    <div className="border rounded-lg shadow-sm p-4 hover:shadow-md transition-transform transform hover:scale-105">
      {getProductImage() ? (
        <img
          src={getProductImage()}
          alt={product.name || 'Product image'}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
          <span className="text-gray-500">Không có hình ảnh</span>
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800">{product.name || 'Unnamed Product'}</h3>
      <p className="text-gray-600">
        {product.price ? product.price.toLocaleString('vi-VN') : '0'} VND
      </p>
      <div className="mt-4 flex gap-2">
        <Link to={`/product/${product.id}`}>
          <Button variant="outline">Xem chi tiết</Button>
        </Link>
        <Link to={`/product/${product.id}`}>
          <Button variant="primary">Mua ngay</Button>
        </Link>
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className={`p-2 rounded-full ${isFavorited ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
            } hover:bg-red-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;