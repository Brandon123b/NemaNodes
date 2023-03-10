
/**
 * Create a circle sprite
 * 
 * @param {number} radius radius of sprite
 * @param {number} fillColor 
 * @param {number} borderColor 
 * @param {number} borderPct percentage of the circle taken up by border 
 * @returns {PIXI.Sprite}
 */
function circleSprite(radius, fillColor, borderColor, borderPct) {
  let g = new PIXI.Graphics()
  g.beginFill(borderColor)
  g.drawCircle(0,0,radius)
  g.endFill()
  g.beginFill(fillColor)
  g.drawCircle(0,0,(1-borderPct)*radius)
  g.endFill()
  let circ = new PIXI.Sprite(app.renderer.generateTexture(g))
  circ.anchor.set(0.5)
  circ.hitArea = new PIXI.Circle(0,0,radius)
  return circ
}

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
  sliderbg.drawRoundedRect(0,-3,opts.length,6,10)
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
  let knob = circleSprite(8,opts.fill,opts.bg,0.2)
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


/**
 * 
 * @param {object} opts parameters:
 * {
 * radius: radius of button
 * fill: color number of button
 * activeFill: color number of button when it is activated
 * bg: color number of button background
 * onToggle: function (boolean) => ... to apply when button is enabled/disabled
 * toggled: boolean for initial state
 * }
 */
function mkButton(opts) {
  let container = new PIXI.Container()

  // initial state
  let toggled = opts.toggled

  // background button sprite
  let bgbtn = circleSprite(opts.radius,opts.bg,0,0)
  container.addChild(bgbtn)

  // create button sprite
  let btn = circleSprite(opts.radius*0.8, 0xffffff, 0, 0)
  btn.interactive = true
  btn.tint = toggled ? opts.activeFill : opts.fill
  container.addChild(btn)

  // create effect of pushing button by shrinking and darkening it
  let initialScale = btn.scale.clone()
  let btnfilter = new PIXI.ColorMatrixFilter()
  btn.filters = [btnfilter]
  
  let onPress = function() {
    btnfilter.brightness(0.75, false)
    btn.scale = initialScale.multiplyScalar(0.85)
    toggled = !toggled
    opts.onToggle(toggled)
    app.stage.on("pointerup", onUp)
    app.stage.on("pointerupoutside", onUp)
  }

  let onUp = function() {
    btnfilter.brightness(1, false)
    btn.tint = toggled ? opts.activeFill : opts.fill
    btn.scale.set(initialScale.x, initialScale.y)
    app.stage.off("pointerup", onUp)
    app.stage.off("pointerupoutside", onUp)
    
  }

  btn.on("pointerdown", onPress)
  
  return container
}
