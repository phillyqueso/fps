const http = require('http'),
      url = require('url'),
      fs = require('fs'),
      io = require('socket.io');

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

var clients = new Array();

// socket.io 
var socket = io.listen(server); 
socket.on('connection', function(client){ 
    if (clients.length > 0)
	client.send({ clients: clients});
    console.log(client.sessionId + ' connected.\n');
    client.on('message', function(message){
	clients[client.sessionId] = message; //update latest position, etc.
	//console.log(client.sessionId + ' broadcasting new info: '+message.x+ ' ' +message.y+ ' ' +message.z+ ' ' +message.color);
	return client.broadcast({ message: [client.sessionId, message]});
    })
    client.on('disconnect', function(){
	delete clients[client.sessionId];
	return client.broadcast({ disconnect: [client.sessionId]});
    }) 
});