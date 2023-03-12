
/**
 * Vector2.js
 * Additional methods for PIXI.Points
 */

// rotate this vector to create a new one
// provide outPoint argument to store the results, or leave it empty to return a new one
PIXI.Point.prototype.rotate = function(_angle) {

    // Calculate the sin and cos of the angle
    const cos = Math.cos(_angle * Math.PI / 180)
    const sin = Math.sin(_angle * Math.PI / 180)

    var oldX = this.x;

    // Rotate the point
    this.x = oldX * cos - this.y * sin
    this.y = oldX * sin + this.y * cos

    // Return just in case we want to chain
    return this
}

// get the angle of the vector in degrees
PIXI.Point.prototype.getAngle = function() {
    return Math.atan2(this.y, this.x) * 180 / Math.PI
}

// Adds an x and y value to this vector
PIXI.Point.prototype.addXY = function(_x, _y) {
    this.x += _x
    this.y += _y
    return this
}

/** Turns this vector into a unit vector in a random direction
 * 
 * @returns This direction
 */
PIXI.Point.prototype.RandomDirection = function() {
    this.x = 0;
    this.y = 1;

    // Rotate the point a random amount
    this.rotate(Math.random() * 360);

    // Return just in case we want to chain
    return this
}

/** Sets this vector to a random position within a circle
 * 
 * @param {*} radius The radius of the circle
 * @returns This vector
 */
PIXI.Point.prototype.RandomPosition = function(radius) {

    this.RandomDirection();

    var dist = Math.random() * radius;

    this.x *= dist;
    this.y *= dist;

    // Return just in case we want to chain
    return this;
}