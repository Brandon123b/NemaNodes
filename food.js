/**
 * Food
 * 
 * Food can be placed either by the player or by the world engine. 
 * Nematodes can see it amd consume it.
 */



class Food {
    static FOOD_DECAY_AGE = 100 // seconds until food decays away

    // number of ticks between each call to SlowUpdate() for a food object
    static FOOD_UPDATE_INTERVAL = 100

    constructor(position) {

        // Allow default position to be undefined causing a random position to be generated
        if (position == undefined) {
            position = new PIXI.Point().RandomPosition(World.radius)
        }

        this.width = 6
        this.height = 6

        this.age = 0 // this is not used as of now

        this.birthTime = timeSinceStart

        this.spriteScaleX = 0.25 //scale sprite as needed
        this.spriteScaleY = 0.25

        this.sprite = PIXI.Sprite.from('mc_cake_sprite.png') //make real sprites later
        this.sprite.anchor.set(0.5)
        //this.sprite.scale.set(spriteScaleX, spriteScaleY)
        //set sprite position from constructor params
        this.sprite.position = position
        this.sprite.width = this.width
        this.sprite.height = this.height
        
        world.add(this)
    }

    /*
    * Update food
    * Currently: updates age
    * @param {number} delta - time since last udpate
    */
    Update(delta) {
        // this is never called as of now
        this.age += delta
    }

    /**
     * SlowUpdate only called once very few frames
     */
    SlowUpdate() {
        if (timeSinceStart - this.birthTime >= Food.FOOD_DECAY_AGE)
            this.Destroy()
    }

    GetPosition() {
        return this.sprite.position
    }

    GetX() {
        return this.sprite.position.x;
    }

    GetY() {
        return this.sprite.position.y;
    }

    GetAge() {
        return this.age
    }

    GetPosition() {
        return this.sprite.position
    }

    SetPos(x, y) {
        this.sprite.position.set(x,y)
    }

    GetRadius() {
        return this.width / 2;
    }
    
    /* Called when a nematode eats this food
    *  Removes the food from the world
    *  Returns the nutrition value of the food (TODO: add nutrition value to food)
    */
    Eat(){

        // Set the food to ignore raycasts (so it can't be eaten again) (This also ignores things like smell)
        this.ignoreRaycast = true;

        // Remove the food from the world
        this.Destroy()

        // Return the nutrition value of the food
        return 30;
    }

    /**
     * Destroy this food object
     * 
     */
    Destroy() {
        world.destroy(this)
    }

    toString() {
        return `{Food at (${this.GetX()}, ${this.GetY()})}`
    }

    // TODO: consider energy preservation?
    /* Static function to spawn food when a nematode dies */
    static SpawnNematodeDeathFood(deathPos, size) {

        // Find the amount of food to spawn based on size
        var num = Math.floor(size / 5);

        // Spawn the food
        for (var i = 0; i < num; i++) {
            var pos = new PIXI.Point(deathPos.x, deathPos.y).perturb(size / 2);
            new Food(pos);
        }
    }
}