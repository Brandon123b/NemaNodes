
/**
 * Bibite
 * 
 * A bibite is a creature that can see food and move towards it.
 * It has three eyes that can see food. The eyes are raycasted from the bibite's position.
 * The bibite has a neural network that takes the eye raycasts as inputs and outputs a rotation and speed.
 * The bibite moves in the direction of the rotation and at the speed.
 */

// The maximum distance that the bibite can see
var maxSeeDistance = 50;

// DEBUG: Should the eye rays be drawn?
var drawEyeRays = true;

class Nematode {
    // provide the World object for this nematode to live in
    constructor(world) {
        this.world = world

        // The brain
        this.nn = new NeatNN(5, 2)              // The neural network of the Nematode

        // The body
        this.age = 0;                           // The age in seconds
        this.energy = 100;                      // The energy of the Nematode

        // The movement
        this.maxSpeed = 80;                     // The maximum speed of the Nematode (in pixels (unzoomed) per second)
        this.maxTurnSpeed = 120;                // The maximum turn speed of the Nematode (in degrees per second)

        // The size
        this.width  = 10;                       // The width of the Nematode
        this.height = 10;                       // The height of the Nematode

        // The direction (normalized)
        this.direction = new PIXI.Point(1,0).rotate(Math.random()*360)

        // Create a sprite to draw (Image stolen for convenience) TODO: Replace with own image
        this.sprite = PIXI.Sprite.from('Bibite.png');
        // Set the pivot point to the center of the bibite
        this.sprite.anchor.set(0.5);

        // the position of this nematode in the world is maintained by its sprite position
        this.sprite.position = new PIXI.Point(Math.random() * 500 - 250, Math.random() * 500 - 250)
        
        world.add(this)
    }

    /*
    * Update the bibite
    * 
    * @param {number} delta - The time since the last update in seconds
    */
    Update(delta) {
        
        // Set the neural network inputs from the eye raycasts

        this.nn.SetInput(0, this.EyeRaycast(-25));
        this.nn.SetInput(1, this.EyeRaycast(0));
        this.nn.SetInput(2, this.EyeRaycast(25));
        this.nn.SetInput(3, this.age / 60 - 1);
        this.nn.SetInput(4, this.energy / 100 - 1);

        // Run the neural network
        this.nn.RunNN();

        // Get the rotation and speed from the neural network
        var rotate = this.nn.GetOutput(0) * this.maxTurnSpeed * delta;
        var speed  = this.nn.GetOutput(1) * this.maxSpeed     * delta;

        // Update the bibite's rotation
        this.direction.rotate(rotate);

        // If speed is negative, halve it (Make backwards movement slower to encourage forward movement)
        speed = (speed < 0) ? speed *= 0.5 : speed;

        // Update the bibite's position
        this.world.updatePos(this, this.GetX() + this.direction.x * speed, this.GetY() + this.direction.y * speed);

        // Increase the age of the bibite
        this.age += delta;

        // Decrease the energy of the bibite
        this.energy -= delta;

        // update sprite
        this.sprite.width = this.width
        this.sprite.height = this.height
        this.sprite.angle = this.direction.getAngle()
    }

    // Returns the ratio of the distance to the closest food to the max distance
    // Returns -1 if no food is found
    EyeRaycast(angleFromMiddle) {
        // Create a raycast result object
        var raycastResult = new RaycastResult2D();

        // Calculate the angle of the sight line in radians
        var theta = (this.direction.getAngle() + angleFromMiddle) * Math.PI / 180;

        // Get the direction of the sight line
        var dirX = Math.cos(theta);
        var dirY = Math.sin(theta);

        // Send the raycast
        if (Raycast(raycastResult, this.sprite.x, this.sprite.y, dirX, dirY, maxSeeDistance, drawEyeRays))
            return (1 - raycastResult.GetDistance() / maxSeeDistance);
        
        // Return -1 if no food is found
        return -1;
    }

    // TEMP FOR TESTING RAYCASTS
    GetRadius() {
        return this.width / 2;
    }

    GetX() {
        return this.sprite.position.x;
    }

    GetY() {
        return this.sprite.position.y;
    }

    GetPosition() {
        return this.sprite.position
    }

    SetPos(x, y) {
        this.sprite.position.set(x,y)
    }
}

