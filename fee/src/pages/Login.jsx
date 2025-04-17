import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import toast from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const { login, user, loading } = useAuth();
    const [error, setError] = useState(null);

    useEffect(() => {
        if (loading) return;

        if (user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (email, password, recaptchaToken) => {
        try {
            console.log('Login attempt with:', { email, recaptchaToken });
            await login(email, password, recaptchaToken);
            toast.success('Đăng nhập thành công!');
            navigate('/');
        } catch (err) {
            console.error('Login error in component:', err);
            setError(err.message || 'Đăng nhập thất bại.');
            toast.error(err.message || 'Đăng nhập thất bại.');
        }
    };

    if (loading) return <div className="text-center mt-10">Đang tải...</div>;

    return (
        <div className="max-w-md mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Đăng nhập</h1>
            <LoginForm onSubmit={handleSubmit} error={error} />
            <p className="mt-4 text-center text-gray-600">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-primary hover:underline">
                    Đăng ký
                </Link>
            </p>
        </div>
    );
};

export default Login;