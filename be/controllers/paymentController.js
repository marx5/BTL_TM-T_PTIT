const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const paypal = require('paypal-rest-sdk');
const axios = require('axios');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const { sendPaymentConfirmationEmail } = require('../utils/email');
const Joi = require('joi');
const { where } = require('sequelize');
const { createHmac } = require('crypto');
const { request } = require('https');

const getBaseUrl= ()=> {
    return "http://localhost:3000";
}


const createPaymentSchema_1 = 
    Joi.object(
        {
            orderId: Joi.number().integer().required()
                .messages(
                    {
                        'number.base': 'orderId phải là số',
                        'number.integer': 'orderId phải là số nguyên',
                        'any.required': 'orderId là bắt buộc'
                    }
                ),

            paymentMethod: Joi.string().valid('momo').required()
                .messages(
                    {
                        'string.base': 'Phương thức thanh toán không hợp lệ',
                        'any.only': 'Chỉ hỗ trợ thanh toán qua momo',
                        'any.required': 'Phương thức thanh toán là bắt buộc'
                    }
                )
        }
    );

exports.createPayment= async(req, res, next) =>{
    const transaction_1 = await sequelize.transaction(); // cách sử dụng : await User.create({ name: 'John Doe' }, { transaction });

    try{
        console.log('Creating payment with data : ', req.body);

        const {error, value}= 
            createPaymentSchema_1
                .validate(
                    req.body,
                    {
                        abortEarly: false,
                        allowUnknown: false
                    }
                );

        if(error){
            console.error('Validation error : ', error.details);

            const errorMessage = 
                error.details
                    .map(
                        details=> details.message
                    )
                    .join(', ');
            
            return res
                .status(400)
                .json(
                    {
                        status: 'error',
                        message: errorMessage
                    }
                )
        }

        const {orderId, paymentMethod}= value;

        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 Check if order exists and belongs to user

        const order= await 
            Order.findOne(
                {
                    where: {
                        id : orderId,
                        UserId: req.user.id,
                        status: 'pending'
                    },
                    transaction_1
                }
            )


        if(!order){
            console.error('Order not found : ', {orderId, userId: req.user.id});
            return res
                .status(400)
                .json(
                    {
                        status: 'error',
                        message: 'không tìm thấy đơn hàng hoặc đơn hàng không hợp lệ'
                    }
                );
        }
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩

        // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥 check if order is already paid
        const existingPayment = await 
            Payment.findOne(
                {
                    where: { 
                        OrderId: orderId, 
                        status: 'completed' 
                    },
                    transaction_1
                }
            );

        if (existingPayment) {
            console.error('Order already paid:', { orderId });
            
            return res
                .status(400)
                .json(
                    {
                       status: 'error',
                        message: 'Đơn hàng đã được thanh toán'
                    }
                );
        }
        // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥


        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 chuẩn bị dữ liệu để gửi api momo
        //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
        //parameters
        var partnerCode_Momo = "MOMOKXAQ20250410";
        var accessKey_Momo = "wd2ELg3mTHEVm1NU";
        var secretkey_Momo = "CtWZFmI4Hllt7BrjbVQLbFChqxwVbS8X";
        var requestId_Momo = partnerCode_Momo + new Date().getTime();
        var orderId_Momo = requestId_Momo;
        var orderInfo_Momo = "pay with MoMo : "+ requestId_Momo;
        var redirectUrl_Momo = "http://localhost:3000";
        
        var ipnUrl_Momo = "http://localhost:3456/api/payments/success";
        // var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
        
        var amount_Momo = "50000";
        var requestType_Momo = "captureWallet"
        var extraData_Momo = ""; //pass empty value if your merchant does not have stores
        
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩

        //before sign HMAC SHA256 with format
        //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
        var rawSignature_Momo = 
            "accessKey="+accessKey_Momo
            +"&amount=" + amount_Momo
            +"&extraData=" + extraData_Momo
            +"&ipnUrl=" + ipnUrl_Momo
            +"&orderId=" + orderId_Momo
            +"&orderInfo=" + orderInfo_Momo
            +"&partnerCode=" + partnerCode_Momo 
            +"&redirectUrl=" + redirectUrl_Momo
            +"&requestId=" + requestId_Momo
            +"&requestType=" + requestType_Momo ;
        
        
        //puts raw signature
        console.log("🟩🟩🟩🟩--------------------RAW SIGNATURE----------------🟩🟩🟩🟩")
        console.log(rawSignature_Momo)
        
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩

        //signature
        
        
        var signature_Momo = 
            createHmac('sha256', secretkey_Momo)
                .update(rawSignature_Momo)
                .digest('hex');
        
        console.log("--------------------SIGNATURE----------------")
        console.log(signature_Momo)
        
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩

        //json object send to MoMo endpoint
        const requestBody_Momo = 
            JSON.stringify(
                {
                    partnerCode : partnerCode_Momo,
                    accessKey : accessKey_Momo,
                    requestId : requestId_Momo,
                    amount : amount_Momo,
                    orderId : orderId_Momo,
                    orderInfo : orderInfo_Momo,
                    redirectUrl : redirectUrl_Momo,
                    ipnUrl : ipnUrl_Momo,
                    extraData : extraData_Momo,
                    requestType : requestType_Momo,
                    signature : signature_Momo,
                    lang: 'vi'
                }
            );
        
        //Create the HTTPS objects
        
        const options_Momo = {
            hostname: 'payment.momo.vn',
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody_Momo)
            }
        }
        
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
        
        // Hàm thực hiện yêu cầu HTTP POST và trả về dữ liệu JSON
        async function makePostRequest(options, requestBody) {
            
            return new Promise(
                (resolve, reject) => {
                    const req = request(
                        options, 
        
                        (res) => {
                            let data = '';
        
                            res.on( 
                                'data', 
                                (chunk) => { data += chunk; } 
                            );
        
                            res.on(
                                'end', 
                                () => {
                                    try {
                                        const jsonResponse = JSON.parse(data); // Chuyển đổi thành JSON
                                        resolve(jsonResponse); // Trả về dữ liệu JSON
                                    } 
                                    
                                    catch (error) {
                                        reject(`Error parsing JSON: ${error.message}`);
                                    }
                                }
                            );
                        }
                    );
        
                    req.on(
                        'error', 
                        (error) => {
                            reject(error); // Xử lý lỗi nếu có
                        }
                    );
        
                    // Gửi dữ liệu JSON vào request body
                    req.write(requestBody);
        
                    req.end();
                }
            );
        }
        
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
        
        const responseData = await makePostRequest(options_Momo, requestBody_Momo);
        console.log('Response from server:', responseData);
        
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩


        // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥 kiểm tra tồn tại

        const paymentTimKiemDuoc = await 
            Payment.findOne(
                {
                    where: {
                        OrderId : orderId_Momo,
                        status: 'pending'
                    }
                },
                {transaction_1}
            )

        const dbPayment= "";
        
        if(!paymentTimKiemDuoc){
            dbPayment = await 
                Payment.create(
                    {
                        OrderId : orderId_Momo,
                        paymentMethod : paymentMethod,
                        amount : amount_Momo,
                        status : 'pending',
                        momoPaymentId : requestId_Momo
                    },
                    {transaction_1}
                );
        }else{
            dbPayment = await
                Payment.update(
                    {
                        OrderId : orderId_Momo,
                        paymentMethod : paymentMethod,
                        amount : amount_Momo,
                        status : 'pending',
                        momoPaymentId : requestId_Momo
                    },
                    {transaction_1}
                );
        }

        console.log('Approval url : ', responseData.payUrl);

        // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥 trả về kết quả
        return res.json(
            {
                status : 'success',
                message : 'thanh toan được tạo thành công',
                paymentId : dbPayment.id,
                approvalUrl : responseData.payUrl
            }
        );

        // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥 

    }

    catch(err){
        await transaction_1.rollback();
        console.error("Payment creation error : ", err);

        return res
            .status(500)
            .json(
                {
                    status: 'error',
                    message: err.message || 'có lỗi xảy ra khi tạo thanh toán'
                }
            )
        ;
    }
}

exports.paymentSuccess = async (req, res, next)=> {
    const transaction_1 = await sequelize.transaction();

    try{
        const requestData_1= req.body;

        var secretkey_Momo= "CtWZFmI4Hllt7BrjbVQLbFChqxwVbS8X";

        // accessKey=$accessKey
        var accessKey_Momo= "wd2ELg3mTHEVm1NU";
        // &amount=$amount
        var amount_Momo= requestData_1.amount;
        // &extraData=$extraData
        var extraData_Momo= requestData_1.extraData;
        // &message=$message
        var message_Momo= requestData_1.message;
        // &orderId=$orderId
        var orderId_Momo= requestData_1.orderId;
        // &orderInfo=$orderInfo
        var orderInfo_Momo= requestData_1.orderInfo;
        // &orderType=$orderType
        var orderType_Momo= requestData_1.orderType;
        // &partnerCode=$partnerCode
        var partnerCode_Momo= requestData_1.partnerCode;
        // &payType=$payType
        var payType_Momo= requestData_1.payType;
        // &requestId=$requestId
        var requestId_Momo= requestData_1.requestId;
        // &responseTime=$responseTime
        var responseTime_Momo= requestData_1.responseTime;
        // &resultCode=$resultCode
        var resultCode_Momo= requestData_1.resultCode;
        // &transId=$transId
        var transId_Momo= requestData_1.transId;

        // signature_Momo
        var signature_Momo= requestData_1.signature;

        var rawSignature2= 
            "accessKey="+accessKey_Momo
            + "&amount="+ amount_Momo
            + "&extraData="+ extraData_Momo
            + "&message=" + message_Momo
            + "&orderId=" + orderId_Momo
            + "&orderInfo=" + orderInfo_Momo
            + "&orderType=" + orderType_Momo
            + "&partnerCode=" + partnerCode_Momo
            + "&payType=" + payType_Momo
            + "&requestId=" + requestId_Momo
            + "&responseTime=" + responseTime_Momo
            + "&resultCode=" + resultCode_Momo
            + "&transId=" + transId_Momo;

        var signature2= 
            createHmac('sha256', secretkey_Momo)
                .update(rawSignature2)
                .digest('hex');
        
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
        var dungChuKy= await new Promise(
            (resolve, reject)=> {
                if(signature2 == signature_Momo){
                    resolve(true);
                }else{
                    resolve(false);
                }
            }
        )

        if(dungChuKy== false){
            throw new AppError('sai chu ky : ', 400);
        }
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
        const payment1 = await 
            Payment.findOne(
                orderId_Momo, 
                {transaction_1} 
            );
        if(!payment1){
            throw new AppError('payment not found ', 404);
        }
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
        const order1 = await
            Order.findByPk(
                orderId_Momo,
                { transaction_1 }
            );
        if(!order1){
            throw new AppError('order not found ', 404)
        }
        // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩

        // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥
        await payment1.update(
            {
                staus: 'completed',
                momoPaymentId : orderId_Momo
            },
            {transaction_1}
        );

        // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥

        await order1.update(
            { status: 'completed'},
            {transaction_1}
        );

        // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥

        await transaction_1.commit();

        // 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥

        res.json(
            {
                message : 'Thanh toán đã được hoàn tất thành công. ',
                payment: {
                    orderId : orderId_Momo,
                    orderInfo_Momo : orderInfo_Momo,
                    requestId_Momo : requestId_Momo,
                    amount_Momo : amount_Momo
                }
            }
        );
    }

    catch(err){
        await transaction_1.rollback();
        console.error('Payment success error : ', err);
        next(err);
    }
}

exports.paymentCancel = async (req, res, next)=> {
    try {
        const orderId = req.body.orderId;
        
        if(orderId){
            const payment= await 
                Payment.findOne(
                    {
                        where : {
                            OrderId : orderId
                        }
                    }
                );

            if(payment){
                await payment.update( {status : 'failed'} );
            }
        }

        res.json(
            {message : 'thanh toán hủy thành công '}
        );
    }

    catch(err){
        console.error('payment cancel error : ', err);
        next(err);
    }
}

exports.getPayment = async (req, res, next)=> {
    try{
        const orderId = req.body.orderId;

        const payment = await
            Payment.findOne(
                {
                    where : {
                        OrderId : orderId
                    }
                }
            )

        if(!payment){
            throw new AppError('payment not found ', 404);
        }

        res.json(
            {
                id: payment.id,
                orderId: payment.OrderId,
                status: payment.status,
                amount: payment.amount,
            }
        )
    }

    catch(err){
        console.error('get payment error : ', err);
        next(err);
    }
}