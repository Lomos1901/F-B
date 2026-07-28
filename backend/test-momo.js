const crypto = require('crypto');
const amount = 50000;
const orderId = 'a1234567-89ab-cdef-0123-456789abcdef';
const partnerCode = 'MOMOBKUN20180529';
const accessKey = 'klm05TvNBzhg7h7j';
const secretKey = 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa';
const requestId = orderId.substring(0, 30) + '-' + Date.now();
const orderInfo = 'Thanh toan don hang';
const redirectUrl = 'http://localhost:3000/pos';
const ipnUrl = 'http://localhost:3001/payments/momo-ipn';
const requestType = 'captureWallet';
const extraData = '';
const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
const requestBody = { partnerCode, partnerName: 'SẪM COFFEE', storeId: 'MomoTestStore', requestId, amount, orderId, orderInfo, redirectUrl, ipnUrl, lang: 'vi', requestType, autoCapture: true, extraData, signature };

fetch('https://test-payment.momo.vn/v2/gateway/api/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) })
  .then(res => res.json())
  .then(data => console.log(data));
