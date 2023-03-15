/**
 * Food
 * 
 * Food can be placed either by the player or by the world engine. 
 * Nematodes can see it amd consume it.
 */



class Food {
    

    constructor(position) {

        this.width = 6
        this.height = 6

        this.age = 0
        this.spriteScaleX = 0.25 //scale sprite as needed
        this.spriteScaleY = 0.25

        this.sprite = PIXI.Sprite.from('mc_cake_sprite.png') //make real sprites later
        this.sprite.anchor.set(0.5)
        //this.sprite.scale.set(spriteScaleX, spriteScaleY)
        //set sprite position from constructor params
        this.sprite.position = position
        this.sprite.width = this.width
        this.sprite.height = this.height
        
        world.addFood(this)

    }

    /*
    * Update food
    * Currently: updates age
    * @param {number} delta - time since last udpate
    */
    Update(delta) {
        this.age += delta
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
        world.destroyFood(this)

        return 30;
    }

    toString() {
        return `{Food at (${this.GetX()}, ${this.GetY()})}`
    }

}