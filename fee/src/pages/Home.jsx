import { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { getProducts } from '../services/product';
import { getCategories } from '../services/category';
import { getActiveBanners } from '../services/banner';
import ProductCard from '../components/product/ProductCard';
import Banner from '../components/banner/Banner';
import Loader from '../components/common/Loader';

const Home = () => {
    const { data: products, loading: productsLoading, error: productsError, callApi: fetchProducts } = useApi();
    const { data: categories, loading: categoriesLoading, error: categoriesError, callApi: fetchCategories } = useApi();
    const { data: banners, loading: bannersLoading, error: bannersError, callApi: fetchBanners } = useApi();

    useEffect(() => {
        fetchProducts(getProducts);
        fetchCategories(getCategories);
        fetchBanners(getActiveBanners);
    }, [fetchProducts, fetchCategories, fetchBanners]);

    if (productsLoading || categoriesLoading || bannersLoading) return <div className="text-center mt-10"><Loader /></div>;

    if (productsError || categoriesError || bannersError) {
        console.error('Error loading data:', { productsError, categoriesError, bannersError });
        const errorMessage = productsError || categoriesError || bannersError;
        return (
            <div className="text-red-500 text-center mt-10">
                {errorMessage === 'Đã xảy ra lỗi không xác định.'
                    ? 'Không thể tải dữ liệu. Vui lòng thử lại sau.'
                    : errorMessage}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Banner */}
            <Banner banners={banners} />

            <div className="px-4 py-10">
                {/* Danh mục sản phẩm */}
                <div className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Danh mục sản phẩm</h2>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {categories && Array.isArray(categories) && categories.length > 0 ? (
                            categories.map((category) => (
                                <a
                                    key={category.id}
                                    href={`/category/${category.id}`}
                                    className="flex-shrink-0 px-4 py-2 bg-neutral text-gray-700 rounded-full hover:bg-primary hover:text-white transition"
                                >
                                    {category.name}
                                </a>
                            ))
                        ) : (
                            <p className="text-gray-500">Không có danh mục nào để hiển thị.</p>
                        )}
                    </div>
                </div>

                {/* Sản phẩm nổi bật */}
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Sản phẩm nổi bật</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products && Array.isArray(products) ? (
                        products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="text-gray-500">Không có sản phẩm nào để hiển thị.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;