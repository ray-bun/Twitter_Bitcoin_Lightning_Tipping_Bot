const sendTwitWithMedia = require("./twitWithMedia");
const formatNumber = require("./formatNumber");
const supabase = require("./supabase");


module.exports.dailyPost = async function dailyPost() {
  try {
    let topDonors = await supabase.topDonors();
    let donatedSatsAmount = await supabase.donatedSatsAmount();
    replyText = `Generous Donors ❤️\n\n🥇 @${topDonors[0].userScrenName} 👑 - ${formatNumber(topDonors[0].defaultPayOut)}⚡\n\n🥈 @${topDonors[1].userScrenName} - ${formatNumber(
      topDonors[1].defaultPayOut
    )}\n\n🥉 @${topDonors[2].userScrenName} - ${formatNumber(topDonors[2].defaultPayOut)}\n\n@${topDonors[3].userScrenName} - ${formatNumber(topDonors[3].defaultPayOut)}\n\n@${
      topDonors[4].userScrenName
    } - ${formatNumber(topDonors[4].defaultPayOut)}\n\nTotal: ${formatNumber(donatedSatsAmount)} Satoshis`;
    // Post that tweet
    console.log(replyText, dailyStats);
    sendTwitWithMedia.dailyPost(replyText);
    sendTwitWithMedia.twitWithMedia(dailyStats, screenshot1MLPath, "", true, true);
  } catch (err) {
    console.log(err);
  }
};

