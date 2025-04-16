import Button from '../common/Button';

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
  return (
    <div className="border rounded-lg p-4 mb-4 flex justify-between items-start">
      <div>
        <p className="font-semibold">{address.fullName}</p>
        <p>
          {address.addressLine}, {address.city}, {address.state},{' '}
          {address.country}
        </p>
        <p>Mã bưu điện: {address.postalCode}</p>
        <p>Điện thoại: {address.phone}</p>
        {address.isDefault && <p className="text-green-500">Mặc định</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => onEdit(address)}>
          Sửa
        </Button>
        <Button variant="danger" onClick={() => onDelete(address.id)}>
          Xóa
        </Button>
        {!address.isDefault && (
          <Button variant="primary" onClick={() => onSetDefault(address.id)}>
            Đặt làm mặc định
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddressCard;
