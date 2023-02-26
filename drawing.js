
class Canvas {
  constructor(width, height) {

  this.camera = {
    zoomLevel : 1,
    maxZoomLevel : 10,
    minZoomLevel : 0.3,
    // TODO add bounds for panning
  }

  // background sprite to interact with (mouse wheel zoom and clicks)
  // a background sprite is needed to register mouse events
  this.backGround = new PIXI.Sprite(PIXI.Texture.WHITE);
  this.backGround.width = app.screen.width;
  this.backGround.height = app.screen.height;
  this.backGround.tint = 0xff3333;
  this.backGround.interactive = true
  app.stage.addChild(this.backGround)
  // TODO resize background on screen change
  // something like this probably
  //window.addEventListener("resize", () => this.backGround.resize(window.innerWidth, window.innerHeight));


  // container to hold world object sprites
  // the local position of a sprite within the canvas container is 1:1 with its world object position
  this.container = new PIXI.Container()
  this.container.interactive = true // mark interactive to register clicks on objects
  this.container.pivot.set(width/2, height/2)
  this.container.position.set(width/2, height/2)
  this.initialScale = this.container.scale.clone()
  app.stage.addChild(this.container)

  // DEBUG: click on a point on the background to get the corresponding position in the nematode world
  this.backGround.on('pointerdown', e => {
    console.log("Screen Pos of click: (" + e.data.global.x + ", " + e.data.global.y + ")");
	  var screenPos = new PIXI.Point(e.data.global.x, e.data.global.y);
	  var worldPos = this.screen2WorldPos(e.data.global);
	  console.log("World Pos of click: (" + worldPos.x + ", " + worldPos.y + ")");
  })

  // set up callbacks for mouse drag behavior (for panning)
  this.dragdata = null
  this.dragging = false
  this.backGround
    .on('pointerdown', e => {this.dragdata = e.data; this.dragging = true})
    .on('pointerup', () => {this.dragdata = null; this.dragging = false})
    .on('pointerupoutside', () => {this.dragdata = null; this.dragging = false})
    .on('pointermove', (e) => {
      if (this.dragging) {
        // BUG dragging will jerk the center of the container to the mouse
        this.container.position = this.dragdata.global
      }
    })
  

  // on mouse wheel, change the zoom level
  let onScroll = e => {
    const scroll = e.deltaY
    if (scroll > 0)
      this.camera.zoomLevel *= 1.1
    else
      this.camera.zoomLevel /= 1.1
    // clamp the zoomlevel
    this.camera.zoomLevel = Math.min(this.camera.zoomLevel, this.camera.maxZoomLevel)
    this.camera.zoomLevel = Math.max(this.camera.zoomLevel, this.camera.minZoomLevel)
    this.container.scale = this.initialScale.multiplyScalar(this.camera.zoomLevel)
  }

  this.backGround.onwheel = onScroll
  this.container.onwheel = onScroll

  }

  // take a world point and convert it to a point on the screen
  world2ScreenPos(worldPoint) {
    return this.container.toGlobal(worldPoint)
  }

  // take a point on the screen and convert to world space
  screen2WorldPos(screenPoint) {
    return this.container.toLocal(screenPoint)
  }

  // add a sprite to this canvas
  add(sprite) {
    this.container.addChild(sprite)
  }

  // for each object in the world, change its sprite position in the view container
  // and scale the sprite correctly
  drawWorld(world) {
    world.forEach(o => {
      //o.sprite.position = this.world2ScreenPos(o.worldPos)
      //o.sprite.scale.set(this.camera.zoomLevel)
      //o.sprite.position = o.worldPos
      o.UpdateSprite()
    });
  }


}
