import React, { useState } from 'react';
import { addAddress } from '../../services/address';
import Button from '../common/Button';
import Input from '../common/Input';
import { toast } from 'react-hot-toast';

const AddressForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    country: 'Việt Nam',
    postalCode: '',
    isDefault: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addAddress(formData);
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Không thể thêm địa chỉ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
          placeholder="Nhập họ và tên"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <Input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="Nhập số điện thoại"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa chỉ <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="addressLine"
          value={formData.addressLine}
          onChange={handleChange}
          required
          placeholder="Nhập địa chỉ cụ thể"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Thành phố <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          placeholder="Nhập thành phố"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tỉnh/Thành phố <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="state"
          value={formData.state}
          onChange={handleChange}
          required
          placeholder="Nhập tỉnh/thành phố"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quốc gia <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="country"
          value={formData.country}
          onChange={handleChange}
          required
          placeholder="Nhập quốc gia"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mã bưu điện <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          name="postalCode"
          value={formData.postalCode}
          onChange={handleChange}
          required
          placeholder="Nhập mã bưu điện"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
          Đặt làm địa chỉ mặc định
        </label>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang thêm...' : 'Thêm địa chỉ'}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
