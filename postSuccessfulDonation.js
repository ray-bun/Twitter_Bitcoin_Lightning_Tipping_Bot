const umbril = require("./umbril");
const config = require("./config.js");
const updateTwitterBio = require("./updateTwitterBio");
const formatNumber = require("./formatNumber");
const sendTwitWithMedia = require("./twitWithMedia");
const supabase = require("./supabase");

async function checkForNewSuccessfulDonation() {
  try {
    let getJWTToken = await umbril.getJWTToken();
    let lastPersonDonated = await umbril.lastDonation(getJWTToken);
    let searchDonor = await supabase.searchDonor(lastPersonDonated);
    if (searchDonor != null) {
      if (!searchDonor.paid) {
        let tweetPayLoad = {
          id: searchDonor.id,
          twitterUserID: searchDonor.twitterUserID,
          defaultPayOut: searchDonor.defaultPayOut,
          userScrenName: searchDonor.userScrenName,
          idThread: searchDonor.idThread,
        };
        sendPaymentConfirmationTweet(tweetPayLoad);
        //Update database
        supabase.UpdateDonated(searchDonor.idThread);
        //update BIO
        updateTwitterBio();

      }
    }
  } catch (err) {
    //console.log(err);
  }
}

async function sendPaymentConfirmationTweet(payload) {
  // Who sent the tweet?
  let name = payload.userScrenName;
  // What is the text?
  // If we want the conversation thread
  let id = payload.idThread;
  // console.log('Reply to: ', tweet)

  // Start a reply back to the sender
  let numPeople = "";
  if (payload.defaultPayOut <= config.defaultPayOut) {
    numPeople = "Thanks for donating the Sats back.";
  } else if (payload.defaultPayOut >= config.powerToTip) {
    numPeople = `Thanks to you ${Math.floor(payload.defaultPayOut / config.defaultPayOut)} more plebs @ ${config.defaultPayOut} Sats can now enjoy the #LightningNetwork ⚡. Use command: @${
      config.twitteraccount
    } !TIP ${config.maxTipAmount} to tip plebs ${config.maxTipAmount} Sats.`;
  } else {
    numPeople = `Thanks to you ${Math.floor(payload.defaultPayOut / config.defaultPayOut)} more plebs @ ${config.defaultPayOut} Sats can now enjoy the #LightningNetwork ⚡`;
  }
  replyText = `@${payload.userScrenName} ✅ @${payload.userScrenName} We have received your ${formatNumber(payload.defaultPayOut)} Sats donation! ${numPeople}`;

  //Send Tweet
  try {
    let twitOut = await sendTwitWithMedia.twitWithMedia(replyText, false, id, true);
    console.log("Twit sent");
  } catch (err) {
    console.log("Failed to twit from Power Of satoshi, trying again: ", err);
    try {
      let twitOut = await sendTwitWithMedia.twitWithMedia(replyText, false, id, true);
      console.log("Twit sent");
    } catch (err) {
      console.log("PostSuccessfulDonation Error: ", err);
    }
  }

  //Like tweet
  sendTwitWithMedia.twitLove(id);
}

module.exports = checkForNewSuccessfulDonation;
