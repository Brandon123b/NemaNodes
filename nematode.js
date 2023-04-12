
/**
 * Nematode.js
 * 
 * A Nematode is a creature that can see food and move towards it.
 * It has three eyes that can see food. The eyes are raycasted from the Nematode's position.
 * The Nematode has a neural network that takes the eye raycasts as inputs and outputs a rotation and speed.
 * The Nematode moves in the direction of the rotation and at the speed.
 */

class Nematode {

    // Sensor constants
    static MAX_EYE_DISTANCE = 80;                           // The maximum distance that the eyes can see (in pixels)
    static MAX_SMELL_DISTANCE = 80;                         // The maximum distance that the smell can smell (in pixels)
    static MAX_BITE_DISTANCE = 10;                          // The maximum distance that the bite can bite (in pixels)

    // Nematode constants
    static PERCENTAGE_ENERGY_TO_REPRODUCE = 0.75;           // The percentage of energy that the nematode must have to reproduce
    static PERCENT_ENERGY_LOST_WHEN_REPRODUCING = 0.25;     // The percentage of energy that the nematode loses when reproducing
    static TIME_BETEWEEN_CHILDREN = 10;                     // The time between reproductions (in seconds)
    
    // Bite constants
    static ENERGY_LOST_WHEN_BITING = 5;                     // The amount of energy that the nematode loses when biting (in energy units)
    static ENERGY_LOST_WHEN_BITTEN = 20;                    // The amount of energy that the nematode loses when getting bit (will me multiplied by the size ratio) (in energy units)
    static KNOCKBACK_POWER = 100;                           // The amount of knockback that the nematode gets when getting bit (in pixels)
    static BITE_COOLDOWN = 1;                               // The time between bites (in seconds)

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

    // all possible input neurons
    static INPUT_LABELS = [
        "left food eye",
        "mid food eye",
        "right food eye",
        "left nematode eye",
        "mid nematode eye",
        "right rematode eye",
        "food smell",
        "nematode smell",
        "age",
        "energy",
        "dist from center"
    ]

    // all possible output neurons
    static OUTPUT_LABELS = [
        "turn speed",
        "move speed",
        "bite"
    ]
    
    // ------------------------- Constructors ------------------------- //

    /* Instead of multiple constructors, use a single constructor that can take a position, a parent nematode, or nothing */
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
            this.biteCooldown = 0;          // The time until the nematode can bite again (in seconds)
            world.add(this);

            return;
        }

        // Update the stats of the Nematode (to set the initial values)
        this.UpdateStats(0, 0)   
        
        // Initialize the energy of the Nematode to its maximum value
        this.energy = this.maxEnergy;

        // Create minor vars
        this.biteCooldown = 0;          // The time until the nematode can bite again (in seconds)

        // Tell the world that this bibite exists
        world.add(this)
    }

    /* Creates a random nematode (with random stats and position)
     *  Called in the constructor when no arguments are provided or when a position is provided
     */
    CreateRandomNematode() {

        // The age in seconds
        this.age = 0;
        this.generation = 0;

        this.exists = true;             // Nematodes exist by default
        this.alive = true;              // Nematodes are (hopefully) alive by default
        this.paralyzed = false;         // set flag to true to prevent nematode from moving

        this.nn = new NeatNN(11, 3)      // The brain of the Nematode

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

    /* Creates a child nematode from a parent
     *  Called in the constructor when a parent is provided
     *  @param {Nematode} parent The parent of the child
     */
    CreateChildNematode(parent) {

        // The age in seconds (always 0 for children)
        this.age = 0;  
        this.generation = parent.generation + 1

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
        this.speed = 0;                // The speed of the Nematode (Set in SlowUpdate)
        this.rotate = 0;               // The rotation of the Nematode (Set in SlowUpdate)
    }

    /* Creates a nematode from a json object
     * Called in the constructor when a json object is provided
     * @param {Object} json The json object to create the nematode from
     */
    CreateJsonNematode(json) {
            
        // The age in seconds
        this.age = json.age;
        this.generation = json.generation; // Number of ancestors this nematode has

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

    /* Update the nematode, but only called every x frames (x = Nematode.SLOW_UPDATE_RATE) */
    SlowUpdate(){

        // Return if the nematode is dead
        if (!this.alive) return;

        // Get all the food in the world (for the eye raycasts)
        var foodList = world.getFoodAt(this.sprite.x, this.sprite.y, Nematode.MAX_EYE_DISTANCE * 1.1);

        // Get all the nematodes in the world (for the eye raycasts)
        var nematodeList = world.getNematodesAt(this.sprite.x, this.sprite.y, Nematode.MAX_EYE_DISTANCE * 1.1);

        // Set the neural network inputs from the eye raycasts
        this.nn.SetInput(0, this.EyeRaycast(foodList, -25));
        this.nn.SetInput(1, this.EyeRaycast(foodList, 0));
        this.nn.SetInput(2, this.EyeRaycast(foodList, 25));
        this.nn.SetInput(3, this.EyeRaycast(nematodeList, -25, false));
        this.nn.SetInput(4, this.EyeRaycast(nematodeList, 0, false));
        this.nn.SetInput(5, this.EyeRaycast(nematodeList, 25, false));
        this.nn.SetInput(6, this.SmellArea(foodList));                              // Range from -1 to 1
        this.nn.SetInput(7, this.SmellArea(nematodeList));                          // Range from -1 to 1
        this.nn.SetInput(8, this.age / 200 - 1);                                    // Range from -1 to 1 (400sec == 1)
        this.nn.SetInput(9, this.energy / this.maxEnergy);                          // Range from  0 to 1
        this.nn.SetInput(10, DistFromOrigin(this.sprite.position) / World.radius);  // Range from  0 to 1

        // Run the neural network
        this.nn.RunNN();
        
        // Set the rotate and speed variables from the neural network outputs
        this.rotate = this.nn.GetOutput(0) * this.maxTurnSpeed;
        this.speed  = this.nn.GetOutput(1) * this.maxSpeed;
        // Output 2 is used for Biting in OnBite (Called from EyeRaycast)

        // If speed is negative, halve it (Make backwards movement slower to encourage forward movement)
        this.speed = (this.speed < 0) ? this.speed * 0.5 : this.speed;
    }

    /* Update the Nematodes
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
            world.updatePosition(this,  this.GetX() + this.direction.x * this.speed * delta, 
                                this.GetY() + this.direction.y * this.speed * delta);

            // If the nematode has knockback, apply it
            if (this.knockbackDirection != undefined)
                this.KnockbackAnimation(delta);
        }

        // If the Nematodes has no energy, kill it
        if (this.energy <= 0) {
            this.OnDeath();
        }
    }

    /* Updates the stats of the Nematode
     * Called in Update()
     * 
     * @param {number} delta The time since the last update in seconds
     * @param {number} speed The speed of the Nematode
     */
    UpdateStats(delta){

        // Increase the age of the bibite (in seconds)
        this.age += delta;
        this.childTime -= delta;
        if (this.biteCooldown > 0) this.biteCooldown -= delta;

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

    /* Returns the ratio of the distance to the closest food to the max distance
    *  Returns -1 if no food is found
    */
    EyeRaycast(foodList, angleFromMiddle, isFood = true) {
        // Create a raycast result object
        var raycastResult = new RaycastResult2D();

        // Calculate the angle of the sight line in radians
        var theta = (this.direction.getAngle() + angleFromMiddle) * Math.PI / 180;

        // Get the direction of the sight line
        var dir = new PIXI.Point(Math.cos(theta), Math.sin(theta));

        // Send the raycast
        if (Raycast(raycastResult, this.sprite.position, dir, Nematode.MAX_EYE_DISTANCE, foodList)){

            // If the raycast is close enough to the food, eat it
            if (isFood && raycastResult.GetDistance() < this.size / 2)
                this.OnEat(raycastResult.GetHitObject());
            
            // If the raycast is close enough to the nematode, bite it
            else if (!isFood && raycastResult.GetDistance() < this.size / 2 + Nematode.MAX_BITE_DISTANCE)
                this.OnBite(raycastResult.GetHitObject());

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

    // ------------------- Events ------------------- //

    /* Called when the nematode dies
    */
    OnDeath() {

        // Keep track of how long the nematode has been dead
        this.timeSinceDeath = 0;

        // Set the nematode to be dead
        this.alive = false;

        // Set the sprite to be ignored by raycasts
        this.ignoreRaycast = true;

        // Spawn food at the nematode's position
        Food.SpawnNematodeDeathFood(this.sprite.position, this.size);

        // If we are training, add the nematode to the training data
        if (NematodeTrainer.isTraining)
            NematodeTrainer.AddNematode(this.toJson());
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
    
    /* Bites another Nematode (Called from EyeRaycast)
     *  @param {Nematode} nematode - The nematode to bite
     */
    OnBite(nematode){
        // If the nematode is on cooldown or does not want to bite, don't bite
        if (this.biteCooldown > 0 || this.nn.GetOutput(2) < 0) return;
        
        // Lose energy for biting
        this.energy -= Nematode.ENERGY_LOST_WHEN_BITING;

        // Call the OnBite function of the nematode
        nematode.OnGetBitten(this.GetPosition(), this.size);

        // Start the cooldown timer
        this.biteCooldown = Nematode.BITE_COOLDOWN;
    }

    /* Called when the Nematode is bitten by another Nematode
    *  pos -- The position of the attacking Nematode 
    *  size -- The size of the attacking Nematode (used to calculate the knockback and damage)
    */
    OnGetBitten(pos, attackingSize){
        // The ratio of the attacking Nematode's size to the size of this Nematode
        var sizeRatio = attackingSize / this.size;   

        // Lose energy for being bitten
        this.energy -= Nematode.ENERGY_LOST_WHEN_BITTEN * sizeRatio;

        // Set a knockback direction (to be used in KnockBackAnimation())
        this.knockbackDirection = new PIXI.Point(this.GetX() - pos.x, this.GetY() - pos.y)
                                          .normalize().MultiplyConstant(Nematode.KNOCKBACK_POWER * sizeRatio);

        // give red tint to nematode
        let tint = new PIXI.ColorMatrixFilter()
        tint.tint(0xff0000)
        let filters = this.sprite.filters || []
        filters.push(tint)
        this.sprite.filters = filters
        // remove the red tint after 1/3 seconds
        setTimeout(() => {
            if (!this.sprite.destroyed) this.sprite.filters = this.sprite.filters.filter(f => f != tint)
        }, 300)
    }

    /* Destroy this nematode */
    Destroy() {
        // remove nematode from world structure
        world.destroy(this);

        // Set the nematode to not exist
        this.exists = false;

        this.sprite.destroy()
        // TODO set flag to destroy texture as well if it is uniquely generated

        // Clean un the neural network
        // The NN was not the culprit of the memory leak
        //this.nn.Destroy();
        //this.nn = null;
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

        // Remove the nematode from the world after 14 seconds
        if (this.timeSinceDeath > 14) this.Destroy()
    }

    /* Called in Update() when the nematode is bitten */
    KnockbackAnimation(delta) {

        // Move the nematode in the knockback direction
        world.updatePosition(this,  this.GetX() + this.knockbackDirection.x * delta, 
                            this.GetY() + this.knockbackDirection.y * delta);

        // Decrease the knockback power
        this.knockbackDirection.MultiplyConstant(1 - delta * 10);

        // If the knockback power is low enough, stop the knockback animation
        if (DistFromOrigin(this.knockbackDirection) < 0.1) {
            this.knockbackDirection = undefined; // Remove the knockback direction
        }
    }

    // ------------------- Drawing ------------------- //

    /* Return a strinig description of this nematode's stats
    */
    mkStatString() {

        let statString  = "Age: " + this.age.toFixed(2) + "s\n";
        statString += "Energy: " + this.energy.toFixed(2) + " / " + this.maxEnergy.toFixed(2) + "\n";
        statString += "\n";
        statString += "Max Speed: " + this.maxSpeed.toFixed(2) + " pixels/s\n";
        statString += "Turn Speed: " + this.maxTurnSpeed.toFixed(2) + "\n";
        statString += "\n";
        statString += "Size: " + this.size.toFixed(2) + " pixels\n";
        statString += "Base Size: " + this.baseSize.toFixed(2) + " pixels\n";
        statString += "Grow Rate: " + this.growRate.toFixed(2) + " pixels/s\n";
        statString += "\n";
        statString += "Bite Cooldown: " + this.biteCooldown.toFixed(2) + "s\n";
        statString += "\n";
        statString += "Energy Consumption: \n";
        statString += "  Existence: " + 1 + " energy/s\n";
        statString += "  Movement: " + (Math.abs(this.speed ) / this.maxSpeed).toFixed(3) + " energy/s\n";
        statString += "  NN Penalty: " + this.nn.GetPenalty().toFixed(3) + " energy/s\n";
        statString += "  Age: " + (1 + this.age / 300).toFixed(3) + " times the normal rate\n";
        statString += "\n";
        statString += "Tint: " + this.sprite.tint.toString(16) + "\n";
        statString += "Time for next child: " + (this.childTime).toFixed(2) + "s\n";

        return statString
    }

    /* Draws the nematodes smell range to the given graphics object */
    DrawSmellRange(graphics) {

        // Set a border to green with a width of 1 pixel and an alpha
        graphics.lineStyle(1, 0x00FF00, .2);

        // set the fill color to red and the alpha
        graphics.beginFill(0xff0000, .1);

        // Draw a circle with the given radius
        graphics.drawCircle(this.GetX(), this.GetY(), Nematode.MAX_SMELL_DISTANCE);
    }

    // ------------------- OTHER ------------------- //

    // Will be replaced with a call to a function that creates a sprite (hopefully in a separate file)
    CreateSpriteTemp() {
        // Create a sprite to draw (Image stolen for convenience) TODO: Replace with own image
        //this.sprite = PIXI.Sprite.from(PIXI.Texture.EMPTY) // initialize to empty sprite
        this.sprite = PIXI.Sprite.from("Bibite.png")
        // set to different texture with this.SetTexture(newTexture)

        // Set the pivot point to the center of the bibite
        this.sprite.anchor.set(0.5);

        // random color tint for sprite
        this.baseColor = Math.round(Math.random() * 0xFFFFFF)
        this.sprite.tint = this.baseColor

        // make nematodes draggable
        createDragAction(this.sprite, this.sprite,
            (x,y) => this.paralyzed = world.draggableObjects,
            (dx,dy,x,y) => { if (world.draggableObjects) world.updatePosition(this, x, y) },
            (x,y) => this.paralyzed = false
        )
    }

    toJson() {
        return {
            age: this.age,
            generation: this.generation,
            alive: this.alive,
            nn: this.nn.toJson(),
            pos: this.exists ? {x: this.GetX(), y: this.GetY()} : {x:0,y:0},
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

    toString() {
        return "Nematode(" + "Age: " + this.age.toFixed(2) + ") ";
    }

    // ------------------- GETTERS AND SETTERS ------------------- //

    GetAge(){
        return this.age;
    }

    GetX() {
        return this.sprite.position.x;
    }

    GetY() {
        return this.sprite.position.y;
    }

    GetRadius() {
        return this.sprite.width / 2;
    }

    GetPosition() {
        return this.sprite.position
    }

    GetAngle() {
        return this.sprite.angle
    }

    SetPos(x, y) {
        this.sprite.position.set(x,y)
    }

    SetTexture(texture) {
        if (this.sprite.destroyed) throw `Cannot set the texture for a destroyed sprite`
        this.sprite.texture = texture
    }

    GetDisplayObject() {
        return this.sprite
    }
}