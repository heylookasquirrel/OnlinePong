
const express = require('express');
const fs = require("fs");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const LZUTF8 = require('lzutf8');

app.assignedPort = 2000


//static dir for webGUI
app.set('view engine','ejs');
app.use("/", express.static("public"));


function init(){
  let normalizedPath = require("path").join(__dirname, "pagecode");

  fs.readdirSync(normalizedPath).forEach(function(file) {
    console.log("loaded " + file)
    require("./pagecode/" + file);
  });
}

app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});


app.get('/', function(req, res){

  res.render("home",app.fpinfo)

})

http.listen(app.assignedPort, function(){
  console.log('listening on port ' + app.assignedPort);
});

let player1 = {
  x:100,
  score:0,
  ready: false
}

let player2 = {
  x:100,
  score:0,
  ready: false
}

let ball = {
  vx: 1,
  vy: 1,
  x: 197.5,
  y: 247.5
}

function ballThread(){
  if(player1.ready == true && player2.ready == true){
    //logic

    if(ball.x >= player2.x && ball.x <= player2.x + 100 &&
      ball.y >= 480 && ball.y <= 495) {
      ball.y = 475; //push ball outside paddle
      ball.vy = -ball.vy;  //reverse ball
    }

    if(ball.x >= player1.x && ball.x <= player1.x + 100 &&
      ball.y >= 20 && ball.y <= 35) {
      ball.y = 40; //push ball outside paddle
      ball.vy = -ball.vy;  //reverse ball
    }

    //physics
    ball.x += ball.vx;
    ball.y += ball.vy;


    if(ball.x <= 0){
      ball.vx = -ball.vx
    }
    if(ball.x >= 400){
      ball.vx = -ball.vx
    }
    if(ball.y <= 0){
      player2.score += 1;
      ball.y = 247.5
    }
    if(ball.y >= 500){
      player1.score += 1;
      ball.y = 247.5
    }


  }
}

io.on('connection', (socket) => {

  socket.on("send1", (data)=>{

    let decompressed = LZUTF8.decompress(data,{inputEncoding:"Base64"})
    decompressed = JSON.parse(decompressed)
    player1.x = decompressed.x
    player1.ready = decompressed.ready
    ballThread()
    let packet = {
      ball: ball,
      player1: player1,
      player2: player2
    }
    socket.emit("receive", LZUTF8.compress(JSON.stringify(packet), {outputEncoding:"Base64"}))
  })

  socket.on("send2", (data)=>{

    let decompressed = LZUTF8.decompress(data,{inputEncoding:"Base64"})
    decompressed = JSON.parse(decompressed)
    player2.x = decompressed.x
    player2.ready = decompressed.ready
    ballThread()
    let packet = {
      ball: ball,
      player1: player1,
      player2: player2
    }

    var output = LZUTF8.compress(JSON.stringify(packet),{outputEncoding:"Base64"})

    socket.emit("receive", output)
  })


})

init();
