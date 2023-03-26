
class Canvas {
  constructor() {

  this.camera = {
    zoomLevel : 1,
    maxZoomLevel : 10,
    minZoomLevel : 0.1,
    // TODO add bounds for panning
  }

  // background sprite to interact with (mouse wheel zoom and clicks)
  // a background sprite is needed to register mouse events
  this.backGround = new PIXI.Sprite(PIXI.Texture.WHITE);
  this.backGround.width = app.screen.width;
  this.backGround.height = app.screen.height;
  this.backGround.tint = 0x999955;
  this.backGround.interactive = true
  app.stage.addChild(this.backGround)

  // container to hold world object sprites
  // the local position of a sprite within the canvas container is 1:1 with its world object position
  this.container = new PIXI.Container()
  this.container.interactive = true // mark interactive to register clicks on objects
  this.container.position.set(app.screen.width/2, app.screen.height/2)
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

  this.nematodeStatsMenuObj = new NematodeStatsMenu(this.screenGraphics);

  // set up callbacks for mouse drag behavior (for panning)
  createDragAction(this.backGround, this.container,
    null,
    (dx,dy) => { this.container.position.addXY(dx,dy) },
    null,
    true  // make world drag occur with right mouse button drag
  )

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

  
  drawWorld(world) {
    // resize the background if window changes
    this.backGround.width = app.screen.width
    this.backGround.height = app.screen.height

    // draw borders of petri dish
    this.worldGraphics.lineStyle(10, 0, 1, 1)
    this.worldGraphics.drawCircle(0,0,World.radius)

    if (world.drawZones) {
      this.worldGraphics.lineStyle(10, 0x00ffff)
      for (const [x,y] of world.getOccupiedZones())
      this.worldGraphics.drawRect(world.zoneSize()*x, world.zoneSize()*y, world.zoneSize(), world.zoneSize())
    }

    //draw energy level bars above nematodes
    if(world.energyBarOn) {
      world.forEachNematode(n => this.DrawEnergyLevel(n));

    }

    // draw the selected nematode's neural network and stats
    if (world.selectedNematode != null){

      // If the selected nematode still exists, draw its stats and neural network
      if (world.selectedNematode.exists) {
        this.nematodeStatsMenuObj.DrawBackground(this.screenGraphics);
        world.selectedNematode.DrawStats(this.nematodeStatsMenuObj);
        world.selectedNematode.nn.DrawNN(this.screenGraphics);
      }
      // If the selected nematode no longer exists, deselect it
      else {
        this.nematodeStatsMenuObj.MakeInvisible();
        world.selectedNematode = null;
      }
    }
  }

  //Draw a bar above a nematode's head that shows its energy level
  DrawEnergyLevel(nematode) {
    
    //setting variables here is dumb and to be changed later
    var offset_y = 30;
    var bar_height = 0.001
    var bar_width = 30
    //console.log(rect_position);

    let barcolor = 0xbd1111

    this.worldGraphics.beginFill(barcolor);
    this.worldGraphics.lineStyle(5, barcolor);
    this.worldGraphics.drawRect(nematode.sprite.x - (bar_width/2), nematode.sprite.y - offset_y, bar_width, bar_height);
    
    //graphics.drawRect(rect_position.)

  }
}

class NematodeStatsMenu {

  static width = 300;
  static height = 420;
  static xPos = -1;                                  // Left padding
  static yPos = 250;                                 // Top padding

  constructor(graphics){

    // Set based on the screen size
    NematodeStatsMenu.xPos = app.screen.width - NematodeStatsMenu.width - 10;

    // Create a text object for the header
    this.headerText = new PIXI.Text("Nematode Stats", {fontFamily : 'Arial', fontSize: 20, fontWeight: 'bold', fill : 0xffffff, align : 'left'});
    this.headerText.position.set(NematodeStatsMenu.xPos + 25, NematodeStatsMenu.yPos + 10);
    graphics.addChild(this.headerText);

    // Create a text object for the stats
    this.statsText = new PIXI.Text("", {fontFamily : 'Arial', fontSize: 16, fill : 0xffffff, align : 'left', lineHeight: 20});
    this.statsText.position.set(NematodeStatsMenu.xPos + 30, NematodeStatsMenu.yPos + 50);
    graphics.addChild(this.statsText);
  }

  /* Draws the background of the stats menu 
  * @param {PIXI.Graphics} graphics - The graphics object to draw to
  */
  DrawBackground(graphics) {

    // Draw the background
    graphics.beginFill(0x000000, 0.5);
    graphics.drawRoundedRect(NematodeStatsMenu.xPos, NematodeStatsMenu.yPos, NematodeStatsMenu.width, NematodeStatsMenu.height);
    graphics.endFill();

    // Make the text visible
    this.headerText.visible = true;
    this.statsText.visible = true;
  }

  /* Makes the stats menu invisible */
  MakeInvisible() {
    this.headerText.visible = false;
    this.statsText.visible = false;
  }

  
}
