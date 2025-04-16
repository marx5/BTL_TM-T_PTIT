import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { deleteCartItem } from '../services/cart';
import { toast } from 'react-hot-toast';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';

const Cart = () => {
    const navigate = useNavigate();
    const { cart, loading, updateCartItem, fetchCart } = useCart();

    const handleUpdateQuantity = async (productId, quantity) => {
        try {
            if (quantity < 1) {
                toast.error('Số lượng phải lớn hơn 0');
                return;
            }

            await updateCartItem(productId, quantity);
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    };

    const handleRemove = async (productId) => {
        try {
            await deleteCartItem(productId);
            await fetchCart();
            toast.success('Xóa sản phẩm thành công');
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error('Xóa sản phẩm thất bại');
        }
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    if (loading) {
        return <div className="container mx-auto px-4 py-8">Loading...</div>;
    }

    if (!cart) {
        return null;
    }

    const { items = [], shippingFee = 0, total = 0 } = cart;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Giỏ hàng</h1>
            {items.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">Giỏ hàng của bạn đang trống</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                    >
                        Tiếp tục mua sắm
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {items.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                    <div className="lg:col-span-1">
                        <CartSummary
                            total={total}
                            shippingFee={shippingFee}
                            onCheckout={handleCheckout}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;