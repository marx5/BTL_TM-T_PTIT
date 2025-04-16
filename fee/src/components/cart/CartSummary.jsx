const CartSummary = ({ total, shippingFee, onCheckout }) => {
  return (
    <div className="border rounded-lg p-6 bg-neutral">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Tóm tắt đơn hàng
      </h3>
      <div className="flex justify-between mb-2">
        <span>Tổng tiền hàng:</span>
        <span>{total.toLocaleString('vi-VN')} VND</span>
      </div>
      <div className="flex justify-between mb-2">
        <span>Phí vận chuyển:</span>
        <span>{shippingFee.toLocaleString('vi-VN')} VND</span>
      </div>
      <div className="flex justify-between font-semibold text-lg">
        <span>Tổng cộng:</span>
        <span>{(total + shippingFee).toLocaleString('vi-VN')} VND</span>
      </div>
      <button
        onClick={onCheckout}
        className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Thanh toán
      </button>
    </div>
  );
};

export default CartSummary;
