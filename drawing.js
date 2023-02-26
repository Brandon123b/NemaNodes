/**
Canvas is a container that fills the screen


*/
class Canvas {
  constructor() {

  this.camera = {
    center : new PIXI.Point(0,0), // this should be the world coordinates that the screen is centered on
    zoomLevel : 1,
    maxZoomLevel : 100,
    minZoomLevel : 0.05
  }
  

  // position container for whole screen
  this.container = new PIXI.Container();



  // TODO: LOOK AT THIS
  // You should try to get a background seperate from the container 
  // If you want to have the background scalable, you should find a way to do that seperatly
  // You can do this by making a seperate sprite and adding it to the container
  // You may be able to scale the container to zoom in and out, but you will have to figure out how to do that
  // There may also be issues with blurryness when you scale the container (I'm not sure)
  // Seems to only zoom with mouse over this container background. Something to consider
  var backGround = new PIXI.Sprite(PIXI.Texture.WHITE);
  backGround.width = 200;
  backGround.height = 200;
  backGround.tint = 0xff3333;
  this.container.addChild(backGround);


  //this.container.width = app.screen.width (This was your error)
  //this.container.height = app.screen.height (This was your error)
  

  console.log("Container position: (" + this.container.position.x + ", " + this.container.position.y + ")");
  console.log("Container width: " + this.container.width);
  console.log("Container height: " + this.container.height);
  console.log("Container scale: " + this.container.scale.x + ", " + this.container.scale.y);

  // make the background pink
  this.container.tint = 0xff3333
  this.container.interactive = true // mark interactive to register mouse wheel
  app.stage.addChild(this.container)
  this.container.on('pointerdown', e => {
    console.log("Screen Pos of click: (" + e.data.global.x + ", " + e.data.global.y + ")");
	var screenPos = new PIXI.Point(e.data.global.x, e.data.global.y);
	var worldPos = this.screen2WorldPos(screenPos);
	console.log("World Pos of click: (" + worldPos.x + ", " + worldPos.y + ")");
  })

  // on mouse wheel, change the scale of the view
  this.container.onwheel = e => {
    const scroll = e.deltaY
    if (scroll > 0)
      this.camera.zoomLevel *= 0.9
    else
      this.camera.zoomLevel *= 1.1
  }

  }

  // take a world point and convert it to a point on the screen
  world2ScreenPos(worldPoint) {
    return worldPoint.subtract(this.camera.center).multiplyScalar(this.camera.zoomLevel)
  }

  // take a point on the screen and convert to world space
  screen2WorldPos(screenPoint) {
    return screenPoint.multiplyScalar(1/this.camera.zoomLevel).add(this.camera.center)
  }

  // for each object in the world, change its sprite position in the view container
  // and scale the sprite correctly
  drawWorld(world) {
    world.forEach(o => {
      o.sprite.position = this.world2ScreenPos(o.worldPos)
      o.sprite.scale.set(this.camera.zoomLevel)
    });
  }

}
