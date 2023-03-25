/**
 * Code for creating UI elements
 * 
 * mkButton and mkSlider for creating individual UI elements
 * 
 * UICard is a constructor for a UI dash
 */



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
  addBlur(g, 0.3)

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
 * increment: increment when changing value
 * length: physical length,
 * fill: color source for the slider fill,
 * bg: background color source for the slider,
 * fillAlpha: alpha of fill color,
 * bgAlpha: alpha of background,
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
    increment: 1,
    length: 100,
    fill: 0xffffff,
    bg: 0x000000,
    onChange: () => {}
  })

  let container = new PIXI.Container()
  let value = opts.default

  // draw the background of slider
  let sliderbg = new PIXI.Graphics()
  sliderbg.lineStyle(2,opts.bg,opts.bgAlpha)
  sliderbg.drawRoundedRect(0,-3,opts.length,6,10)
  container.addChild(sliderbg)

  // draw the fill of the slider
  let sliderfill = new PIXI.Graphics()
  let drawFill = function() {
    sliderfill.clear()
    sliderfill.beginFill(opts.fill, opts.fillAlpha)
    sliderfill.drawRoundedRect(0,-2,knob.x,4,10)
    sliderfill.endFill()
  }
  container.addChild(sliderfill)

  // create knob sprite
  let knob = mkCircle(8,opts.fill,opts.bg,0.2,opts.fillAlpha, opts.bgAlpha)
  knob.interactive = true
  container.addChild(knob)

  let range = opts.max - opts.min

  // quantize the slider value to the increment
  let quantize = x => {
    let fraction = opts.increment.toString().split('.')[1]
    let precision = fraction ? fraction.length : 0

    // truncate the calculated float value because of funky float math
    let floatVal = Math.floor((x-opts.min)/opts.increment)*opts.increment + opts.min
    return Number.parseFloat(floatVal.toFixed(precision))
  }

  // retrieve the unquantized value converted from knob position
  let getValue = (knobx) => (range/opts.length)*knobx + opts.min

  knob.x = (value-opts.min)*opts.length/range
  drawFill()

  let moveKnob = function(x) {
    let initialValue = value
    knob.x = x
    knob.position.clamp([0,opts.length], [0,0])
    value = quantize(getValue(knob.x))
    drawFill()
    
    if (value != initialValue)
      opts.onChange(value, knob.x)
  }

  createDragAction(knob, knob,
      null,
      (dx,dy,x,y) => moveKnob(x),
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

  let actions = [opts.onToggle]
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
  let toggle = (enabled) => {
    toggled = enabled
    for (action of actions)
      action(toggled)
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
    toggle(!toggled)
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
  outerContainer.addAction = (action) => actions.push(action)

  return outerContainer
}

/**
 * Rectangular list view of UI elements
 * 
 * Meant to be constructed by chaining together methods like addToggle(..) and addSlider(..)
 * 
 * Call make() to create and retrieve this UI card's container
 * 
 */
class UICard {
  constructor(width, maxHeight = 500) {
    this.container = new PIXI.Container()
    this.width = width
    this.maxHeight = maxHeight
    this.margin = 15
    this.padding = 5
    // track the next y-position for the next UI element in this card to be added
    this.nextPos = this.margin

    // TODO make these fields as arguments if this is class is used anywhere else
    this.opacity = 0.6
    this.color = 0x0
    this.trim = 0x00cc00
    this.trimOpacity = 1

    // graphics object for background
    this.card = new PIXI.Graphics()

    // content container for the actual content
    this.content = new PIXI.Container()

    this.container.addChild(this.card)
    this.container.addChild(this.content)

    this.textStyle = new PIXI.TextStyle({
      wordWrap: true,
      wordWrapWidth: this.width - this.margin*2,
      fontSize: 18,
      fontFamily: "Courier New",
      fontVariant: "small-caps",
      fontWeight: "bold",
      letterSpacing: 2,
      fill: this.trim
    })

    // scroll contents with the mousewheel
    this.container.onwheel = e => {
      const scroll = e.deltaY
      if (scroll > 0)
        this.content.y -= 15
      else
        this.content.y += 15
      
      this.content.position.clamp([0,0], [Math.min(this.container.height - this.nextPos - this.margin,0),0])
    }
  }

  // return the container for this UI card
  make(rounded = true) {
    let cornerRadius = rounded ? 10 : 0
    let height = Math.min(this.nextPos + this.margin, this.maxHeight)
    // transparent bluish background to mimic glass
    this.card.beginFill(this.color,this.opacity)
    this.card.drawRoundedRect(0,0,this.width,height,cornerRadius)
    this.card.endFill()
    // border
    // this.card.lineStyle(2,this.trim,this.trimOpacity)
    // this.card.drawRoundedRect(0,0,this.width,height,cornerRadius)
    
    this.card.interactive = true

    addBlur(this.card, 0.5)

    // create a mask to hide contents that overflow due to scrolling
    let rect = new PIXI.Graphics()
    rect.beginFill()
    rect.drawRect(0,0,this.width,this.maxHeight)
    rect.endFill()
    this.content.mask = rect
    this.container.addChild(rect)

    return this.container
  }

  // create a new TextStyle object using the this.textStyle for defaults
  #textStyle(opts) {
    let sty = this.textStyle.clone()
    for (const prop in opts)
    if (opts[prop] != undefined)
    sty[prop] = opts[prop]
    return sty
  }

  // add the given UI element to the next row on the card
  #addElement(element) {
    this.content.addChild(element)
    element.y = this.nextPos
    element.x = this.margin
    // update starting y position for next element
    this.nextPos = element.y + element.height + this.padding
  }

  // call this to start adding a mutually exclusive group of toggle buttons
  startToggleGroup() {
    this.toggleGroup = []
    return this
  }

  // add callbacks to all toggle buttons in the group so that they are mutually exclusive
  endToggleGroup() {
    for (const toggle1 of this.toggleGroup)
    for (const toggle2 of this.toggleGroup)
    if (toggle1 != toggle2)
    toggle1.addAction(enabled => {
      if (enabled) toggle2.toggle(false)
    })
    this.toggleGroup = null
    return this
  }

  // add a button element to the UI card
  #buttonElement(onClick, label, toggled) {
    let btnContainer = new PIXI.Container()

    // are we creating a toggle button
    let isToggle = toggled != undefined

    let btn = mkButton({
      radius: 8,
      fill: this.color,
      activeFill: isToggle ? this.trim : this.color,
      bg: this.trim,
      onToggle: onClick,
      toggled: isToggle ? toggled : false,
      fillAlpha: this.opacity,
      activeFillAlpha: isToggle ? this.trimOpacity : this.opacity
    })
    btnContainer.addChild(btn)
    btn.position.set(btn.width/2)
    
    // is this button part of a group of mutually exclusive toggles
    if (this.toggleGroup) this.toggleGroup.push(btn)

    if (label) {
      let text = new PIXI.Text(label, this.#textStyle({
        wordWrapWidth: this.width - btn.width - this.margin*2,
        fontSize: btn.height
      }))

      text.x = btn.x + btn.width
      text.y = -1 // small tweak
      btnContainer.addChild(text)
    } 

    this.#addElement(btnContainer)
  }

  // add text to the next row with the given size
  addText(string, fontsize) {
    let text = new PIXI.Text(string, this.#textStyle({
      fontSize: fontsize
    }))
    this.#addElement(text)
    return this
  }

  // add a button to the UI card that performs some action on click
  addButton(onClick, label) {
    this.#buttonElement(onClick, label)
    return this
  }

  // add a checkbox toggle button that performs some action
  // onToggle: (boolean) => ...
  // enabled: initial state
  addToggle(onToggle, label, enabled) {
    this.#buttonElement(onToggle, label, enabled)
    return this
  }

  /**
   * Add a slider element to this UI
   * @param {function} onChange function applied to the sliders value 
   * @param {number} min minimum value for slider
   * @param {number} max maximum value for slider
   * @param {number} initial initial value for slider
   * @param {number} increment
   * @param {string} label 
   * @returns 
   */
  addSlider(onChange, min, max, initial, increment, label) {
    let sliderContainer = new PIXI.Container()

    let labelText = new PIXI.Text(label + ": " + initial, this.#textStyle())

    labelText.x += this.margin
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
      increment: increment,
      length: this.width - this.margin*2,
      fill: this.trim,
      fillAlpha: this.trimOpacity,
      bg: 0,
      bgAlpha: 0
    })

    s.y += labelText.height + this.padding
    sliderContainer.addChild(s)

    this.#addElement(sliderContainer, 0)
    return this
  }
}