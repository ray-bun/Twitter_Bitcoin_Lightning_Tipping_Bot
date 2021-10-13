const config = require("./config.js");
const formatNumber = require("./formatNumber");
const sendTwitWithMedia = require("./twitWithMedia");
const supabase = require("./supabase");

async function listenToPowerOfSatoshi(tweet) {
  let twitterUserID = tweet.in_reply_to_user_id_str;
  let userScrenName = tweet.in_reply_to_screen_name;
  let refUserScrenName = tweet.user.screen_name;
  let idThread = tweet.in_reply_to_status_id_str;
  let refTwitterId = tweet.user.id_str;

  let twitText = tweet.text;
  let id = tweet.id_str;
  let regPower = new RegExp("@" + config.twitteraccount + " ![Gg][iI][vV][eE][pP][oO][wW][eE][rR][oO][fF][sS][aA][tT][oO][sS][hH][iI]");
  let powerRequest = regPower.test(twitText);
  //Check if requested user have donated enought Sats
  let donated = await supabase.tippingPermission(refTwitterId);

  if (powerRequest && donated >= config.powerofsatoshi) {
    //insert data here
    console.log("---------------- STARTING POWER OF SATOSHI ----------------");

    let checkPowerOfSatoshi = await supabase.QueryPowerOfSatoshiStatus(twitterUserID);

    if (!checkPowerOfSatoshi) {
      await supabase.InsertPowerOfSatoshi(twitterUserID, refTwitterId, userScrenName, refUserScrenName, idThread, true);
      console.log("Insert into Power Of Satoshi database");
      let satoshiDigit = (config.maxTipAmount / 100000000).toFixed(8);
      let satoshiDigitString = satoshiDigit.toString();
      let replyText = `🎉 BY THE POWER OF LORD SATOSHI 🔱\n\n@${refUserScrenName} have now granted you @${userScrenName} the powerrr to TIP all plebs ${formatNumber(
        config.maxTipAmount
      )} Satoshi / ${satoshiDigitString.replace("0.0", ".0")} #BTC on the ⚡ #LightningNetwork.\n\nTo tip:\n@${config.twitteraccount} !TIP ${
        config.maxTipAmount
      }\n\n*Valid for 7 Days | Follow us @${config.twitteraccount}`;
      //Send Tweet
      try {
        let twitOut = await sendTwitWithMedia.twitWithMedia(replyText, false, id, true);
        console.log("Twitted");
      } catch (err) {
        console.log("Failed to twit from Power Of satoshi, trying again: ", err);
        try {
          let twitOut = await sendTwitWithMedia.twitWithMedia(replyText, false, id, true);
          console.log("Twitted");
        } catch (err) {
          console.log(err);
        }
      }
    }
    if (checkPowerOfSatoshi) {
      let replyText = `🔱 @${refUserScrenName}, Lord Satoshi has already granted @${userScrenName} the Power Of Satoshi.\n\nFollow us @${config.twitteraccount}`;
      let twitOut = await sendTwitWithMedia.twitWithMedia(replyText, false, id, false, false);
      console.log("Already have access to Power Of Satoshi");
    }
  }
}

module.exports = listenToPowerOfSatoshi;
