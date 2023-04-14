/**
 * This class contains the PIXI container that holds the sprites for world objects.
 * It also handles:
 *  - some user interactions (world panning/zooming, pausing game)
 *  - graphics drawing in the world space and the screen space (for debugging mostly)
 */
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

    // add a highlight circle to easily identify the location of the selected nematode
    this.highlightCircle = new PIXI.Graphics()
    this.highlightCircle.beginFill(0xff0000, 0.5)
    this.highlightCircle.drawCircle(0,0,10,10)
    this.highlightCircle.endFill()
    this.highlightCircle.visible = false
    addBlur(this.highlightCircle, 5)
    this.container.addChild(this.highlightCircle)
    // start ticker action that updates the highlight circle
    app.ticker.add(() => {
      if (world.selectedNematode && world.selectedNematode.exists) {
        this.highlightCircle.visible = true
        this.highlightCircle.position = world.selectedNematode.GetPosition()
      } else {
        this.highlightCircle.visible = false
      }
    })

    // Create the fps counter
    this.CreateFpsCounter();

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
      
      // scale the highlight circle based on zoom level to easily find selected nematode
      let hCircleMult = 2/this.camera.zoomLevel
      let bounds = [1, 10]
      this.highlightCircle.scale.set(hCircleMult).clamp(bounds, bounds)
    }

    this.backGround.onwheel = onScroll
    this.container.onwheel = onScroll


    this.CreatePauseAction()


    //Settings for drawing energy levels above nematodes
    this.ebar_offset_y = 30;
    this.ebar_height = 0.001;
    this.ebar_max_length = 30;

    //colors for the energy bars
    this.ebarcolor_low = 0xbd1111;
    this.ebarcolor_mid = 0xfcd303;
    this.ebarcolor_high = 0x0339fc;

    // glow filter to apply to highlighted nematodes
    this.nematodeGlow = new PIXI.filters.GlowFilter({
      // extra options
    })
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

  // pause the game on space bar and display pause symbol
  CreatePauseAction() {
    // create Pause action
    let pHeight = 100
    let pWidth = 40
    let pMargin = 25
    let pauseSymbol = new PIXI.Graphics()
    pauseSymbol.beginFill(0xffffff)
    pauseSymbol.drawRect(0,0,pWidth,pHeight)
    pauseSymbol.drawRect(pWidth+pMargin,0,pWidth,pHeight)
    pauseSymbol.pivot.set(pWidth+pMargin/2, pHeight)
    app.stage.addChild(pauseSymbol)
    
    let setPauseSymbol = () => {
        pauseSymbol.visible = paused
        pauseSymbol.x = app.screen.width/2
        pauseSymbol.y = app.screen.height-pMargin
    }

    setPauseSymbol()
    // pause/unpause when the space bar is pressed
    Keys.addAction("Space", () => {
        paused = !paused
        setPauseSymbol()
    })
  }

  // Create the fps counter
  CreateFpsCounter(){
    
    // Keeps a moving average of the fps (This smooths out the fps counter)
    this.movingFps = 60;
          
    // Create the fps counter
    this.fpsCounter = new PIXI.Text("FPS: 0", {fontFamily : 'Arial', fontSize: 20, fill : 0x00FF00, align : 'center'});
    this.fpsCounter.x = 10;
    this.fpsCounter.y = 8;

    // Make the border thicker
    this.fpsCounter.style.strokeThickness = 2;

    // Set the border to black
    this.fpsCounter.style.stroke = 0x000000;

    // Add the fps counter to the stage
    app.stage.addChild(this.fpsCounter);
  }

  // Update the fps counter
  UpdateFpsCounter(delta){
    
    // Update the moving fps (Uses the last 20 frames)
    this.movingFps = this.movingFps * 0.95 + 1 / delta * 0.05;

    // Get the hours, minutes, and seconds since the start of the simulation
    const hour = Math.floor(timeSinceStart / 3600);
    const minute = Math.floor((timeSinceStart % 3600) / 60);
    const second = Math.floor(timeSinceStart % 60);

    // Format the time string
    const timeString = hour.toFixed(0) + ":" + minute.toFixed(0).padStart(2, '0') + ":" + second.toFixed(0).padStart(2, '0');

    this.fpsCounter.text =  "FPS: " + (this.movingFps).toFixed(1) +
                            " | Time: " + timeString +
                            " | Nematodes: " + world.numNematodes() +
                            " | Food: " + world.numFood();
  }
  
  // Draws the border, zones, and nematode stats/nn (if needed) (called every frame)
  drawWorld(delta) {
    // resize the background if window changes
    this.backGround.width = app.screen.width
    this.backGround.height = app.screen.height

    // draw borders of petri dish
    this.worldGraphics.lineStyle(10, 0, 1, 1)
    this.worldGraphics.drawCircle(0,0,World.radius)

    // draw the zones (if enabled)
    if (world.drawZones) {
      this.worldGraphics.lineStyle(10, 0x00ffff)
      for (const [x,y] of world.getOccupiedZones())
      this.worldGraphics.drawRect(world.zoneSize()*x, world.zoneSize()*y, world.zoneSize(), world.zoneSize())
    }

    world.forEachNematode(n => {
      //draw energy level bars above nematodes
      if (world.energyBarOn) this.DrawEnergyLevel(n)
      if (world.selectedNematode)
      // TODO have nematodes reference the same Species object held in World
        if (world.selectedNematode.species == n.species)
          addFilter(n.GetDisplayObject(), this.nematodeGlow, true)
        else
          removeFilter(n.GetDisplayObject(), this.nematodeGlow)

    })

    if (world.selectedNematode != null){
      if (world.selectedNematode.exists) {
        if (world.drawSmell)
          this.DrawSmellRange(world.selectedNematode);
      }
    }

    // Update the fps counter
    this.UpdateFpsCounter(delta);
  }

  //Draw a bar above a nematode's head that shows its energy level
  DrawEnergyLevel(nematode) {

    //Scale bar as a ratio of nematode's energy
    let ebar_ratio = nematode.energy / nematode.maxEnergy;
    //Set color based on nematode's energy percentage
    let barcolor = this.ebarcolor_high;
    if(ebar_ratio < 0.33) {
      barcolor = this.ebarcolor_low;
    }
    else if (ebar_ratio < 0.66) {
      barcolor = this.ebarcolor_mid;
    }

    //Draw the energy bar
    this.worldGraphics.beginFill(barcolor);
    this.worldGraphics.lineStyle(5, barcolor);
    this.worldGraphics.drawRect(
      nematode.GetX() - (this.ebar_max_length * ebar_ratio/2),
      nematode.GetY() - this.ebar_offset_y,
      this.ebar_max_length * ebar_ratio,
      this.ebar_height);   
    
  }

  /* Draws the nematodes smell range to the given graphics object */
  DrawSmellRange(nematode) {

    // Set a border to green with a width of 1 pixel and an alpha
    this.worldGraphics.lineStyle(1, 0x00FF00, .2);

    // set the fill color to red and the alpha
    this.worldGraphics.beginFill(0xff0000, .1);

    // Draw a circle with the given radius
    this.worldGraphics.drawCircle(nematode.GetX(), nematode.GetY(), Nematode.MAX_SMELL_DISTANCE);
  }
}

