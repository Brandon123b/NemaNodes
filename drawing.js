
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
  this.container.position.set(app.screen.width, app.screen.height)
  console.log(this.container.position)
  this.initialScale = this.container.scale.clone()
  app.stage.addChild(this.container)

  // Add a graphis object to the canvas This is for drawing to the world (like raycasts)
  // This may/may not be kept, but it is useful for debugging
  this.worldGraphics = new PIXI.Graphics();
  this.container.addChild(this.worldGraphics);

  // Add a graphis object to the canvas This is for drawing to the screen (like the neural network)
  // This may/may not be kept, but it is useful for debugging
  this.screenGraphics = new PIXI.Graphics();
  app.stage.addChild(this.screenGraphics);

  // DEBUG: click on a point on the background to get the corresponding position in the nematode world
  this.backGround.on('pointerdown', e => {
    console.log("Screen Pos of click: (" + e.data.global.x + ", " + e.data.global.y + ")");
	  var screenPos = new PIXI.Point(e.data.global.x, e.data.global.y);
	  var worldPos = this.screen2WorldPos(e.data.global);
	  console.log("World Pos of click: (" + worldPos.x + ", " + worldPos.y + ")");
  })

  // set up callbacks for mouse drag behavior (for panning)
  this.backGround
    .on('pointerdown', onDragStart, this.container)
    .on('pointerup', onDragEnd)
    .on('pointerupoutside', onDragEnd)
  

  // on mouse wheel, change the zoom level
  let onScroll = e => {
    const scroll = e.deltaY
    if (scroll > 0)
      this.camera.zoomLevel /= 1.1
    else
      this.camera.zoomLevel *= 1.1
    // clamp the zoomlevel
    this.camera.zoomLevel = Math.min(this.camera.zoomLevel, this.camera.maxZoomLevel)
    this.camera.zoomLevel = Math.max(this.camera.zoomLevel, this.camera.minZoomLevel)
    
    let mousePos = e.data.global
    let returnPivot = this.container.toLocal(mousePos)
    this.container.scale = this.initialScale.multiplyScalar(this.camera.zoomLevel)
    this.container.pivot = this.container.pivot.subtract(this.container.toLocal(mousePos).subtract(returnPivot))
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

  // for each object in the world, call UpdateSprite
  // may optimize to calling UpdateSprite on static objects like food
  drawWorld(world) {

    world.forEach(o => {
      o.UpdateSprite()
    });

    firstNeatode.nn.DrawNN(this.screenGraphics);
  }


}

// general code for dragging
let dragTarget = null
let dragStart = new PIXI.Point()

function onDragMove(event) {
  if (dragTarget) {
      const { x, y } = dragStart;
      dragTarget.parent.toLocal(event.global, null, dragStart);
      dragTarget.x += (dragStart.x - x);
      dragTarget.y += (dragStart.y - y);
  }
}

function onDragStart(event) {
  dragTarget = this;
  app.stage.on('pointermove', onDragMove);
  dragTarget.parent.toLocal(event.global, null, dragStart);
}

function onDragEnd() {
  if (dragTarget) {
      app.stage.off('pointermove', onDragMove);
      dragTarget = null;
  }
}