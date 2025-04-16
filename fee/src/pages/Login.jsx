import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const { loginUser, user, loading } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false); // State để hiển thị/ẩn mật khẩu

    useEffect(() => {
        if (loading) return;

        if (user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Ngăn chặn load lại trang
        setError(null); // Xóa lỗi trước đó
        try {
            await loginUser(formData.email, formData.password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại.');
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    if (loading) return <div className="text-center mt-10">Đang tải...</div>;

    return (
        <div className="max-w-md mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Đăng nhập</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    error={error?.includes('email') ? error : null}
                    className="w-full"
                />
                <div className="relative">
                    <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mật khẩu"
                        error={error?.includes('password') ? error : null}
                        className="w-full pr-10"
                    />
                    <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
                {error && !error.includes('email') && !error.includes('password') && (
                    <p className="text-red-500 text-sm">{error}</p>
                )}
                <Button type="submit" className="w-full">
                    Đăng nhập
                </Button>
            </form>
            <p className="mt-4 text-center text-gray-600">
                Quên mật khẩu?{' '}
                <Link to="/forgot-password" className="text-primary hover:underline">
                    Khôi phục
                </Link>
            </p>
            <p className="mt-2 text-center text-gray-600">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-primary hover:underline">
                    Đăng ký
                </Link>
            </p>
        </div>
    );
};

export default Login;