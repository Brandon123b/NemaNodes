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
      let [zoneX,zoneY] = this.#pos2zone(obj.worldPos.GetX(), obj.worldPos.GetY())
      return this.#zone2hashkey(zoneX,zoneY)
    }
    this.zones = new HashTable(obj2zone)
  }

  // remove an object from the world
  destroy(obj) {
    if (!this.zones.remove(obj))
      throw `Object ${obj} cannot be destroyed because it does not exist in the world`
  }

  // add an object to the world
  add(obj) {
    // TODO clamp object's position to be within world borders
    this.zones.insert(obj)
  }

  // update the position of the object
  // NOTE: this will modify the object's worldPos field
  updatePos(obj, worldPosX, worldPosY) {
    if (!this.zones.remove(obj))
      throw `Object ${obj} position cannot be updated because it does not exist in the world`
    // TODO clamp newWorldPos to be within world borders
    obj.worldPos.SetX(worldPosX)
    obj.worldPos.SetY(worldPosY)
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
    if (Math.sqrt((obj.worldPos.GetX()-worldPosX)**2 + (obj.worldPos.GetY()-worldPosY)**2) <= radius)
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

}