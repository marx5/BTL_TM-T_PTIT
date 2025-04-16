import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { getProductById } from '../services/product';
import { buyNow } from '../services/order';
import { getAddresses } from '../services/address';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

const API_BASE_URL = 'http://localhost:3456';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user, loading } = useAuth();
    const { data: product, loading: productLoading, error: productError, callApi: fetchProduct } = useApi();
    const { data: addresses, loading: addressesLoading, error: addressesError, callApi: fetchAddresses } = useApi();
    const [variant, setVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addressId, setAddressId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProduct(getProductById, id);
        if (loading) return;
        if (token && user) {
            fetchAddresses(getAddresses, token);
        }
    }, [id, token, user, loading, fetchProduct, fetchAddresses]);

    useEffect(() => {
        if (product?.variants?.length > 0) {
            setVariant(product.variants[0]);
        }
        if (addresses?.length > 0) {
            setAddressId(addresses[0].id);
        }
    }, [product, addresses]);

    const getProductImage = () => {
        if (!product) return null;

        // Nếu có ProductImages
        if (product.ProductImages && product.ProductImages.length > 0) {
            const mainImage = product.ProductImages.find(img => img.isMain);
            if (mainImage?.url) {
                // Loại bỏ dấu gạch chéo ở đầu và thư mục Uploads nếu có
                const cleanUrl = mainImage.url.replace(/^\/+/, '').replace(/^Uploads\//, '');
                return mainImage.url.startsWith('http')
                    ? mainImage.url
                    : `${API_BASE_URL}/uploads/${cleanUrl}`;
            }
        }

        // Nếu có image trực tiếp
        if (product.image) {
            // Loại bỏ dấu gạch chéo ở đầu và thư mục Uploads nếu có
            const cleanUrl = product.image.replace(/^\/+/, '').replace(/^Uploads\//, '');
            return product.image.startsWith('http')
                ? product.image
                : `${API_BASE_URL}/uploads/${cleanUrl}`;
        }

        return null;
    };

    const handleBuyNow = async () => {
        if (loading) return;
        if (!token || !user) {
            navigate('/login');
            return;
        }

        if (!addressId) {
            setError('Vui lòng chọn địa chỉ giao hàng.');
            return;
        }

        if (!variant) {
            setError('Vui lòng chọn biến thể sản phẩm.');
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

    if (loading || productLoading || addressesLoading) return <div className="text-center mt-10">Đang tải...</div>;
    if (productError || addressesError) return <div className="text-red-500 text-center mt-10">{productError || addressesError}</div>;
    if (!product) return <div className="text-center mt-10">Không tìm thấy sản phẩm</div>;

    const productImage = getProductImage();

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    {productImage ? (
                        <img
                            src={productImage}
                            alt={product.name || 'Product image'}
                            className="w-full h-96 object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">Không có hình ảnh</span>
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name || 'Unnamed Product'}</h1>
                    <p className="text-2xl text-gray-700 mb-4">
                        {product.price ? product.price.toLocaleString('vi-VN') : '0'} VND
                    </p>
                    <p className="text-gray-600 mb-6">{product.description || 'No description'}</p>

                    {product.variants?.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Biến thể:</label>
                            <select
                                className="border rounded-md p-2 w-full"
                                value={variant?.id}
                                onChange={(e) => {
                                    const selectedVariant = product.variants.find((v) => v.id === parseInt(e.target.value));
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
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng:</label>
                        <input
                            type="number"
                            min="1"
                            max={variant?.stock || 1}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.min(parseInt(e.target.value), variant?.stock || 1))}
                            className="border rounded-md p-2 w-full"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ giao hàng:</label>
                        {token && user ? (
                            <select
                                className="border rounded-md p-2 w-full"
                                value={addressId || ''}
                                onChange={(e) => setAddressId(parseInt(e.target.value))}
                            >
                                <option value="">Chọn địa chỉ</option>
                                {addresses && addresses.map((address) => (
                                    <option key={address.id} value={address.id}>
                                        {address.fullName} - {address.addressLine}, {address.city}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-red-500">Vui lòng đăng nhập để chọn địa chỉ giao hàng.</p>
                        )}
                    </div>

                    {error && <div className="text-red-500 mb-4">{error}</div>}

                    <Button variant="primary" onClick={handleBuyNow} className="w-full">
                        Mua ngay
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;