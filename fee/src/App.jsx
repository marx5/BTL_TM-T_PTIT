import { Routes, Route, Suspense } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AddressProvider } from './context/AddressContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Addresses from './pages/Addresses';
import Search from './pages/Search';
import Category from './pages/Category';
import Favorites from './pages/Favorites';
import Dashboard from './pages/admin/Dashboard';
import Categories from './pages/admin/Categories';
import Users from './pages/admin/Users';
import UserDetail from './pages/admin/UserDetail';
import Products from './pages/Products';
import AdminProducts from './pages/admin/Products';
import AdminProductDetail from './pages/admin/ProductDetail';
import OrdersAdmin from './pages/admin/Orders';
import OrderDetail from './pages/admin/OrderDetail';
import Banners from './pages/admin/Banners';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <AddressProvider>
          <Routes>
            {/* Routes công khai */}
            <Route
              path="/*"
              element={
                <>
                  <Header />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/addresses" element={<Addresses />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/category/:id" element={<Category />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/category/:categoryId" element={<Products />} />
                  </Routes>
                  <Footer />
                </>
              }
            />
            {/* Routes dành cho admin */}
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/categories" element={<Categories />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/users/:id" element={<UserDetail />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/:id" element={<AdminProductDetail />} />
            <Route path="/admin/orders" element={<OrdersAdmin />} />
            <Route path="/admin/orders/:id" element={<OrderDetail />} />
            <Route path="/admin/banners" element={<Banners />} />
          </Routes>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </AddressProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;