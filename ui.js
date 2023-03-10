
/**
 * 
 * Create a UI slider and return its PIXI.Container
 * 
 * @param {object} opts parameters:
 * {
 * min: minimum value,
 * max: maximum value,
 * default: initial value,
 * length: physical length,
 * fill: color number for the slider fill,
 * bg: background color number for the slider,
 * onChange: function applied to current slider value
 * }
 * 
 * @returns {PIXI.Container}
 */
function mkSlider(opts) {
  let container = new PIXI.Container()

  // draw the background of slider
  let sliderbg = new PIXI.Graphics()
  sliderbg.beginFill(opts.bg)
  sliderbg.drawRoundedRect(0,-2,opts.length,4,10)
  sliderbg.endFill()
  container.addChild(sliderbg)

  // draw the fill of the slider
  let sliderfill = new PIXI.Graphics()
  let drawFill = function() {
    sliderfill.clear()
    sliderfill.beginFill(opts.fill)
    sliderfill.drawRoundedRect(0,-2,knob.x,4,10)
    sliderfill.endFill()
  }
  container.addChild(sliderfill)

  // create knob sprite
  let knobGraphics = new PIXI.Graphics()
  knobGraphics.beginFill(0x333333)
  knobGraphics.drawCircle(0,0,8)
  knobGraphics.endFill()
  knobGraphics.beginFill(0xFFFFFF)
  knobGraphics.drawCircle(0,0,5)
  knobGraphics.endFill()
  let knob = new PIXI.Sprite(app.renderer.generateTexture(knobGraphics))
  knob.anchor.set(0.5)
  knob.interactive = true
  container.addChild(knob)

  let range = opts.max - opts.min

  // retrieve the value of the slider from the position of the knob
  let getValue = () => (range/opts.length)*knob.x + opts.min

  // set initial knob position
  knob.x = (opts.default-opts.min)*opts.length/range
  drawFill()

  let moveKnob = function(dx) {
    let initialX = knob.x
    knob.position.addXY(dx, 0).clamp([0, opts.length], [0,0])
    if (knob.x != initialX) {
      opts.onChange(getValue())
      drawFill()
    }
  }

  createDragAction(knob, knob,
      null,
      (dx,dy) => moveKnob(dx),
      null
  )

  return container
}