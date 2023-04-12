/**
 * Structure to hold information about the world and objects in the world
 * 
 * Objects to be placed in the world must implement GetX(), GetY(), GetPosition()
 */

class World {
  static SMALL_ZONE_SIZE = 50
  static MED_ZONE_SIZE = 200
  static LARGE_ZONE_SIZE = 500
  static XL_ZONE_SIZE = 1000

  static radius = 3000
  static #zoneSize = World.MED_ZONE_SIZE

  // brushes
  static foodBrushOn = false
  static nematodeBrushOn = false
  static eraseBrushOn = false
  static brushRadius = 10

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


  constructor() {

    // the canvas holds a container that we draw the objects on
    this.canvas = new Canvas()

    // The currently selected nematode
    this.selectedNematode = null

    // Food settings
    this.maxNumFood = 2000
    this.foodReplenishRate = 25 // food added per second
    this.maxReplenishRate = 100
    
    // Debug Settings (Boolean)
    this.drawZones = false
    this.drawEyeRays = false
    this.drawSmell = false

    this.draggableObjects = true // flag for enabled ability to drag world objects

    // Debug slider vars
    this.SlowUpdateInterval = 5;

    // create a button to display nematode energy
    this.energyBarOn = false;

    this.#setUpBrushes()

    //load images for sprite generator
    SpriteGenerator.LoadspriteChunks();
  }

  /**
   * Return the hash table structure associated with the obj
   * @param {Nematode | Food} obj 
   * @returns {HashTable}
   */
  getHashTableFor(obj) {
    if (obj instanceof Nematode) return this.#nematodeZones
    else if (obj instanceof Food) return this.#foodZones
    else throw `Unsupported world object: ${obj}`
  }

  /**
   * @param {Nematode | Food} obj world object to add (Nematode or Food)
   */
  add(obj) {
    // insert obj into zone hash
    this.getHashTableFor(obj).insert(obj)

    if (obj instanceof Nematode) {
      // make the nematode clickable
      obj.sprite.interactive = true
      // when the nematode is clicked, select it
      obj.sprite.onmousedown = () => {
        this.selectedNematode = obj
        displaySelectedNematode() // in ui.js
      }
    } else if (obj instanceof Food) {
      // nothing else
    } else throw `Unsupported: Can't add to world: ${obj}`
    // add the game object so it can be drawn
    this.canvas.add(obj.sprite)
  }

  /**
   * remove the given world object from the world and destroy it
   * @param {Nematode | Food} obj to destroy
   */
  destroy(obj) {
    const zoneHash = this.getHashTableFor(obj)

    if (!zoneHash.remove(obj))
      throw `Object ${obj} cannot be destroyed because it does not exist in the world`
    obj.sprite.destroy()
  }

  /**
   * Perform some action for each object of some type in the world
   * 
   * @param {*} f function to perform on the object
   * @param {Class} type class of world objects to, setting this to undefined means to iterate over all items
   */
  forEach(f, type) {
    if (type === Nematode)
      this.#nematodeZones.items().forEach(f)
    else if (type === Food)
      this.#foodZones.items().forEach(f)
    else if (type === undefined) {
      this.forEach(f, Nematode)
      this.forEach(f, Food)
    } else throw `Unsupported world object type: ${type}`
  }

  /**
   * Retrieve objects
   * 
   * @param {number} zx zone's x coordinate
   * @param {number} zy zone's y coordinate
   * @param {Class} type class of world objects to, setting this to undefined means to get all items
   * @return {Set | Array} hash bucket of items at the zone
   * 
   * WARNING: MODIFYING THE RETURNED COLLECTION MAY CORRUPT THE HASHTABLE
   */
  getObjectsAtZone(zx,zy,type) {
    let key = this.#zone2hashkey(zx,zy)
    if (type === Nematode) return this.#nematodeZones.getItemsWithKey(key)
    else if (type === Food) return this.#foodZones.getItemsWithKey(key)
    else if (type === undefined) {
      let results = []
      results.push(...this.#nematodeZones.getItemsWithKey(key))
      results.push(...this.#foodZones.getItemsWithKey(key))
      return results
    }
    else throw `Unsupported world object type: ${type}`
  }
  
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

  // update the position of the object
  // NOTE: this will modify the object's position
  updatePosition(obj, x, y) {

    // clamp newWorldPos to be within world borders
    let [newX, newY] = this.clampWorldPos(x, y)

    let {oldX,oldY} = obj.GetPosition()
    let [oldzx, oldzy] = this.#pos2zone(oldX,oldY)
    let [newzx,newzy] = this.#pos2zone(newX, newY)

    let zoneChange = (oldzx != newzx) || (oldzy != newzy)

    let zoneHash = this.getHashTableFor(obj)

    // if the nematode is changing zones then update the zone hash table
    if (zoneChange && !zoneHash.remove(obj))
      throw `Object ${obj} position cannot be updated because it does not exist in the world`

    obj.SetPos(newX, newY)
    if (zoneChange) zoneHash.insert(obj)
  }

  /**
   * 
   * @param {Nematode | Food} obj 
   * @param {number} worldX 
   * @param {number} worldY
   * @param {number} radius
   * @param {number} r2 radius of the circle squared (passed in for efficiency)
   * @return {boolean} true if the given object's position falls within the specified circle 
   */
  circleCast(obj,worldPosX,worldPosY,radius,r2) {
    return obj.GetX() >= worldPosX - radius &&
      obj.GetX() <= worldPosX + radius &&
      obj.GetY() >= worldPosY - radius &&
      obj.GetY() <= worldPosY + radius &&
      (obj.GetX() - worldPosX) ** 2 + (obj.GetY() - worldPosY) ** 2 <= r2
  }

  /**
   * 
   * @param {*} worldPosX 
   * @param {*} worldPosY 
   * @param {*} radius search radius
   * @param {Nematode | Food} type class of world objects to search for, leave undefined to search for all objects
   * @returns list of the found objects
   */
  getObjectsAt(worldPosX, worldPosY, radius, type) {
    let [minZoneX,minZoneY] = this.#pos2zone(worldPosX-radius,worldPosY-radius)
    let [maxZoneX,maxZoneY] = this.#pos2zone(worldPosX+radius,worldPosY+radius)
    
    let results = []

    let rSq = radius * radius;
    
    for (let x = minZoneX; x <= maxZoneX; x++)
    for (let y = minZoneY; y <= maxZoneY; y++) {
      if (type === Nematode || type === undefined)
      for (let obj of this.getObjectsAtZone(x,y,Nematode))
      if (this.circleCast(obj,worldPosX,worldPosY,radius,rSq))
        results.push(obj)

      if (type === Food || type === undefined)
      for (let obj of this.getObjectsAtZone(x,y,Food))
      if (this.circleCast(obj,worldPosX,worldPosY,radius,rSq))
        results.push(obj)
    }

    return results
  }

////// Nematode stuff ///////

  /**
   * 
   * @param {*} worldPosX 
   * @param {*} worldPosY 
   * @param {*} radius 
   * @returns new collection of nematodes from within the search circle
   */
  getNematodesAt(worldPosX,worldPosY,radius) {
    return this.getObjectsAt(worldPosX,worldPosY,radius,Nematode)
  }

  // perform an action on each nematode of the world
  forEachNematode(f) {
    this.forEach(f, Nematode)
  }

  // return the number of nematodes in the world
  numNematodes() {
    return this.#nematodeZones.size()
  }
  
  /**
   * 
   * @param {*} zoneX column of zone
   * @param {*} zoneY row of zone
   * @returns the hash bucket of nematodes at that zone
   * 
   * WARNING: DO NOT MODIFY RETURNED COLLECTION
   */
  //getNematodeAtZone(zoneX, zoneY) {
  //  return this.#nematodeZones.getItemsWithKey(this.#zone2hashkey(zoneX,zoneY))
 // }
  
  // return the currently occupied zones: [[0,1], [-2,2], [5,0]]
  getOccupiedZones() {
    return this.#nematodeZones.keys().map(function(k) {
      const [x,y] = k.split(',')
      return [parseInt(x), parseInt(y)]
    })
  }

  // ----------------- Food -----------------

  // return the number of food items in the world
  numFood() {
    return this.#foodZones.size()
  }

  // return a list of objects from the given area
  getFoodAt(worldPosX, worldPosY, radius) {
    return this.getObjectsAt(worldPosX,worldPosY,radius,Food)
  }

  // ----------------- Spawn Functions -----------------
  

  /* Spawn a number of nematodes
   * number: the number of nematodes to spawn
   */
  SpawnNematodes(number){
    for (let i = 0; i < number; i++) {
      world.selectedNematode = new Nematode()
    }
  }

  /* Spawn a number of "Smart" nematodes
   * number: the number of nematodes to spawn
   */
  SpawnSmartNematodes(number){

    for (let i = 0; i < number; i++) {

      // Load a random nematode from the training data
      const nematodeData = NematodeTrainer.GetRandomNematode();

      // Create a new nematode with the loaded data
      const parent = new Nematode(nematodeData);

      // Create a new nematode with the loaded data as a parent
      new Nematode(parent);

      // Destroy the parent
      parent.Destroy();
    }
  }

  /** Spawn a number of food
  *  Will not spawn more than world.maxNumFood
  * 
  * @param {*} number The number of food to spawn
  */
  SpawnFood(number){
    for (let i = 0; i < number && world.numFood() < world.maxNumFood; i++) {
      new Food()
    }
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
        // perform brush action if the supplied flag is enabled
        if (flagGetter() && Math.random() < strength) {
          let pos = this.canvas.screen2WorldPos({x: x, y: y})
          action(pos.x,pos.y)
        }
      },
      null
    )
  }

  // set up any brushing tools the user has
  #setUpBrushes() {
    // food brush
    this.createBrush(() => World.foodBrushOn, (x,y) => {
      let pos = new PIXI.Point(x,y)
      pos.perturb(World.brushRadius)
      new Food(pos)
    }, 0.25)

    // nematode brush
    this.createBrush(() => World.nematodeBrushOn, (x,y) => {
      let pos = new PIXI.Point(x,y)
      pos.perturb(World.brushRadius)
      new Nematode(pos)
    }, 0.1)

    // erase brush
    this.createBrush(() => World.eraseBrushOn, (x,y) => {
      let r = World.brushRadius
      // collect world objects at mouse
      let objs = this.getObjectsAt(x,y,r)
      for (const obj of objs) obj.Destroy()
      // draw box for the area being erased
      // BUG: the erase circle flashes in and out
      // TODO: figure out a better way to draw in the world
      this.canvas.worldGraphics.lineStyle(1, 0)
      this.canvas.worldGraphics.drawCircle(x,y,r)
    }, 1)
  }

  /**
   * Rehash all world objects into their new zones
   * @param {number} newZoneSize 
   */
  rezone(newZoneSize) {
    console.log("rezoning")
    let objs = []
    this.forEach(obj => objs.push(obj))

    if (objs.length != this.numFood() + this.numNematodes())
      throw `ERROR WHILE REZONING: ${objs.length} != ${this.numFood()} + ${this.numNematodes()}`

    // remove objects from hash structure
    for (const obj of objs) {
      let zoneHash = this.getHashTableFor(obj)
      zoneHash.remove(obj)
    }

    // reinsert objects into hash
    World.#zoneSize = newZoneSize
    for (const obj of objs) {
      let zoneHash = this.getHashTableFor(obj)
      zoneHash.insert(obj)
    }

    if (objs.length != this.numFood() + this.numNematodes())
      throw "ERROR WHILE REZONING"
  }

  // ----------------- Getters -----------------

  zoneSize() {
    return World.#zoneSize
  }

}