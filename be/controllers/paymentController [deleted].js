const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const paypal = require('paypal-rest-sdk');
const axios = require('axios');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const { sendPaymentConfirmationEmail } = require('../utils/email');
const Joi = require('joi');

// Configure PayPal with environment variables
paypal.configure({
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

// Get base URL for callback URLs
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL || 'https://your-production-domain.com';
  }
  return 'http://localhost:3000';
};

const createPaymentSchema = Joi.object({
  orderId: Joi.number().integer().required().messages({
    'number.base': 'orderId phải là số',
    'number.integer': 'orderId phải là số nguyên',
    'any.required': 'orderId là bắt buộc'
  }),
  paymentMethod: Joi.string().valid('paypal').required().messages({
    'string.base': 'Phương thức thanh toán không hợp lệ',
    'any.only': 'Chỉ hỗ trợ thanh toán qua PayPal',
    'any.required': 'Phương thức thanh toán là bắt buộc'
  })
});

async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    const response = await axios.get(`http://data.fixer.io/api/latest`, {
      params: {
        access_key: process.env.FIXER_API_KEY,
        base: 'EUR',
        symbols: `${fromCurrency},${toCurrency}`,
      },
    });

    if (!response.data.success) {
      console.error('Fixer API error:', response.data.error);
      throw new AppError('failed_exchange_rate', 500);
    }

    const rates = response.data.rates;
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      throw new AppError('currency_not_supported', 400);
    }

    const vndToEur = rates[fromCurrency];
    const usdToEur = rates[toCurrency];
    const vndToUsd = usdToEur / vndToEur;
    return vndToUsd;
  } catch (error) {
    console.error('Exchange rate error:', error);
    throw new AppError('failed_exchange_rate', 500);
  }
}

exports.createPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    console.log('Creating payment with data:', req.body);
    
    // Validate request body
    const { error, value } = createPaymentSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      console.error('Validation error:', error.details);
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message: errorMessage
      });
    }

    const { orderId, paymentMethod } = value;

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      where: { 
        id: orderId, 
        UserId: req.user.id, 
        status: 'pending' 
      },
      transaction
    });

    if (!order) {
      console.error('Order not found:', { orderId, userId: req.user.id });
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy đơn hàng hoặc đơn hàng không hợp lệ'
      });
    }

    // Check if order is already paid
    const existingPayment = await Payment.findOne({
      where: { 
        OrderId: orderId, 
        status: 'completed' 
      },
      transaction
    });

    if (existingPayment) {
      console.error('Order already paid:', { orderId });
      return res.status(400).json({
        status: 'error',
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    // Get exchange rate and convert amount
    const exchangeRate = await getExchangeRate('VND', 'USD');
    const totalInUSD = (order.total * exchangeRate).toFixed(2);
    console.log('Converted amount:', { vnd: order.total, usd: totalInUSD, rate: exchangeRate });

    // Prepare PayPal payment data
    const baseUrl = getBaseUrl();
    const paymentData = {
      intent: 'sale',
      payer: { payment_method: 'paypal' },
      redirect_urls: {
        return_url: `${baseUrl}/api/payments/success?orderId=${orderId}`,
        cancel_url: `${baseUrl}/api/payments/cancel?orderId=${orderId}`,
      },
      transactions: [
        {
          amount: {
            total: totalInUSD,
            currency: 'USD',
            details: {
              subtotal: totalInUSD,
              tax: '0.00',
              shipping: '0.00',
            },
          },
          description: `Payment for Order #${orderId}`,
          item_list: {
            items: [
              {
                name: `Order #${orderId}`,
                description: 'Your order items',
                quantity: '1',
                price: totalInUSD,
                currency: 'USD',
              },
            ],
          },
        },
      ],
    };

    console.log('Creating PayPal payment with data:', paymentData);

    // Create PayPal payment
    const payment = await new Promise((resolve, reject) => {
      paypal.payment.create(paymentData, (error, payment) => {
        if (error) {
          console.error('PayPal payment creation error:', error);
          reject(error);
          return;
        }
        resolve(payment);
      });
    });

    if (!payment || !payment.id) {
      return res.status(500).json({
        status: 'error',
        message: 'Không thể tạo thanh toán PayPal'
      });
    }

    console.log('PayPal payment created:', payment);

    // Create payment record in database
    const dbPayment = await Payment.create(
      {
        OrderId: orderId,
        paymentMethod,
        amount: order.total,
        status: 'pending',
        paypalPaymentId: payment.id,
      },
      { transaction }
    );

    await transaction.commit();
    console.log('Payment record created:', dbPayment.toJSON());

    // Get approval URL
    const approvalUrl = payment.links.find((link) => link.rel === 'approval_url')?.href;
    if (!approvalUrl) {
      return res.status(500).json({
        status: 'error',
        message: 'Không thể lấy URL thanh toán PayPal'
      });
    }

    console.log('Approval URL:', approvalUrl);

    return res.json({
      status: 'success',
      message: 'Thanh toán đã được tạo thành công.',
      paymentId: payment.id,
      approvalUrl,
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Payment creation error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Có lỗi xảy ra khi tạo thanh toán'
    });
  }
};

exports.paymentSuccess = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { paymentId, PayerID, orderId } = req.query;

    if (!paymentId || !PayerID || !orderId) {
      throw new AppError('invalid_payment_parameters', 400);
    }

    const payment = await Payment.findOne(
      { where: { paypalPaymentId: paymentId, OrderId: orderId }, transaction }
    );
    if (!payment) {
      throw new AppError('payment_not_found', 404);
    }

    const order = await Order.findByPk(orderId, { transaction });
    if (!order || order.UserId !== req.user.id) {
      throw new AppError('order_not_found', 404);
    }

    const exchangeRate = await getExchangeRate('VND', 'USD');
    const totalInUSD = (payment.amount * exchangeRate).toFixed(2);

    const executePayment = {
      payer_id: PayerID,
      transactions: [{ amount: { total: totalInUSD, currency: 'USD' } }],
    };

    paypal.payment.execute(paymentId, executePayment, async (error, executedPayment) => {
      if (error) {
        console.error('PayPal payment execution error:', error);
        throw new AppError('paypal_execution_failed', 500);
      }

      const paypalAmount = executedPayment.transactions[0].amount.total;
      if (parseFloat(paypalAmount) !== parseFloat(totalInUSD)) {
        throw new AppError('invalid_payment_amount', 400);
      }

      await payment.update(
        {
          status: 'completed',
          paypalTransactionId: executedPayment.id,
        },
        { transaction }
      );
      await order.update({ status: 'completed' }, { transaction });

      const user = await User.findByPk(req.user.id, { transaction });
      if (user && user.email) {
        await sendPaymentConfirmationEmail(user.email, order.id, payment.amount);
      }

      await transaction.commit();

      res.json({
        message: 'Thanh toán đã được hoàn tất thành công.',
        payment: executedPayment,
      });
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Payment success error:', err);
    next(err);
  }
};

exports.paymentCancel = async (req, res, next) => {
  try {
    const { orderId } = req.query;
    if (orderId) {
      const payment = await Payment.findOne({ where: { OrderId: orderId } });
      if (payment) {
        await payment.update({ status: 'failed' });
      }
    }
    res.json({ message: 'Thanh toán đã bị hủy.' });
  } catch (err) {
    console.error('Payment cancel error:', err);
    next(err);
  }
};

exports.getPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({
      where: { OrderId: orderId },
      include: [
        {
          model: Order,
          as: 'Order',
          where: { UserId: req.user.id },
        },
      ],
    });

    if (!payment) {
      throw new AppError('payment_not_found', 404);
    }

    res.json({
      id: payment.id,
      orderId: payment.OrderId,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      amount: payment.amount,
      paypalPaymentId: payment.paypalPaymentId,
      paypalTransactionId: payment.paypalTransactionId,
    });
  } catch (err) {
    console.error('Get payment error:', err);
    next(err);
  }
};