import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, createPayment } from '../services/order';
import { useAuth } from '../context/AuthContext';
import OrderSummary from '../components/order/OrderSummary';
import Button from '../components/common/Button';

const Checkout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(orderId, token);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin đơn hàng.');
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, token]);

  const handlePayment = async () => {
    try {
      if (order.paymentMethod === 'paypal') {
        const response = await createPayment(
          { orderId, paymentMethod: 'paypal' },
          token
        );
        window.location.href = response.approvalUrl; // Chuyển hướng đến PayPal
      } else {
        navigate('/orders'); // COD: Chuyển đến trang đơn hàng
      }
    } catch (err) {
      setError(err.message || 'Không thể xử lý thanh toán.');
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Xác nhận đơn hàng
      </h1>
      <OrderSummary order={order} />
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <Button onClick={handlePayment} className="mt-4 w-full">
        {order.paymentMethod === 'paypal'
          ? 'Thanh toán với PayPal'
          : 'Xác nhận đơn hàng (COD)'}
      </Button>
    </div>
  );
};

export default Checkout;
