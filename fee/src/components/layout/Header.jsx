import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart(); // Không cần fetchCart ở đây nữa vì đã gọi trong CartContext
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (debouncedQuery.trim()) {
      navigate(`/search?q=${debouncedQuery}`);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công.');
    navigate('/login');
  };

  const cartItemCount = cart?.CartItems?.length || 0;

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/">
          <img src="/assets/images/logo.png" alt="Logo" className="h-10" />
        </Link>
        <form onSubmit={handleSearch} className="flex-1 mx-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
        <nav className="flex items-center gap-4">
          <Link to="/products" className="text-gray-700 hover:text-primary">
            Sản phẩm
          </Link>
          <Link to="/cart" className="text-gray-700 hover:text-primary relative">
            Giỏ hàng
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="text-gray-700 hover:text-primary">
                {user.email}
              </Link>
              <button onClick={handleLogout} className="text-gray-700 hover:text-primary">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-primary">
                Đăng nhập
              </Link>
              <Link to="/register" className="text-gray-700 hover:text-primary">
                Đăng ký
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;