const { createClient } = require("@supabase/supabase-js");
const config = require("./config.js");

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

module.exports.InsertDonation = function InsertDonation(twitterUserID, defaultPayOut, userScrenName, idThread) {
  return new Promise(async (resolve, reject) => {
    const { data, error } = await supabase.from("donations").insert([{ twitterUserID, defaultPayOut, userScrenName, idThread, paid: false }]);
    if (error) {
      console.log("Error @ InsertDonation", error);
      reject();
    } else resolve();
  });
};

module.exports.UpdateDonated = function UpdateDonated(idThread) {
  return new Promise(async (resolve, reject) => {
    const { data, error } = await supabase.from("donations").update({ paid: true }).eq("idThread", idThread);
    if (error) {
      console.log("Error @ UpdateDonated", error);
      reject();
    } else resolve();
  });
};

module.exports.searchDonor = function searchDonor(lastPersonDonated) {
  return new Promise(async (resolve, reject) => {
    //let memo = lastPersonDonated
    let memo = lastPersonDonated.memo;
    if (isNaN(memo)) {
      console.log("Error @ searchDonor", memo);
      reject("Not valid donation: ", memo);
    } else {
      let { data, error } = await supabase.from("donations").select("*").eq("idThread", memo).eq("paid", false);
      if (error) {
        console.log("Error @ searchDonor", error);
        reject("Not valid donation: ", memo);
      } else {
        resolve(data[0]);
      }
    }
  });
};

module.exports.tippingPermission = function tippingPermission(twitterUserID) {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("donations").select("defaultPayOut").eq("twitterUserID", twitterUserID).eq("paid", true);
    if (error) {
      console.log("Error @ tippingPermission", error);
      reject(error);
    } else {
      let totalDonated = 0;
      data.map((data) => {
        totalDonated += data.defaultPayOut;
      });
      console.log("Total donated: ", totalDonated);
      resolve(totalDonated);
    }
  });
};

module.exports.QueryPowerOfSatoshiStatus = function QueryPowerOfSatoshiStatus(twitterUserID) {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("powerofsatoshi").select("*").eq("twitterUserID", twitterUserID);

    if (error) {
      console.log("Error QueryPowerOfSatoshiStatus: ", error);
      reject(error);
    }
    if (data.length === 0) {
      console.log("User not found");
      resolve(false);
    } else {
      console.log("Found Power Of Satoshi:", data);
      resolve(true);
    }
  });
};

module.exports.QueryTwitterIDPendingPayout = function QueryTwitterIDPendingPayout(twitterUserID) {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("pending_payout").select("*").eq("twitterUserID", twitterUserID);
    //.eq("paid", false)

    if (error) {
      console.log("Error @ QueryTwitterIDPendingPayout", error);
      reject(error);
    }
    if (data.length === 0) {
      console.log("User not found");
      resolve(false);
    } else {
      console.log("Found in QueryTwitterIDPendingPayout: ");
      resolve(true);
    }
  });
};

module.exports.QueryTwitterIDPaidPayout = function QueryTwitterIDPaidPayout(twitterUserID) {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("pending_payout").select("*").eq("twitterUserID", twitterUserID).eq("paid", true);

    if (error) {
      console.log("Error @ QueryTwitterIDPaidPayout", error);
      reject(error);
    }
    if (data.length === 0) {
      console.log("User not found");
      resolve(false);
    } else {
      //console.log("Found QueryTwitterIDPaidPayout: ", data);
      resolve(true);
    }
  });
};

module.exports.QueryTwitterID = function QueryTwitterID(twitterUserID) {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("users").select("*").eq("twitterUserID", twitterUserID);

    if (error) {
      console.log("Error @ QueryTwitterID", error);
      reject(error);
    }
    if (data.length === 0) {
      console.log("User not found");
      resolve(false);
    } else {
      console.log("Found QueryTwitterID");
      resolve(true);
    }
  });
};

module.exports.deleteTwitterID = function deleteTwitterID(twitterUserID) {
  return new Promise(async (resolve, reject) => {
    const { data, error } = await supabase.from("pending_payout").delete().eq("twitterUserID", twitterUserID).eq("paid", false);
    if (error) {
      console.log("Error @ deleteTwitterID, no ID matching", error);
      reject();
    } else resolve();
  });
};

module.exports.InsertPendingPayout = function InsertPendingPayout(twitterUserID, refTwitterId, userScrenName, refUserScrenName, idThread, defaultPayOut, paid, payoutKey, tweet) {
  return new Promise(async (resolve, reject) => {
    const { data, error } = await supabase.from("pending_payout").insert([{ twitterUserID, refTwitterId, userScrenName, refUserScrenName, idThread, defaultPayOut, paid, payoutKey, tweet }]);
    if (error) {
      console.log("Error @ InsertPendingPayout", error);
      reject();
    } else resolve();
  });
};

module.exports.InsertPayout = function InsertPendingPayout(twitterUserID, refTwitterId, userScrenName, refUserScrenName, idThread, defaultPayOut, paid, payoutKey, tweet) {
  return new Promise(async (resolve, reject) => {
    const { data, error } = await supabase.from("pending_payout").insert([{ twitterUserID, refTwitterId, userScrenName, refUserScrenName, idThread, defaultPayOut, paid: true, payoutKey, tweet }]);
    if (error) {
      console.log("Error @ InsertPendingPayout", error);
      reject();
    } else resolve();
  });
};

module.exports.InsertPowerOfSatoshi = function InsertPowerOfSatoshi(twitterUserID, refTwitterId, userScrenName, refUserScrenName, idThread, enabled) {
  return new Promise(async (resolve, reject) => {
    const { data, error } = await supabase.from("powerofsatoshi").insert([{ twitterUserID, refTwitterId, userScrenName, refUserScrenName, idThread, enabled }]);
    if (error) {
      console.log("Error @ InsertPowerOfSatoshi", error);
      reject();
    } else resolve();
  });
};

module.exports.QueryTwitterPendingPayoutAmount = function QueryTwitterPendingPayoutAmount(twitterUserID) {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("pending_payout").select("defaultPayOut").eq("twitterUserID", twitterUserID).eq("paid", false);
    if (error) {
      console.log("Error @ QueryTwitterPendingPayoutAmount", error);
      reject(error);
    }
    if (data.length === 0) {
      console.log("Pending amount not found");
      resolve(0);
    } else {
      console.log("Pending Amount:", data[0].defaultPayOut);
      resolve(data[0].defaultPayOut);
    }
  });
};

module.exports.UpdatePendingPayout = function UpdatePendingPayout(twitterUserID, fee) {
  return new Promise(async (resolve, reject) => {
    const { data, error } = await supabase.from("pending_payout").update({ paid: true, fee: fee }).eq("twitterUserID", twitterUserID);

    if (error) {
      console.log("Error @ UpdatePendingPayout", error);
      reject();
    } else resolve();
  });
};

module.exports.InsertPaidTwitterID = function InsertPaidTwitterID(twitterUserID, satAmount, fee, username) {
  return new Promise(async (resolve, reject) => {
    const { data, error } = await supabase.from("users").insert([{ twitterUserID, satAmount, fee, username }]);
    if (error) {
      console.log("Error @ InsertPaidTwitterID", error);
      reject();
    } else resolve();
  });
};

module.exports.topDonors = function topDonors() {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("donations").select("*").eq("paid", true);
    if (error) {
      console.log("Error @ topDonors", error);
      reject(error);
    } else {
      let result = [];

      data.map((data) => {
        if (!this[data.userScrenName]) {
          this[data.userScrenName] = { userScrenName: data.userScrenName, defaultPayOut: 0 };
          result.push(this[data.userScrenName]);
        }
        this[data.userScrenName].defaultPayOut += data.defaultPayOut;
      }, Object.create(null));
      //console.log("Total donated: ", result);
      // sort and get top 3
      result.sort(function (a, b) {
        return b.defaultPayOut - a.defaultPayOut;
      });
      console.log(result.slice(0, 5));
      resolve(result.slice(0, 5));
    }
  });
};

module.exports.donatedSatsAmount = function donatedSatsAmount() {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("donations").select("defaultPayOut").eq("paid", true);
    if (error) {
      console.log("Error @ donatedSatsAmount", error);
      reject(error);
    } else {
      let totalDonated = 0;
      data.map((data) => {
        totalDonated += data.defaultPayOut;
      });
      console.log("Total donated: ", totalDonated);
      resolve(totalDonated);
    }
  });
};

module.exports.countUsers = function countUsers() {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("users").select("id");
    if (error) {
      console.log("Error @ countUsers", error);
      reject(error);
    } else {
      let userCount = Object.keys(data).length;
      let pendingUsersCount = await countPendingUsers();
      console.log(userCount + pendingUsersCount);
      resolve(userCount + pendingUsersCount);
      //count pending table
    }
  });
};

function countPendingUsers() {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("pending_payout").select("id").eq("paid", true);
    if (error) {
      console.log("Error @ countPendingUsers", error);
      reject(error);
    } else {
      let userCount = Object.keys(data).length;
      resolve(userCount);
    }
  });
}

module.exports.addTotalSats = async function addTotalSats() {
  try {
    let usersAmount = await addTotal("users", "satAmount", false);
    let paidOut = await addTotal("pending_payout", "defaultPayOut", true);
    let giveAwayAmount = await addTotal("random_giveway", "amount", true);
    let total = usersAmount + paidOut + giveAwayAmount;
    console.log(total);
    return total;
  } catch (error) {
    console.log("Error @ addTotalSats", error);
  }
};

module.exports.addTotalFees = async function addTotalFees() {
  try {
    let usersFee = await addTotal("users", "fee", false);
    let paidOutFee = await addTotal("pending_payout", "fee", false);
    let total = usersFee + paidOutFee;
    console.log(total);
    return total;
  } catch (err) {
    console.log("Error @ addTotalFees", error);
  }
};

function addTotal(tableName, column, paid) {
  return new Promise(async (resolve, reject) => {
    if (paid) {
      let { data, error } = await supabase.from(tableName).select(column).eq("paid", true);
      if (error) {
        console.log("Error @ addTotal", error);
        reject(error);
      } else {
        let totalSatAmount = 0;
        data.map((data) => {
          if (column === "satAmount") {
            totalSatAmount += data.satAmount;
          }
          if (column === "defaultPayOut") {
            totalSatAmount += data.defaultPayOut;
          }
          if (column === "amount") {
            totalSatAmount += data.amount;
          }
          if (column === "fee") {
            totalSatAmount += data.fee;
          }
        });
        console.log(`${column} total: `, totalSatAmount);
        resolve(totalSatAmount);
      }
    } else {
      let { data, error } = await supabase.from(tableName).select(column);
      if (error) {
        console.log("Error @ addTotal", error);
        reject(error);
      } else {
        let totalSatAmount = 0;
        data.map((data) => {
          if (column === "satAmount") {
            totalSatAmount += data.satAmount;
          }
          if (column === "defaultPayOut") {
            totalSatAmount += data.defaultPayOut;
          }
          if (column === "amount") {
            totalSatAmount += data.amount;
          }
          if (column === "fee") {
            totalSatAmount += data.fee;
          }
        });
        console.log(`${column} total: `, totalSatAmount);
        resolve(totalSatAmount);
      }
    }
  });
}

module.exports.deleteUnPaidTips = function deleteUnPaidTips() {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("pending_payout").select("*").eq("paid", false);
    if (error) {
      console.log("Error @ QueryTwitterPendingPayoutAmount", error);
      reject(error);
    }
    if (data.length === 0) {
      console.log("Pending amount not found");
      resolve(0);
    } else {
      data.map(async (pending) => {
        let today = new Date();
        let databaseTime = new Date(pending.time);

        let diffInMilliSeconds = Math.abs(databaseTime - today) / 1000;
        const days = Math.floor(diffInMilliSeconds / 86400);
        diffInMilliSeconds -= days * 86400;
        // start delete
        if (days >= 2) {
          console.log(`Delete - Calculated days ${days} - ${pending.time} - ${pending.twitterUserID}`);
          const { data, error } = await supabase.from("pending_payout").delete().eq("twitterUserID", pending.twitterUserID);
        }
      });
      // console.log(data);
      resolve(data);
    }
  });
};

module.exports.deletePowerOfSatoshi = function deletePowerOfSatoshi() {
  return new Promise(async (resolve, reject) => {
    let { data, error } = await supabase.from("powerofsatoshi").select("*");
    if (error) {
      console.log("Error @ deletePowerOfSatoshi", error);
      reject(error);
    }
    if (data.length === 0) {
      console.log("deletePowerOfSatoshi not found");
      resolve(0);
    } else {
      data.map(async (user) => {
        let today = new Date();
        let databaseTime = new Date(user.time);

        let diffInMilliSeconds = Math.abs(databaseTime - today) / 1000;
        const days = Math.floor(diffInMilliSeconds / 86400);
        diffInMilliSeconds -= days * 86400;
        // start delete
        if (days >= 7) {
          console.log(`Delete Power of Satoshi - Calculated days ${days} - ${user.time} - ${user.twitterUserID} ${user.userScrenName}`);
          const { data, error } = await supabase.from("powerofsatoshi").delete().eq("twitterUserID", user.twitterUserID);
        }
      });
      // console.log(data);
      resolve(data);
    }
  });
};
