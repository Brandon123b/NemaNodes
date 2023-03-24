
/**
 * Vector2.js
 * Additional methods for PIXI.Points
 * 
 * 
 * PIXI.js uses both Point and ObservablePoint so duplicate the extensions for both
 * May want to convert these helper functions into standalones if it becomes an issue
 */

// rotate this vector by some angle in degrees
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
PIXI.ObservablePoint.prototype.rotate = PIXI.Point.prototype.rotate

// get the angle of the vector in degrees
PIXI.Point.prototype.getAngle = function() {
    return Math.atan2(this.y, this.x) * 180 / Math.PI
}
PIXI.ObservablePoint.prototype.getAngle = PIXI.Point.prototype.getAngle

// Adds an x and y value to this vector
PIXI.Point.prototype.addXY = function(_x, _y) {
    this.x += _x
    this.y += _y
    return this
}
PIXI.ObservablePoint.prototype.addXY = PIXI.Point.prototype.addXY

/* Turns this vector into a unit vector in a random direction
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
PIXI.ObservablePoint.prototype.RandomDirection = PIXI.Point.prototype.RandomDirection

/* Sets this vector to a random position within a circle
 * 
 * @param {*} radius The radius of the circle
 * @returns This vector
 */
PIXI.Point.prototype.RandomPosition = function(radius) {

    this.RandomDirection();

    var dist = Math.sqrt(Math.random()) * radius;

    this.x *= dist;
    this.y *= dist;

    // Return just in case we want to chain
    return this;
}
PIXI.ObservablePoint.prototype.RandomPosition = PIXI.Point.prototype.RandomPosition

/* Gets the distance from this vector to another */
PIXI.Point.prototype.Dist = function(other) {
    return Math.sqrt((this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y));
}
PIXI.ObservablePoint.prototype.Dist = PIXI.Point.prototype.Dist

/** Gets the distance from this vector to the origin
 * 
 * @param {*} radius The radius of the circle
 * @returns This vector
 */
function DistFromOrigin(pos) {
    return Math.sqrt(pos.x * pos.x + pos.y * pos.y);
}


/* clamp the values of this point to be within the given bounds
 * Example: new PIXI.Point(4,9).clamp([0,2], [10,15]) => PIXI.Point(2,10)
*/
PIXI.Point.prototype.clamp = function(xbounds, ybounds) {
    let [minX, maxX] = xbounds
    let [minY, maxY] = ybounds

    this.x = Math.max(minX, Math.min(this.x, maxX))
    this.y = Math.max(minY, Math.min(this.y, maxY))

    return this
}
PIXI.ObservablePoint.prototype.clamp = PIXI.Point.prototype.clamp

// perturb the given Point by moving it randomly by at the most radius distance
PIXI.Point.prototype.perturb = function(radius) {
    let delta = new PIXI.Point(0,radius).rotate(Math.random()*360)
    delta.multiplyScalar(Math.random(), delta)
    this.addXY(delta.x, delta.y)
    return this
}
PIXI.ObservablePoint.prototype.perturb = PIXI.Point.prototype.perturb
