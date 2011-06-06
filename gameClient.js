const xLimit = 1000;
const yLimit = 1000;
const zLimit = 1000;

var camera, scene, renderer, particle;
var balls = new Array();
var color;

var socket;

$(document).ready(function() {
    init();

    socket = new io.Socket(null, {port: 8000, rememberTransport: false});
    socket.connect();
    socket.on('message', function(obj){
	if ('message' in obj) {
	    handleClient(obj.message[0], obj.message[1]);	    
	} else if ('clients' in obj){
            for (var client in obj.clients) {
		handleClient(client, obj.clients[client]);
	    }
        } else if ('disconnect' in obj) {
	    scene.removeObject(balls[obj.disconnect]);
	    delete balls[obj.disconnect];
	}
    });
    
    socket.on('connect', function(){ console.log('Connected'); });
    socket.on('disconnect', function(){ console.log('Disconnected'); });
    socket.on('reconnect', function(){ console.log('Reconnected to server'); });
    socket.on('reconnecting', function( nextRetry ){ console.log('Attempting to re-connect to the server, next attempt in ' + nextRetry + 'ms'); });
    socket.on('reconnect_failed', function(){ console.log('Reconnected to server FAILED.'); });

    setInterval( loop, 1000 / 60 );
});

function handleClient(sessionId, message) {
    if (!balls[sessionId]) {
	console.log('adding '+sessionId+' with info: '+message.x+ ' ' +message.y+ ' ' +message.z+ ' ' +message.color);
	AddBall(sessionId, message.x, message.y, message.z, message.color);
    } else {
	console.log('updating '+sessionId+' with info: '+message.x+ ' ' +message.y+ ' ' +message.z+ ' ' +message.color);
	UpdateBall(sessionId, message.x, message.y, message.z, message.color);
    }
}

function AddBall(sessionId, x, y, z, color) {
    var PI2 = Math.PI * 2;
    var program = function ( context ) {
	context.beginPath();
	context.arc( 0, 0, 1, 0, PI2, true );
	context.closePath();
	context.fill();
    }    
    particle = new THREE.Particle( new THREE.ParticleCanvasMaterial( { color: color, program: program, opacity: 0.8 } ) );
    particle.position.x = x;
    particle.position.y = y;
    particle.position.z = z;
    //particle.scale.x = particle.scale.y = Math.random() * 10 + 10;
    particle.scale.x = particle.scale.y = 15;
    balls[sessionId] = particle;
    scene.addObject( particle );
}

function UpdateBall(sessionId, x, y, z, color) {
    var particle =  balls[sessionId];
    particle.position.x = x;
    particle.position.y = y;
    particle.position.z = z;
    particle.color = color;
}

function Message(position, color) {
    this.x = position.x;
    this.y = position.y;
    this.z = position.z;
    this.color = color;
    return this;
}
    
function loop() {
    var msg = new Message(camera.position, color);
    var message = {x: msg.x, y: msg.y, z: msg.z, color: msg.color};
    var msgString = '{x: '+msg.x+', y: '+msg.y+', z: '+msg.z+', color: '+msg.color+'}';
    console.log("sending: " + msgString);
    socket.send(message);
    renderer.render( scene, camera );
}

function init() {
    camera = new THREE.QuakeCamera({'fov': 75,
				    'aspect': window.innerWidth / window.innerHeight,
				    'near': 1, 'far': 10000,
				    'movementSpeed': 500,
				    'lookSpeed': 0.2,
				    'lookVertical': true,
				    'noFly': true
				   });
    camera.position.x = (-xLimit + 50);
    camera.position.y = (-yLimit + 50);
    camera.position.z = Math.random() * zLimit;
    color = Math.random() * 0xffffff;
    
    scene = new THREE.Scene();
    
    var geometry = new THREE.Geometry();
    geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - zLimit, 0, 0 ) ) );
    geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( zLimit, 0, 0 ) ) );
    
    var material = new THREE.LineBasicMaterial( { color: 0x00000f, opacity: 0.2 } );
    
    for ( var i = 0; i <= 20; i ++ ) {	
	var line = new THREE.Line( geometry, material );
	line.position.y = - yLimit;
	line.position.z = ( i * 100 ) - zLimit;
	scene.addObject( line );
	
	var line = new THREE.Line( geometry, material );
	line.position.x = ( i * 100 ) - zLimit;
	line.position.y = - yLimit;
	line.rotation.y = 90 * Math.PI / 180;
	scene.addObject( line );
    }

    renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    
    document.body.appendChild( renderer.domElement );
}