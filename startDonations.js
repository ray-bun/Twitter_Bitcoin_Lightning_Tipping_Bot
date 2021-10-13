const config = require("./config.js");
const generateInvoice = require("./donationQR");
const supabase = require("./supabase");

async function listenToDonation(tweet) {
  {
    let userScrenName = tweet.user.screen_name;
    let twitText = tweet.text;
    let regExDonation = /![dD][oO][nN][aA][tT][eE]\s([0-9]+)/;
    let twitDonation = regExDonation.test(twitText);
    let idThread = tweet.id_str;
    let twitterUserId = tweet.user.id_str;

    if (twitDonation && userScrenName != config.twitteraccount && userScrenName != config.twitteraccount2) {
      // if donation true
      let defaultPayOut = Number(twitText.match(regExDonation)[1]);
      console.log("---------------- STARTING DONATION ---------------- " + userScrenName);
      console.log("Amount detected: ", defaultPayOut);
      if (defaultPayOut > 10) {
        //insert into database
        try {
          supabase.InsertDonation(twitterUserId, defaultPayOut, userScrenName, idThread);
          generateInvoice.generateInvoice(tweet, defaultPayOut, userScrenName, idThread);
        } catch (err) {
          try {
            console.log("Failed to post donation, trying again: ", err);
            generateInvoice.generateInvoice(tweet, defaultPayOut, userScrenName, idThread);
          } catch (err) {
            console.log("Failed to post donation, trying again: ", err);
          }
        }
      } else {
        console.log("Below 10 or invalid number");
      }
    }
    //console.log(twitDonation)
  }
}

//listenToDonation()
module.exports = listenToDonation;
