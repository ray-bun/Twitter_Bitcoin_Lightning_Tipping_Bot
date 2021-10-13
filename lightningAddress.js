const config = require("./config.js");
const umbril = require("./umbril");
const responseToTwit = require("./responseToTwit");
const updateTwitterBio = require("./updateTwitterBio");
const supabase = require("./supabase");
const axios = require("axios");

async function lightningAddress(tweet, twitContainURL, userID, twitterUserID, accountAge, userScrenName) {
  try {
    let twitText = tweet.text;
    let checkEmail = validateEmail(twitText);
    let validEmail = Object.keys(checkEmail).length >= 1;
    if (validEmail) {
      console.log("Lightning network email address detected");
      let checkUserIDInDatabase = await supabase.QueryTwitterID(twitterUserID);
      let checkUserIDinPendingPayout = await supabase.QueryTwitterIDPendingPayout(twitterUserID);
      let checkUserIDinPaidPayout = await supabase.QueryTwitterIDPaidPayout(twitterUserID);

      let time = Date.now();

      console.log(`${new Date(time)} - User: ${userScrenName} User ID: ${twitterUserID} Account Age: ${accountAge} DB: ${checkUserIDInDatabase} URL: ${twitContainURL} `);
      // check if there's URL and user ID is false and account older than 60 days
      if (checkUserIDInDatabase && config.enableErrorTwit && validEmail) {
        //send already PAID
        responseToTwit.sendTwit(tweet, "alreadypaid");
      }

      if (validEmail && !checkUserIDInDatabase && accountAge >= 60) {
        console.log("Email Address detected: ", checkEmail.email);
        // want to check if we have sent user payment before. Need to store to DB
        // need to create user elibility, twiiter account age etc.
        try {
          let lightningInvoice = await getLNURL(checkEmail.domain, checkEmail.userName, config.defaultPayOut);
          if (lightningInvoice.length >= 90 && !checkUserIDinPendingPayout && !checkUserIDinPaidPayout) {
            let timerStart = new Date();
            //may want to show timer, time to take to pay
            console.log("Wallet QR: ", lightningInvoice);
            let cleanQRCode = lightningInvoice.replace("lightning:", "");
            //send response
            let MakePaymentAndReturnFee = await umbril.makePayment(cleanQRCode, config.defaultPayOut, checkUserIDinPendingPayout);
            console.log("Fee PAID: ", MakePaymentAndReturnFee.fee);
            let timerEnd = new Date() - timerStart;
            console.log("Executed in: ", timerEnd);
            supabase.InsertPaidTwitterID(twitterUserID, MakePaymentAndReturnFee.sat, MakePaymentAndReturnFee.fee, userScrenName);
            console.log("User inserted");
            //Update Twitter Bio
            updateTwitterBio();

            responseToTwit.sendTwit(tweet, "success", {
              time: timerEnd,
              amountandfee: {
                fee: MakePaymentAndReturnFee.fee,
                sat: MakePaymentAndReturnFee.sat,
              },
            });
            // PAY OUT TIPPING!
          } else if (checkUserIDinPendingPayout && !checkUserIDinPaidPayout && validEmail) {
            let timerStart = new Date();
            let pendingAmount = await supabase.QueryTwitterPendingPayoutAmount(twitterUserID);
            let lightningInvoice = await getLNURL(checkEmail.domain, checkEmail.userName, pendingAmount);
            //may want to show timer, time to take to pay

            console.log("Pending payout Wallet QR: " + lightningInvoice + " Pending Amount Due: " + pendingAmount);

            let cleanQRCode = lightningInvoice.replace("lightning:", "");
            //send response
            let MakePaymentAndReturnFee = await umbril.makePayment(cleanQRCode, pendingAmount, checkUserIDinPendingPayout);
            console.log("Fee PAID: ", MakePaymentAndReturnFee.fee);
            let timerEnd = new Date() - timerStart;
            console.log("Executed in: ", timerEnd);
            supabase.UpdatePendingPayout(twitterUserID, MakePaymentAndReturnFee.fee);
            console.log("User inserted");
            //Update Twitter Bio
            updateTwitterBio();

            responseToTwit.sendTwit(tweet, "success", {
              time: timerEnd,
              amountandfee: {
                fee: MakePaymentAndReturnFee.fee,
                sat: MakePaymentAndReturnFee.sat,
              },
            });
          }
        } catch (err) {
          console.log("Unable to read QR Code: ", err);
          if (config.enableErrorTwit) {
            //Update database
            console.log(err);
            if (err.includes("routing")) {
              supabase.UpdatePendingPayout(twitterUserID, 0);
              responseToTwit.sendTwit(tweet, "paidbasic");
            } else {
              responseToTwit.sendTwit(tweet, "invalidqr", { err: err });
            }
          }
        }
      }
    }
  } catch (err) {
    console.log("Error in TweetDetect: ", err);
  }
}

function validateEmail(email) {
  //let twitText = tweet.text;
  var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
  let containsEmail = re.test(email);
  if (containsEmail) {
    console.log("yes, email found");
    const emailAddress = email.match(re);
    let domain = emailAddress[0].split("@");
    console.log({
      email: emailAddress[0],
      domain: domain[1],
      userName: domain[0],
    });
    return { email: emailAddress[0], domain: domain[1], userName: domain[0] };
  }
  return false;
}

async function getLNURL(domain, username, paymentAmount) {
  try {
    // fetch data from a url endpoint
    const response = await axios.get(`https://${domain}/.well-known/lnurlp/${username}`);
    const data = await response.data;
    //console.log(response)
    if (response.status == 200) {
      // let callbackURL = await data.callback
      let responseCallback = await axios.get(`${data.callback}?amount=${paymentAmount * 1000}`);
      let dataCallback = await responseCallback.data;
      console.log(dataCallback.pr);
      return dataCallback.pr;
    }

    //
    //
    //return lnURL;
  } catch (error) {
    console.log("error", error);

    // appropriately handle the error
  }
}

module.exports = lightningAddress;
