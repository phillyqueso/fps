//three.js functions

exports.vectorAddSelf = function(obj) {
    obj.position.x += obj.speed.x;
    obj.position.y += obj.speed.y;
    obj.position.z += obj.speed.z;
    return obj;
}

exports.distanceTo = function ( v1, v2 ) {
    return Math.sqrt( distanceToSquared( v1, v2 ) );
}

var distanceToSquared = function ( v1, v2 ) {
    var obj = sub( v1, v2 );
    return lengthSq(obj);
}

var lengthSq = function (obj) {
    return obj.x * obj.x + obj.y * obj.y + obj.z * obj.z;
}

var sub = function ( v1, v2 ) {
    var obj = {x:0, y:0, z:0};
    obj.x = v1.x - v2.x;
    obj.y = v1.y - v2.y;
    obj.z = v1.z - v2.z;
    return obj;
}