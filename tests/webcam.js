var Kairos = require('kairos-api');
var client = new Kairos('4f889d91', 'c6bd9b0d9e1cf3f7f013d7097ff3459f');
const fs = require('fs');
const PiCamera = require('pi-camera');
const myCamera = new PiCamera({
  mode: 'photo',
  output: `${ __dirname }/capture.jpg`,
  width: 640,
  height: 480,
  nopreview: true,
  vflip: true
});

const file = fs.readFileSync('./test.jpg', 'base64');

var params = {
  image: file,
  gallery_name:"elliot_faces"
};

client.recognize(params)
.then(function(result) {
  if(result.body.images[0].candidates.length > 0){
    const recognized_individual = result.body.images[0].candidates[0].subject_id;
    const percent_confidence = Math.floor(result.body.images[0].candidates[0].confidence * 100);
    console.log(`Oh, I recognize you! Your name is ${recognized_individual}, I'm ${percent_confidence} percent sure of it!`)
  }
})
.catch(function(err) {
  console.log(err);
});
