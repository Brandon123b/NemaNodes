
// TODO move button and slider constructors into their own class to support methods more easily

/**
 * Create a UI circle that can be manipulated
 * 
 * @param {number} radius radius of sprite
 * @param {number} fillColor color number
 * @param {number} borderColor color number
 * @param {number} borderPct percentage of the circle taken up by border 
 * @returns {PIXI.Sprite}
 * 
 */
function mkCircle(radius, fillColor, borderColor, borderPct, fillAlpha, borderAlpha) {
  let g = new PIXI.Graphics()

  // draw the circle
  let draw = () => {
    g.clear()
    // draw inner circle
    g.beginFill(fillColor, fillAlpha)
    g.drawCircle(0,0,(1-borderPct)*radius)
    g.endFill()
    // draw border
    g.lineStyle(borderPct*radius,borderColor,borderAlpha,0)
    g.drawCircle(0,0,radius)
    g.hitArea = new PIXI.Circle(0,0,radius)
  }
  
  // apply blur filter to make circle less pixelated
  g.filters = [new PIXI.BlurFilter(0.3)]
  draw()
  let container = new PIXI.Container()
  container.addChild(g)

  // add methods to redraw the circle for interaction purposes
  container.setRadius =       r => {radius = r; draw()}
  container.setFillColor =    c => {fillColor = c; draw()}
  container.setBorderColor =  c => {borderColor = c; draw()}
  container.setBorderPct =    pct => {borderPct = pct; draw()}
  container.setFillAlpha =    a => {fillAlpha = a; draw()}
  container.setBorderAlpha =  a => {borderAlpha = a; draw()}

  return container
}


/**
 * 
 * Create a UI slider and return its PIXI.Container.
 * This is an interactive object that the user can drag to manipulate a value
 * 
 * @param {object} opts parameters:
 * {
 * min: minimum value,
 * max: maximum value,
 * default: initial value,
 * length: physical length,
 * fill: color source for the slider fill,
 * bg: background color source for the slider,
 * onChange: function applied to current slider value
 * }
 * 
 * @returns {PIXI.Container}
 */
function mkSlider(opts) {
  opts = fillDefaults(opts || {}, {
    min: 0,
    max: 100,
    default: 50,
    length: 100,
    fill: 0xffffff,
    bg: 0x000000,
    onChange: () => {}
  })

  let container = new PIXI.Container()

  // draw the background of slider
  let sliderbg = new PIXI.Graphics()
  sliderbg.lineStyle(2,opts.bg)
  sliderbg.drawRoundedRect(0,-3,opts.length,6,10)
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
  let knob = mkCircle(9,opts.fill,opts.bg,0.2)
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
      opts.onChange(getValue(), knob.x)
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
 * Create a button/toggle UI element
 * 
 * @param {object} opts parameters:
 * {
 * radius: radius of button
 * fill: color source of button
 * activeFill: color source of button when it is activated
 * bg: color number of button background
 * onToggle: function (boolean) => ... to apply when button is enabled/disabled
 * toggled: boolean for initial state
 * fillAlpha: alpha value of button
 * activeFillAlpha: alpha value when active
 * }
 */
function mkButton(opts) {
  opts = fillDefaults(opts || {}, {
    radius: 10,
    fill: 0xffffff,
    activeFill: 0xffffff,
    bg: 0x000000,
    onToggle: () => {},
    toggled: false,
    fillAlpha: 1,
    activeFillAlpha: 1
  })

  let container = new PIXI.Container()

  // initial state
  let toggled = opts.toggled
  // retrieve the correct fill color and alpha values according to current state
  let fill = () => toggled ? opts.activeFill : opts.fill
  let alpha = () => toggled ? opts.activeFillAlpha : opts.fillAlpha

  // create inner circle for button
  let btn = mkCircle(opts.radius, fill(), opts.bg, 0.25, alpha(), 1)
  btn.interactive = true
  container.addChild(btn)

  // create effect of darkening button when pressed and
  // tinting it according to its status
  let btnfilter = new PIXI.ColorMatrixFilter()
  btn.filters = [btnfilter]

  // toggle button state
  let toggle = () => {
    toggled = !toggled
    opts.onToggle(toggled)
    btn.setFillColor(fill())
    btn.setFillAlpha(alpha())
  }

  // on mouse down, darken and shrink inner circle
  let onPress = function() {
    btnfilter.brightness(0.75, false)
    btn.setBorderPct(0.4)
    app.stage.on("pointerup", onUp)
    app.stage.on("pointerupoutside", onUp)
  }

  // on mouse up, perform toggle action
  let onUp = function() {
    btnfilter.brightness(1, false)
    toggle()
    btn.setBorderPct(0.25)
    app.stage.off("pointerup", onUp)
    app.stage.off("pointerupoutside", onUp)
  
  }

  btn.on("pointerdown", onPress)

  // make button pop out on mouse hover
  btn.on("mouseover", () => {
    container.scale.x *= 1.1
    container.scale.y *= 1.1 
  })
  btn.on("mouseout", () => {
    container.scale.x /= 1.1
    container.scale.y /= 1.1 
  })
  
  // make another container so there's no scaling conflicts created by mouse hover
  let outerContainer = new PIXI.Container()
  outerContainer.addChild(container)

  // create methods for toggling and getting status
  outerContainer.toggled = () => toggled
  outerContainer.toggle = toggle

  return outerContainer
}


class UICard {
  constructor(width) {
    this.container = new PIXI.Container()
    this.width = width
    this.margin = 5
    // track the next y-position for the next UI element in this card to be added
    this.nextPos = this.margin

    this.card = new PIXI.Graphics()

    this.container.addChild(this.card)

    this.textStyle = new PIXI.TextStyle({
      wordWrap: true,
      wordWrapWidth: this.width - this.margin*2
    })
  }

  // return the container for this UI card
  make() {
    let height = this.nextPos + this.margin
    // transparent bluish background to mimic glass
    this.card.beginFill(0x8888ff,0.25)
    this.card.drawRoundedRect(0,0,this.width,height,10)
    this.card.endFill()
    // black border
    this.card.lineStyle(2,0)
    this.card.drawRoundedRect(0,0,this.width,height,10)
    
    this.card.interactive = true
    createDragAction(this.card, this.container)

    return this.container
  }

  #addElement(element, x) {
    this.container.addChild(element)
  
    element.y = this.nextPos + element.height/2
    element.x = this.margin + x

    this.nextPos = element.y + element.height/2 + this.margin
  }

  #buttonElement(onClick, label, toggled) {
    let btnContainer = new PIXI.Container()

    // are we creating a toggle button
    let isToggle = toggled != undefined

    let btn = mkButton({
      radius: 8,
      fill: 0x8888ff,
      activeFill: isToggle ? 0 : 0x8888ff,
      bg: 0,
      onToggle: onClick,
      toggled: isToggle ? toggled : false,
      fillAlpha: 0.35,
      activeFillAlpha: isToggle ? 1 : 0.35
    })
    btnContainer.addChild(btn)

    if (label) {
      let text = new PIXI.Text(label, {
        wordWrap: true,
        wordWrapWidth: this.width - btn.width - this.margin*2,
        fontSize: btn.height
      })

      text.x += this.margin + (btn.width/2)
      text.y = -text.height/2
      btnContainer.addChild(text)
    } 

    this.#addElement(btnContainer, btn.width/2)
  }

  addText(string, fontsize) {
    let sty = this.textStyle.clone()
    sty.fontSize = fontsize
    let text = new PIXI.Text(string, sty)
    console.log(text.pivot.y)
    text.pivot.y = -text.height/2
    this.#addElement(text, 0)
    return this
  }

  addButton(onClick, label) {
    this.#buttonElement(onClick, label)
    return this
  }

  addToggle(onToggle, label, enabled) {
    this.#buttonElement(onToggle, label, enabled)
    return this
  }

  addSlider(onChange, min, max, initial, label) {
    let sliderContainer = new PIXI.Container()

    let labelText = new PIXI.Text(label + ": " + initial, {
      wordWrap: true,
      wordWrapWidth: this.width - this.margin*2,
      fontSize: 18
    })

    labelText.x += this.margin
    labelText.y = -labelText.height/2
    sliderContainer.addChild(labelText)

    // when moving the slider knob, carry out action
    // also manipulate the value label
    let onSliderChange = function(val) {
      onChange(val)
      labelText.text = label + ": " + val
    }

    let s = mkSlider({
      onChange: onSliderChange,
      min: min,
      max: max,
      default: initial,
      length: this.width - this.margin*2,
      fill: 0,
      bg: 0
    })

    s.y += labelText.height/2 + this.margin
    sliderContainer.addChild(s)

    this.#addElement(sliderContainer, 0)
    return this
  }
}