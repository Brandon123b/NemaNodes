
// Raycasts a ray against all circles in the scene
// Returns true if the ray hit a circle or false if it did not
// raycastResult is the result of the raycast
// drawRay is whether or not to draw the ray
function Raycast(raycastResult, pos, dir, maxLength, circleList) {

    var hasHit = false;

    tempResult = new RaycastResult2D();

    // Loop through all circles in the scene
    for (var i = 0; i < circleList.length; i++) {

        // If the circle refuses to be raycasted, continue
        if (circleList[i].ignoreRaycast == true){
            continue;
        }

        // If the ray did not hit a circle, continue
        if (!RaycastCircle(tempResult, pos, dir, maxLength, circleList[i]))
            continue;
        
        // If the hit distance is less than the current hit distance, set the current hit distance to the new hit distance
        if (!hasHit || tempResult.GetDistance() < raycastResult.GetDistance()){
            hasHit = true
            raycastResult.SetFrom(tempResult);
        }
    }

    // Only draw the ray if the drawEyeRays flag is set to true
    if (world.drawEyeRays) {

        var gGraphics = world.canvas.worldGraphics;

        // Draw the ray
        gGraphics.moveTo(pos.x, pos.y);

        if (hasHit){
            gGraphics.lineStyle(1, "0xff0000", .5);
            gGraphics.lineTo(raycastResult.GetX(), raycastResult.GetY());
        }
        else{
            gGraphics.lineStyle(1, "0x00ffff", .25);
            gGraphics.lineTo(pos.x + dir.x * maxLength, pos.y + dir.y * maxLength);
        }
    }

    // Return whether or not the ray hit a circle
    return hasHit;
}

// Raycasts a ray against a single circle
// Returns true if the ray hit a circle or false if it did not
// raycastResult is the result of the raycast
function RaycastCircle(raycastResult, pos, dir, maxLength, circle) {

    // Store the radius of the circle
    var r = circle.GetRadius();

    // Store the square of the radius of the circle
    var rSq = r * r;

    // Store the vector from the circle to the ray origin
    var e = [circle.GetX() - pos.x, circle.GetY() - pos.y];

    // Calculate the dot product of the direction vector and the vector from the circle to the ray origin
    var a = e[0] * dir.x + e[1] * dir.y;

    // If the dot product is negative, the ray is pointing away from the circle
    if (a < 0) 
        return false;

    // Calculate the square of the magnitude of the vector from the circle to the ray origin
    var eMagSqar = e[0] * e[0] + e[1] * e[1];

    // If the origin of the ray is inside the circle, set the raycast result to the origin of the ray
    if (eMagSqar < rSq){

        // If the origin of the ray is the same as the center of the circle, there is no intersection
        if (pos.x == circle.GetX() && pos.y == circle.GetY())
            return false;

        raycastResult.Set(pos.x, pos.y, 0, circle);
        return true;
    }

    // Calculate the distance from the clocest point on the ray to the center of the circle
    var bSq = eMagSqar - a * a;

    // If the distance from the closest point on the ray to the center of the circle is greater than the radius of the circle, there is no intersection
    if (bSq > rSq) 
        return false;
    
    // Find the distance from the bSq to the intercection of the ray and the circle
    var f = Math.sqrt(rSq - bSq);

    // Calculate the distance from the ray origin to the closest point on the ray to the circle
    var t = a - f;

    // If the ray is longer than the maximum length, there is no intersection
    if (t > maxLength)
        return false;

    // Set the raycast result
    raycastResult.Set(pos.x + t * dir.x, pos.y + t * dir.y, t, circle);

    // Raycast was successful
    return true;
}

class RaycastResult2D {
    
    Set(_hitX, _hitY, _distance, _hitObject) {
        this.hitX = _hitX;
        this.hitY = _hitY;
        this.distance = _distance;

        if (_hitObject == undefined)
            throw "RaycastResult2D.Set: _hitObject is undefined";

        this.hitObject = _hitObject;
    }

    SetFrom(raycastResult2D){
        this.Set(raycastResult2D.GetX(), raycastResult2D.GetY(), raycastResult2D.GetDistance(), raycastResult2D.GetHitObject());
    }

    GetX() {
        return this.hitX;
    }

    GetY() {
        return this.hitY;
    }

    GetDistance() {
        return this.distance;
    }

    GetHitObject() {
        return this.hitObject;
    }

    Clear() {
        this.hitX = 0;
        this.hitY = 0;
        this.distance = 0;
        this.hitObject = null;
    }
}