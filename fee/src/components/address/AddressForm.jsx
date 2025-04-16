import Input from '../common/Input';
import Button from '../common/Button';
import { useState } from 'react';

const AddressForm = ({ address = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: address?.fullName || '',
    phone: address?.phone || '',
    addressLine: address?.addressLine || '',
    city: address?.city || '',
    state: address?.state || '',
    country: address?.country || '',
    postalCode: address?.postalCode || '',
    isDefault: address?.isDefault || false,
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Không thể lưu địa chỉ.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-neutral">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {address?.id ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
      </h3>
      <Input
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        placeholder="Họ và tên"
        error={error?.fullName}
      />
      <Input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Số điện thoại"
        error={error?.phone}
      />
      <Input
        name="addressLine"
        value={formData.addressLine}
        onChange={handleChange}
        placeholder="Địa chỉ"
        error={error?.addressLine}
      />
      <Input
        name="city"
        value={formData.city}
        onChange={handleChange}
        placeholder="Thành phố"
        error={error?.city}
      />
      <Input
        name="state"
        value={formData.state}
        onChange={handleChange}
        placeholder="Tỉnh/Quận"
        error={error?.state}
      />
      <Input
        name="country"
        value={formData.country}
        onChange={handleChange}
        placeholder="Quốc gia"
        error={error?.country}
      />
      <Input
        name="postalCode"
        value={formData.postalCode}
        onChange={handleChange}
        placeholder="Mã bưu điện"
        error={error?.postalCode}
      />
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="mr-2"
          />
          Đặt làm địa chỉ mặc định
        </label>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" className="w-full">
          Lưu
        </Button>
        <Button variant="outline" onClick={onCancel} className="w-full">
          Hủy
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
