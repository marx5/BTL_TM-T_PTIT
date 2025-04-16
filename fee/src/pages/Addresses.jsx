import { useState, useEffect } from 'react';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../services/address';
import { useAuth } from '../context/AuthContext';
import AddressCard from '../components/address/AddressCard';
import AddressForm from '../components/address/AddressForm';
import Button from '../components/common/Button';

const Addresses = () => {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await getAddresses(token);
        setAddresses(data);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách địa chỉ.');
        setLoading(false);
      }
    };
    fetchAddresses();
  }, [token]);

  const handleAddOrUpdate = async (formData) => {
    // eslint-disable-next-line no-useless-catch
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData, token);
      } else {
        await addAddress(formData, token);
      }
      const updatedAddresses = await getAddresses(token);
      setAddresses(updatedAddresses);
      setShowForm(false);
      setEditingAddress(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id, token);
      const updatedAddresses = await getAddresses(token);
      setAddresses(updatedAddresses);
    } catch (err) {
      setError('Không thể xóa địa chỉ.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id, token);
      const updatedAddresses = await getAddresses(token);
      setAddresses(updatedAddresses);
    } catch (err) {
      setError('Không thể đặt địa chỉ mặc định.');
    }
  };

  const handleAddAddress = () => {
    setSelectedAddress({
      fullName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false,
    });
    setShowForm(true);
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý địa chỉ</h1>
      {showForm ? (
        <AddressForm
          address={selectedAddress}
          onSubmit={handleAddOrUpdate}
          onCancel={() => {
            setShowForm(false);
            setSelectedAddress(null);
          }}
        />
      ) : (
        <Button onClick={handleAddAddress} className="mb-6">
          Thêm địa chỉ mới
        </Button>
      )}
      {addresses.length === 0 ? (
        <p>Chưa có địa chỉ nào.</p>
      ) : (
        addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={(addr) => {
              setEditingAddress(addr);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
          />
        ))
      )}
    </div>
  );
};

export default Addresses;
