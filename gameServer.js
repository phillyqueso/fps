const http = require('http'),
url = require('url'),
fs = require('fs'),
io = require('socket.io'),
vector3 = require('./libs/vector3.js');

server = http.createServer(function(req, res){
    var path = url.parse(req.url).pathname;
    switch (path) {
        case '/Three.js':
        case '/gameClient.js':
        case '/index.html':
        case '/favicon.ico':
        case '/':
	    if (path == '/') path = '/index.html';
	    fs.readFile(__dirname + path, function(err, data) {
		if (err) return send404(res, "::err:" + path);
		res.writeHead(200, {'Content-Type': path == 'gameClient.js' ? 'text/javascript' : 'text/html'})
		res.write(data, 'utf8');
		res.end();
	    });
	break;
        default:
	    send404(res, "not found: "+ path);
	break;
    }
});

send404 = function(res, msg){
    console.log("404:: " + msg);
    res.writeHead(404);
    res.write('404:: ' + msg);
    res.end();
};

server.listen(8000);

var players = new Array();
var bullets = new Array();

// socket.io 
var socket = io.listen(server); 
socket.on('connection', function(client) {
    client.send({id : client.sessionId}); //send client their ID
    console.log(client.sessionId + ' connected.\n');
    client.on('message', function(message) {
	if ('bullet' in message) {
	    //console.log(client.sessionId+": fired bullet");
	    bullets[bullets.length] = {'position': message.bullet[0], 'speed': message.bullet[1], 'clientOrigin': client.sessionId};
	    return client.broadcast(message);
	} else {
	    players[client.sessionId] = message; //update latest position, etc.
	    //console.log(client.sessionId + ' broadcasting new info: '+message.x+ ' ' +message.y+ ' ' +message.z+ ' ' +message.color);
	    return client.broadcast({ message: [client.sessionId, message]});
	}
    })
    client.on('disconnect', function() {
	players.splice(client.sessionId,1);
	return client.broadcast({ disconnect: [client.sessionId]});
    }) 
});

// Handle bullet logic at the same rate as the scene gets updated in the client?
setInterval( bulletHandler, 1000 / 60 );

var xLimit = 1000;
var yLimit = 1000;
var zLimit = 1000;

// bullet hits client? or runs out of bounds?
function bulletHandler() {
    for (var i = 0; i < bullets.length; i++) {
	//update position
	bullets[i] = vector3.vectorAddSelf(bullets[i]);

	for (var player in players) {
	    if (player != bullets[i].clientOrigin) {
		//scale 1.5 25
		var d = vector3.distanceTo(players[player], bullets[i].position);
		//console.log("distance between bullet:" + bullets[i].clientOrigin + " and player:" + player + " is: "+d);
		//if (d <= (1.5 + 25)) {
		if (d <= (30)) {
		    console.log(bullets[i].clientOrigin + " hit player : " + player);
		    socket.broadcast({hit: player, by: bullets[i].clientOrigin});
		}
	    }
	}


	//check if the bullet has reached a boundary, if so delete it.
	if (( bullets[i].position.x >= xLimit || bullets[i].position.x <= -xLimit ) || 
	    ( bullets[i].position.y >= yLimit || bullets[i].position.y <= -yLimit ) ||
	    ( bullets[i].position.z >= zLimit || bullets[i].position.z <= -zLimit ) ) {
	    bullets.splice(i,1);
	}
    }
}