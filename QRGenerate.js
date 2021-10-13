var fs = require("fs");
const request = require("request");

function QRGenerate(message, id) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("downloading QR Code from Google API");
      let downloadQRImageFromAPIGoogle = await downloadQRImageAPIGoogle(
        message,
        id
      );
      resolve(downloadQRImageFromAPIGoogle);
    } catch {
      try {
        console.log("downloading QR Code API Server");
        let downloadQRImage = await downloadQRImageAPI(message, id);
        resolve(downloadQRImage);
      } catch {
        reject("Failed to generate and download QR Code");
      }
    }
  });
}

function downloadQRImageAPI(message, id) {
  return new Promise((resolve, reject) => {
    //create folder if it doesnt exist
    let dir = './image_temp';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    let path = `${__dirname}/image_temp/qrcode-${id}.jpg`;
    let download = function (uri, filename, callback) {
      request.head(uri, function (err, res, body) {
        if (err) {
          console.log("Error generating QR Code", err);
          reject(err);
        } else {
          console.log("QR Downloaded, resolving as success");
          console.log("content-type:", res.headers["content-type"]);
          console.log("content-length:", res.headers["content-length"]);

          request(uri)
            .pipe(fs.createWriteStream(filename))
            .on("close", callback);
        }
      });
    };

    download(
      `https://api.qrserver.com/v1/create-qr-code/?data=${message}`,
      path,
      checkQRDownloadError
    );
    // check if QR generated and download successfully
    function checkQRDownloadError(err) {
      if (err) {
        console.log(
          "Error responing download QR from API server, try Google: ",
          err.message
        );
        reject(err);
      } else {
        console.log("Downloaded");
        resolve(path);
      }
    }
  });
}

function downloadQRImageAPIGoogle(message, id) {
  return new Promise((resolve, reject) => {
    //create folder if it doesnt exist
    let dir = './image_temp';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    let path = `${__dirname}/image_temp/qrcode_-${id}.jpg`;
    let download = function (uri, filename, callback) {
      request.head(uri, function (err, res, body) {
        if (err) {
          console.log("Error generating QR Code", err);
          reject(err);
        } else {
          console.log("QR Downloaded, resolving as success");
          console.log("content-type:", res.headers["content-type"]);
          console.log("content-length:", res.headers["content-length"]);

          request(uri)
            .pipe(fs.createWriteStream(filename))
            .on("close", callback);
        }
      });
    };

    download(
      `https://chart.googleapis.com/chart?cht=qr&chl=${message}&chs=360x360&chld=L|0`,
      path,
      checkQRDownloadError
    );
    // check if QR generated and download successfully
    function checkQRDownloadError(err) {
      if (err) {
        console.log("Error responing: ", err);
        reject(err);
      } else {
        console.log("Downloaded");
        resolve(path);
      }
    }
  });
}

module.exports = QRGenerate;
