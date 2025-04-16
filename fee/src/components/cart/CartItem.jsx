import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-hot-toast';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

const CartItem = ({ item, onUpdateQuantity, onRemove, onSelect }) => {
  const { updateCartItem, deleteCartItem, updateCartItemSelected } = useCart();
  const [quantity, setQuantity] = useState(item.quantity);
  const [isSelected, setIsSelected] = useState(item.selected || false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setQuantity(item.quantity);
    setIsSelected(item.selected || false);
  }, [item.quantity, item.selected]);

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
      if (onUpdateQuantity) {
        onUpdateQuantity(item.id, newQuantity);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectedChange = async (e) => {
    const newSelected = e.target.checked;
    setIsSelected(newSelected);
    try {
      await updateCartItemSelected(item.id, newSelected);
      if (onSelect) {
        onSelect(item.id, newSelected);
      }
    } catch (error) {
      console.error('Error updating selected status:', error);
      setIsSelected(!newSelected); // Revert the change if it fails
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCartItem(item.id);
      if (onRemove) {
        onRemove(item.id);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleIncrement = () => handleQuantityChange(quantity + 1);
  const handleDecrement = () => handleQuantityChange(quantity - 1);

  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectedChange}
          className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
        />
      </div>

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
        onClick={handleDelete}
        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
      >
        <FaTrash className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CartItem;
