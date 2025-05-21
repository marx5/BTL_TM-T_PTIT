import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { addToFavorites, removeFromFavorites, getFavorites } from '../../services/favorite';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3456/';

const ProductCard = ({ product }) => {
  const { token, user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
          : `${API_BASE_URL}${cleanUrl}`;
          // : `${API_BASE_URL}/uploads/${cleanUrl}`;
      }
    }

    // Nếu có image trực tiếp
    if (product.image) {
      // Loại bỏ dấu gạch chéo ở đầu và thư mục Uploads nếu có
      const cleanUrl = product.image.replace(/^\/+/, '').replace(/^Uploads\//, '');
      return product.image.startsWith('http')
        ? product.image
        : `${API_BASE_URL}${cleanUrl}`;
        // : `${API_BASE_URL}/uploads/${cleanUrl}`;
    }

    return null;
  };

  if (!product) return null;

  return (
    <div
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-transparent hover:border-primary"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite button */}
      <button
        onClick={handleFavoriteClick}
        disabled={isLoading}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-300 ${isFavorited
          ? 'bg-red-500 text-white shadow-lg'
          : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
          } ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Product image */}
      <div className="relative aspect-square overflow-hidden">
        {getProductImage() ? (
          <img
            src={getProductImage()}
            alt={product.name || 'Product image'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">Không có hình ảnh</span>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {product.name || 'Unnamed Product'}
        </h3>

        <div className="flex items-center justify-between mb-4">
          <p className="text-xl font-bold text-primary">
            {product.price ? product.price.toLocaleString('vi-VN') : '0'} VND
          </p>
          {product.discount > 0 && (
            <span className="text-sm text-gray-500 line-through">
              {(product.price * (1 + product.discount / 100)).toLocaleString('vi-VN')} VND
            </span>
          )}
        </div>

        {/* Action button */}
        <Link to={`/product/${product.id}`} className="block">
          <Button
            variant="primary"
            className="w-full justify-center"
          >
            Xem chi tiết
          </Button>
        </Link>
      </div>

      {/* Discount badge */}
      {product.discount > 0 && (
        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
          -{product.discount}%
        </div>
      )}
    </div>
  );
};

export default ProductCard;