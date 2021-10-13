const sendTwit = require("./twitWithMedia");
const formatNumber = require("./formatNumber");

module.exports = async function donationQRCodeTwit(tweet, satAmount, dpasteURL, qrPath) {
  let reply_to = tweet.in_reply_to_screen_name;
  // Who sent the tweet?
  let twitterAccount = tweet.user.screen_name;

  // What is the text?
  let txt = tweet.text;
  // If we want the conversation thread
  let id = tweet.id_str;
  // Start a reply back to the sender
  let qrCodetexts = dpasteURL.concat(".txt");
  let qrCodetextsOneLine = qrCodetexts.replace(/\n/g, "");
  console.log(qrCodetextsOneLine);
  let replyText = `Thanks @${twitterAccount} for your donation. Please find lightning network invoice QR Code for ${formatNumber(
    satAmount
  )} Sats. ${qrCodetextsOneLine}`;
  try {
    await sendTwit.twitWithMedia(replyText, qrPath, id, true, true);
  } catch (err) {
    console.log("Failed to upload QR Code to Twitter, trying again", err);
    try {
      await sendTwit.twitWithMedia(replyText, qrPath, id, true, true);
    } catch (err) {
      console.log(err);
    }
  }
};
