
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
    
    constructor() {

        // Is the bibite still alive?
        this.alive = true;

        // The brain
        this.nn = new NeatNN(5, 2)                  // The neural network of the Nematode

        // The body
        this.age = 0;                               // The age in seconds
        this.energy = 30 + Math.random() * 60;      // The energy of the Nematode
        
        // The size (TODO: Will be updated when the nematodes sprites are finished)
        this.size  =      5 + Math.random() * 10;   // The size of the Nematode (in pixels) (Randomly chosen between 5 and 15)
        this.growRate = .05 + Math.random() * .1;   // The rate at which the Nematode grows (in pixels per second)

        // The movement
        this.maxSpeed = -1;                          // The maximum speed of the Nematode (set in Update) (in pixels per second) 
        this.maxTurnSpeed = 120;                    // The maximum turn speed of the Nematode (in degrees per second)


        // The direction (normalized)
        this.direction = new PIXI.Point(1,0).rotate(Math.random()*360)

        // Create a sprite to draw (Image stolen for convenience) TODO: Replace with own image
        this.sprite = PIXI.Sprite.from('Bibite.png');
        // Set the pivot point to the center of the bibite
        this.sprite.anchor.set(0.5);

        // the position of this nematode in the world is maintained by its sprite position
        this.sprite.position = new PIXI.Point(Math.random() * 500 - 250, Math.random() * 500 - 250)

        // random color tint for sprite
        this.baseColor = Math.round(Math.random() * 0xFFFFFF)
        this.sprite.tint = this.baseColor

        // set flag to true to prevent nematode from moving
        this.paralyzed = false
        
        // Tell the world that this bibite exists
        world.addNematode(this)

        // make nematodes draggable
        createDragAction(this.sprite, this.sprite,
            (x,y) => this.paralyzed = true,
            (dx,dy) => world.updateNematodePosition(this, this.GetX()+dx, this.GetY()+dy),
            (x,y) => this.paralyzed = false
        )
    }

    /*
    * Update the bibite
    * 
    * @param {number} delta - The time since the last update in seconds
    */
    Update(delta) {
        
        // If the bibite is dead, run the death animation and return
        if (!this.alive) {
            this.DeathAnimation(delta);
            return;
        }

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

        // If speed is negative, halve it (Make backwards movement slower to encourage forward movement)
        speed = (speed < 0) ? speed *= 0.5 : speed;

        // Prevent the bibite from moving if it is paralyzed
        if (!this.paralyzed) {
            // Update the bibite's rotation
            this.direction.rotate(rotate);

            // Update the bibite's position
            world.updateNematodePosition(this, this.GetX() + this.direction.x * speed, this.GetY() + this.direction.y * speed);
        }

        // Increase the age of the bibite (in seconds)
        this.age += delta;

        // Increase the size of the bibite and set the max speed to adjust for the new size
        this.size += this.growRate * delta;
        this.maxSpeed = 40 + 200 / this.size;                   // size must be greater than 0

        // Decrease the energy of the bibite
        var energyLoss = 1;                                     // Initial energy loss is 1 per second
        energyLoss += Math.abs(speed ) / this.maxSpeed;         // Multiply energy loss by the ratio of the speed to the max speed
        energyLoss += this.nn.GetPenalty();                     // Multiply energy loss by the penalty of the neural network
        energyLoss *= 1 + this.age / 300;                       // Multiply energy loss by the ratio of the age to a constant
        this.energy -= energyLoss * delta;                      // Decrease the energy by the energy loss

        // update sprite
        this.sprite.width = this.size
        this.sprite.height = this.size
        this.sprite.angle = this.direction.getAngle()

        // If the bibite has no energy, kill it
        if (this.energy <= 0) {
            this.OnDeath();
        }
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
        if (Raycast(raycastResult, this.sprite.x, this.sprite.y, dirX, dirY, maxSeeDistance, drawEyeRays)){

            if (raycastResult.GetHitObject() == undefined)
                console.log(raycastResult.GetHitObject())

            // If the raycast is close enough to the food, eat it
            if (raycastResult.GetDistance() < this.size / 2) 
                this.energy += raycastResult.GetHitObject().Eat();
            
            // Return the ratio of the distance to the closest food to the max distance
            return (1 - raycastResult.GetDistance() / maxSeeDistance);
        }

        // Return -1 if no food is found
        return -1;
    }

    // ------------------- Drawing ------------------- //

    /* Draws the nematodes stats to the given graphics object
    *  @param {PIXI.Graphics} graphics - The graphics object to draw to
    *  @param {number} xPos - The x position to draw the stats at (top left)
    *  @param {number} yPos - The y position to draw the stats at (top left)
    */
    DrawStats(graphics) {

        var xPos = 10;          // Left padding
        var yPos = 30 + 200;    // Top padding + the height of the nn drawing
        var width = 300;
        var height = 200;

        // Draw the background
        graphics.beginFill(0x000000, 0.5);
        graphics.drawRoundedRect(xPos, yPos, width, height);

        // Create a text object to draw the stats
        var text = new PIXI.Text("PIE", {fontFamily : 'Arial', fontSize: 15, fill : 0xffffff, align : 'left'});
        
        // Add the text to the graphics object
        graphics.addChild(text);

        // Set the position of the text
        text.position.set(xPos + 10, yPos + 10);

        // Draw the stats
        text.text = "Nematode Stats:";
        text.text += "\n";
        text.text += "\nAge: " + this.age.toFixed(2) + "s";
        text.text += "\nEnergy: " + this.energy.toFixed(2);
        text.text += "\n";
        text.text += "\nSpeed: " + this.maxSpeed.toFixed(2);
        text.text += "\nTurn Speed: " + this.maxTurnSpeed.toFixed(2);
        text.text += "\nSize: " + this.size.toFixed(2) + " pixels";
        text.text += "\n";
        text.text += "\nPenalty: " + this.nn.GetPenalty().toFixed(3) + " energy/s";
        text.text += "\nTint: " + this.sprite.tint.toString(16);

    }

    // ------------------- Events ------------------- //

    /* Called when the nematode dies
    */
    OnDeath() {

        // Keep track of how long the nematode has been dead
        this.timeSinceDeath = 0;

        // Set the nematode to be dead
        this.alive = false
    }

    // ------------------- Animations ------------------- //

    /** Called in Update() when the nematode is dead
     *  Used to animate the death of the nematode
     */
    DeathAnimation(delta) {

        // Increase the time since death
        this.timeSinceDeath += delta;

        // Turn the nematode red slowly
        if (this.sprite.tint != 0xFF0000){
            var tint = this.sprite.tint;

            // Get the red, green, and blue components of the tint
            var r = (tint >> 16) & 0xFF;
            var g = (tint >> 8) & 0xFF;
            var b = tint & 0xFF;

            // Increase the red component and decrease the green and blue components
            r = Math.min(255, r + delta * 30);
            g = Math.max(0, g - delta * 30);
            b = Math.max(0, b - delta * 30);

            // Set the new tint
            this.sprite.tint = (r << 16) + (g << 8) + b;
        }

        // Remove the nematode from the world after 10 seconds
        if (this.timeSinceDeath > 10) {
            // Remove the nematode from the world
            world.destroyNematode(this);
        }
    }

    // ------------------- GETTERS AND SETTERS ------------------- //

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

