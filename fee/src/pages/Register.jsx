/* eslint-disable no-useless-catch */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegisterForm from '../components/auth/RegisterForm';
import toast from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    const { register, user, loading } = useAuth();
    const [error, setError] = useState(null);

    useEffect(() => {
        if (loading) return;

        if (user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (data) => {
        try {
            console.log('Registering with data:', data);
            const response = await register(data);
            console.log('Registration response:', response);
            toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác minh.');
            navigate('/verify-email');
        } catch (err) {
            console.error('Registration error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Đăng ký thất bại.';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    if (loading) return <div className="text-center mt-10">Đang tải...</div>;

    return (
        <div className="max-w-md mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Đăng ký</h1>
            <RegisterForm onSubmit={handleSubmit} error={error} />
            <p className="mt-4 text-center text-gray-600">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-primary hover:underline">
                    Đăng nhập
                </Link>
            </p>
        </div>
    );
};

export default Register;