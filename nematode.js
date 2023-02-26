
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

        this.nn = null;                         // new NeuralNetwork(3, 2);  // The neural network of the Nematode

        this.age = 0;                           // The age in seconds
        this.energy = 100;                      // The energy of the Nematode

        this.maxSpeed = 1;                     // The maximum speed of the Nematode
        this.maxTurnSpeed = 4;                  // The maximum turn speed of the Nematode

        this.width  = 1;                       // The width of the Nematode
        this.height = 1;                       // The height of the Nematode
        this.angle = Math.random() * 360;       // The angle of the Nematode

        this.worldPos = new PIXI.Point(0,0);  // The position of the Nematode in the world    TODO: What is the best way to store this?

        // Create a sprite to draw (Image stolen for convenience) TODO: Replace with own image
        this.sprite = PIXI.Sprite.from('Bibite2.png');
        // Set the pivot point to the center of the bibite
        this.sprite.anchor.set(0.5);
        
    }

    /*
    * Update the bibite
    * 
    * @param {number} delta - The time since the last update in seconds
    */
    Update(delta) {

        // Increase the age of the bibite
        this.age += delta;
        
        // Set the neural network inputs from the eye raycasts
        //this.nn.SetInput(0, this.EyeRaycast(-30));
        //this.nn.SetInput(1, this.EyeRaycast(0));
        //this.nn.SetInput(2, this.EyeRaycast(30));

        // Run the neural network
        //this.nn.RunNN();

        // Update the bibite's position and rotation from the neural network's outputs
        this.angle += /*this.nn.GetOutput(0) * */ delta * this.maxTurnSpeed;

        // Calculate the speed of the bibite
        var speed = /*this.nn.GetOutput(1) * */ delta * this.maxSpeed;

        // If speed is negative, halve it (Make backwards movement slower to encourage forward movement)
        if (speed < 0)
            speed /= 2;

        let newPos = this.worldPos.add(new PIXI.Point(Math.cos(this.angle * Math.PI / 180) * delta * speed, Math.sin(this.angle * Math.PI / 180) * delta * speed))
        world.updatePos(this, newPos)

        // Update the sprite
        this.UpdateSprite();         // TODO: This may be called automatically by the draw class
    }

    UpdateSprite() {

        // Set the sprite values
        this.sprite.x = this.worldPos.x;
        this.sprite.y = this.worldPos.y;
        //this.sprite.width = this.width;
        //this.sprite.height = this.height;
        this.sprite.angle = this.angle;
    }
}