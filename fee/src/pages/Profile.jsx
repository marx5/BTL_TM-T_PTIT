import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    birthday: user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.error('Vui lòng đăng nhập để xem hồ sơ.');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      toast.success('Hồ sơ đã được cập nhật thành công.');
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật thông tin.');
      setError(err.message || 'Không thể cập nhật thông tin.');
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Hồ sơ cá nhân</h1>
      <form onSubmit={handleSubmit}>
        <Input
          name="email"
          value={user?.email || ''}
          disabled
          placeholder="Email"
        />
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Họ và tên"
        />
        <Input
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Số điện thoại"
          error={error?.includes('phone') ? error : null}
        />
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Ngày sinh
          </label>
          <Input
            type="date"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
            placeholder="Ngày sinh (YYYY-MM-DD)"
            error={error?.includes('birthday') ? error : null}
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <Button type="submit" className="w-full">Cập nhật</Button>
      </form>
      <div className="mt-4 text-center">
        <Button variant="outline" onClick={() => navigate('/addresses')}>
          Quản lý địa chỉ
        </Button>
      </div>
    </div>
  );
};

export default Profile;