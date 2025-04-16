import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-hot-toast';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

const CartItem = ({ item }) => {
  const { updateCartItem } = useCart();
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatPrice = (price) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateCartItem(item.id, newQuantity);
      setQuantity(newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Không cần hiển thị toast ở đây vì đã được xử lý trong CartContext
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = () => handleQuantityChange(quantity + 1);
  const handleDecrement = () => handleQuantityChange(quantity - 1);

  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="w-24 h-24 flex-shrink-0">
        <img
          src={item.product.image}
          alt={item.product.name}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      <div className="flex-grow">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-gray-900">{item.product.name}</h3>
          <p className="text-sm text-gray-500">
            Size: {item.ProductVariant?.size || 'N/A'} | Color: {item.ProductVariant?.color || 'N/A'}
          </p>
          <p className="text-lg font-semibold text-primary">
            {formatPrice(item.ProductVariant?.Product?.price || item.product.price)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrement}
          disabled={quantity <= 1 || isUpdating}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaMinus className="w-4 h-4 text-gray-600" />
        </button>

        <span className="w-8 text-center font-medium">{quantity}</span>

        <button
          onClick={handleIncrement}
          disabled={quantity >= 99 || isUpdating}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPlus className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <button
        onClick={() => handleQuantityChange(0)}
        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
      >
        <FaTrash className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CartItem;
