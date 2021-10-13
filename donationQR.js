const axios = require("axios");
const config = require("./config.js");
const umbril = require("./umbril");
const donationQRCodeTwit = require("./donationQRCodeTwit");
const PasteClient = require("pastebin-api").default;
const client = new PasteClient(config.pastebin);
const fetch = require("node-fetch");
const QRgenerate = require("./QRGenerate")


function generateInvoice(tweet, amount, userScrenName,idThread) {
  return new Promise(async (resolve, reject) => {
    try {
      //get JWT Token
      //console.log(tweet)
      console.log("Generating invoice")
      let JWTToken = await umbril.getJWTToken();
      let paymentRequest = await generatePaymentRequest(JWTToken, {
        amt: amount,
        memo: String(idThread),
      });
      console.log("Invoice: ", paymentRequest);
      //generate wallet paste
      let dpasteURL = ""
      dpasteURL = await dpaste(paymentRequest);
      if(!dpasteURL){
        console.log("dPaste failed, trying PastePin")
        dpasteURL = pasteBin(paymentRequest)
      }
      //download qrimage
      let qrPath = await QRgenerate(paymentRequest, idThread)
      
      //send twit with QR and paste url
      let postQRCodeTwit = await donationQRCodeTwit(tweet, amount, dpasteURL, qrPath);
      resolve("QR Donation Twit Posted");
    } catch (err) {
      console.log("Error in generating invoice: ", err);
      reject(err);
      
    }
  });
}
function pasteBin(paymentRequest){
  return new Promise(async (resolve, reject)=>{
    try{
      const url = await client.createPaste({
        code: "const something = 'Hello World!'",
        expireDate: "1D",
        name: "something.txt",
        publicity: 0,
        expireDate: "1D"
      });
      resolve(url)
    }
    catch(err){reject(err)}
    
  })
  
    
}


async function dpaste(paymentRequest) {
  return new Promise(async (resolve, reject) => {
    console.log("Generating dpaste")
    var response = await fetch("https://dpaste.com/api/v2/", {
      method: "POST",
      Authorization: `Bearer ${config.dpaste}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "content=" + paymentRequest,
    })
      .then((res) => resolve(res.text()))
      .catch((err) => reject(err));
  });
}


function generatePaymentRequest(JWTToken, payLoad) {
  return new Promise((resolve, reject) => {
    let res = axios
      .post(`http://umbrel.local/api/v1/lnd/lightning/addInvoice`, payLoad, {
        headers: {
          Authorization: `JWT ${JWTToken}`,
        },
      })
      .then(async (res) => {
        let paymentRequest = res.data.paymentRequest;
        if (paymentRequest === null) {
          reject("Failed to generate paymentRequest from Umbrel");
        } else {
          // result from API
          resolve(paymentRequest);
        }
      });
  });
}


module.exports = {generateInvoice, dpaste}
