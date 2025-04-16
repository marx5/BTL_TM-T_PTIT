import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('Đang xác minh email...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const token = new URLSearchParams(location.search).get('token');
      if (!token) {
        setMessage('Liên kết xác minh không hợp lệ. Vui lòng kiểm tra lại email hoặc liên hệ hỗ trợ.');
        toast.error('Liên kết xác minh không hợp lệ.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setMessage(response.message);
        setIsSuccess(true);
        toast.success('Email đã được xác minh thành công!');
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        const errorMessage = err.message || 'Liên kết xác minh không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ hỗ trợ.';
        setMessage(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [location, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <img
          src="/assets/images/logo.png"
          alt="Fashion Store Logo"
          className="h-12 mx-auto mb-6"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Xác minh email</h1>
        <p className={isSuccess ? 'text-green-500 text-lg' : 'text-red-500 text-lg'}>{message}</p>
        {isSuccess && (
          <div className="mt-6">
            <p className="text-gray-600">
              Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...
            </p>
            <div className="mt-4 flex justify-center">
              <Loader />
            </div>
          </div>
        )}
        {!isSuccess && (
          <div className="mt-6">
            <p className="text-gray-600">
              Không nhận được email?{' '}
              <button
                onClick={async () => {
                  try {
                    await api.post('/auth/resend-verification', { email: 'vulu.nvgb@gmail.com' }); // Thay bằng email của người dùng
                    toast.success('Email xác minh đã được gửi lại.');
                  } catch (err) {
                    toast.error('Không thể gửi lại email xác minh.');
                  }
                }}
                className="text-primary hover:underline"
              >
                Gửi lại email xác minh
              </button>
            </p>
            <p className="text-gray-600 mt-2">
              Quay lại <a href="/register" className="text-primary hover:underline">đăng ký</a> hoặc liên hệ hỗ trợ nếu cần.
            </p>
            <div className="mt-4">
              <a href="mailto:support@fashionstore.com" className="text-primary hover:underline">
                support@fashionstore.com
              </a>
              <span className="mx-2">|</span>
              <a href="tel:0901234567" className="text-primary hover:underline">
                0901234567
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;