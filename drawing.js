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
  this.container = new PIXI.Sprite(PIXI.Texture.WHITE)
  this.container.width = app.screen.width
  this.container.height = app.screen.height
  
  // make the background pink
  this.container.tint = 0xff3333
  this.container.interactive = true // mark interactive to register mouse wheel
  app.stage.addChild(this.container)
  this.container.on('pointerdown', e => {
    console.log(e.data.global.x, e.data.global.y)
    console.log(this.screen2WorldPos(new PIXI.Point(e.data.global.x, e.data.global.y)))
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
