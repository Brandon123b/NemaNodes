/**
 * Food
 * 
 * Food can be placed either by the player or by the world engine. 
 * Nematodes can see it amd consume it.
 */



class Food {
    

    constructor(world, position) {
        this.world = world

        this.width = 10
        this.height = 10

        this.age = 0

        this.sprite = PIXI.Sprite.from('mc_cake_sprite.png') //make real sprites later
        this.sprite.anchor.set(0.5)
        //set sprite position from constructor params
        this.sprite.position = new PIXI.Point(position[0], position[1])


        // make food draggable
        createDragAction(this.sprite, this.sprite,
            (x,y) => this.paralyzed = true,
            (dx,dy) => this.world.updatePos(this, this.GetX()+dx, this.GetY()+dy),
            (x,y) => this.paralyzed = false
        )

    }

    /*
    * Update food
    * Currently: updates age
    * @param {number} delta - time since last udpate
    */
    update(delta) {
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

    
    

}