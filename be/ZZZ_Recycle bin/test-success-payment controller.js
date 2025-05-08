const Order = require("../models/Order");
const Payment = require("../models/Payment");
const { createHmac } = require('crypto');
const { request } = require('https');
const { where } = require('sequelize');
const { sequelize } = require('../config/database');


var orderId= 27;

// 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩

const transaction_1 = sequelize.transaction(); // cách sử dụng : await User.create({ name: 'John Doe' }, { transaction });

try{

    const order1= 
        Order.findByPk(
            orderId,
            {transaction_1}
        );

    const payment1= 
        Payment.findByPk(
            orderId,
            {transaction_1}
        );

    // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩

    var secretkey_Momo= "CtWZFmI4Hllt7BrjbVQLbFChqxwVbS8X";

    // accessKey=$accessKey
    var accessKey_Momo= "wd2ELg3mTHEVm1NU";
    // &amount=$amount
    var amount_Momo= order1.total;
    // &extraData=$extraData
    var extraData_Momo= "";//pass ezmpty value if your merchant does not have stores// &message=$message
    var message_Momo= "abc 123";
    // &orderId=$orderId
    var orderId_Momo= orderId;
    // &orderInfo=$orderInfo

    var date1= new Date();
    var orderInfo_Momo= 
        "pay with MoMo : "
        + "\n"+ "🟧 ngay thang nam : "+ date1.getDate()+"/" + date1.getMonth()+ "/"+ date1.getFullYear()
        + "\n"+ "🟧 gio phut giay : "+ date1.getHours() + ":"+ date1.getMinutes()+ ":"+ date1.getSeconds()
        + "\n";
    // &orderType=$orderType
    var orderType_Momo= "momo_wallet";
    // &partnerCode=$partnerCode
    var partnerCode_Momo= "MOMOKXAQ20250410";
    // &payType=$payType
    var payType_Momo= "qr";
    // &requestId=$requestId
    var requestId_Momo= payment1.momoPaymentId ;
    // &responseTime=$responseTime
    var responseTime_Momo= date1.getTime();
    // &resultCode=$resultCode
    var resultCode_Momo= "200";
    // &transId=$transId
    var transId_Momo= payment1.momoPaymentId;


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

    //json object send to MoMo endpoint
    const requestBody_Momo = 
        JSON.stringify(
            {
                accessKey : accessKey_Momo,
                amount : amount_Momo,
                extraData : extraData_Momo,
                message : message_Momo,
                orderId :  orderId_Momo,
                orderInfo : orderInfo_Momo,
                orderType : orderType_Momo,
                partnerCode : partnerCode_Momo,
                payType : payType_Momo,
                requestId : requestId_Momo,
                responseTime : responseTime_Momo,
                resultCode : resultCode_Momo,
                transId : transId_Momo
            }
        );

    //Create the HTTPS objects

    const options_Momo = {
        hostname: 'localhost',
        port: 3456,
        path: '/api/payments/success',
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

    const responseData = makePostRequest(options_Momo, requestBody_Momo);
    console.log('Response from server:', responseData);

    // 🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩

}

catch(err){
    transaction_1.rollback();
    console.error("Payment creation error : ", err);
}