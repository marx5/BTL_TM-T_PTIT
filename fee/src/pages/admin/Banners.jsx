import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../../services/adminBanner';
import { getProducts } from '../../services/adminProduct';
import AdminLayout from '../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

const Banners = () => {
    const { token } = useAuth();
    const { data: bannersData, loading, error, callApi: fetchBanners } = useApi();
    const { data: productsData, callApi: fetchProducts } = useApi();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [formData, setFormData] = useState({
        productId: '',
        image: null,
        isActive: true,
    });

    useEffect(() => {
        fetchBanners(() => getBanners(page, limit, token));
        fetchProducts(() => getProducts(1, 100, token));
    }, [page, limit, token, fetchBanners, fetchProducts]);

    // Debug log
    useEffect(() => {
        console.log('Banners data:', bannersData);
    }, [bannersData]);

    const openModal = (banner = null) => {
        if (banner) {
            setIsEditMode(true);
            setSelectedBanner(banner);
            setFormData({
                productId: banner.productId,
                image: null,
                isActive: banner.isActive,
            });
        } else {
            setIsEditMode(false);
            setSelectedBanner(null);
            setFormData({
                productId: '',
                image: null,
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({
            productId: '',
            image: null,
            isActive: true,
        });
    };

    const handleChange = (e) => {
        const { name, value, files, type, checked } = e.target;
        if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] });
        } else if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = new FormData();
        form.append('productId', formData.productId);
        form.append('isActive', formData.isActive);
        if (formData.image) {
            form.append('image', formData.image);
        }

        try {
            if (isEditMode) {
                await updateBanner(selectedBanner.id, form, token);
                toast.success('Cập nhật banner thành công!');
            } else {
                await createBanner(form, token);
                toast.success('Thêm banner thành công!');
            }
            fetchBanners(() => getBanners(page, limit, token));
            closeModal();
        } catch (err) {
            toast.error(err.message || 'Có lỗi xảy ra khi lưu banner.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa banner này?')) return;
        try {
            await deleteBanner(id, token);
            toast.success('Xóa banner thành công!');
            fetchBanners(() => getBanners(page, limit, token));
        } catch (err) {
            toast.error(err.message || 'Có lỗi xảy ra khi xóa banner.');
        }
    };

    if (loading) return <div className="text-center mt-10">Đang tải...</div>;
    if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

    // Lấy danh sách banner từ data.data
    const banners = bannersData?.data?.data || [];

    return (
        <AdminLayout>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý banner</h2>
                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Thêm banner mới
                    </button>
                </div>

                {/* Bảng danh sách banner */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">ID</th>
                                <th className="py-2 px-4 border-b">Hình ảnh</th>
                                <th className="py-2 px-4 border-b">Sản phẩm</th>
                                <th className="py-2 px-4 border-b">Trạng thái</th>
                                <th className="py-2 px-4 border-b">Ngày tạo</th>
                                <th className="py-2 px-4 border-b">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners && banners.length > 0 ? (
                                banners.map((banner) => (
                                    <tr key={banner.id} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{banner.id}</td>
                                        <td className="py-2 px-4 border-b">
                                            {banner.imageUrl ? (
                                                <img
                                                    src={`http://localhost:3456/${banner.imageUrl}`}
                                                    alt="Banner"
                                                    className="w-32 h-16 object-cover rounded"
                                                />
                                            ) : (
                                                <span className="text-gray-500">Không có hình ảnh</span>
                                            )}
                                        </td>
                                        <td className="py-2 px-4 border-b">
                                            {banner.Product?.name || 'Không có sản phẩm'}
                                        </td>
                                        <td className="py-2 px-4 border-b">
                                            <span className={`px-2 py-1 rounded-full text-xs ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {banner.isActive ? 'Kích hoạt' : 'Tắt'}
                                            </span>
                                        </td>
                                        <td className="py-2 px-4 border-b">
                                            {new Date(banner.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => openModal(banner)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(banner.id)}
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
                                    <td colSpan="6" className="py-2 px-4 text-center text-gray-500">
                                        Không có banner nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Thêm/Sửa banner */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50"
            >
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h2 className="text-xl font-bold mb-4">{isEditMode ? 'Sửa banner' : 'Thêm banner mới'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sản phẩm</label>
                            <select
                                name="productId"
                                value={formData.productId}
                                onChange={handleChange}
                                className="mt-1 block w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            >
                                <option value="">Chọn sản phẩm</option>
                                {productsData?.products?.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hình ảnh</label>
                            <input
                                type="file"
                                name="image"
                                onChange={handleChange}
                                accept="image/*"
                                className="mt-1 block w-full"
                                required={!isEditMode}
                            />
                            {isEditMode && selectedBanner?.imageUrl && (
                                <img
                                    src={`http://localhost:3456/${selectedBanner.imageUrl}`}
                                    alt="Banner"
                                    className="mt-2 w-32 h-16 object-cover rounded"
                                />
                            )}
                        </div>
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium text-gray-700">Kích hoạt</span>
                            </label>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                {isEditMode ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
};

export default Banners;