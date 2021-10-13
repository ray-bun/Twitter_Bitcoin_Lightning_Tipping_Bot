const axios = require("axios");
var Jimp = require("jimp");
const jsQR = require("jsqr");
var fs = require("fs");
const request = require("request");

function readQRCode(qrurl) {
  return new Promise(async (resolve, reject) => {
    try {
      let manaullyReadQr = await manaullyReadQR(qrurl);
      console.log("Manaul read QR Success", manaullyReadQr);
      resolve(manaullyReadQr);
    } catch{
      try {
        console.log("Failed with JSR, trying QR Server");
        let QrServer = await readQRCodeQrServer(qrurl);
        console.log("Success with QR Server: ", QrServer);
        resolve(QrServer);
      } catch {
        try {
          console.log("QR Server failed, trying Zxing");
          let zXing = await readQRCodeZxing(qrurl);
          console.log("Success with Zxing: ", zXing);
          resolve(zXing);
        } catch(err) {
          console.log("failed to read QR")
          reject(err)
        }
      }
    }
  });
}
//read QR via QR Server
function readQRCodeQrServer(qrurl) {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://api.qrserver.com/v1/read-qr-code/?fileurl=${qrurl}`)
      .then(async (res) => {
        let qrdata = res.data[0].symbol[0].data;
        if (qrdata === null) {
          try {
            console.log(
              "Failed to read QR code via API server, trying with manaulReadQr Function"
            );
            const manualQr = await manaullyReadQR(qrurl);
            console.log("QR Code: ", manualQr);
            resolve(manualQr);
          } catch (err) {
            console.log("Failed to read QR via QR Server.com. Can we retry?");
            reject(err);
          }
        } else {
          // result from API
          resolve(res.data[0].symbol[0].data);
        }
      })
      .catch((err) => reject(err.message));
  });
}

// read QR via zxing
function readQRCodeZxing(qrurl) {
  return new Promise(async (resolve, reject) => {
      let decodeURL = decodeURIComponent(qrurl);
      axios
        .get(`https://zxing.org/w/decode?u=${decodeURL}`)
        .catch((err)=>{reject(err)})
        .then(async (res) => {
          let html = res.data;
          let regExQRCode = /(\<pre\>).*(<\/pre\>)/;
          let regExFoundQR = regExQRCode.test(html);
          if (regExFoundQR) {
            let qrCode = html.match(regExQRCode)[0];
            let cleanQr1 = qrCode.replace("<pre>", "");
            let cleanQrFinal = cleanQr1.replace("</pre>", "");
            console.log("QRCode Detected: ", cleanQrFinal);
            resolve(cleanQrFinal);
          } else {
            reject("Failed to read QR Code with Zxing");
          }
        });
  })
}

// Read Manually
function manaullyReadQR(qrurl) {
  return new Promise((resolve, reject) => {
    let decodeURL = decodeURIComponent(qrurl);
    console.log("URL: ", decodeURL);
    //create folder if it doesnt exist
    let dir = './image_temp';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    let random = Math.floor(Math.random() * 100000);
    let path = `${__dirname}/image_temp/qrcode_temp-${random}.jpg`;

    let download = function (uri, filename, callback) {
      request.head(uri, function (err, res, body) {
        if (err) {
          reject(path);
        } else {
          console.log("content-type:", res.headers["content-type"]);
          console.log("content-length:", res.headers["content-length"]);
          request(uri)
            .pipe(fs.createWriteStream(filename))
            .on("close", callback);
        }
      });
    };

    download(decodeURL, path, function () {
      let buffer = fs.readFileSync(path);

      // Parse the image using Jimp.read() method
      Jimp.read(buffer, function (err, image) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          const code = jsQR(
            image.bitmap.data,
            image.bitmap.width,
            image.bitmap.height
          );
  
          if (code) {
            console.log("Found QR code", code.data);
           
            resolve(code.data);
          } else {
            reject("Failed to read QR with JSQR");
          }
        }
      });
    });
  });
}
//not in use
function readQrManullyJSQR(buffer) {
  return new Promise((resolve, reject) => {
    Jimp.read(buffer, function (err, image) {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        const code = jsQR(
          image.bitmap.data,
          image.bitmap.width,
          image.bitmap.height
        );

        if (code) {
          console.log("Found QR code", code.data);
          //delete file
          fs.unlink(buffer, (err) => {
            if (err) {
              reject(err);
            }
          });
          resolve(code.data);
        } else {
          reject("Failed to read QR with JSQR");
        }
      }
    });
  });
}


module.exports = readQRCode;
