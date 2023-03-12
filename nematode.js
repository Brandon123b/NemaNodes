
/**
 * Bibite
 * 
 * A bibite is a creature that can see food and move towards it.
 * It has three eyes that can see food. The eyes are raycasted from the bibite's position.
 * The bibite has a neural network that takes the eye raycasts as inputs and outputs a rotation and speed.
 * The bibite moves in the direction of the rotation and at the speed.
 */

// A static variable to keep track of nematode variables
var NematodeVars = {
    maxSeeDistance: 50,
    maxSize: 100,
    minSize: 10,
    maturityAge: 40         // The age at which the bibite can reproduce
}


// DEBUG: Should the eye rays be drawn?
var drawEyeRays = false;

class Nematode {
    
    // If createNew is false, the bibite is being created from a parent
    constructor(createNew = true) {

        this.alive = true;              // Nematodes are (hopefully) alive by default
        this.paralyzed = false;          // set flag to true to prevent nematode from moving

        // If the bibite is not being created from a parent, return
        if (!createNew) 
            return;

        this.nn = new NeatNN(5, 2)      // The brain of the Nematode

        {   // TODO: Update the bibite's sprite(s) and color by calling a new function (or something) when implementing

            // Create a sprite to draw (Image stolen for convenience) TODO: Replace with own image
            this.sprite = PIXI.Sprite.from('Bibite.png');
            // Set the pivot point to the center of the bibite
            this.sprite.anchor.set(0.5);

            // random color tint for sprite
            this.baseColor = Math.round(Math.random() * 0xFFFFFF)
            this.sprite.tint = this.baseColor

            // make nematodes draggable
            createDragAction(this.sprite, this.sprite,
                (x,y) => this.paralyzed = true,
                (dx,dy) => world.updateNematodePosition(this, this.GetX()+dx, this.GetY()+dy),
                (x,y) => this.paralyzed = false
            )
        }

        // Set position and direction to random values
        this.direction = new PIXI.Point().RandomDirection();
        this.sprite.position = new PIXI.Point().RandomPosition(500);

        this.SetInitialStats();         // Set the initial stats of the bibite
        
        world.addNematode(this)         // Tell the world that this bibite exists

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

        // Update the stats of the bibite
        this.UpdateStats(delta, speed);    

        // Prevent the bibite from moving if it is paralyzed
        if (!this.paralyzed) {

            // Update the bibite's rotation
            this.direction.rotate(rotate);

            // Update the bibite's position
            world.updateNematodePosition(this, this.GetX() + this.direction.x * speed, this.GetY() + this.direction.y * speed);
        }

        // If the bibite has no energy, kill it
        if (this.energy <= 0) {
            this.OnDeath();
        }
    }

    /** Sets the initial stats of the nematode
     *  If no parameters are given, the stats are set to random values
     * 
     * TODO: The size and grow rate should be updated when the sprite is changed
     * 
     * @param {*} energy The energy of the Nematode
     * @param {*} size The size of the Nematode
     * @param {*} growRate The rate at which the Nematode grows
     */
    SetInitialStats(energy, size, growRate){

        // The age in seconds
        this.age = 0;  

        // Either set the stats to the given values or set them to random values
        if (energy != undefined){     
             
            // Slighly randomize the stats to prevent clones from being identical
            this.energy = energy;
            this.size = size / 2;
            this.growRate = growRate + Math.random() * .04 - .02;
        }
        else {

            this.energy = 30 + Math.random() * 40;      // The energy of the Nematode (Randomly chosen between 30 and 70)
            this.size  =      5 + Math.random() *  10;  // The size of the Nematode (in pixels) (Randomly chosen between 5 and 15)
            this.growRate = .05 + Math.random() * .08;  // The rate at which the Nematode grows (in pixels per second)
        }

        // Update the stats to set the max speed and max turn speed
        this.UpdateStats(0, 0);                            
    }

    /** Updates the stats of the Nematode
     * Called in Update()
     * 
     * @param {number} delta The time since the last update in seconds
     * @param {number} speed The speed of the Nematode
     */
    UpdateStats(delta, speed){

        // Increase the age of the bibite (in seconds)
        this.age += delta;

        // Increase the size of the bibite and set the max speed to adjust for the new size
        this.size += this.growRate * delta;
        this.maxSpeed = 20 + 400 / this.size;
        this.maxTurnSpeed = 100 + 960 / this.size;
        this.maxEnergy = 80 + this.size * 2;

        // Decrease the energy of the bibite
        var energyLoss = 1;                                     // Initial energy loss is 1 per second
        energyLoss += Math.abs(speed ) / this.maxSpeed;         // Multiply energy loss by the ratio of the speed to the max speed
        energyLoss += this.nn.GetPenalty();                     // Multiply energy loss by the penalty of the neural network
        energyLoss *= 1 + this.age / 300;                       // Multiply energy loss by the ratio of the age to a constant
        this.energy -= energyLoss * delta;                      // Decrease the energy by the energy loss

        // Clamp the size
        this.size = Math.min(Math.max(this.size, NematodeVars.minSize), NematodeVars.maxSize);

        // update sprite (TODO: Will be updated when the nematodes sprites are finished)
        this.sprite.width = this.size
        this.sprite.height = this.size
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
        if (Raycast(raycastResult, this.sprite.x, this.sprite.y, dirX, dirY, NematodeVars.maxSeeDistance, drawEyeRays)){

            if (raycastResult.GetHitObject() == undefined)
                console.log(raycastResult.GetHitObject())

            // If the raycast is close enough to the food, eat it
            if (raycastResult.GetDistance() < this.size / 2) 
                this.energy += raycastResult.GetHitObject().Eat();

                // Clamp the energy to the max energy
                this.energy = Math.min(this.energy, this.maxEnergy);

                // If the bibite is old enough and has enough energy, have a child
                if (this.age >= NematodeVars.maturityAge && this.energy > this.maxEnergy * .8)
                    this.OnHaveChild();
            
            // Return the ratio of the distance to the closest food to the max distance
            return (1 - raycastResult.GetDistance() / NematodeVars.maxSeeDistance);
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
        var height = 350;

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
        text.text += "\nEnergy: " + this.energy.toFixed(2) + " / " + this.maxEnergy.toFixed(2);
        text.text += "\n";
        text.text += "\nMax Speed: " + this.maxSpeed.toFixed(2) + " pixels/s";
        text.text += "\nTurn Speed: " + this.maxTurnSpeed.toFixed(2);
        text.text += "\n";
        text.text += "\nSize: " + this.size.toFixed(2) + " pixels";
        text.text += "\nGrow Rate: " + this.growRate.toFixed(2) + " pixels/s";
        text.text += "\n";
        text.text += "\nEnergy Consumption: ";
        text.text += "\n  Existance: " + 1 + " energy/s";
        text.text += "\n  Movement: " + (Math.abs(this.nn.GetOutput(1) * this.maxSpeed ) / this.maxSpeed).toFixed(3) + " energy/s";
        text.text += "\n  NN Penalty: " + this.nn.GetPenalty().toFixed(3) + " energy/s";
        text.text += "\n  Age: " + (1 + this.age / 300).toFixed(3) + " times the normal rate";
        text.text += "\n";
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

    /* Called when the nematode has a child
    *  This will create a new nematode with (nearly) the same stats as the parent
    */
    OnHaveChild() {

        this.energy *= .5;

        // Create a new nematode (false means it is not a random nematode)
        var child = new Nematode(false);

        // Clone the parent's neural network and mutate it
        child.nn = this.nn.Clone();
        child.nn.Mutate();

        {   // TODO: Remove this block when the nematode sprites are finished using some other method to set the color an sprite
            
            // Create a sprite to draw (Image stolen for convenience) TODO: Replace with own image
            child.sprite = PIXI.Sprite.from('Bibite.png');
            // Set the pivot point to the center of the bibite
            child.sprite.anchor.set(0.5);

            // the position of this nematode in the world is maintained by its sprite position
            child.sprite.position = this.sprite.position;

            // random color tint for sprite (TODO: replace with something better)
            child.baseColor = this.baseColor;
            child.sprite.tint = child.baseColor
            
            // make nematodes draggable
            createDragAction(child.sprite, child.sprite,
                (x,y) => child.paralyzed = true,
                (dx,dy) => world.updateNematodePosition(child, child.GetX()+dx, child.GetY()+dy),
                (x,y) => child.paralyzed = false
            )
        }
        
        // Set position to the parent's position and give it a random direction
        child.direction = new PIXI.Point().RandomDirection();
        child.sprite.position = new PIXI.Point(this.sprite.position.x, this.sprite.position.y);

        child.SetInitialStats(this.energy, this.size, this.growRate);

        // The direction (normalized)
        child.direction = new PIXI.Point(1,0).rotate(Math.random()*360)
        
        // Add the child to the list of nematodes
        world.addNematode(child);
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

