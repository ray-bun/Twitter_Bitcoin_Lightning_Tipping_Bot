let Twit = require("twit");
const config = require("./config.js");
const formatNumber = require("./formatNumber");
const fs = require("fs");

//randomise API
let apiList = config.twitterAccountsArray;

module.exports.twitLove = function twitLove(id) {
  let randomAPI = apiList[Math.floor(Math.random() * apiList.length)];
  let Twitter = new Twit(randomAPI);
  console.log("Twitter Key: ", randomAPI.consumer_key);
  Twitter.post("favorites/create", { id: id });
};

module.exports.updateBio = function updateBio(getLNBalance, addTotalSats, addTotalFees, countUsers) {
  let randomAPI = apiList[Math.floor(Math.random() * apiList.length)];
  let Twitter = new Twit(randomAPI);
  console.log("Twitter Key: ", randomAPI.consumer_key);
  Twitter.post("account/update_profile", {
    description: `Live Balance: ${formatNumber(getLNBalance)} Sats | Paid: ${formatNumber(addTotalSats)} | Fees: ${formatNumber(addTotalFees)} | Users: ${formatNumber(
      countUsers
    )} | Tweet ⚡ QR Code for ${config.defaultPayOut} FREE Sats | Purely educational & not for profit`,
  });
};

module.exports.dailyPost = function dailyPost(replyText) {
  let randomAPI = apiList[Math.floor(Math.random() * apiList.length)];
  let Twitter = new Twit(randomAPI);
  console.log("Twitter Key: ", randomAPI.consumer_key);
  Twitter.post("statuses/update", { status: replyText });
};

module.exports.twitWithMedia = function twitWithMedia(replyText, qrPath, id, media, postQR) {
  return new Promise((resolve, reject) => {
    console.log("Start posting tweet");
    let randomAPI = apiList[Math.floor(Math.random() * apiList.length)];
    let Twitter = new Twit(randomAPI);
    console.log("Twitter Key: ", randomAPI.consumer_key);
    if (media) {
      let files,
        b64content,
        chosenFile = "";
      if (postQR && qrPath) {
        b64content = fs.readFileSync(qrPath, { encoding: "base64" });
      } else {
        files = fs.readdirSync(`${__dirname}/memes`);
        /* now files is an Array of the name of the files in the folder and you can pick a random name inside of that array */
        chosenFile = files[Math.floor(Math.random() * files.length)];
        console.log(`Meme: ${chosenFile} Twiter thread ID: ${id}`);
        console.log("Twit to send: ", replyText);
        b64content = fs.readFileSync(`${__dirname}/memes/${chosenFile}`, {
          encoding: "base64",
        });
      }
      // first we must post the media to Twitter
      Twitter.post("media/upload", { media_data: b64content }, function (err, data, response) {
        // now we can assign alt text to the media, for use by screen readers and
        // other text-based presentations and interpreters
        console.log("Uploading media file: ", chosenFile);
        var mediaIdStr = data.media_id_string;
        var altText = `Meme: ${chosenFile} Twiter thread ID: ${id}`;
        var meta_params = {
          media_id: mediaIdStr,
          alt_text: { text: altText },
        };
        if (!err) {
          Twitter.post("media/metadata/create", meta_params, function (err, data, response) {
            console.log("Twitter Key to create media meta data: ", randomAPI.consumer_key);
            if (!err) {
              // now we can reference the media and post a tweet (media will attach to the tweet)
              var params = {
                status: replyText,
                in_reply_to_status_id: id,
                media_ids: [mediaIdStr],
              };
              console.log("Twitter Key to post twit with media: ", randomAPI.consumer_key);
              Twitter.post("statuses/update", params, function (err, data, response) {
                resolve(data);
              });
            } else {
              reject(err);
            }
          });
        } else {
          reject(err);
        }
      });
    } else {
      // Post that tweet
      Twitter.post("statuses/update", { status: replyText, in_reply_to_status_id: id }, function (err, data, response) {
        if (!err) {
          console.log("Tweeted");
          resolve(data);
        } else {
          reject(err);
        }
      });
    }
  });
};

module.exports.twitterUserprofile = function twitterUserprofile(twitterUserID) {
  return new Promise((resolve, reject) => {
    let randomAPI = apiList[Math.floor(Math.random() * apiList.length)];
    let Twitter = new Twit(randomAPI);
    console.log("Twitter Key: ", randomAPI.consumer_key);
    Twitter.get("users/show", { user_id: twitterUserID }, function (err, data, response) {
      if (err) {
        reject();
      } else {
        console.log(data);
        resolve(data);
      }
    });
  });
};
