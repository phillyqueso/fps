const xLimit = 1000;
const yLimit = 1000;
const zLimit = 1000;
const PI2 = Math.PI * 2;

var camera, scene, renderer, particle;
var balls = new Array();
var bullets = new Array();
var color;

var socket;
var id;

$(document).ready(function() {
    init();

    socket = new io.Socket(null, {port: 8000, rememberTransport: false});
    socket.connect();
    socket.on('message', function(obj){
	if ('message' in obj) {
	    handleClient(obj.message[0], obj.message[1]);
	} else if ('bullet' in obj) {
	    var position = new THREE.Vector3();
	    position.set(obj.bullet[0].x, obj.bullet[0].y, obj.bullet[0].z);
	    var speed = new THREE.Vector3();
	    speed.set(obj.bullet[1].x, obj.bullet[1].y, obj.bullet[1].z);
	    AddBullet(position, speed, obj.bullet[2]);
	} else if ('id' in obj) {
	    id = obj.id;
	} else if ('hit' in obj) {
	    if (id == obj.hit) { //you're dead
		var answer = confirm("play again?");
		if (answer) {
		    window.location.reload();
		} else {
		    window.location = "http://google.com";
		}
	    } else {
		if (id == obj.by) { //you killed
		    console.log("you killed: "+obj.hit);
		}
		scene.removeObject(balls[obj.hit]);
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

    $(this).click(function() {
	var speed = new THREE.Vector3();
	speed.set(camera.target.position.x, camera.target.position.y, camera.target.position.z);
	speed.subSelf(camera.position);
	AddBullet(camera.position, speed, color);
	socket.send({'bullet': [camera.position, speed, color]});
    });

    setInterval( loop, 1000 / 60 );
});

function handleClient(sessionId, message) {
    if (!balls[sessionId]) {
	//console.log('adding '+sessionId+' with info: '+message.x+ ' ' +message.y+ ' ' +message.z+ ' ' +message.color);
	AddBall(sessionId, message.x, message.y, message.z, message.color);
    } else {
	//console.log('updating '+sessionId+' with info: '+message.x+ ' ' +message.y+ ' ' +message.z+ ' ' +message.color);
	UpdateBall(sessionId, message.x, message.y, message.z, message.color);
    }
}

var program = function ( context ) {
    context.beginPath();
    context.arc( 0, 0, 1, 0, PI2, true );
    context.closePath();
    context.fill();
}    

function AddBall(sessionId, x, y, z, color) {
    particle = new THREE.Particle( new THREE.ParticleCanvasMaterial( { color: color, program: program, opacity: 0.8 } ) );
    particle.position.x = x;
    particle.position.y = y;
    particle.position.z = z;
    particle.scale.x = particle.scale.y = 25;
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

function AddBullet(position, speed, color) {
    particle = new THREE.Particle( new THREE.ParticleCanvasMaterial( { color: color, program: program, opacity: 1.0 } ) );
    particle.position.x = position.x;
    particle.position.y = position.y;
    particle.position.z = position.z;
    particle.scale.x = particle.scale.y = 1.5;
    bullets.push( new Bullet(particle, speed) );
    scene.addObject( particle );
}

function Bullet(particle, speed) {
    this.particle = particle;
    this.speed = speed;
    return this;
}
    
function loop() {
    var msg = new Message(camera.position, color);
    //var msgString = '{x: '+msg.x+', y: '+msg.y+', z: '+msg.z+', color: '+msg.color+'}';
    //console.log("sending: " + msgString);
    socket.send(msg);

    for (var j = 0; j < bullets.length; j++) {
	var bullet = bullets[j];
	if (bullet) {
	    bullet.particle.position.addSelf(bullet.speed);
	    var position = bullet.particle.position;
	    if ( ( position.x >= xLimit || position.x <= -xLimit ) || 
		 ( position.y >= yLimit || position.y <= -yLimit ) ||
		 ( position.z >= zLimit || position.z <= -zLimit ) ) {
		// has bullet reached limit?
		scene.removeObject(bullet.particle);
		bullets.splice(j,1);
	    }
	}
    }
    renderer.render( scene, camera );
}

function init() {
    camera = new THREE.QuakeCamera({'fov': 75,
				    'aspect': window.innerWidth / window.innerHeight,
				    'near': 1, 'far': 10000,
				    'movementSpeed': 500,
				    'lookSpeed': 0.2,
				    'lookVertical': true,
				    'noFly': true,
				    'moveOnClick': false
				   });
    camera.position.x = (-xLimit + 50);
    camera.position.y = (-yLimit + 50);
    camera.position.z = Math.random() * zLimit;

    camera.target.x = Math.random() * xLimit;
    camera.target.y = Math.random() * yLimit;
    camera.target.z = Math.random() * zLimit;

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