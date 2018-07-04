const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const app_keys = require('./keys');
const path = require('path')
const url = require('url')
const fs = require('fs');
const spawn = require('child_process').spawn;
const {ipcMain} = require('electron')


const PiCamera = require('pi-camera');
const myCamera = new PiCamera({
  mode: 'photo',
  output: `${ __dirname }/pictures/capture.jpg`,
  width: 640,
  height: 480,
  nopreview: true,
  vflip: true
});

var Kairos = require('kairos-api');
var client = new Kairos(app_keys.kairos_app_id, app_keys.kairos_app_key);


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    // protocol: 'https:',
    // pathname: 'soundcloud.com/couldever/maybe',
    slashes: true
  }))

  mainWindow.setMenu(null);

  // mainWindow.maximize();
  // mainWindow.setFullScreen(true);

  // setTimeout(()=>{
  //   mainWindow.focus();
  //   mainWindow.setFullScreen(false);
  // }, 3000)
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
  // Emitted when the window is closed.
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    console.log("Goodbye.");
    app.quit()
  }
})

app.on('activate', function () {
  console.log("Greetings!");
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('focus', (event, arg) => {
  console.log(arg)  // prints "ping"
  var spawn = require("child_process").spawn;
  var process = spawn('python',["servo_controller.py", "1", `${Math.floor(Math.random() * 180)}`]);
  mainWindow.focus();
})

ipcMain.on('detect face', (event, arg) => {
  detect_face()
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
function rotate_head(angle){
  console.log("Rotating head:", angle);
  var process = spawn('python',["servo_controller.py", "1", `${angle}`]);
}

const facing_teacher_angle = 0;
const facing_student_angle = 60;

function detect_face(){
  rotate_head(facing_student_angle)
  myCamera.snap()
  .then((result) => {
    console.log(result);

    const file = fs.readFileSync('./pictures/capture.jpg', 'base64');

    var params = {
      image: file,
    };

    client.detect(params)
    .then(function(result) {
      console.log("RESULT OF FACIAL RECOGNITION");
      if(result.body.images && result.body.images[0].faces){
        console.log("Detected a face!");
        recognize_face()
      } else{
        console.log("No face detected.");
        rotate_head(facing_teacher_angle)
        mainWindow.webContents.send("robot speak command", "I cannot see anybody. Tell them to stand in front of the camera.");
      }
    })
    .catch(function(err) {
      console.log(err);
    });

  })
  .catch((error) => {
    console.log(error);
  });
}

function recognize_face(){
  const file = fs.readFileSync('./pictures/capture.jpg', 'base64');

  var params = {
    image: file,
    gallery_name:"elliot_faces"
  };

  client.recognize(params)
  .then(function(result) {

    if(result.body.images[0].candidates){
      const recognized_individual = result.body.images[0].candidates[0].subject_id;
      const percent_confidence = Math.floor(result.body.images[0].candidates[0].confidence * 100);
      mainWindow.webContents.send("robot speak command", `Oh, I recognize you! Your name is ${recognized_individual}, I'm ${percent_confidence} percent sure of it!`);
      rotate_head(facing_teacher_angle);
    } else{
      rotate_head(facing_teacher_angle)
      mainWindow.webContents.send("robot speak command", "I recognized a face but I don't know who it is. You told me this is Sam, right? I'll try to remember him");
      enroll_face();
    }
  })
  .catch(function(err) {
    console.log(err);
  });
}

function enroll_face(){
  const file = fs.readFileSync('./pictures/capture.jpg', 'base64');

  var params = {
    image: file,
    gallery_name:"elliot_faces",
    subject_id: "Sam Almaer"
  };

  client.enroll(params)
  .then(function(result) {
    console.log(result);
    mainWindow.webContents.send("robot speak command", "Okay, now I remember Sam Almaer!");
  })
  .catch(function(err) {
    console.log(err);
  });
}
