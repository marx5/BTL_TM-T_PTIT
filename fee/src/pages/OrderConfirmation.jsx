import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrderById } from '../services/order';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const OrderConfirmation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await getOrderById(id, token);
                setOrder(response);
            } catch (err) {
                setError('Không thể tải thông tin đơn hàng');
                toast.error('Không thể tải thông tin đơn hàng');
            } finally {
                setLoading(false);
            }
        };

        if (token && id) {
            fetchOrder();
        }
    }, [id, token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">{error || 'Không tìm thấy đơn hàng'}</h1>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/')}
                    >
                        Quay về trang chủ
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đơn hàng của bạn đã được xác nhận!</h1>
                        <p className="text-gray-600">Cảm ơn bạn đã mua hàng. Chúng tôi sẽ gửi email xác nhận đến bạn sớm.</p>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Mã đơn hàng</h3>
                                <p className="mt-1 text-sm text-gray-900">#{order.id}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Ngày đặt hàng</h3>
                                <p className="mt-1 text-sm text-gray-900">
                                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Tổng tiền</h3>
                                <p className="mt-1 text-sm text-gray-900">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Phương thức thanh toán</h3>
                                <p className="mt-1 text-sm text-gray-900">
                                    {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'PayPal'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ giao hàng</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-900">
                                {order.Address.fullName}
                            </p>
                            <p className="text-sm text-gray-900">
                                {order.Address.phone}
                            </p>
                            <p className="text-sm text-gray-900">
                                {order.Address.addressLine}
                            </p>
                            <p className="text-sm text-gray-900">
                                {order.Address.city}, {order.Address.state}
                            </p>
                            <p className="text-sm text-gray-900">
                                {order.Address.country} - {order.Address.postalCode}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm đã đặt</h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 w-16 h-16">
                                        <img
                                            src={item.image || '/placeholder-product.jpg'}
                                            alt={item.name}
                                            className="w-full h-full object-cover rounded-md"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {item.variant.size} - {item.variant.color}
                                        </p>
                                        <p className="text-sm text-gray-900">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} x {item.quantity}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center space-x-4">
                        <Button
                            variant="primary"
                            onClick={() => navigate('/')}
                        >
                            Tiếp tục mua sắm
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => navigate(`/orders/${order.id}`)}
                        >
                            Xem chi tiết đơn hàng
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation; 