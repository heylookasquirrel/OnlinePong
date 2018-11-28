let socket = io();
console.log("start")

let stats = {
  x: false,
  y: false,
}
let startTime;
let latency;

stats.x = document.getElementById("ballx")
stats.y = document.getElementById("bally")
stats.p1score = document.getElementById("p1score")
stats.p2score = document.getElementById("p2score")
stats.paddle = document.getElementById("paddlex")
stats.opponent = document.getElementById("opponentx")
stats.ping = document.getElementById("ping")

function updateDebug(){
  stats.x.innerHTML = "x: " + ball.x;
  stats.y.innerHTML = "y: " + ball.y;
  stats.p1score.innerHTML = "Player 1: " +score.player1;
  stats.p2score.innerHTML = "Player 2: " +score.player2;
  stats.paddle.innerHTML = "x: " + player.x;
  stats.opponent.innerHTML = "x: " + opponent.x;
  stats.ping.innerHTML = "ms: " + latency;
}

//Rendering loop
let canvas = document.getElementById("stage");
let ctx = canvas.getContext("2d");
let score = {
  player1: 0,
  player2: 0
}
let ready = false

let Paddle = function(player){
  if(player == true){
    this.y = 20;
  }
  else{
    this.y = 480;
  }
  this.x = 40;
  this.vx = 0;
  this.speed = 2;
  this.size = 100;
  this.controller = {
    left:false,
    right:false,
  }
}

let BallObject = function(){
  this.size = 5;
  this.x = canvas.width/2 - this.size/2;
  this.y = canvas.height/2 - this.size/2;
  this.vx = 0;
  this.vy = 0;
  this.speed = 0;
}

let player = new Paddle(true)
let opponent = new Paddle(false)
let ball = new BallObject

function render(){
  //clear frame
  ctx.clearRect(0,0,
    canvas.width,
    canvas.height
  )

  ctx.fillStyle = '#282C34'
  ctx.fillRect(
    ball.x, //position of paddle 1
    ball.y, //position of paddle 1
    ball.size, //size of paddle 1
    ball.size
  )

  ctx.fillStyle = "#77AFC6";
  ctx.fillRect(
    player.x, //position of paddle 1
    player.y, //position of paddle 1
    player.size, //size of paddle 1
    15) //default height of paddle 1

  ctx.fillStyle = "#FFD264";
  ctx.fillRect(
    opponent.x, //position of paddle 2
    opponent.y, //position of paddle 2
    opponent.size, //size of paddle 2
    15) //default height of paddle 2

  }

function logic(){

  if(ready == false && player.controller.ready == true){
    ready = true;
  }
  if(player.controller.left == true){
    player.vx = -player.speed;
  }
  if(player.controller.right == true){
    player.vx = player.speed;
  }
  if(player.controller.right == false && player.controller.left == false){
    player.vx = 0;
  }
  player.x += player.vx;

  //netcode
  startTime = Date.now();
  let packet = {
    x: player.x,
    ready: ready,
  }
  let send = LZUTF8.compress( JSON.stringify(packet), { outputEncoding:"Base64"} )
  socket.emit("send1", send )


}

function main(){
  logic()
  updateDebug()
  render()
  window.requestAnimationFrame(main)
}

document.addEventListener('keyup', function(e){
  e.preventDefault
  switch(e.keyCode){
    case 37: player.controller.left = false; break;
    case 39: player.controller.right = false; break;
    case 32: player.controller.ready = false; break;
  }
}, false);

document.addEventListener('keydown', function(e){
  e.preventDefault
  switch(e.keyCode){
    case 37: player.controller.left = true; break;
    case 39: player.controller.right = true; break;
    case 32: player.controller.ready = true; break;
  }
}, false);

socket.on('receive', function (data) {

  let packet = LZUTF8.decompress(data,{inputEncoding:"Base64"})
  packet = JSON.parse(packet)


  opponent.x = packet.player2.x;
  score.player1 = packet.player1.score;
  score.player2 = packet.player2.score;
  ball.x = packet.ball.x
  ball.y = packet.ball.y

  latency = Date.now() - startTime;
});




window.requestAnimationFrame(main)
