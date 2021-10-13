const axios = require("axios");
const config = require("./config.js");
const QueryDatabase = require("./mysql");
let randomSeconds = Math.floor(Math.random() * 10);

module.exports.getJWTToken = function getJWTToken() {
  return new Promise((resolve, reject) => {
    axios
      .post(`http://umbrel.local/manager-api/v1/account/login`, config.umbrilpassword)
      .then((res) => resolve(res.data.jwt))
      .catch((error) => reject(error.response.data));
  });
};

function checkNumSatoshis(JWTToken, qrcode) {
  return new Promise((resolve, reject) => {
    axios
      .get(`http://umbrel.local/api/v1/lnd/lightning/invoice?paymentRequest=${qrcode}`, {
        headers: {
          Authorization: `JWT ${JWTToken}`,
        },
      })
      .then((res) => resolve(res.data.numSatoshis))
      .catch((error) => reject(error.response.data));
  });
}

function payInvoice(JWTToken, qrcode, amt) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      axios
        .post(
          `http://umbrel.local/api/v1/lnd/lightning/payInvoice`,
          { amt: amt, paymentRequest: `${qrcode}` },
          {
            headers: {
              Authorization: `JWT ${JWTToken}`,
            },
          }
        )
        .then((response) => resolve(response.data.paymentRoute.totalFees))
        .catch((error) => {
          //let errorBody = error.response.data
          reject(error);
        });
    }, randomSeconds);
  });
}


module.exports.lastDonation = function lastDonation(JWTToken) {
  return new Promise((resolve, reject) => {
    axios
      .get(`http://umbrel.local/api/v1/lnd/lightning/invoices`, {
        headers: {
          Authorization: `JWT ${JWTToken}`,
        },
      })
      .then((res) => {
        let json = res.data;
        let donationList = [];
        //let highestSettleDate = [];
        for (var i = 0; i < res.data.length; i++) {
          var obj = json[i];
          if (obj.memo && obj.settled) {
            //highestSettleDate.push(obj.settleDate);
            donationList.push({
              memo: obj.memo,
              value: obj.value,
              settleDate: obj.settleDate,
            });
          }
        }
        //console.log(donationList)
        let lastPersonDonated = latestDonor(donationList);
        resolve(lastPersonDonated);
        //console.log(lastPersonDonated)
      })
      .catch((err) => reject(err));
  });
};

function latestDonor(items) {
  let highestPriceSoFar = 0;
  let nameOfHighestPriceSoFar;
  for (const { memo, value, settleDate } of items) {
    if (settleDate > highestPriceSoFar) {
      highestPriceSoFar = settleDate;
      nameOfHighestPriceSoFar = {
        memo: memo,
        value: value,
        settleDate: settleDate,
      };
    }
  }
  return nameOfHighestPriceSoFar;
}

module.exports.makePayment = function makePayment(qrcode, payoutAmount, checkUserIDinPendingPayout) {
  return new Promise(async (resolve, reject) => {
    try {
      //get JWT Token
      let JWTToken = await this.getJWTToken();
      console.log("JWT Token: ", JWTToken);
      let sat = await checkNumSatoshis(JWTToken, qrcode);
      if (sat <= payoutAmount && sat >= 10 && !checkUserIDinPendingPayout && sat <= config.maxTipAmount) {
        //Pay invoice
        console.log("Executing makePayment function ");

        let executePaymentAndFee = await payInvoice(JWTToken, qrcode, 0);
        console.log("Executing Done, going to resolve");
        //returning fee we paid and sat amount
        resolve({ fee: executePaymentAndFee, sat: sat });
      } else if (sat == 0 && !checkUserIDinPendingPayout) {
        //Pay invoice
        console.log("Executing makePayment function with default 100 sats as we didnt detect invoice amount ");
        let executePaymentAndFee = await payInvoice(JWTToken, qrcode, payoutAmount);
        console.log("Executing Done, going to resolve");
        //returning fee we paid and sat amount
        resolve({ fee: executePaymentAndFee, sat: payoutAmount });
      }
      // Payout function--------
      else if (sat <= payoutAmount && sat >= 10 && checkUserIDinPendingPayout) {
        //Pay invoice
        console.log("Payout Executing makePayment function ");

        let executePaymentAndFee = await payInvoice(JWTToken, qrcode, 0);
        console.log("Payout Executing Done, going to resolve");
        //returning fee we paid and sat amount
        resolve({ fee: executePaymentAndFee, sat: sat });
      } else if (sat == 0 && checkUserIDinPendingPayout) {
        //Pay invoice
        console.log("Payout Executing makePayment function with default 1000 sats as we didnt detect invoice amount ");
        let executePaymentAndFee = await payInvoice(JWTToken, qrcode, payoutAmount);
        console.log("Payout Executing Done, going to resolve");
        //returning fee we paid and sat amount
        resolve({ fee: executePaymentAndFee, sat: payoutAmount });
      } else {
        reject(`Invalid sat amount: (${sat}), please try again with the correct amount of Sats.`);
      }
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

module.exports.giveAwayMakePayment = function giveAwayMakePayment() {
  return new Promise(async (resolve, reject) => {
    try {
      //get JWT Token
      let checkPendingPayout = await QueryDatabase.QueryGiveAwayPendingPayout();
      //console.log(checkPendingPayout)
      if (checkPendingPayout) {
        if (checkPendingPayout.amount <= config.maxTipAmount) {
          let JWTToken = await this.getJWTToken();
          console.log("JWT Token: ", JWTToken);
          //Pay invoice
          console.log(`Executing makePayment function, invoice: ${checkPendingPayout.invoice} ${checkPendingPayout.amount}`);
          await QueryDatabase.UpdateGiveAwayPaid(checkPendingPayout.payoutKey);
          // Updated database
          let executePaymentAndFee = await payInvoice(JWTToken, checkPendingPayout.invoice, 0);
          if (executePaymentAndFee) {
            console.log("Database updated");
            console.log("Executing Done, going to resolve");
            resolve({ fee: executePaymentAndFee, amount: checkPendingPayout.amount, time: checkPendingPayout.time, threadID: checkPendingPayout.threadID });
          }
        }
      } else {
        reject("Nothing to process");
      }
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};
