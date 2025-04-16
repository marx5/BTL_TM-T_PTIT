import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { getProducts } from '../services/product';
import ProductCard from '../components/product/ProductCard';

const Category = () => {
    const { id } = useParams();
    const { data: products, loading, error, callApi } = useApi();

    useEffect(() => {
        callApi(getProducts, { categoryId: parseInt(id) });
    }, [id, callApi]);

    if (loading) return <div className="text-center mt-10">Đang tải...</div>;
    if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;
    if (!products || products.length === 0) return <div className="text-center mt-10">Không có sản phẩm nào trong danh mục này.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Sản phẩm trong danh mục</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
};

export default Category;