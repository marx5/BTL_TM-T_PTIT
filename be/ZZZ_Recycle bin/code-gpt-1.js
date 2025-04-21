import { createHmac } from 'crypto';
import { request } from 'https';

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
//signature


var signature_Momo = 
    createHmac('sha256', secretkey_Momo)
        .update(rawSignature_Momo)
        .digest('hex');

console.log("--------------------SIGNATURE----------------")
console.log(signature_Momo)

//json object send to MoMo endpoint
const requestBody_Momo = JSON.stringify({
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
});

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

// Sử dụng async/await để gọi hàm và xử lý kết quả
async function sendData(options, requestBody) {
  try {
    const responseData = await makePostRequest(options, requestBody);
    console.log('Response from server:', responseData);
  } catch (error) {
    console.error('Error:', error);
  }
}

// sendData(); // Gửi yêu cầu POST

const responseData = await makePostRequest(options_Momo, requestBody_Momo);
console.log('Response from server:', responseData);

console.log('Response from server:', responseData.payUrl);


