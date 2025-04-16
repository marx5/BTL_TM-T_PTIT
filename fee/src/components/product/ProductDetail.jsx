import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../../services/product';
import { buyNow } from '../../services/order';
import { getAddresses } from '../../services/address';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, addressesData] = await Promise.all([
          getProductById(id),
          getAddresses(token),
        ]);
        setProduct(productData);
        setVariant(productData.variants[0]);
        setAddresses(addressesData);
        if (addressesData.length > 0) {
          setAddressId(addressesData[0].id);
        }
        setLoading(false);
      } catch (err) {
        setError('Không thể tải sản phẩm hoặc địa chỉ.');
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  const handleBuyNow = async () => {
    if (!addressId) {
      setError('Vui lòng chọn địa chỉ giao hàng.');
      return;
    }
    try {
      const response = await buyNow(
        {
          ProductVariantId: variant.id,
          quantity,
          addressId,
          paymentMethod: 'cod',
        },
        token
      );
      navigate(`/checkout/${response.order.id}`);
    } catch (err) {
      setError(err.message || 'Không thể tạo đơn hàng.');
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-96 object-cover rounded-lg"
            onError={(e) => (e.target.src = '/assets/images/placeholder.jpg')}
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            {product.price.toLocaleString('vi-VN')} VND
          </p>
          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biến thể:
            </label>
            <select
              className="border rounded-md p-2 w-full"
              value={variant?.id}
              onChange={(e) => {
                const selectedVariant = product.variants.find(
                  (v) => v.id === parseInt(e.target.value)
                );
                setVariant(selectedVariant);
              }}
            >
              {product.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.size} - {v.color} (Còn {v.stock} sản phẩm)
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng:
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value)))
              }
              className="border rounded-md p-2 w-20"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ giao hàng:
            </label>
            <select
              className="border rounded-md p-2 w-full"
              value={addressId || ''}
              onChange={(e) => setAddressId(parseInt(e.target.value))}
            >
              <option value="">Chọn địa chỉ</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.fullName} - {address.addressLine}, {address.city}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <Button onClick={handleBuyNow} className="w-full">
            Mua ngay
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
