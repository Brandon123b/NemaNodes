/**
 * Structure to hold information about the world and objects in the world
 * 
 * Objects to be placed in the world need to have a worldPos field containing a Vector2
 */

class World {
  // set the size of the world in the x-direction (width)
  // set the size of the world in the y-direction (height)
  // give the size of a world zone
  constructor(worldWidth, worldHeight, zoneWidth, zoneHeight) {
    this.width = worldWidth
    this.height = worldHeight
    this.zoneWidth = zoneWidth
    this.zoneHeight = zoneHeight

    this.maxNumFood = 1000
    this.foodReplenishRate = 1 // food added per second

    // function to map objects to zones

    let obj2zone = obj => {
      let [zoneX,zoneY] = this.#pos2zone(obj.GetX(), obj.GetY())
      return this.#zone2hashkey(zoneX,zoneY)
    }

    // hash table that maps game objects to a zone
    this.zones = new HashTable(obj2zone)
    // the canvas holds a container that we draw the objects on
    this.canvas = new Canvas(worldWidth, worldHeight)
  }

  // remove an object from the world
  destroy(obj) {
    if (!this.zones.remove(obj))
      throw `Object ${obj} cannot be destroyed because it does not exist in the world`
    obj.sprite.destroy()
  }

  // add an object to the world
  // an object should implement a worldPos field which is a PIXI.Point
  add(obj) {
    obj.sprite.interactive = true
    obj.sprite.onclick = () => {
      console.log("Nematode's world position: (" + obj.GetX() + ", " + obj.GetY() + ")");
      console.log("Nematode's screen position: (", this.canvas.world2ScreenPos(obj.GetPosition()) , ")");
    }
    
    // TODO clamp object's position to be within world borders
    this.zones.insert(obj)
    // add the game object so it can be drawn
    this.canvas.add(obj.sprite)
  }

  // update the position of the object
  // NOTE: this will modify the object's worldPos field
  updatePos(obj, newX, newY) {
    if (!this.zones.remove(obj))
      throw `Object ${obj} position cannot be updated because it does not exist in the world`
    // TODO clamp newWorldPos to be within world borders
    obj.SetPos(newX, newY)
    this.zones.insert(obj)
  }

  // return a list of objects from the given area
  getObjectsAt(worldPosX, worldPosY, radius) {
    let [minZoneX,minZoneY] = this.#pos2zone(worldPosX-radius,worldPosY-radius)
    let [maxZoneX,maxZoneY] = this.#pos2zone(worldPosX+radius,worldPosY+radius)
    
    let results = []

    for (let x = minZoneX; x <= maxZoneX; x++)
    for (let y = minZoneY; y <= maxZoneY; y++)
    for (let obj of this.getObjectsAtZone(x,y))

    // Take the square of radius to avoid taking the square root of the sum of squares
    if ((obj.worldPos.x-worldPosX)**2 + (obj.worldPos.y-worldPosY)**2 <= radius * radius) 
      results.push(obj)

    return results
  }

  // return array of items currently in the given zone
  getObjectsAtZone(zoneX, zoneY) {
    let results = this.zones.getItemsWithKey(this.#zone2hashkey(zoneX,zoneY))
    if (results)
      return [...results]
    else return []
  }

  // get zone coordinates from world coordinates
  #pos2zone(worldPosX,worldPosY) {
    return [Math.floor(worldPosX/this.zoneWidth), Math.floor(worldPosY/this.zoneHeight)]
  }

  // create hash key of zone coordinates from position
  #zone2hashkey(zoneX, zoneY) {
    return `${zoneX},${zoneY}`
  }

  // perform an action on each object of the world
  forEach(f) {
    this.zones.forEachBucket(zone => zone.forEach(f))
  }

}