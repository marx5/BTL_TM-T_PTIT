import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProduct, addProductVariants, updateProductVariant, deleteProductVariant, getProductById, deleteProductImage } from '../../services/adminProduct';
import { getCategories } from '../../services/adminCategory';
import AdminLayout from '../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { Link } from 'react-router-dom';

Modal.setAppElement('#root');

const IMG_BASE_URL = process.env.REACT_APP_IMG_URL || 'http://localhost:3456';

const cleanImageUrl = (url) => {
    return url.replace(/^\/+/, '').replace(/^Uploads\//, '');
};

const getProductImage = (product) => {
    if (!product) return null;

    // Nếu có ProductImages
    if (product.ProductImages && product.ProductImages.length > 0) {
        const mainImage = product.ProductImages.find(img => img.isMain);
        if (mainImage?.url) {
            const cleanUrl = cleanImageUrl(mainImage.url);
            return mainImage.url.startsWith('http')
                ? mainImage.url
                : `${IMG_BASE_URL}/uploads/${cleanUrl}`;
        }
    }

    // Nếu có image trực tiếp
    if (product.image) {
        const cleanUrl = cleanImageUrl(product.image);
        return product.image.startsWith('http')
            ? product.image
            : `${IMG_BASE_URL}/uploads/${cleanUrl}`;
    }

    return null;
};

const Products = () => {
    const { token } = useAuth();
    const { data: productsData, loading, error, callApi: fetchProducts } = useApi();
    const { data: categoriesData, callApi: fetchCategories } = useApi();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        image: null,
    });
    const [variants, setVariants] = useState([]);
    const [newVariant, setNewVariant] = useState({
        size: '',
        color: '',
        stock: '',
    });
    const [productImages, setProductImages] = useState([]);
    const [newImages, setNewImages] = useState([]);

    useEffect(() => {
        fetchProducts(() => getProducts(page, limit, token));
        fetchCategories(() => getCategories(1, 100, token));
    }, [page, limit, token, fetchProducts, fetchCategories]);

    const openModal = (product = null) => {
        if (product) {
            setIsEditMode(true);
            setSelectedProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price,
                categoryId: product.Category?.id || '',
                image: null,
            });
            setVariants(product.ProductVariants || []);
            setProductImages(product.ProductImages || []);
        } else {
            setIsEditMode(false);
            setSelectedProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                categoryId: '',
                image: null,
            });
            setVariants([]);
            setProductImages([]);
        }
        setNewImages([]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({
            name: '',
            description: '',
            price: '',
            categoryId: '',
            image: null,
        });
    };

    const handleAddVariant = async () => {
        if (!newVariant.size || !newVariant.color || !newVariant.stock) {
            toast.error('Vui lòng điền đầy đủ thông tin biến thể');
            return;
        }

        if (!selectedProduct?.id) {
            toast.error('Vui lòng lưu sản phẩm trước khi thêm biến thể');
            return;
        }

        try {
            const variantToSend = [{
                size: newVariant.size,
                color: newVariant.color,
                stock: parseInt(newVariant.stock)
            }];

            const response = await addProductVariants(selectedProduct.id, variantToSend);
            if (response) {
                setVariants([...variants, ...variantToSend]);
                setNewVariant({
                    size: '',
                    color: '',
                    stock: '',
                });
                toast.success('Thêm biến thể thành công!');
            }
        } catch (err) {
            console.error('Error adding variant:', err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm biến thể');
        }
    };

    const handleRemoveVariant = async (variantId) => {
        if (isEditMode && variantId && selectedProduct?.id) {
            try {
                await deleteProductVariant(selectedProduct.id, variantId);
                toast.success('Xóa biến thể thành công!');
            } catch (err) {
                console.error('Error deleting variant:', err);
                toast.error('Có lỗi xảy ra khi xóa biến thể');
                return;
            }
        }
        setVariants(variants.filter(v => v.id !== variantId));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages(files);
    };

    const handleRemoveImage = async (imageId) => {
        if (isEditMode && imageId) {
            try {
                await deleteProductImage(selectedProduct.id, imageId, token);
                setProductImages(productImages.filter(img => img.id !== imageId));
                toast.success('Xóa ảnh thành công!');
            } catch (err) {
                console.error('Error deleting image:', err);
                toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa ảnh');
            }
        } else {
            setProductImages(productImages.filter(img => img.id !== imageId));
        }
    };

    const handleSetMainImage = (imageId) => {
        setProductImages(productImages.map(img => ({
            ...img,
            isMain: img.id === imageId
        })));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Thêm các ảnh mới vào FormData
            newImages.forEach((image) => {
                formDataToSend.append('images', image);
            });

            // Thêm thông tin ảnh chính
            const mainImage = productImages.find(img => img.isMain);
            if (mainImage) {
                formDataToSend.append('mainImageId', mainImage.id);
            }

            let productId;
            if (isEditMode) {
                const response = await updateProduct(selectedProduct.id, formDataToSend, token);
                productId = selectedProduct.id;
                toast.success('Cập nhật sản phẩm thành công!');
            } else {
                const response = await createProduct(formDataToSend, token);
                productId = response.id;
                setSelectedProduct(response);
                toast.success('Thêm sản phẩm thành công!');
            }

            // Lấy lại thông tin sản phẩm để cập nhật danh sách ảnh
            const updatedProduct = await getProductById(productId);
            setProductImages(updatedProduct.ProductImages || []);
            setNewImages([]);

            closeModal();
            fetchProducts(() => getProducts(page, limit, token));
        } catch (err) {
            console.error('Error submitting product:', err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        try {
            await deleteProduct(id, token);
            toast.success('Xóa sản phẩm thành công!');
            fetchProducts(() => getProducts(page, limit, token));
        } catch (err) {
            console.error('Error deleting product:', err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm.');
        }
    };

    if (loading) return <div className="text-center mt-10">Đang tải...</div>;
    if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

    const products = productsData?.products || [];
    const totalPages = productsData?.totalPages || 1;
    const categories = categoriesData?.categories || [];

    return (
        <AdminLayout>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h2>
                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Thêm sản phẩm mới
                    </button>
                </div>

                {/* Bảng danh sách sản phẩm */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">ID</th>
                                <th className="py-2 px-4 border-b">Hình ảnh</th>
                                <th className="py-2 px-4 border-b">Tên sản phẩm</th>
                                <th className="py-2 px-4 border-b">Giá</th>
                                <th className="py-2 px-4 border-b">Danh mục</th>
                                <th className="py-2 px-4 border-b">Số lượng</th>
                                <th className="py-2 px-4 border-b">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{product.id}</td>
                                        <td className="py-2 px-4 border-b">
                                            {getProductImage(product) ? (
                                                <img
                                                    src={getProductImage(product)}
                                                    alt={product.name}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                                    <span className="text-gray-500 text-sm">Không có ảnh</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-4 border-b">{product.name}</td>
                                        <td className="py-2 px-4 border-b">{product.price?.toLocaleString('vi-VN')} VND</td>
                                        <td className="py-2 px-4 border-b">
                                            {categories.find(c => c.id === product.categoryId)?.name || 'Không có'}
                                        </td>
                                        <td className="py-2 px-4 border-b">{product.stock}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    to={`/admin/products/${product.id}`}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Chi tiết
                                                </Link>
                                                <button
                                                    onClick={() => openModal(product)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-2 px-4 text-center text-gray-500">
                                        Không có sản phẩm nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                            Trước
                        </button>
                        <span className="px-4 py-2 mx-1">{`Trang ${page} / ${totalPages}`}</span>
                        <button
                            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={page === totalPages}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                            Tiếp
                        </button>
                    </div>
                )}
            </div>

            {/* Modal thêm/sửa sản phẩm */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto ml-64">
                        <div className="sticky top-0 bg-white z-10 pb-4 border-b">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">
                                    {selectedProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Giá</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {isEditMode && selectedProduct?.Category && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        Danh mục hiện tại: {selectedProduct.Category.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Hình ảnh sản phẩm</label>

                                {/* Hiển thị ảnh hiện có */}
                                {productImages.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Ảnh hiện có:</h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {productImages.map((image) => (
                                                <div key={image.id} className="relative group">
                                                    <img
                                                        src={image.url.startsWith('http') ? image.url : `${IMG_BASE_URL}/uploads/${cleanImageUrl(image.url)}`}
                                                        alt="Product"
                                                        className={`w-full h-24 object-cover rounded ${image.isMain ? 'ring-2 ring-blue-500' : ''}`}
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSetMainImage(image.id)}
                                                            className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                                            title="Đặt làm ảnh chính"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(image.id)}
                                                            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                            title="Xóa ảnh"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    {image.isMain && (
                                                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                                                            Ảnh chính
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Thêm ảnh mới */}
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100"
                                />
                                {newImages.length > 0 && (
                                    <div className="mt-2">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Ảnh mới sẽ thêm:</h4>
                                        <div className="grid grid-cols-4 gap-2">
                                            {newImages.map((image, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={URL.createObjectURL(image)}
                                                        alt={`New ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-gray-700 mb-2">Biến thể sản phẩm</h4>
                                <div className="space-y-4">
                                    {variants.length > 0 && (
                                        <div className="mb-4">
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Biến thể hiện có:</h5>
                                            <div className="space-y-2">
                                                {variants.map((variant) => (
                                                    <div key={variant.id || Date.now()} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                        <div className="flex-1">
                                                            <span className="font-medium">{variant.size}</span>
                                                            <span className="mx-2">-</span>
                                                            <span className="font-medium">{variant.color}</span>
                                                        </div>
                                                        <div className="flex-1 text-right">
                                                            <span className="text-gray-600">{variant.stock} sản phẩm</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveVariant(variant.id)}
                                                            className="ml-2 text-red-500 hover:text-red-700"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Thêm biến thể mới:</h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            <input
                                                type="text"
                                                placeholder="Kích thước"
                                                value={newVariant.size}
                                                onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Màu sắc"
                                                value={newVariant.color}
                                                onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Số lượng"
                                                value={newVariant.stock}
                                                onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddVariant}
                                            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            Thêm biến thể
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    {isEditMode ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Products;
