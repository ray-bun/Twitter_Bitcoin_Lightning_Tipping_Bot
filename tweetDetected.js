const config = require("./config.js");
const umbril = require("./umbril");
const responseToTwit = require("./responseToTwit");
const qrCodeRead = require("./qrcoderead");
const updateTwitterBio = require("./updateTwitterBio");
const axios = require("axios");
const supabase = require("./supabase");

async function tweetDetected(tweet, twitContainURL, userID, twitterUserID, accountAge, userScrenName) {
  try {
    let qrCodeInvoice = await checkQforLightningAddress(tweet, twitContainURL, twitterUserID);
    console.log(qrCodeInvoice);

    // found QR Code
    if (qrCodeInvoice.length >= 90) {
      let checkUserIDInDatabase = await supabase.QueryTwitterID(twitterUserID);
      let checkUserIDinPendingPayout = await supabase.QueryTwitterIDPendingPayout(twitterUserID);
      let checkUserIDinPaidPayout = await supabase.QueryTwitterIDPaidPayout(twitterUserID);

      let time = Date.now();

      console.log(`${new Date(time)} - User: ${userScrenName} User ID: ${twitterUserID} Account Age: ${accountAge} DB: ${checkUserIDInDatabase} URL: ${twitContainURL}`);
      // check if there's URL and user ID is false and account older than 60 days
      if (!checkUserIDInDatabase && !checkUserIDinPendingPayout && !checkUserIDinPaidPayout && accountAge >= 60) {
        console.log("--------- START DEFAULT PAYMENT ---------");
        let timerStart = new Date();
        //may want to show timer, time to take to pay
        console.log("Wallet QR: ", qrCodeInvoice);
        //send response
        let MakePaymentAndReturnFee = await umbril.makePayment(qrCodeInvoice, config.defaultPayOut, checkUserIDinPendingPayout);
        console.log("Fee PAID: ", MakePaymentAndReturnFee.fee);
        let timerEnd = new Date() - timerStart;
        console.log("Executed in: ", timerEnd);
        supabase.InsertPaidTwitterID(twitterUserID, MakePaymentAndReturnFee.sat, MakePaymentAndReturnFee.fee, userScrenName);
        console.log("User inserted / Update BIO");
        //Update Twitter Bio
        updateTwitterBio();
        responseToTwit.sendTwit(tweet, "success", { time: timerEnd, amountandfee: { fee: MakePaymentAndReturnFee.fee, sat: MakePaymentAndReturnFee.sat } });
      } else if (checkUserIDinPendingPayout && !checkUserIDinPaidPayout) {
        console.log("--------- START TIPPING PAYMENT ---------");
        let timerStart = new Date();
        //may want to show timer, time to take to pay
        let pendingAmount = await supabase.QueryTwitterPendingPayoutAmount(twitterUserID);

        let MakePaymentAndReturnFee = await umbril.makePayment(qrCodeInvoice, pendingAmount, checkUserIDinPendingPayout);
        console.log("Fee PAID: ", MakePaymentAndReturnFee.fee);
        let timerEnd = new Date() - timerStart;
        console.log("Executed in: ", timerEnd);
        supabase.UpdatePendingPayout(twitterUserID, MakePaymentAndReturnFee.fee);
        console.log("Updated Pending Payout to PAID");
        //Update Twitter Bio
        updateTwitterBio();

        responseToTwit.sendTwit(tweet, "success", {
          time: timerEnd,
          amountandfee: {
            fee: MakePaymentAndReturnFee.fee,
            sat: MakePaymentAndReturnFee.sat,
          },
        });
      } else if (checkUserIDinPaidPayout) {
        console.log("Tweet already PAID");
        responseToTwit.sendTwit(tweet, "alreadypaidout");
      } else {
        // Twit invalid invoice/wallet
        if (config.enableErrorTwit) {
          console.log("Tweet INVALID invoice");
          responseToTwit.sendTwit(tweet, "invalidinvoice");
        }
        console.log("Error not lighning invoice");
      }
    }
  } catch (err) {
    if (err === Object(err) && err.data != "undefined") {
      console.log("Error in Tweet detected ", err);
      responseToTwit.sendTwit(tweet, "error", err.data);
    }

    // console.log("Unable to read QR Code: ", err);
  }
}
function checkIfContainQR(tweet, twitContainURL) {
  return new Promise(async (resolve, reject) => {
    try {
      if (twitContainURL) {
        let url = tweet.entities.media[0].media_url;
        console.log("URL Found: ", url);
        qrCodeMediaURL = encodeURIComponent(url);
        let videoURL = url.includes("video");
        if (!videoURL) {
          let lightningInvoice = await qrCodeRead(qrCodeMediaURL);
          if (qrCodeMediaURL && lightningInvoice.length >= 90) {
            let lightningInvoiceLowerCase = lightningInvoice.toLowerCase();
            let cleanQRCode = lightningInvoiceLowerCase.replace("lightning:", "");
            console.log("Lightning Invoice QR Code: ", cleanQRCode);
            resolve(cleanQRCode);
          } else {
            console.log("QR Code not detected");
            reject("Unable to ready QR Code / or Invalid");
          }
        } else {
          console.log("Detected video in the URL");
          reject("Video URL Detected, ignoring");
        }
      } else {
        reject();
      }
    } catch (err) {
      reject("No URL detected");
    }
  });
}
// LIGHTING ADDRESS
function validateEmail(email) {
  return new Promise((resolve, reject) => {
    var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
    let containsEmail = re.test(email);
    console.log(containsEmail);
    if (containsEmail) {
      console.log("yes, email found");
      const emailAddress = email.match(re);
      let domain = emailAddress[0].split("@");
      console.log({
        email: emailAddress[0],
        domain: domain[1],
        userName: domain[0],
      });
      console.log("Email found: ", emailAddress[0]);
      resolve({ email: emailAddress[0], domain: domain[1], userName: domain[0] });
    } else reject();
  });
}

async function getLNURL(domain, username, paymentAmount) {
  try {
    // fetch data from a url endpoint
    const response = await axios.get(`https://${domain}/.well-known/lnurlp/${username}`);
    const data = await response.data;
    //console.log(response)
    if (response.status == 200) {
      // let callbackURL = await data.callback
      let callBackURL = `${data.callback}?amount=${paymentAmount * 1000}&comment=:D%20Follow%20us%20@${config.twitteraccount}`;
      console.log(callBackURL);
      let responseCallback = await axios.get(callBackURL);
      let dataCallback = await responseCallback.data;
      console.log(dataCallback.pr);
      return dataCallback.pr;
    }
  } catch {
    reject("Invalid lightning address email");
  }
}

function checkQforLightningAddress(tweet, twitContainURL, twitterUserID) {
  return new Promise(async (resolve, reject) => {
    let twitText = tweet.text;
    try {
      let qrCodeInvoice = await checkIfContainQR(tweet, twitContainURL);
      if (qrCodeInvoice.length >= 90) {
        console.log("Found QR Code");
        resolve(qrCodeInvoice);
      } else {
        reject();
      }
      //Check for Lightning Address
    } catch (err) {
      try {
        console.log(err);
        let checkEmail = await validateEmail(twitText);
        let validEmail = Object.keys(checkEmail).length >= 1;
        if (validEmail) {
          let pendingAmount = await supabase.QueryTwitterPendingPayoutAmount(twitterUserID);
          let checkUserIDInDatabase = await supabase.QueryTwitterID(twitterUserID);
          let checkUserIDinPendingPayout = await supabase.QueryTwitterIDPendingPayout(twitterUserID);
          let checkUserIDinPaidPayout = await supabase.QueryTwitterIDPaidPayout(twitterUserID);

          console.log("Pending Amount Due: " + pendingAmount);
          if (pendingAmount >= 1 && pendingAmount <= config.maxTipAmount) {
            let invoiceLNURL = await getLNURL(checkEmail.domain, checkEmail.userName, pendingAmount);
            resolve(invoiceLNURL);
          } else if ((!checkUserIDInDatabase || !checkUserIDinPendingPayout) && !checkUserIDinPaidPayout) {
            let invoiceLNURL = await getLNURL(checkEmail.domain, checkEmail.userName, config.defaultPayOut);
            resolve(invoiceLNURL);
          }
        } else {
          reject();
        }
      } catch (err) {
        reject(err);
      }
    }
  });
}

module.exports = tweetDetected;
