
/**
 * Bibite
 * 
 * A bibite is a creature that can see food and move towards it.
 * It has three eyes that can see food. The eyes are raycasted from the bibite's position.
 * The bibite has a neural network that takes the eye raycasts as inputs and outputs a rotation and speed.
 * The bibite moves in the direction of the rotation and at the speed.
 */

// The maximum distance that the bibite can see
var maxSeeDistance = 500;

// DEBUG: Should the eye rays be drawn?
var drawEyeRays = false;

class Nematode {

    constructor() {

        // The brain
        this.nn = new NeatNN(5, 3)              // The neural network of the Nematode

        // The body
        this.age = 0;                           // The age in seconds
        this.energy = 100;                      // The energy of the Nematode

        // The movement
        this.maxSpeed = 1;                      // The maximum speed of the Nematode
        this.maxTurnSpeed = 4;                  // The maximum turn speed of the Nematode

        // The size
        this.width  = 10;                       // The width of the Nematode
        this.height = 10;                       // The height of the Nematode

        // The direction (normalized)
        this.direction = new PIXI.Point(0,1).rotate(Math.random()*360)

        // The position (in the world)
        this.worldPos = new PIXI.Point(0,0);    // The position of the Nematode in the world

        // Create a sprite to draw (Image stolen for convenience) TODO: Replace with own image
        this.sprite = PIXI.Sprite.from('Bibite.png');
        // Set the pivot point to the center of the bibite
        this.sprite.anchor.set(0.5);
        
    }

    /*
    * Update the bibite
    * 
    * @param {number} delta - The time since the last update in seconds
    */
    Update(delta) {
        
        // Set the neural network inputs from the eye raycasts
        //this.nn.SetInput(0, this.EyeRaycast(-30));
        //this.nn.SetInput(1, this.EyeRaycast(0));
        //this.nn.SetInput(2, this.EyeRaycast(30));
        this.nn.SetInput(0, .5);
        this.nn.SetInput(1, .5);
        this.nn.SetInput(2, .5);
        this.nn.SetInput(3, this.age);
        this.nn.SetInput(4, this.energy);

        // Run the neural network
        this.nn.RunNN();

        // Update the bibite's rotation
        this.direction.rotate(this.nn.GetOutput(0) * this.maxTurnSpeed * delta);

        // Calculate the speed of the bibite
        var speed = this.nn.GetOutput(1) * delta * this.maxSpeed;

        // If speed is negative, halve it (Make backwards movement slower to encourage forward movement)
        speed = (speed < 0) ? speed *= 0.5 : speed;

        // Update the bibite's position
        this.worldPos.addXY( this.direction.x * speed * delta, 
                             this.direction.y * speed * delta );


        // Increase the age of the bibite
        this.age += delta;

        // Decrease the energy of the bibite
        this.energy -= delta;
    }

    // called by drawing.js
    UpdateSprite() {
        // Set the sprite values
        this.sprite.x = this.worldPos.x;
        this.sprite.y = this.worldPos.y;
        this.sprite.width = this.width;
        this.sprite.height = this.height;
        this.sprite.angle = this.direction.getAngle();
    }
}

