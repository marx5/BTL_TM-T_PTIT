import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCart, addToCart as addToCartService, updateCartItem as updateCartItemService, deleteCartItem as deleteCartItemService } from '../services/cart';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getCart();
      // Format lại dữ liệu để bao gồm thông tin biến thể và phí ship
      const formattedCart = {
        ...response,
        shippingFee: response.shippingFee || 0,
        items: response.items.map(item => ({
          ...item,
          size: item.ProductVariant?.size || '',
          color: item.ProductVariant?.color || '',
          product: {
            ...item.product,
            image: item.product.image ? `http://localhost:3456/uploads/${item.product.image.replace(/^\/+/, '').replace(/^Uploads\//, '')}` : null
          }
        }))
      };
      setCart(formattedCart);
    } catch (err) {
      console.error('Error fetching cart:', err);
      if (err.message === 'Vui lòng đăng nhập để xem giỏ hàng') {
        setCart(null);
        navigate('/login');
        toast.error('Vui lòng đăng nhập để xem giỏ hàng');
      } else if (err.response?.status === 401) {
        setCart(null);
        navigate('/login');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        toast.error('Không thể tải giỏ hàng. Vui lòng thử lại sau.');
        setCart(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, navigate]);

  const addToCart = useCallback(async (variantId, quantity = 1) => {
    try {
      await addToCartService(variantId, quantity);
      await fetchCart();
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
    } catch (err) {
      console.error('Error adding to cart:', err);
      if (err.message === 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng') {
        navigate('/login');
        toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      } else if (err.response?.status === 401) {
        navigate('/login');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.data?.error === 'stock_exceeded') {
        toast.error('Số lượng sản phẩm vượt quá tồn kho');
      } else {
        toast.error(err.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại sau.');
      }
    }
  }, [fetchCart, navigate]);

  const updateCartItem = useCallback(async (itemId, quantity) => {
    try {
      const response = await updateCartItemService(itemId, { quantity });
      setCart(prev => ({
        ...prev,
        total: response.total,
        shippingFee: response.shippingFee,
        items: prev.items.map(item =>
          item.id === itemId ? {
            ...item,
            quantity,
            product: {
              ...item.product,
              price: response.cartItem.product.price
            },
            ProductVariant: {
              ...item.ProductVariant,
              Product: {
                ...item.ProductVariant.Product,
                price: response.cartItem.ProductVariant.Product.price
              }
            }
          } : item
        )
      }));
    } catch (error) {
      console.error('Error updating cart item:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 404) {
        toast.error('Sản phẩm không tồn tại trong giỏ hàng');
        await fetchCart(); // Refresh cart data
      } else if (error.response?.data?.error === 'stock_exceeded') {
        toast.error('Số lượng sản phẩm vượt quá tồn kho');
      } else {
        toast.error(error.response?.data?.message || 'Không thể cập nhật số lượng. Vui lòng thử lại sau.');
      }
    }
  }, [navigate, fetchCart]);

  const deleteCartItem = useCallback(async (id) => {
    try {
      await deleteCartItemService(id);
      // Cập nhật local state thay vì fetch lại toàn bộ giỏ hàng
      setCart(prevCart => {
        if (!prevCart) return null;
        return {
          ...prevCart,
          items: prevCart.items.filter(item => item.id !== id)
        };
      });
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (err) {
      console.error('Error deleting cart item:', err);
      if (err.response?.status === 401) {
        navigate('/login');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        toast.error(err.response?.data?.message || 'Không thể xóa sản phẩm. Vui lòng thử lại sau.');
        await fetchCart();
      }
    }
  }, [fetchCart, navigate]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const value = {
    cart,
    loading: loading || authLoading,
    fetchCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};