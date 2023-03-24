
/**
 * Nematode.js
 * 
 * A Nematode is a creature that can see food and move towards it.
 * It has three eyes that can see food. The eyes are raycasted from the Nematode's position.
 * The Nematode has a neural network that takes the eye raycasts as inputs and outputs a rotation and speed.
 * The Nematode moves in the direction of the rotation and at the speed.
 */

class Nematode {

    // Static variables
    static MAX_EYE_DISTANCE = 80;                           // The maximum distance that the eyes can see (in pixels)
    static MAX_SMELL_DISTANCE = 80;                         // The maximum distance that the smell can smell (in pixels)
    static PERCENTAGE_ENERGY_TO_REPRODUCE = 0.75;           // The percentage of energy that the nematode must have to reproduce
    static PERCENT_ENERGY_LOST_WHEN_REPRODUCING = 0.25;     // The percentage of energy that the nematode loses when reproducing
    static TIME_BETEWEEN_CHILDREN = 10;                     // The time between reproductions (in seconds)

    // Constraints
    static SIZE_CONSTRAINT = { min: 5, max: 50 }            // The minimum and maximum size of the nematode (in pixels)
    static GROW_RATE_CONSTRAINT = { min: 0.01, max: 0.1 }   // The minimum and maximum grow rate of the nematode (in pixels per second)

    // Initial value ranges
    static BASE_SIZE_RANGE = { min: 5,      max: 15 }
    static GROW_RATE_RANGE = { min: 0.03,   max: 0.05 }
    static MATURITY_RANGE  = { min: 30,     max: 50 }       // The age at which the nematode can reproduce

    // Mutation rates (as +/- up to this constant)
    static BASE_SIZE_THRESHOLD = 0.02;
    static GROW_RATE_THRESHOLD = 0.01;
    
    // ------------------------- Constructors ------------------------- //

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
        // Object argument provided to create a nematode from a saved state
        else if (arg1 instanceof Object) {
                
            this.CreateJsonNematode(arg1);

            // These are to avoid the nematode from gaining max energy when the game is loaded
            this.UpdateStats(0, 0);
            world.addNematode(this);
            return;
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

        this.nn = new NeatNN(7, 2)      // The brain of the Nematode

        this.CreateSpriteTemp();        // Create the sprite for the bibite

        // Set position and direction to random values
        this.direction = new PIXI.Point().RandomDirection();
        this.sprite.position = new PIXI.Point().RandomPosition(World.radius);

        this.size = // Sets to base size on next line
        this.baseSize = Nematode.BASE_SIZE_RANGE.min + Math.random() * (Nematode.BASE_SIZE_RANGE.max - Nematode.BASE_SIZE_RANGE.min);  // The base size of the Nematode (in pixels)
        this.growRate = Nematode.GROW_RATE_RANGE.min + Math.random() * (Nematode.GROW_RATE_RANGE.max - Nematode.GROW_RATE_RANGE.min);  // The rate at which the Nematode grows (in pixels per second)
        this.childTime = Nematode.MATURITY_RANGE.min + Math.random() * (Nematode.MATURITY_RANGE.max - Nematode.MATURITY_RANGE.min);    // The age at which the Nematode can reproduce (in seconds)

        this.energy = -1;              // The energy of the Nematode Will be set to max in constructor (Needs to be set before UpdateStats is called)
        this.speed = 0;                // The speed of the Nematode (Set in SlowUpdate)
        this.rotate = 0;               // The rotation of the Nematode (Set in SlowUpdate)
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
        this.size = // Sets to base size on next line
        this.baseSize = parent.baseSize + (Math.random() - .5) * Nematode.BASE_SIZE_THRESHOLD;
        this.growRate = parent.growRate + (Math.random() - .5) * Nematode.GROW_RATE_THRESHOLD;
        this.childTime = Nematode.MATURITY_RANGE.min + Math.random() * (Nematode.MATURITY_RANGE.max - Nematode.MATURITY_RANGE.min);  // The age at which the Nematode can reproduce (in seconds)

        this.energy = -1;              // The energy of the Nematode Will be set to max in constructor (Needs to be set before UpdateStats is called)
    }

    /* Creates a nematode from a json object
     * Called in the constructor when a json object is provided
     * @param {Object} json The json object to create the nematode from
     */
    CreateJsonNematode(json) {
            
        // The age in seconds
        this.age = json.age;

        this.exists = true;             // Nematodes exist by default
        this.alive = json.alive;        // Nematodes are (hopefully) alive by default
        this.paralyzed = false;         // set flag to true to prevent nematode from moving

        this.nn = NeatNN.fromJson(json.nn) // The brain of the Nematode

        this.CreateSpriteTemp();        // Create the sprite for the bibite

        // Set position and direction to random values
        this.direction = new PIXI.Point(json.dir.x, json.dir.y);
        this.sprite.position = new PIXI.Point(json.pos.x, json.pos.y);

        this.size = json.size;          // The size of the Nematode (in pixels)
        this.baseSize = json.baseSize;  // The base size of the Nematode (in pixels)
        this.growRate = json.growRate;  // The rate at which the Nematode grows (in pixels per second)
        this.childTime = json.childTime;// The age at which the Nematode can reproduce (in seconds)

        this.energy = json.energy;      // The energy of the Nematode Will be set to max in constructor (Needs to be set before UpdateStats is called)
        this.speed = json.speed;        // The speed of the Nematode (Set in SlowUpdate)
        this.rotate = json.rotate;      // The rotation of the Nematode (Set in SlowUpdate)
    }

    // ------------------------------------ Update Functions ------------------------------------ //

    /* Update the nematode, but only called every x frames (x = Nematode.SLOW_UPDATE_RATE)
    */
    SlowUpdate(){

        // Return if the nematode is dead
        if (!this.alive) return;

        // Get all the food in the world (for the eye raycasts)
        var foodList = world.getFoodAt(this.sprite.x, this.sprite.y, Nematode.MAX_EYE_DISTANCE * 1.1);

        // Set the neural network inputs from the eye raycasts
        this.nn.SetInput(0, this.EyeRaycast(foodList, -25));
        this.nn.SetInput(1, this.EyeRaycast(foodList, 0));
        this.nn.SetInput(2, this.EyeRaycast(foodList, 25));
        this.nn.SetInput(3, this.age / 200 - 1);                                    // Range from -1 to 1 (400sec == 1)
        this.nn.SetInput(4, this.energy / this.maxEnergy);                          // Range from  0 to 1
        this.nn.SetInput(5, DistFromOrigin(this.sprite.position) / World.radius);   // Range from  0 to 1
        this.nn.SetInput(6, this.SmellArea(foodList));                              // Range from -1 to 1

        // Run the neural network
        this.nn.RunNN();
        
        // Set the rotate and speed variables from the neural network outputs
        this.rotate = this.nn.GetOutput(0) * this.maxTurnSpeed;
        this.speed  = this.nn.GetOutput(1) * this.maxSpeed;

        // If speed is negative, halve it (Make backwards movement slower to encourage forward movement)
        this.speed = (this.speed < 0) ? this.speed * 0.5 : this.speed;
    }

    /** Update the Nematodes
    * 
    * @param {number} delta - The time since the last update in seconds
    */
    Update(delta) {

        // If the Nematodes is dead, run the death animation and return
        if (!this.alive) {
            this.DeathAnimation(delta);
            return;
        }

        // Update the stats of the Nematodes
        this.UpdateStats(delta);    

        // Prevent the Nematodes from moving if it is paralyzed
        if (!this.paralyzed) {

            // Update the Nematodes's rotation
            this.direction.rotate(this.rotate * delta);

            // Update the Nematodes's position
            world.updateNematodePosition(this,  this.GetX() + this.direction.x * this.speed * delta, 
                                                this.GetY() + this.direction.y * this.speed * delta);
        }

        // If the Nematodes has no energy, kill it
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
    UpdateStats(delta){

        // Increase the age of the bibite (in seconds)
        this.age += delta;
        this.childTime -= delta;

        // Increase the size of the bibite and set the max speed to adjust for the new size
        this.size += this.growRate * delta;
        this.maxSpeed = 20 + 400 / this.size;
        this.maxTurnSpeed = 100 + 960 / this.size;
        this.maxEnergy = 80 + this.size * 2;

        // Decrease the energy of the bibite
        let energyLoss = 1;                                     // Initial energy loss is 1 per second
        energyLoss += Math.abs(this.speed) / this.maxSpeed;     // Multiply energy loss by the ratio of the speed to the max speed
        energyLoss *= 1 + this.age / 300;                       // Multiply energy loss by the ratio of the age to a constant
        this.energy -= energyLoss * delta;                      // Decrease the energy by the energy loss
        
        // Clamp the values
        this.size = Math.min(Math.max(this.size, Nematode.SIZE_CONSTRAINT.min), Nematode.SIZE_CONSTRAINT.max);
        this.growRate = Math.min(Math.max(this.growRate, Nematode.GROW_RATE_CONSTRAINT.min), Nematode.GROW_RATE_CONSTRAINT.max);

        // update sprite (TODO: Will be updated when the nematodes sprites are finished)
        this.sprite.width = this.size
        this.sprite.height = this.size
        this.sprite.angle = this.direction.getAngle()
    }

    // ---------------------- Sensor Functions ---------------------- //

    // Returns the ratio of the distance to the closest food to the max distance
    // Returns -1 if no food is found
    EyeRaycast(foodList, angleFromMiddle) {
        // Create a raycast result object
        var raycastResult = new RaycastResult2D();

        // Calculate the angle of the sight line in radians
        var theta = (this.direction.getAngle() + angleFromMiddle) * Math.PI / 180;

        // Get the direction of the sight line
        var dir = new PIXI.Point(Math.cos(theta), Math.sin(theta));

        // Send the raycast
        if (Raycast(raycastResult, this.sprite.position, dir, Nematode.MAX_EYE_DISTANCE, foodList)){

            // If the raycast is close enough to the food, eat it
            if (raycastResult.GetDistance() < this.size / 2)
                this.OnEat(raycastResult.GetHitObject());

            // Return the ratio of the distance to the closest food to the max distance
            return (1 - raycastResult.GetDistance() / Nematode.MAX_EYE_DISTANCE);
        }
        // Return -1 if no food is found
        return -1;
    }

    /* Returns the general amount of food in the area
    *  The closer the food is to the Nematode, the more it will be counted
    *  The return value will be 1 if there are 4 pieces of food directly on the Nematode
    *  The return value will be -1 if there is no food in the area    
    *  @param {Circle array} foodList - The list of food to check
    * 
    * WARNING: This function currently takes the same array of food as the EyeRaycast function (so MaxEyeDistance is used for inputs)
    */
    SmellArea(foodList) {

        // Default return value
        var totalSmell = -1;

        // Loop through all the food
        for (var i = 0; i < foodList.length; i++) {

            // Ignore food that does not want to be seen
            if (foodList[i].ignoreRaycast) continue;

            // Get the distance to the food
            var distance = this.sprite.position.Dist(foodList[i].GetPosition());

            // If the food is close enough to smell
            if (distance < Nematode.MAX_SMELL_DISTANCE) {

                // Calculate the smell value of the food (The max smell value per food is 0.5)
                var smell = (1 - distance / Nematode.MAX_SMELL_DISTANCE) / 2; 

                // Add the smell value to the total
                totalSmell += smell;
            }
        }

        // Return the total smell (-1 to 1)
        return Math.min(1, totalSmell);
    }

    // ------------------- Drawing ------------------- //

    /* Draws the nematodes stats to the given graphics object
    *  @param {PIXI.Graphics} graphics - The graphics object to draw to
    */
    DrawStats(NematodeStatsMenu) {

        NematodeStatsMenu.statsText.text  = "Age: " + this.age.toFixed(2) + "s\n";
        NematodeStatsMenu.statsText.text += "Energy: " + this.energy.toFixed(2) + " / " + this.maxEnergy.toFixed(2) + "\n";
        NematodeStatsMenu.statsText.text += "\n";
        NematodeStatsMenu.statsText.text += "Max Speed: " + this.maxSpeed.toFixed(2) + " pixels/s\n";
        NematodeStatsMenu.statsText.text += "Turn Speed: " + this.maxTurnSpeed.toFixed(2) + "\n";
        NematodeStatsMenu.statsText.text += "\n";
        NematodeStatsMenu.statsText.text += "Size: " + this.size.toFixed(2) + " pixels\n";
        NematodeStatsMenu.statsText.text += "Base Size: " + this.baseSize.toFixed(2) + " pixels\n";
        NematodeStatsMenu.statsText.text += "Grow Rate: " + this.growRate.toFixed(2) + " pixels/s\n";
        NematodeStatsMenu.statsText.text += "\n";
        NematodeStatsMenu.statsText.text += "Energy Consumption: \n";
        NematodeStatsMenu.statsText.text += "  Existence: " + 1 + " energy/s\n";
        NematodeStatsMenu.statsText.text += "  Movement: " + (Math.abs(this.speed ) / this.maxSpeed).toFixed(3) + " energy/s\n";
        NematodeStatsMenu.statsText.text += "  NN Penalty: " + this.nn.GetPenalty().toFixed(3) + " energy/s\n";
        NematodeStatsMenu.statsText.text += "  Age: " + (1 + this.age / 300).toFixed(3) + " times the normal rate\n";
        NematodeStatsMenu.statsText.text += "\n";
        NematodeStatsMenu.statsText.text += "Tint: " + this.sprite.tint.toString(16) + "\n";
        NematodeStatsMenu.statsText.text += "Time for next child: " + (this.childTime).toFixed(2) + "s\n";
    }

    // ------------------- Events ------------------- //

    /* Called when the nematode dies
    */
    OnDeath() {

        // Keep track of how long the nematode has been dead
        this.timeSinceDeath = 0;

        // Set the nematode to be dead
        this.alive = false

        // Spawn food at the nematode's position
        Food.SpawnNematodeDeathFood(this.sprite.position, this.size);
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
        if (this.childTime <= 0 && this.energy > this.maxEnergy * Nematode.PERCENTAGE_ENERGY_TO_REPRODUCE){
            this.childTime = Nematode.TIME_BETEWEEN_CHILDREN;                                // Reset the child time
            this.energy -= this.maxEnergy * Nematode.PERCENT_ENERGY_LOST_WHEN_REPRODUCING;  // Lose energy when reproducing
            new Nematode(this);                                                             // Create a new Nematode child
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
        if (this.timeSinceDeath > 14) {
            // Remove the nematode from the world
            world.destroyNematode(this);

            // Set the nematode to not exist
            this.exists = false;

            // Clean un the neural network
            this.nn.Destroy();
            this.nn = null;
        }
    }

    // ------------------- OTHER ------------------- //

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
            (x,y) => this.paralyzed = world.draggableObjects,
            (dx,dy) => { if (world.draggableObjects) world.updateNematodePosition(this, this.GetX()+dx, this.GetY()+dy) },
            (x,y) => this.paralyzed = false
        )
    }

    toJson() {
        return {
            age: this.age,
            alive: this.alive,
            nn: this.nn.toJson(),
            pos: {x: this.GetX(), y: this.GetY()},
            dir: {x: this.direction.x, y: this.direction.y},
            size: this.size,
            baseSize: this.baseSize,
            growRate: this.growRate,
            childTime: this.childTime,
            maxEnergy: this.maxEnergy,
            energy: this.energy,
            speed: this.speed,
            rotate: this.rotate,
            maxEnergy: this.maxEnergy
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

