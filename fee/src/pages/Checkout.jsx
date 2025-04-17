import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { createOrder, createPayment } from '../services/order';
import Button from '../components/common/Button';
import AddressForm from '../components/address/AddressForm';
import AddressList from '../components/address/AddressList';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, selectedItems } = useCart();
  const { user, loading: authLoading, isAuthenticated, token } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !cartLoading) {
      if (!isAuthenticated) {
        toast.error('Vui lòng đăng nhập để thanh toán');
        navigate('/login');
        return;
      }

      if (!selectedItems || selectedItems.length === 0) {
        toast.error('Vui lòng chọn sản phẩm để thanh toán');
        navigate('/cart');
        return;
      }
    }

    // Set default address if available
    if (user?.addresses?.length > 0) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [authLoading, cartLoading, isAuthenticated, selectedItems, navigate, user?.addresses]);

  const handleCreateOrder = async () => {
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    setIsProcessing(true);
    try {
      // Create order first
      const orderResponse = await createOrder({
        addressId: selectedAddress.id,
        paymentMethod
      }, token);

      console.log('Order created:', orderResponse);

      // Kiểm tra orderResponse có id không
      if (!orderResponse || !orderResponse.id) {
        // throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại.');
      }

      // if (paymentMethod === 'paypal') {
      //   try {
      //     // Create PayPal payment
      //     const paymentResponse = await createPayment({
      //       orderId: orderResponse.id,
      //       paymentMethod: 'paypal'
      //     }, token);

      //     console.log('PayPal payment created:', paymentResponse);

      //     if (!paymentResponse || !paymentResponse.approvalUrl) {
      //       throw new Error('Không thể tạo thanh toán PayPal');
      //     }

      //     // Validate URL
      //     try {
      //       const url = new URL(paymentResponse.approvalUrl);
      //       if (url.protocol !== 'https:') {
      //         throw new Error('URL không an toàn');
      //       }
      //     } catch (err) {
      //       console.error('Invalid PayPal URL:', err);
      //       throw new Error('URL thanh toán PayPal không hợp lệ');
      //     }

      //     // Redirect to PayPal
      //     console.log('Redirecting to PayPal:', paymentResponse.approvalUrl);
      //     window.location.href = paymentResponse.approvalUrl;
      //     return;
      //   } catch (err) {
      //     console.error('PayPal payment error:', err);
      //     toast.error(err.message || 'Không thể tạo thanh toán PayPal. Vui lòng thử lại.');
      //     return;
      //   }
      // }

      // For COD payment
      toast.success('Đơn hàng đã được tạo thành công!');
      navigate(`/checkout/${orderResponse.id}`);
    } catch (err) {
      console.error('Order creation error:', err);
      toast.error(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
  };

  if (authLoading || cartLoading) {
    return <div className="text-center mt-10">Đang tải...</div>;
  }

  if (!isAuthenticated || !selectedItems || selectedItems.length === 0) {
    return null;
  }

  const total = selectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shippingFee = total >= 1000000 ? 0 : 30000;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Địa chỉ giao hàng */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Địa chỉ giao hàng</h2>

            {showAddressForm ? (
              <AddressForm
                onSuccess={() => {
                  setShowAddressForm(false);
                  toast.success('Đã thêm địa chỉ mới');
                }}
                onCancel={() => setShowAddressForm(false)}
              />
            ) : (
              <>
                <AddressList
                  addresses={user?.addresses || []}
                  selectedAddress={selectedAddress}
                  onSelectAddress={handleSelectAddress}
                />
                <Button
                  onClick={() => setShowAddressForm(true)}
                  className="mt-4"
                  variant="outline"
                >
                  + Thêm địa chỉ mới
                </Button>
              </>
            )}
          </div>

          {/* Phương thức thanh toán */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="cod"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="cod" className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</span>
                  <span className="block text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</span>
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="paypal"
                  name="payment"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <label htmlFor="paypal" className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">PayPal</span>
                  <span className="block text-sm text-gray-500">Thanh toán qua PayPal</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-4">
              {selectedItems.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} | Color: {item.color}
                    </p>
                    <p className="text-sm text-gray-900">
                      {item.quantity} x {item.product.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Tổng tiền hàng:</span>
                  <span>{total.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Phí vận chuyển:</span>
                  <span>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}đ`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg text-gray-900">
                  <span>Tổng cộng:</span>
                  <span>{(total + shippingFee).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <Button
                onClick={handleCreateOrder}
                className="w-full mt-4"
                disabled={isProcessing || !selectedAddress}
              >
                {isProcessing ? 'Đang xử lý...' : paymentMethod === 'paypal' ? 'Thanh toán với PayPal' : 'Đặt hàng'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
