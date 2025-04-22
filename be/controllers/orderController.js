const { Op, Sequelize } = require('sequelize');
const User = require('../models/User');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Order = require('../models/Order');
const OrderProduct = require('../models/OrderProduct');
const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');
const Address = require('../models/Address');
const Payment = require('../models/Payment');
const ProductImage = require('../models/ProductImage');
const { sendOrderConfirmationEmail } = require('../utils/email');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const Joi = require('joi');
const { stringify } = require('flatted');


const createOrderSchema = Joi.object({
  addressId: Joi.number().integer().required(),
  paymentMethod: Joi.string().valid('momo', 'cod').default('momo'),
});

const buyNowSchema = Joi.object({
  ProductVariantId: Joi.number().integer().required().messages({
    'any.required': 'ID biến thể sản phẩm là bắt buộc.',
    'number.base': 'ID biến thể sản phẩm phải là số.',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'any.required': 'Số lượng là bắt buộc.',
    'number.min': 'Số lượng phải lớn hơn hoặc bằng 1.',
  }),
  addressId: Joi.number().integer().required().messages({
    'any.required': 'ID địa chỉ là bắt buộc.',
    'number.base': 'ID địa chỉ phải là số.',
  }),
  paymentMethod: Joi.string().valid('momo', 'cod').default('cod'),
});

exports.createOrder = async (req, res, next) => { // thông báo có lỗi khi tạo order
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });
  try {
    if (!req.user || !req.user.id) {
      throw new AppError('unauthorized', 401);
    }

    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const userId = req.user.id;
    const { addressId, paymentMethod } = value;

    // First, find the cart
    const cart = await Cart.findOne({
      where: { UserId: userId },
      transaction
    });

    if (!cart) {
      throw new AppError('cart_not_found', 404);
    }

    // Then find selected cart items with their products
    const cartItems = await CartItem.findAll({
      where: { 
        CartId: cart.id,
        selected: true 
      },
      include: [{
        model: ProductVariant,
        as: 'ProductVariant',
        include: [{
          model: Product,
          as: 'Product',
          attributes: ['id', 'name', 'price', 'isActive'],
          where: { isActive: true }
        }]
      }],
      transaction
    });

    if (!cartItems || cartItems.length === 0) {
      throw new AppError('cart_empty', 400);
    }

    const address = await Address.findByPk(addressId, { transaction });
    if (!address || address.UserId !== userId) {
      throw new AppError('invalid_address', 400);
    }

    // Validate stock and calculate total
    let total = 0;
    for (const item of cartItems) {
      if (!item.ProductVariant || !item.ProductVariant.Product) {
        throw new AppError('invalid_cart_item', 400);
      }

      const variant = await ProductVariant.findByPk(item.ProductVariantId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!variant) {
        throw new AppError('variant_not_found', 404);
      }

      if (!variant.stock || item.quantity > variant.stock) {
        throw new AppError(
          `Số lượng ${item.ProductVariant.Product.name} vượt quá tồn kho`,
          400
        );
      }

      total += item.ProductVariant.Product.price * item.quantity;
    }

    const shippingFee = total < 1000000 ? 30000 : 0;

    const order = await Order.create(
      {
        UserId: userId,
        AddressId: addressId,
        total,
        shippingFee,
        paymentMethod,
        status: 'pending'
      },
      { transaction }
    );

    // Create order products and update stock
    for (const item of cartItems) {
      await OrderProduct.create(
        {
          OrderId: order.id,
          ProductVariantId: item.ProductVariantId,
          quantity: item.quantity
        },
        { transaction }
      );

      const variant = await ProductVariant.findByPk(item.ProductVariantId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });
      variant.stock -= item.quantity;
      await variant.save({ transaction });
    }

    // Remove selected items from cart
    await CartItem.destroy({ 
      where: { 
        CartId: cart.id, 
        selected: true 
      }, 
      transaction 
    });

    const user = await User.findByPk(userId, { transaction });
    if (user && user.email) {
      await sendOrderConfirmationEmail(user.email, order.id, total, shippingFee);
    }

    await transaction.commit();

    res.status(201).json({
      message: 'Đơn hàng đã được tạo thành công.',
      order: {
        id: order.id,
        total: order.total,
        shippingFee: order.shippingFee,
        paymentMethod: order.paymentMethod,
        status: order.status,
        address: {
          fullName: address.fullName,
          addressLine: address.addressLine,
          city: address.city,
          state: address.state,
          country: address.country,
          postalCode: address.postalCode
        },
        items: cartItems.map((item) => ({
          productId: item.ProductVariant.Product.id,
          name: item.ProductVariant.Product.name,
          quantity: item.quantity,
          price: item.ProductVariant.Product.price
        }))
      }
    });

    // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥
    // CSDL đã có hàng vừa thêm, nếu lỗi ở đây đã rollback CSDL 
  
  } catch (err) {
    await transaction.rollback();
    console.error('Error in createOrder:', err);
    next(err);
  }
};

exports.buyNow = async (req, res, next) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  });
  try {
    const { error, value } = buyNowSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const userId = req.user.id;
    const { ProductVariantId, quantity, addressId, paymentMethod } = value;

    const variant = await ProductVariant.findByPk(ProductVariantId, {
      include: [
        {
          model: Product,
          as: 'Product',
          attributes: ['id', 'name', 'price', 'isActive'],
          where: { isActive: true },
        },
      ],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!variant || !variant.Product) {
      throw new AppError('variant_not_found', 404);
    }

    if (quantity > variant.stock) {
      throw new AppError(
        `Số lượng ${variant.Product.name} vượt quá tồn kho`,
        400
      );
    }

    const address = await Address.findByPk(addressId, { transaction });
    if (!address || address.UserId !== userId) {
      throw new AppError('invalid_address', 400);
    }

    const total = variant.Product.price * quantity;
    const shippingFee = total < 1000000 ? 30000 : 0;

    const order = await Order.create(
      {
        UserId: userId,
        AddressId: addressId,
        total,
        shippingFee,
        paymentMethod,
      },
      { transaction }
    );

    await OrderProduct.create(
      {
        OrderId: order.id,
        ProductVariantId,
        quantity,
      },
      { transaction }
    );

    variant.stock -= quantity;
    await variant.save({ transaction });

    const user = await User.findByPk(userId, { transaction });
    await sendOrderConfirmationEmail(user.email, order.id, total, shippingFee);

    await transaction.commit();

    res.status(201).json({
      message: 'Đơn hàng đã được tạo thành công.',
      order: {
        id: order.id,
        total: order.total,
        shippingFee: order.shippingFee,
        paymentMethod: order.paymentMethod,
        status: order.status,
        address: {
          fullName: address.fullName,
          addressLine: address.addressLine,
          city: address.city,
          state: address.state,
          country: address.country,
          postalCode: address.postalCode,
        },
        items: [
          {
            productId: variant.Product.id,
            name: variant.Product.name,
            quantity,
            price: variant.Product.price,
          },
        ],
      },
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' && req.query.userId
      ? req.query.userId
      : req.user.id;

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    console.log('Fetching orders for userId:', userId);

    const orders = await Order.findAndCountAll({
      where: { UserId: userId },
      attributes: ['id', 'total', 'shippingFee', 'status', 'createdAt'],
      include: [
        {
          model: OrderProduct,
          as: 'OrderProducts',
          include: [
            {
              model: ProductVariant,
              as: 'ProductVariant',
              attributes: ['id', 'size', 'color'],
              include: [
                {
                  model: Product,
                  as: 'Product',
                  attributes: ['id', 'name', 'price'],
                  include: [
                    {
                      model: ProductImage,
                      as: 'ProductImages',
                      attributes: ['id', 'url'],
                      limit: 1,
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: Address,
          as: 'Address',
          attributes: ['id', 'fullName', 'addressLine', 'city'],
          required: false,
        },
        {
          model: Payment,
          as: 'Payment',
          attributes: ['id', 'status', 'createdAt'],
          required: false,
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    // Format lại kết quả cho frontend dễ xử lý
    const formattedOrders = orders.rows.map((order) => {
      const orderJSON = order.toJSON();
      return {
        ...orderJSON,
        OrderProducts: orderJSON.OrderProducts.map((op) => ({
          ...op,
          ProductVariant: {
            ...op.ProductVariant,
            Product: {
              ...op.ProductVariant.Product,
              image: op.ProductVariant.Product.ProductImages?.[0]?.url || null,
              ProductImages: undefined,
            },
          },
        })),
      };
    });

    res.json({
      orders: formattedOrders,
      totalPages: Math.ceil(orders.count / limit),
    });
  } catch (err) {
    console.error('Error in getUserOrders:', err);
    next(err);
  }
};


exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, dateFrom, dateTo, userId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (userId) where.UserId = userId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderProduct,
          as: 'OrderProducts',
          include: [
            {
              model: ProductVariant,
              as: 'ProductVariant',
              include: [
                {
                  model: Product,
                  as: 'Product',
                  attributes: ['id', 'name', 'price'],
                  include: [
                    {
                      model: ProductImage,
                      as: 'ProductImages',
                      attributes: ['id', 'url'],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { 
          model: Address, 
          as: 'Address',
          attributes: ['id', 'fullName', 'addressLine', 'city', 'state', 'country', 'postalCode']
        },
        { 
          model: Payment, 
          as: 'Payment',
          attributes: ['id', 'status', 'createdAt']
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Format lại kết quả cho frontend dễ xử lý
    const formattedOrders = orders.map(order => {
      const orderJSON = order.toJSON();
      return {
        ...orderJSON,
        items: order.OrderProducts.map(op => ({
          productId: op.ProductVariant.Product.id,
          name: op.ProductVariant.Product.name,
          quantity: op.quantity,
          price: op.ProductVariant.Product.price,
          image: op.ProductVariant.Product.ProductImages?.[0]?.url || null
        })),
        OrderProducts: undefined,
      };
    });

    res.json({
      orders: formattedOrders,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalOrders: count
    });
  } catch (err) {
    console.error('Error in getAllOrders:', err);
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError('invalid_status', 400);
    }

    const order = await Order.findByPk(id);
    if (!order) {
      throw new AppError('order_not_found', 404);
    }
    order.status = status;
    await order.save();
    res.json({
      message: 'Trạng thái đơn hàng đã được cập nhật thành công.',
      order,
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const orders = await Order.findAndCountAll({
      where: { UserId: userId },
      include: [
        {
          model: OrderProduct,
          as: 'OrderProducts',
          include: [
            {
              model: ProductVariant,
              as: 'ProductVariant',
              include: [
                {
                  model: Product,
                  as: 'Product',
                  attributes: ['id', 'name', 'price'],
                  include: [
                    {
                      model: ProductImage,
                      as: 'ProductImages',
                      attributes: ['id', 'url'],
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: Address,
          as: 'Address',
        },
        {
          model: Payment,
          as: 'Payment',
          attributes: ['paymentMethod', 'status'],
          required: false,
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formattedOrders = orders.rows.map((order) => ({
      ...order.toJSON(),
      ProductVariants: order.OrderProducts.map((op) => ({
        ...op.ProductVariant,
        OrderProduct: {
          quantity: op.quantity,
          createdAt: op.createdAt,
          updatedAt: op.updatedAt,
        },
      })),
      OrderProducts: undefined,
    }));

    res.setHeader('Content-Type', 'application/json');
res.send(stringify({
  orders: formattedOrders,
  totalPages: Math.ceil(orders.count / limit),
}));
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const order = await Order.findOne({ where: { id, UserId: userId } });
    if (!order) {
      throw new AppError('order_not_found', 404);
    }
    if (order.status !== 'pending') {
      throw new AppError('order_cannot_be_cancelled', 400);
    }
    order.status = 'cancelled';
    await order.save();
    res.json({
      message: 'Đơn hàng đã được hủy thành công.',
      order,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserOrdersAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Validate userId
    if (!userId || isNaN(userId)) {
      throw new AppError('invalid_user_id', 400);
    }

    // First get total count
    const totalCount = await Order.count({
      where: { UserId: userId }
    });

    // Then get paginated orders
    const orders = await Order.findAll({
      where: { UserId: userId },
      include: [
        {
          model: OrderProduct,
          as: 'OrderProducts',
          include: [
            {
              model: ProductVariant,
              as: 'ProductVariant',
              include: [
                {
                  model: Product,
                  as: 'Product',
                  attributes: ['id', 'name', 'price'],
                  include: [
                    {
                      model: ProductImage,
                      as: 'ProductImages',
                      attributes: ['id', 'url'],
                      limit: 1,
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
        { 
          model: Address,
          as: 'Address',
          attributes: ['id', 'fullName', 'addressLine', 'city', 'state', 'country', 'postalCode'],
        },
        { 
          model: Payment,
          as: 'Payment',
          attributes: ['id', 'status', 'createdAt'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Format lại kết quả cho frontend dễ xử lý
    const formattedOrders = orders.map(order => {
      const orderJSON = order.toJSON();
      return {
        ...orderJSON,
        items: order.OrderProducts.map(op => ({
          productId: op.ProductVariant.Product.id,
          name: op.ProductVariant.Product.name,
          quantity: op.quantity,
          price: op.ProductVariant.Product.price,
          image: op.ProductVariant.Product.ProductImages?.[0]?.url || null
        })),
        OrderProducts: undefined,
      };
    });

    res.json({
      orders: formattedOrders,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      totalOrders: totalCount
    });
  } catch (err) {
    console.error('Error in getUserOrdersAdmin:', err);
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const order = await Order.findOne({
      where: {
        id,
        ...(isAdmin ? {} : { UserId: userId }) // Admin có thể xem tất cả đơn hàng
      },
      include: [
        {
          model: OrderProduct,
          as: 'OrderProducts',
          include: [
            {
              model: ProductVariant,
              as: 'ProductVariant',
              include: [
                {
                  model: Product,
                  as: 'Product',
                  attributes: ['id', 'name', 'price'],
                  include: [
                    {
                      model: ProductImage,
                      as: 'ProductImages',
                      attributes: ['id', 'url'],
                      limit: 1,
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
        { 
          model: Address, 
          as: 'Address',
          attributes: ['id', 'fullName', 'addressLine', 'city', 'state', 'country', 'postalCode']
        },
        { 
          model: Payment, 
          as: 'Payment',
          attributes: ['id', 'status', 'createdAt']
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'name']
        }
      ],
    });

    if (!order) {
      throw new AppError('order_not_found', 404);
    }

    // Format lại kết quả cho frontend dễ xử lý
    const orderJSON = order.toJSON();
    const formattedOrder = {
      id: orderJSON.id,
      total: orderJSON.total,
      shippingFee: orderJSON.shippingFee,
      status: orderJSON.status,
      paymentMethod: orderJSON.paymentMethod,
      createdAt: orderJSON.createdAt,
      User: {
        id: orderJSON.User.id,
        name: orderJSON.User.name,
        email: orderJSON.User.email
      },
      Address: {
        id: orderJSON.Address.id,
        fullName: orderJSON.Address.fullName,
        addressLine: orderJSON.Address.addressLine,
        city: orderJSON.Address.city,
        state: orderJSON.Address.state,
        country: orderJSON.Address.country,
        postalCode: orderJSON.Address.postalCode
      },
      Payment: orderJSON.Payment || {},
      items: orderJSON.OrderProducts.map(op => ({
        id: op.id,
        quantity: op.quantity,
        productId: op.ProductVariant.Product.id,
        name: op.ProductVariant.Product.name,
        price: op.ProductVariant.Product.price,
        image: op.ProductVariant.Product.ProductImages?.[0]?.url || null,
        variant: {
          id: op.ProductVariant.id,
          size: op.ProductVariant.size,
          color: op.ProductVariant.color
        }
      }))
    };

    res.json(formattedOrder);
  } catch (err) {
    console.error('Error in getOrderById:', err);
    next(err);
  }
};