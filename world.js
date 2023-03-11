/**
 * Structure to hold information about the world and objects in the world
 * 
 * Objects to be placed in the world need to have a worldPos field containing a Vector2
 */

class World {
  #width
  #height
  #zoneWidth
  #zoneHeight

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
  constructor(worldWidth, worldHeight, zoneWidth, zoneHeight) {
    this.#width = worldWidth
    this.#height = worldHeight
    this.#zoneWidth = zoneWidth
    this.#zoneHeight = zoneHeight

    this.maxNumFood = 1000
    this.foodReplenishRate = 1 // food added per second
    
    // the canvas holds a container that we draw the objects on
    this.canvas = new Canvas(worldWidth, worldHeight)

    this.drawZones = false
  }

  // remove a nematode from the world
  destroyNematode(obj) {
    if (!this.#nematodeZones.remove(obj))
      throw `Object ${obj} cannot be destroyed because it does not exist in the world`
    obj.sprite.destroy()
  }

  // remove a food object from the world
  destroyFood(obj) {
    if (!this.#foodZones.remove(obj))
      throw `Object ${obj} cannot be destroyed because it does not exist in the world`
    obj.sprite.destroy()
  }

  // add a nematode to the world
  // an object should implement GetX(), GetY(), GetPosition(), SetPos()
  addNematode(obj) {

    // make the nematode clickable
    obj.sprite.interactive = true
    obj.sprite.onclick = () => {
      console.log("Nematode's world position: (" + obj.GetX() + ", " + obj.GetY() + ")");
      console.log("Nematode's screen position: (", this.canvas.world2ScreenPos(obj.GetPosition()) , ")");
    }
    
    // TODO clamp object's position to be within world borders
    this.#nematodeZones.insert(obj)

    // add the game object so it can be drawn
    this.canvas.add(obj.sprite)
  }

  // add a food object to the world
  // Food objects are not clickable
  // an object should implement GetX(), GetY(), GetPosition(), SetPos()
  addFood(obj) {

    // TODO clamp object's position to be within world borders
    this.#foodZones.insert(obj)

    // add the game object so it can be drawn
    this.canvas.add(obj.sprite)
  }

  // update the position of the object
  // NOTE: this will modify the object's position
  updateNematodePosition(obj, newX, newY) {
    // TODO clamp newWorldPos to be within world borders
    let {x,y} = obj.GetPosition()
    let [oldzx, oldzy] = this.#pos2zone(x,y)
    let [newzx,newzy] = this.#pos2zone(newX, newY)

    let zoneChange = (oldzx != newzx) || (oldzy != newzy)

    // if the nematode is changing zones then update the zone hash table
    if (zoneChange && !this.#nematodeZones.remove(obj))
      throw `Object ${obj} position cannot be updated because it does not exist in the world`

    obj.SetPos(newX, newY)
    if (zoneChange) this.#nematodeZones.insert(obj)

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

  // return array of items currently in the given zone
  getFoodAtZone(zoneX, zoneY) {
    let results = this.#foodZones.getItemsWithKey(this.#zone2hashkey(zoneX,zoneY))
    if (results)
      return [...results]
    else return []
  }

  // return the currently occupied zones: [[0,1], [-2,2], [5,0]]
  getOccupiedZones() {
    return this.#nematodeZones.keys().map(function(k) {
      const [x,y] = k.split(',')
      return [parseInt(x), parseInt(y)]
    })
  }

  // get zone coordinates from world coordinates
  #pos2zone(worldPosX,worldPosY) {
    return [Math.floor(worldPosX/this.#zoneWidth), Math.floor(worldPosY/this.#zoneHeight)]
  }

  // create hash key of zone coordinates from position
  #zone2hashkey(zoneX, zoneY) {
    return `${zoneX},${zoneY}`
  }

  // perform an action on each object of the world
  forEachNematode(f) {
    this.#nematodeZones.forEachBucket(zone => zone.forEach(f))
  }

  zoneHeight() {
    return this.#zoneHeight
  }

  zoneWidth() {
    return this.#zoneWidth
  }

}