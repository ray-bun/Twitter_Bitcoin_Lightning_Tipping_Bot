
// Create App and get API keys from: https://developer.twitter.com/en/portal/dashboard
// Must have read/write access
twitter_1 = {
  consumer_key: "XXXX",
  consumer_secret: "XXXX",
  access_token: "XXXX",
  access_token_secret: "XXXX",
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true, // optional - requires SSL certificates to be valid.
};

twitter_2 = {
  consumer_key: "XXX",
  consumer_secret: "XX",
  access_token: "XXX",
  access_token_secret: "XXX",
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true, // optional - requires SSL certificates to be valid.
};

// Good to randomise these. can add more if you wish
module.exports.twitterAccountsArray = Array(twitter_1, twitter_2);

// Can help reduce twitter API limit if false. Example, if false it'll not tweet out already paid message etc.
module.exports.enableErrorTwit = true;

// Recommend you dedicate a
module.exports.umbrilpassword = { password: "xxxxxx" };
//your bot twitter account username. example satoshi_LN_bot
module.exports.twitteraccount = "xxxx";

// Get your dpaste bin API key from here: https://dpaste.com/api/v2/
module.exports.dpaste = "XXXXXXXX";
// Payout 100 sats by default
module.exports.defaultPayOut = 100;
// Max !tip out amount
module.exports.maxTipAmount = 1000;
// Donation amount to get !givepowerofsatoshi
module.exports.powerofsatoshi = 10000;
// Donate amount to get access to !tip
module.exports.powerToTip = 5000;

//Supbase to store our data, it's free https://supabase.io/
module.exports.supabaseUrl = "https://xxxxxxxxx.supabase.co";
module.exports.supabaseKey = "xxxxxxxxx";
