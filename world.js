/**
 * Structure to hold information about the world and objects in the world
 * 
 * Objects to be placed in the world need to have a worldPos field containing a Vector2
 */

class World {
  static radius = 5000
  static #zoneSize = 500

  // hash table that maps nematodes to a zone
  #nematodeZones = new HashTable(obj => {
    let [zoneX,zoneY] = this.#pos2zone(obj.GetX(), obj.GetY())
    return this.#zone2hashkey(zoneX,zoneY)
  })

  // hash table that maps food to a zone
  #foodZones = new HashTable(obj => {
    let [zoneX,zoneY] = this.#pos2zone(obj.GetX(), obj.GetY())
    return this.#zone2hashkey(zoneX,zoneY)
  })

  // set the size of the world in the x-direction (width)
  // set the size of the world in the y-direction (height)
  // give the size of a world zone
  constructor() {
    // The currently selected nematode
    this.selectedNematode = null

    this.maxNumFood = 2000
    this.foodReplenishRate = 25 // food added per second
    this.maxReplenishRate = 100
    
    // the canvas holds a container that we draw the objects on
    this.canvas = new Canvas()

    this.drawZones = false
    this.drawEyeRays = false
    this.draggableObjects = false // flag for enabled ability to drag world objects

    // create food brush action for dragging
    this.foodBrushOn = false
    this.foodBrushRadius = 10

    this.nematodeBrushOn = false
    this.nematodeBrushRadius = 10

    // create a button to display nematode energy
    this.energyBarOn = false;

    this.#setUpBrushes()
  }

  // ----------------- Nematodes -----------------
  /**
   * 
   * @param {number} x x world coordinate
   * @param {number} y y world coordinate
   * @returns [x,y] new x,y coordinates that fall within the world radius
   */
  clampWorldPos(x,y) {
    let l2 = x**2 + y**2
    if (l2 > World.radius**2) {
      let factor = World.radius/Math.sqrt(l2)
      x *= factor
      y *= factor
    }
    return [x,y]
  }

  // add a nematode to the world
  // an object should implement GetX(), GetY(), GetPosition(), SetPos()
  addNematode(obj) {

    // make the nematode clickable
    obj.sprite.interactive = true

    // when the nematode is clicked, select it
    obj.sprite.onclick = () => { this.selectedNematode = obj }
    
    // TODO clamp object's position to be within world borders
    this.#nematodeZones.insert(obj)

    // add the game object so it can be drawn
    this.canvas.add(obj.sprite)
  }

  // remove a nematode from the world
  destroyNematode(obj) {
    if (!this.#nematodeZones.remove(obj))
      throw `Object ${obj} cannot be destroyed because it does not exist in the world`
    this.#nematodeZones.remove(obj)
    obj.sprite.destroy()
  }

  // update the position of the object
  // NOTE: this will modify the object's position
  updateNematodePosition(obj, x, y) {
    // TODO clamp newWorldPos to be within world borders
    let [newX, newY] = this.clampWorldPos(x, y)

    let {oldX,oldY} = obj.GetPosition()
    let [oldzx, oldzy] = this.#pos2zone(oldX,oldY)
    let [newzx,newzy] = this.#pos2zone(newX, newY)

    let zoneChange = (oldzx != newzx) || (oldzy != newzy)

    // if the nematode is changing zones then update the zone hash table
    if (zoneChange && !this.#nematodeZones.remove(obj))
      throw `Object ${obj} position cannot be updated because it does not exist in the world`

    obj.SetPos(newX, newY)
    if (zoneChange) this.#nematodeZones.insert(obj)

  }
  
  // perform an action on each object of the world
  forEachNematode(f) {
    for (const nematode of this.#nematodeZones.items()) f(nematode)
  }

  // return the number of nematodes in the world
  numNematodes() {
    return this.#nematodeZones.size()
  }
  
  // return the currently occupied zones: [[0,1], [-2,2], [5,0]]
  getOccupiedZones() {
    return this.#nematodeZones.keys().map(function(k) {
      const [x,y] = k.split(',')
      return [parseInt(x), parseInt(y)]
    })
  }

  // ----------------- Food -----------------

  // add a food object to the world
  // Food objects are not clickable
  // an object should implement GetX(), GetY(), GetPosition(), SetPos()
  addFood(obj) {

    // TODO clamp object's position to be within world borders
    this.#foodZones.insert(obj)

    // add the game object so it can be drawn
    this.canvas.add(obj.sprite)
  }

  // remove a food object from the world
  destroyFood(obj) {
    if (!this.#foodZones.remove(obj))
      throw `Object ${obj} cannot be destroyed because it does not exist in the world`
    this.#foodZones.remove(obj)
    obj.sprite.destroy()
  }

  // return the number of food items in the world
  numFood() {
    return this.#foodZones.size()
  }

  // return a list of objects from the given area
  getFoodAt(worldPosX, worldPosY, radius) {
    let [minZoneX,minZoneY] = this.#pos2zone(worldPosX-radius,worldPosY-radius)
    let [maxZoneX,maxZoneY] = this.#pos2zone(worldPosX+radius,worldPosY+radius)
    
    let results = []
    
    for (let x = minZoneX; x <= maxZoneX; x++)
    for (let y = minZoneY; y <= maxZoneY; y++)
    for (let obj of this.getFoodAtZone(x,y))

    // Take the square of radius to avoid taking the square root of the sum of squares
    if ((obj.GetX()-worldPosX)**2 + (obj.GetY()-worldPosY)**2 <= radius * radius) 
      results.push(obj)

    return results
  }

  /**
   * 
   * @param {*} zoneX column of zone
   * @param {*} zoneY row of zone
   * @returns the hash bucket of food at that zone
   * 
   * WARNING: DO NOT MODIFY RETURNED COLLECTION
   */
  getFoodAtZone(zoneX, zoneY) {
    return this.#foodZones.getItemsWithKey(this.#zone2hashkey(zoneX,zoneY))
  }

  // ----------------- Hash functions -----------------

  // get zone coordinates from world coordinates
  #pos2zone(worldPosX,worldPosY) {
    return [Math.floor(worldPosX/World.#zoneSize), Math.floor(worldPosY/World.#zoneSize)]
  }

  // create hash key of zone coordinates from position
  #zone2hashkey(zoneX, zoneY) {
    return `${zoneX},${zoneY}`
  }

  // ----------------- Brushes -----------------
  
  /**
   * Register a brush action for the world
   * @param {function} flagGetter returns true if this brush should be active 
   * @param {function} action (x,y) => ... procedure applied to world coordinates of mouse on mouse move
   * @param {number} strength strength of brush value (0 to 1)
   */

  createBrush(flagGetter, action, strength) {
    createDragAction(this.canvas.backGround, this.canvas.container,
      null,
      (dx,dy,x,y) => {
        // perform brush action if the supplied flag is enabled and the user isn't holding shift (for world panning)
        if (flagGetter() && Math.random() < strength) {
          let pos = this.canvas.screen2WorldPos({x: x, y: y})
          action(pos.x,pos.y)
        }
      },
      null
    )
  }

  #setUpBrushes() {
    // food brush
    this.createBrush(() => this.foodBrushOn, (x,y) => {
      let pos = new PIXI.Point(x,y)
      pos.perturb(this.foodBrushRadius)
      new Food(pos)
    }, 0.25)

    // nematode brush
    this.createBrush(() => this.nematodeBrushOn, (x,y) => {
      let pos = new PIXI.Point(x,y)
      pos.perturb(this.nematodeBrushRadius)
      new Nematode(pos)
    }, 0.1)
  }

  // ----------------- Getters -----------------

  zoneSize() {
    return World.#zoneSize
  }

}