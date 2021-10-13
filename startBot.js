let Twit = require("twit");
const config = require("./config.js");
//randomise API
let apiList = config.twitterAccountsArray;
let randomAPI = apiList[Math.floor(Math.random() * apiList.length)];
let T = new Twit(randomAPI);
const calcTwitterAccountAge = require("./calcTwitterAccountAge");
const tweetDetected = require("./tweetDetected");
const startDonations = require("./startDonations");
const checkForNewSuccessfulDonation = require("./postSuccessfulDonation");
const dailyPosting = require("./dailyposting");
const listenToPowerOfSatoshi = require("./startPowerOfSatoshi");
const listenToTipping = require("./startTipping");
const payInvoiceCommand = require("./payInvoice");
const supabase = require("./supabase");



function listenToTwit() {
  let stream = T.stream("statuses/filter", {
    track: config.twitteraccount,
  });

  stream.on("tweet", async function (tweet) {
    let userID = tweet.user.id;
    let twitterUserID = tweet.user.id_str;
    let twitText = tweet.text;
    let regExFindURL = /[-\w]+(\.[a-z]{2,})+(\/?)([^\s]+)/;
    let twitContainURL = regExFindURL.test(twitText);
    let userScrenName = tweet.user.screen_name;
    let followers_count = tweet.user.followers_count;
    let regExDefaultProfile = /default_profile_images/;
    let profileImage = tweet.user.profile_image_url;
    let isUsingDefaultProfile = regExDefaultProfile.test(profileImage);
    let accountAge = calcTwitterAccountAge(tweet.user.created_at);

    // account age must be over 60 days, have a profile image + 10 followers or we will ignore. 
    if ((userScrenName != config.twitteraccount) && followers_count >= 10 && !isUsingDefaultProfile && accountAge >= 60) {
      // listen for !donate
      startDonations(tweet);
      // listen for !tip
      listenToTipping(tweet);
      // listen for !givepowerofsatoshi
      listenToPowerOfSatoshi(tweet);
      // listen for QR code to payout
      tweetDetected(tweet, twitContainURL, userID, twitterUserID, accountAge, userScrenName);
      // listen for !pay command to pay an invoice
      payInvoiceCommand(tweet);
    } else {
      console.log("It could be spam account, we ignore: ", userScrenName);
    }
    //console.log(tweet)
  });
}

listenToTwit();

//Check and post new donation
setInterval(() => {
  try {
    // post successful donation
    checkForNewSuccessfulDonation();
  } catch (err) {
    //console.log(err);
  }
}, 30000);

//clean up jobs, delete unpaid tip, delete power of satoshi and post daily donations/lightning stats.
setInterval(() => {
  supabase.deleteUnPaidTips();
  supabase.deletePowerOfSatoshi();
  dailyPosting.dailyPost();
}, 43200000);

