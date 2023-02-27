
/**
 * Vector2.js
 * Additional methods for PIXI.Points
 */

// rotate this vector to create a new one
// provide outPoint argument to store the results, or leave it empty to return a new one
PIXI.Point.prototype.rotate = function(_angle, outPoint) {
    const cos = Math.cos(_angle * Math.PI / 180)
    const sin = Math.sin(_angle * Math.PI / 180)

    // if no outPoint is given then make a new one to return
    if (!outPoint) outPoint = new PIXI.Point()
    outPoint.x = this.x * cos - this.y * sin
    outPoint.y = this.x * sin + this.y * cos
    return outPoint
}

// rotate a vector in place
PIXI.Point.prototype.rotateInPlace = function(_angle) {
    return this.rotate(_angle, this)
}

// get the angle of the vector in degrees
PIXI.Point.prototype.getAngle = function() {
    return Math.atan2(this.y, this.x) * 180 / Math.PI
}