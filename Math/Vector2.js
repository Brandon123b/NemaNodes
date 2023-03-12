
/**
 * Vector2.js
 * Additional methods for PIXI.Points
 */

// rotate this vector by some angle in degrees
PIXI.Point.prototype.rotate = function(_angle) {

    // Calculate the sin and cos of the angle
    const cos = Math.cos(_angle * Math.PI / 180)
    const sin = Math.sin(_angle * Math.PI / 180)

    var oldX = this.x;

    // Rotate the point
    this.x = this.x * cos - this.y * sin
    this.y = oldX   * sin + this.y * cos

    // Return just in case we want to chain
    return this
}
// PIXI.js uses both Point and ObservablePoint so duplicate the extensions for both
// May want to convert these helper functions into standalones if it becomes an issue
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

// clamp the values of this point to be within the given bounds
// Example: new PIXI.Point(4,9).clamp([0,2], [10,15]) => PIXI.Point(2,10)
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