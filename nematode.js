
/**
 * Bibite
 * 
 * A bibite is a creature that can see food and move towards it.
 * It has three eyes that can see food. The eyes are raycasted from the bibite's position.
 * The bibite has a neural network that takes the eye raycasts as inputs and outputs a rotation and speed.
 * The bibite moves in the direction of the rotation and at the speed.
 */

class Nematode {

    // Static variables
    static MAX_EYE_DISTANCE = 50;                           // The maximum distance that the eyes can see (in pixels)
    static MATURITY_AGE = 40;                               // The age at which the nematode can reproduce
    static PERCENTAGE_ENERGY_TO_REPRODUCE = 0.8;            // The percentage of energy that the nematode must have to reproduce
    static PERCENT_ENERGY_LOST_WHEN_REPRODUCING = 0.5;      // The percentage of energy that the nematode loses when reproducing

    // Constraints
    static SIZE_CONSTRAINT = { min: 5, max: 50 }            // The minimum and maximum size of the nematode (in pixels)

    // Initial value ranges
    static BASE_SIZE_RANGE = { min: 5, max: 15 }
    static GROW_RATE_RANGE = { min: 0.05, max: 0.08 }

    // Mutation rates
    static BASE_SIZE_THRESHOLD = 0.1;
    static GROW_RATE_THRESHOLD = 0.1;
    
    // Instead of multiple constructors, use a single constructor that can take a position, a parent nematode, or nothing
    constructor(arg1) {

        // No arguments provided, create a random nematode
        if (arg1 === undefined) {

          this.CreateRandomNematode();

        } 
        // PIXI.Point argument provided for position (Create a random nematode at the position)
        else if (arg1 instanceof PIXI.Point) {

          this.CreateRandomNematode(arg1);
          this.SetPos(arg1.x, arg1.y);  

        } 
        // Nematode argument provided to create a child of the parent nematode
        else if (arg1 instanceof Nematode) {

          this.CreateChildNematode(arg1);
        }

        // TODO: Add a constructor that takes a json object as an argument to create a nematode from a saved state

        // Update the stats of the Nematode (to set the initial values)
        this.UpdateStats(0, 0)   
        
        // Initialize the energy of the Nematode to its maximum value
        this.energy = this.maxEnergy;

        // Tell the world that this bibite exists
        world.addNematode(this)         
    }

    /** Creates a random nematode (with random stats and position)
     *  Called in the constructor when no arguments are provided or when a position is provided
     */
    CreateRandomNematode() {

        // The age in seconds
        this.age = 0;

        this.exists = true;             // Nematodes exist by default
        this.alive = true;              // Nematodes are (hopefully) alive by default
        this.paralyzed = false;         // set flag to true to prevent nematode from moving

        this.nn = new NeatNN(5, 2)      // The brain of the Nematode

        this.CreateSpriteTemp();        // Create the sprite for the bibite

        // Set position and direction to random values
        this.direction = new PIXI.Point().RandomDirection();
        this.sprite.position = new PIXI.Point().RandomPosition(worldRadius);

        this.baseSize = Nematode.BASE_SIZE_RANGE.min + Math.random() * Nematode.BASE_SIZE_RANGE.max;  // The base size of the Nematode (in pixels)
        this.growRate = Nematode.GROW_RATE_RANGE.min + Math.random() * Nematode.GROW_RATE_RANGE.max;  // The rate at which the Nematode grows (in pixels per second)

        // Set the initial stats of the Nematode
        this.size = this.baseSize; 
        this.energy = -1;              // The energy of the Nematode Will be set to max in constructor (Needs to be set before UpdateStats is called)
    }

    /** Creates a child nematode from a parent
     *  Called in the constructor when a parent is provided
     *  @param {Nematode} parent The parent of the child
     */
    CreateChildNematode(parent) {

        // The age in seconds (always 0 for children)
        this.age = 0;  

        this.exists = true;             // Nematodes exist by default
        this.alive = true;              // Nematodes are (hopefully) alive by default
        this.paralyzed = false;         // set flag to true to prevent nematode from moving

        // Clone the parent's neural network and mutate it
        this.nn = parent.nn.Clone().Mutate();

        // Create the sprite for the bibite (Currently uses the same image as the parent)
        this.CreateSpriteTemp();        

        // Set position to the parent's position and give it a random direction
        this.direction = new PIXI.Point().RandomDirection();
        this.sprite.position = parent.sprite.position.clone();

        // Slighly randomize the stats to prevent clones from being identical
        this.baseSize = parent.baseSize + (Math.random() * Nematode.BASE_SIZE_THRESHOLD * 2 - Nematode.BASE_SIZE_THRESHOLD);
        this.growRate = parent.growRate + (Math.random() * Nematode.GROW_RATE_THRESHOLD * 2 - Nematode.GROW_RATE_THRESHOLD);

        // Set the initial stats of the Nematode
        this.size = this.baseSize; 
        this.energy = -1;              // The energy of the Nematode Will be set to max in constructor (Needs to be set before UpdateStats is called)
    }

    // Will be replaced with a call to a function that creates a sprite (hopefully in a separate file)
    CreateSpriteTemp() {
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

    /** Update the bibite
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
        const rotate = this.nn.GetOutput(0) * this.maxTurnSpeed * delta;
        let   speed  = this.nn.GetOutput(1) * this.maxSpeed     * delta;

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
        let energyLoss = 1;                                     // Initial energy loss is 1 per second
        energyLoss += Math.abs(speed ) / this.maxSpeed;         // Multiply energy loss by the ratio of the speed to the max speed
        energyLoss += this.nn.GetPenalty();                     // Multiply energy loss by the penalty of the neural network
        energyLoss *= 1 + this.age / 300;                       // Multiply energy loss by the ratio of the age to a constant
        this.energy -= energyLoss * delta;                      // Decrease the energy by the energy loss

        // Clamp the size
        this.size = Math.min(Math.max(this.size, Nematode.SIZE_CONSTRAINT.min), Nematode.SIZE_CONSTRAINT.max);

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
        if (Raycast(raycastResult, this.sprite.x, this.sprite.y, dirX, dirY, Nematode.MAX_EYE_DISTANCE, world.drawEyeRays)){

            // If the raycast is close enough to the food, eat it
            if (raycastResult.GetDistance() < this.size / 2) 
                this.OnEat(raycastResult.GetHitObject());

            // Return the ratio of the distance to the closest food to the max distance
            return (1 - raycastResult.GetDistance() / Nematode.MAX_EYE_DISTANCE);
        }
        // Return -1 if no food is found
        return -1;
    }

    // ------------------- Drawing ------------------- //

    /* Draws the nematodes stats to the given graphics object
    *  @param {PIXI.Graphics} graphics - The graphics object to draw to
    */
    DrawStats(graphics) {
        
        var width = 300;
        var height = 380;
        var xPos = app.screen.width - width - 10;       // Left padding
        var yPos = 30 + 200;                            // Top padding + the height of the nn drawing
      
        // Draw the background
        graphics.beginFill(0x000000, 0.5);
        graphics.drawRoundedRect(xPos, yPos, width, height);
      
        // Create a text object to draw the stats
        var text = new PIXI.Text("Nematode Stats", {fontFamily : 'Arial', fontSize: 20, fontWeight: 'bold', fill : 0xffffff, align : 'left'});
        text.position.set(xPos + 25, yPos + 10);
        graphics.addChild(text);
      
        // Draw the stats
        var statsText = new PIXI.Text("", {fontFamily : 'Arial', fontSize: 16, fill : 0xffffff, align : 'left', lineHeight: 20});
        statsText.position.set(xPos + 30, yPos + 50);
        graphics.addChild(statsText);
        statsText.text += "Age: " + this.age.toFixed(2) + "s\n";
        statsText.text += "Energy: " + this.energy.toFixed(2) + " / " + this.maxEnergy.toFixed(2) + "\n";
        statsText.text += "\n";
        statsText.text += "Max Speed: " + this.maxSpeed.toFixed(2) + " pixels/s\n";
        statsText.text += "Turn Speed: " + this.maxTurnSpeed.toFixed(2) + "\n";
        statsText.text += "\n";
        statsText.text += "Size: " + this.size.toFixed(2) + " pixels\n";
        statsText.text += "Grow Rate: " + this.growRate.toFixed(2) + " pixels/s\n";
        statsText.text += "\n";
        statsText.text += "Energy Consumption: \n";
        statsText.text += "  Existence: " + 1 + " energy/s\n";
        statsText.text += "  Movement: " + (Math.abs(this.nn.GetOutput(1) * this.maxSpeed ) / this.maxSpeed).toFixed(3) + " energy/s\n";
        statsText.text += "  NN Penalty: " + this.nn.GetPenalty().toFixed(3) + " energy/s\n";
        statsText.text += "  Age: " + (1 + this.age / 300).toFixed(3) + " times the normal rate\n";
        statsText.text += "\n";
        statsText.text += "Tint: " + this.sprite.tint.toString(16) + "\n";
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

    /* Called when the Nematode touches a food object
    *  Eats the food gaining energy and reproduces if it has enough energy
    *  @param {Food} food - The food object that the Nematode touched
    */
    OnEat(food){
        this.energy += food.Eat();

        // Clamp the energy to the max energy
        this.energy = Math.min(this.energy, this.maxEnergy);

        // If the bibite is old enough and has enough energy, have a child (give it the parent to copy the stats from)
        if (this.age >= Nematode.MATURITY_AGE && this.energy > this.maxEnergy * Nematode.PERCENTAGE_ENERGY_TO_REPRODUCE){
            this.energy -= this.maxEnergy * Nematode.PERCENT_ENERGY_LOST_WHEN_REPRODUCING;
            new Nematode(this);
        }
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
        
        // Make nematodes fade out
        if (this.timeSinceDeath > 10){
            this.sprite.alpha = Math.max(0, this.sprite.alpha - delta * 0.5);
        }

        // Remove the nematode from the world after 10 seconds
        if (this.timeSinceDeath > 20) {
            // Remove the nematode from the world
            world.destroyNematode(this);

            // Set the nematode to not exist
            this.exists = false;

            // Clean un the neural network
            this.nn.Destroy();
            this.nn = null;
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

