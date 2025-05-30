const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  AddressId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Addresses',
      key: 'id',
    },
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  shippingFee: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  paymentMethod: {
    type: DataTypes.ENUM('paypal', 'cod'),
    allowNull: false,
    defaultValue: 'cod',
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
});

Order.associate = (models) => {
  Order.belongsTo(models.User, { foreignKey: 'UserId' });
  Order.belongsTo(models.Address, { foreignKey: 'AddressId' });
  Order.hasMany(models.OrderProduct, { foreignKey: 'OrderId', as: 'OrderProducts' });
  Order.belongsToMany(models.ProductVariant, { through: models.OrderProduct, foreignKey: 'OrderId', as: 'ProductVariants' });
  Order.hasOne(models.Payment, { foreignKey: 'OrderId', as: 'Payment' });
};

module.exports = Order;