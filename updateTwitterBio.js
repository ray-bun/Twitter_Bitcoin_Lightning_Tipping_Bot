const axios = require("axios");
const sendTwitWithMedia = require("./twitWithMedia");
const supabase = require("./supabase");


const umbril = require("./umbril");

async function updateTwitterBio() {
  let getJWTToken = await umbril.getJWTToken();
  let getLNBalance = await getLNDBalance(getJWTToken);
  let countUsers = await supabase.countUsers();
  let addTotalSats = await supabase.addTotalSats("satAmount");
  let addTotalFees = await supabase.addTotalFees("fee");
  // Update BIO tweet
  sendTwitWithMedia.updateBio(getLNBalance, addTotalSats, addTotalFees, countUsers);
}

function getLNDBalance(JWTToken) {
  return new Promise((resolve, reject) => {
    axios
      .get(`http://umbrel.local/api/v1/lnd/channel`, {
        headers: {
          Authorization: `JWT ${JWTToken}`,
        },
      })
      .then((res) => {
        let totalBalance = 0;
        for (let i = 0; i < res.data.length; i++) {
          totalBalance += Number(res.data[i].localBalance);
        }
        resolve(totalBalance);
      })
      .catch((error) => reject(error.response.data));
  });
}


module.exports = updateTwitterBio;
