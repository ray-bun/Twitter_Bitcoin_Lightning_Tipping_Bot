const config = require("./config.js");
const umbril = require("./umbril");
const responseToTwit = require("./responseToTwit");
const qrCodeRead = require("./qrcoderead");
const updateTwitterBio = require("./updateTwitterBio");
const axios = require("axios");
const supabase = require("./supabase");
let Twit = require("twit");
let apiList = config.twitterAccountsArray;
let randomAPI = apiList[Math.floor(Math.random() * apiList.length)];
let T = new Twit(randomAPI);

async function payInvoice(tweet) {
  try {
    let refTwitterUerID = tweet.user.id_str;
    let twitterUserID = tweet.in_reply_to_user_id_str;
    let twitThreadID = tweet.in_reply_to_status_id_str;
    let userScrenName = tweet.in_reply_to_screen_name;
    let refUserScrenName = tweet.user.screen_name;
    let twitText = tweet.text;
    let regexPay = new RegExp("@" + config.twitteraccount + " (![Pp][Aa][Yy])");
    let matches = twitText.match(regexPay);
    if (matches != null && matches.length >= 2) {
      let payAmount = Number(matches[2]);
      let data = await searchTweet(twitThreadID);
      let donatedAmount = await supabase.tippingPermission(refTwitterUerID);
      let checkPowerOfSatoshi = await supabase.QueryPowerOfSatoshiStatus(refTwitterUerID);
      if (donatedAmount >= config.powerToTip || checkPowerOfSatoshi) {
        let qrCodeInvoice = await checkQforLightningAddress(data, twitterUserID, payAmount, tweet);
        console.log("Executing payment to QR Code: ", qrCodeInvoice);
        executePayInvoice(twitterUserID, refTwitterUerID, userScrenName, twitThreadID, qrCodeInvoice, tweet, refUserScrenName);
      } else {
        console.log("Not authorised to Pay invoice");
      }
      //let twitterUserID = data.statuses[0].id_str;
    }
  } catch (err) {
    if (err === Object(err) && err.data != "undefined") {
      console.log("Error in Tweet detected ", err);
      responseToTwit.sendTwit(tweet, "error", err.data);
    }

    // console.log("Unable to read QR Code: ", err);
  }
}
async function executePayInvoice(twitterUserID, refTwitterUerID, userScrenName, twitThreadID, qrCodeInvoice, tweet, refUserScrenName) {
  try {
    if (qrCodeInvoice.length >= 90) {
      let checkUserIDInDatabase = await supabase.QueryTwitterID(twitterUserID);
      let checkUserIDinPendingPayout = await supabase.QueryTwitterIDPendingPayout(twitterUserID);
      let checkUserIDinPaidPayout = await supabase.QueryTwitterIDPaidPayout(twitterUserID);

      let time = Date.now();

      console.log(`${new Date(time)} - User: ${userScrenName} User ID: ${twitterUserID} DB: ${checkUserIDInDatabase}`);
      // check if there's URL and user ID is false and account older than 60 days
      if (!checkUserIDInDatabase && !checkUserIDinPendingPayout && !checkUserIDinPaidPayout) {
        console.log("--------- START DEFAULT PAYMENT ---------");
        let timerStart = new Date();
        //may want to show timer, time to take to pay
        console.log("Wallet QR: ", qrCodeInvoice);
        //send response
        let MakePaymentAndReturnFee = await umbril.makePayment(qrCodeInvoice, config.maxTipAmount, checkUserIDinPendingPayout);
        console.log("Fee PAID: ", MakePaymentAndReturnFee.fee);
        let timerEnd = new Date() - timerStart;
        console.log("Executed in: ", timerEnd);
        let twitThreadID = tweet.in_reply_to_status_id_str;
        supabase.InsertPayout(twitterUserID, refTwitterUerID, userScrenName, refUserScrenName, twitThreadID, config.maxTipAmount, true, "", tweet);
        console.log("User inserted / Update BIO");
        //Update Twitter Bio
        updateTwitterBio();
        responseToTwit.sendTwit(tweet, "success", { time: timerEnd, amountandfee: { fee: MakePaymentAndReturnFee.fee, sat: MakePaymentAndReturnFee.sat } });
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
    console.log("-----------------", err);
    // if (err === Object(err) && err.data != "undefined") {
    //   console.log("Error in Tweet detected ", err);
    //   responseToTwit.sendTwit(tweet, "error", err.data);
    // }

    // console.log("Unable to read QR Code: ", err);
  }
}

function searchTweet(twitThreadID) {
  return new Promise((resolve, reject) => {
    T.get("search/tweets", { q: twitThreadID }, async function (err, data, response) {
      console.log("Length: ", data.statuses.length);
      console.log("Tweet found: ", data);
      if (data.statuses.length >= 1) {
        resolve(data);
      } else {
        reject("Can't find tweet");
      }
    });
  });
}
function checkIfContainQR(data) {
  return new Promise(async (resolve, reject) => {
    try {
      let url = data.statuses[0].entities.media[0].media_url;
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

function checkQforLightningAddress(data, twitterUserID) {
  return new Promise(async (resolve, reject) => {
    let twitText = data.statuses[0].text;
    try {
      let qrCodeInvoice = await checkIfContainQR(data);
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
          console.log("payAmount Amount: " + payAmount);
          if (payAmount >= 1 && payAmount <= config.maxTipAmount) {
            let invoiceLNURL = await getLNURL(checkEmail.domain, checkEmail.userName, pendingAmount);
            resolve(invoiceLNURL);
          } else {
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

module.exports = payInvoice;
