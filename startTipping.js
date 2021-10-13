const config = require("./config.js");
const formatNumber = require("./formatNumber");
const sendTwitWithMedia = require("./twitWithMedia");
const responseToTwit = require("./responseToTwit");
const crypto = require("crypto");
const supabase = require("./supabase");

async function listenToTipping(tweet) {
  try {
    let refTwitterId = tweet.user.id_str;
    let id = tweet.id_str;
    let twitText = tweet.text;
    let regexTipping = new RegExp("@" + config.twitteraccount + " (![Tt][Ii][Pp]) (([0-9]+))");

    let matches = twitText.match(regexTipping);
    if (matches != null && matches.length >= 2) {
      let tipAmount = Number(matches[2]);
      // check permission
      let donatedAmount = await supabase.tippingPermission(refTwitterId);
      let checkPowerOfSatoshi = await supabase.QueryPowerOfSatoshiStatus(refTwitterId);

      if ((tipAmount <= config.maxTipAmount && donatedAmount >= config.powerToTip) || checkPowerOfSatoshi) {
        //insert data here
        console.log("---------------- STARTING TIPPING ----------------");
        let twitterUserID = tweet.in_reply_to_user_id_str;
        let userScrenName = tweet.in_reply_to_screen_name;
        let refUserScrenName = tweet.user.screen_name;
        let idThread = tweet.in_reply_to_status_id_str;
        let refTwitterId = tweet.user.id_str;

        console.log(`Twitter ID: ${twitterUserID} Username: ${userScrenName} Tipped: ${refUserScrenName}`);
        let checkUserIDinPendingPayout = await supabase.QueryTwitterIDPendingPayout(twitterUserID);
        let checkUserIDinPaidPayout = await supabase.QueryTwitterIDPaidPayout(twitterUserID);

        if (checkUserIDinPaidPayout) {
          //We have already tipped this person
          responseToTwit.sendTwit(tweet, "alreadytip");
        }

        if (!checkUserIDinPendingPayout && !checkUserIDinPaidPayout) {
          let payoutKey = crypto.randomBytes(15).toString("hex");
          if (!checkUserIDinPendingPayout) {
            console.log("Delete/Insert into pending payout database");
            await supabase.deleteTwitterID(twitterUserID);
            await supabase.InsertPendingPayout(twitterUserID, refTwitterId, userScrenName, refUserScrenName, idThread, tipAmount, false, payoutKey, tweet);
          } else {
            console.log("User already existed in tipping");
          }

          let satoshiDigit = (tipAmount / 100000000).toFixed(8);
          let satoshiDigitString = satoshiDigit.toString();

          let replyText = `\n\n🎉 @${userScrenName} you've received a tip for ${formatNumber(tipAmount)} Satoshi / ${satoshiDigitString.replace(
            "0.0",
            ".0"
          )} #BTC via ⚡\n\nTo instantly redeem from @${refUserScrenName}:\n\nRespond with your lightning QR Code screenshot\n\nOR\n\nYour lightning address(you@zbd.gg) below⬇️\n\n*Valid 24H`;
          //Twit out with media
          //Send Tweet
          try {
            await sendTwitWithMedia.twitWithMedia(replyText, false, id, true);
            console.log("Twit sent");
          } catch (err) {
            console.log("Failed to twit from Tipping, try again: ", err);
            try {
              await sendTwitWithMedia.twitWithMedia(replyText, false, id, true);
              console.log("Twit sent");
            } catch (err) {
              console.log("Error sending tweet: ", err);
            }
          }
        }
      }
    }
  } catch (err) {
    console.log("Failed at startTipping: ", err);
  }
}

module.exports = listenToTipping;
