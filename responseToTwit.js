const config = require("./config.js");
const sendTwitWithMedia = require("./twitWithMedia");
const formatNumber = require("./formatNumber");

module.exports.sendTwit = function sendTwit(tweet, status, extradata) {
  return new Promise(async (resolve, reject) => {
    // Who sent the tweet?
    let name = tweet.user.screen_name;
    // If we want the conversation thread
    let id = tweet.id_str;

    // Start a reply back to the sender
    let replyText = "";

    switch (status) {
      case "success":
        let satoshiDigit = (extradata.amountandfee.sat / 100000000).toFixed(8);
        let satoshiDigitString = satoshiDigit.toString();
        replyText = `@${name} ✅ PAID ${formatNumber(extradata.amountandfee.sat)} Satoshi / ${satoshiDigitString.replace("0.0", ".0")} #BTC with ❤️ & ⚡ in ${extradata.time / 1000} secs. Fees: ${
          extradata.amountandfee.fee
        } Sat/s. To donate ${extradata.amountandfee.sat}+ Sats use command:\n\n!donate ${extradata.amountandfee.sat}\n\nFollow us @${config.twitteraccount}`;
        break;
      case "paidbasic":
        replyText = `@${name} ✅ PAID with ❤️ & ⚡\n\nFollow us @${config.twitteraccount}`;
        break;
      case "invalidinvoice":
        replyText = `⚠️ @${name} We have already PAID you ${config.defaultPayOut} Satoshi or your QR is invalid.\n\nFollow us @${config.twitteraccount}`;
        break;
      case "tryagain":
        replyText = `@${name} Please try again and only send QR Code screenshot.`;
        break;
      case "invalidqr":
        replyText = `@${name} ${extradata.err}`;
        break;
      case "alreadypaid":
        replyText = `⚠️ We've already tipped or paid @${name}. You can try tipping again in 24 hours if it's unclaimed.\n\nTo donate ${config.defaultPayOut}+ Satoshi use command:\n\n!donate ${config.defaultPayOut}\n\nFollow us @${config.twitteraccount}`;
        break;
      case "alreadypaidout":
        replyText = `⚠️ We've already tipped or paid @${name}. To donate ${config.maxTipAmount}+ Satoshi use command:\n\n!donate ${config.maxTipAmount}\n\nFollow us @${config.twitteraccount}`;
        break;
      case "followrequired":
        replyText = `@${name} please follow us and then resend QR Code.`;
        break;
      case "alreadytip":
        replyText = `⚠️ @${name} We have already tipped or paid this pleb.\n\nFollow us @${config.twitteraccount}`;
        break;
      case "error":
        replyText = `⚠️ @${name} Please regenerate your lightning network QR Code and try again.\n\nFollow us @${config.twitteraccount}`;
        break;
      default:
        replyText = "@" + name + " Failed, please try again later";
    }

    // Post that tweetreplyText, qrPath, id, media, postQR
    try {
      let twitOut = await sendTwitWithMedia.twitWithMedia(replyText, false, id, false);
      //console.log(twitOut)
      resolve(twitOut);
    } catch (err) {
      console.log("Failed to twit from Power Of satoshi, trying again: ", err);
      try {
        let twitOut = await sendTwitWithMedia.twitWithMedia(replyText, false, id, false);
        //console.log(twitOut)
        resolve(twitOut);
      } catch (err) {
        //console.log(err)
        reject(err);
      }
    }
  });
};
