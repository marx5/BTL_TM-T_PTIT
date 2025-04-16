import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserOrders } from '../services/order';
import { useAuth } from '../context/AuthContext';
import OrderItem from '../components/order/OrderItem';

const Orders = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getUserOrders(token);
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách đơn hàng.');
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (orders.length === 0)
    return <div className="text-center mt-10">Bạn chưa có đơn hàng nào.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Đơn hàng của bạn
      </h1>
      {orders.map((order) => (
        <OrderItem key={order.id} order={order} />
      ))}
    </div>
  );
};

export default Orders;
