const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const paypal = require('paypal-rest-sdk');
const axios = require('axios');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const { sendPaymentConfirmationEmail } = require('../utils/email');
const Joi = require('joi');

paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

const createPaymentSchema = Joi.object({
  orderId: Joi.number().integer().required(),
  paymentMethod: Joi.string().valid('paypal').required(),
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

    const rates = response.data.rates;
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      throw new AppError('currency_not_supported', 400);
    }

    const vndToEur = rates[fromCurrency];
    const usdToEur = rates[toCurrency];
    const vndToUsd = usdToEur / vndToEur;
    return vndToUsd;
  } catch (error) {
    throw new AppError('failed_exchange_rate', 500);
  }
}

exports.createPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { error, value } = createPaymentSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { orderId, paymentMethod } = value;

    const order = await Order.findOne(
      {
        where: { id: orderId, UserId: req.user.id, status: 'pending' },
      },
      { transaction }
    );
    if (!order) {
      throw new AppError('order_not_found_or_invalid', 404);
    }

    const existingPayment = await Payment.findOne(
      { where: { OrderId: orderId, status: 'completed' }, transaction }
    );
    if (existingPayment) {
      throw new AppError('order_already_paid', 400);
    }

    const exchangeRate = await getExchangeRate('VND', 'USD');
    const totalInUSD = (order.total * exchangeRate).toFixed(2);

    const paymentData = {
      intent: 'sale',
      payer: { payment_method: 'paypal' },
      redirect_urls: {
        return_url: 'http://localhost:3456/api/payments/success',
        cancel_url: 'http://localhost:3456/api/payments/cancel',
      },
      transactions: [
        {
          amount: {
            total: totalInUSD,
            currency: 'USD',
          },
          description: `Payment for Order #${orderId}`,
        },
      ],
    };

    paypal.payment.create(paymentData, async (error, payment) => {
      if (error) {
        throw new AppError('paypal_error', 500);
      }

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

      const approvalUrl = payment.links.find((link) => link.rel === 'approval_url').href;
      res.json({
        message: 'Thanh toán đã được tạo thành công.',
        paymentId: payment.id,
        approvalUrl,
      });
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.paymentSuccess = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { paymentId, PayerID, orderId } = req.query;

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
      await sendPaymentConfirmationEmail(user.email, order.id, payment.amount);

      await transaction.commit();

      res.json({
        message: 'Thanh toán đã được hoàn tất thành công.',
        payment: executedPayment,
      });
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.paymentCancel = async (req, res, next) => {
  try {
    res.json({ message: 'Thanh toán đã bị hủy.' });
  } catch (err) {
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
    next(err);
  }
};