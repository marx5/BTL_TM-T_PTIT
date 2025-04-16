import Button from '../common/Button';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="flex items-center border-b py-4">
      <img
        src={
          item.ProductVariant.Product.ProductImages?.[0]?.url ||
          '/assets/images/placeholder.jpg'
        }
        alt={item.ProductVariant.Product.name}
        className="w-20 h-20 object-cover rounded-md mr-4"
      />
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">
          {item.ProductVariant.Product.name}
        </h3>
        <p className="text-gray-600">
          {item.ProductVariant.Product.price.toLocaleString('vi-VN')} VND
        </p>
        <p className="text-gray-600">
          Size: {item.ProductVariant.size}, Màu: {item.ProductVariant.color}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) =>
            onUpdateQuantity(item.ProductVariantId, parseInt(e.target.value))
          }
          className="border rounded-md p-1 w-16"
        />
        <Button
          variant="danger"
          onClick={() => onRemove(item.ProductVariantId)}
        >
          Xóa
        </Button>
      </div>
    </div>
  );
};

export default CartItem;
