import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCart } from '../services/cart';
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
    if (authLoading) return; // Đợi cho đến khi auth loading xong

    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getCart();
      setCart(response);
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

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const value = {
    cart,
    loading: loading || authLoading,
    fetchCart,
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