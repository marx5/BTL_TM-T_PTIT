import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Banner = ({ banners }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (banners && banners.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % banners.length);
            }, 5000); // Change slide every 5 seconds

            return () => clearInterval(timer);
        }
    }, [banners]);

    if (!banners || banners.length === 0) return null;

    return (
        <div className="relative w-full h-[400px] overflow-hidden">
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {banners.map((banner, index) => (
                    <div key={banner.id} className="w-full flex-shrink-0">
                        <Link to={`/product/${banner.Product.id}`}>
                            <img
                                src={banner.imageUrl}
                                alt={banner.Product.name}
                                className="w-full h-[400px] object-cover"
                            />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Navigation dots */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            className={`w-3 h-3 rounded-full ${index === currentSlide ? 'bg-white' : 'bg-white/50'
                                }`}
                            onClick={() => setCurrentSlide(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Banner; 