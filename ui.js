/**
 * Code for creating UI elements
 * 
 * mkButton and mkSlider for creating individual UI elements
 * 
 * UICard is a constructor for a UI dash
 * 
 * Monitor class for displaying UICards on the virtual monitor
 * 
 * Public facing classes: UICard, Monitor
 * 
 * Public facing functions:
 *  displaySelectedNematode
 * 
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
 * required: true if clicking on the button when it is already active should do nothing
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
    required: false,
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
    btn.setFillColor(fill())
    btn.setFillAlpha(alpha())
    for (action of actions)
      action(toggled)
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
    btn.setBorderPct(0.25)
    app.stage.off("pointerup", onUp)
    app.stage.off("pointerupoutside", onUp)
    if (!(opts.required && toggled)) toggle(!toggled)
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
  constructor(width, height = 500) {
    this.container = new PIXI.Container()
    this.width = width
    this.height = height
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

    // make a scroll bar for the content
    let scrollBarWidth = 5
    this.scrollBarHeight = 10 // minimum scroll bar height
    this.scrollBar = new PIXI.Graphics()
    this.scrollBar.beginFill(this.trim)
    this.scrollBar.drawRect(0,0,scrollBarWidth,this.scrollBarHeight)
    this.scrollBar.endFill(this.trim)
    this.scrollBar.x = this.width-scrollBarWidth
    this.container.addChild(this.scrollBar)

    // scroll contents with the mousewheel
    this.container.onwheel = e => {
      const scroll = e.deltaY
      if (scroll > 0)
        this.content.y -= 15
      else
        this.content.y += 15
      
      let topY = this.container.height - this.nextPos - this.margin
      this.content.position.clamp([0,0], [Math.min(this.container.height - this.nextPos - this.margin,0),0])
      // slide scroll bar
      this.scrollBar.height = clamp(this.height*this.height/this.content.height,this.scrollBarHeight,this.height)
      this.scrollBar.y = (this.content.y/topY)*(this.height-this.scrollBar.height)
    }
  }

  // return the container for this UI card
  make(rounded = true) {
    let cornerRadius = rounded ? 10 : 0
    // transparent bluish background to mimic glass
    this.card.beginFill(this.color,this.opacity)
    this.card.drawRoundedRect(0,0,this.width,this.height,cornerRadius)
    this.card.endFill()
    
    this.card.interactive = true

    addBlur(this.card, 0.5)

    // create a mask to hide contents that overflow due to scrolling
    let rect = new PIXI.Graphics()
    rect.beginFill()
    rect.drawRect(0,0,this.width,this.height)
    rect.endFill()
    this.content.mask = rect
    this.container.addChild(rect)

    // initialize scroll bar height
    this.scrollBar.height = clamp(this.height*this.height/this.content.height,this.scrollBarHeight,this.height)

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
      activeFillAlpha: isToggle ? this.trimOpacity : this.opacity,
      required : this.toggleGroup ? true : false  // if part of a toggle group, then the button can only be disabled when its neighbor is clicked
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

  /**
   * Add an arbitrary displayObject to this UI card
   * @param {PIXI.DisplayObject} displayObject 
   */
  addElement(displayObject) {
    // TODO scale down the displayObject if needed
    let container = new PIXI.Container()
    container.addChild(displayObject)

    const ratio = (this.width - this.margin*2) / container.width
    container.scale.multiplyScalar(ratio, container.scale)

    this.#addElement(container)
    return this
  }
}

/**
 * Create a display object for a nematode
 * 
 * Call .updateNematodeDisplay() to redraw the NN node activations
 * and nematode stats
 * @param {Nematode} nematode
 * @returns nematode display object to be placed in UI monitor
 * 
 * TODO possibly change this so it works on a nematode that is destroyed
 */
function mkNematodeDisplay(nematode) {
  let container = new PIXI.Container()
  let sprite = PIXI.Sprite.from("Bibite.png") // TODO change this to get the correct sprite
  sprite.anchor.set(0.5)
  sprite.tint = nematode.sprite.tint

  let brain = NNDisplay.mkNNDisplay(nematode.nn)
  container.addChild(sprite)
  container.addChild(brain)

  // change sprite scale to match the NN display
  sprite.scale.multiplyScalar(brain.height / sprite.height, sprite.scale)
  sprite.position.set(sprite.width/2, sprite.height/2)
  brain.x = sprite.x + sprite.width/2 + 10

  // refresh the display by redrawing the NN
  container.updateNematodeDisplay = () => {
    brain.updateNNDisplay()
    sprite.angle = nematode.sprite.angle
  }

  return container
}

/**
 * The UI Monitor that resembles old computer
 * 
 * The monitor uses UICards as windows
 */
class Monitor {

  static screens = {}               // screens keyed by string identifiers
  static currentScreen = undefined  // name of the current screen
  static container = undefined      // container to add UICards to
  static scalingMonitor = false     // flag set to true while monitor scale is changing during animation

  // temporary controls for monitor UI
  // use arrow keys to switch between screens
  static {
    const changeScreen = right => {
      const screenNames = Object.keys(Monitor.screens)
      const i = screenNames.indexOf(Monitor.currentScreen)
      let next = (right ? i+1:i-1)
      next = next < 0 ? screenNames.length-1 : next
      next %= screenNames.length
      Monitor.switchTo(screenNames[next])
    }
    Keys.addAction("ArrowRight", _ => changeScreen(true))
    Keys.addAction("ArrowLeft", _ => changeScreen(false))
  }

  // filters placed on the monitor screen
  static filters = [
    new PIXI.filters.CRTFilter({
      vignetting: 0,
      lineWidth: 3,
      curvature: 2,
      noise: 0.2,
      noiseSize: 3
    }),
    new PIXI.filters.GlitchFilter({
      fillMode: PIXI.filters.GlitchFilter.CLAMP,
      offset: 2,
      red: [0,1],
      blue: [-1,1],
      green: [1,-1]
    })
  ]
    
  // min y value for container position
  static topPos() {
    return app.screen.height - 20
  }

  // max y value for container position
  static bottomPos() {
    return app.screen.height + 300
  }

  // move monitor position up
  static pullup() {
    transition(this.container.position, {y: this.topPos()}, 400)
  }

  // move monitor position down
  static putaway() {
    transition(this.container.position, {y: this.bottomPos()}, 400)
  }

  // scale up the monitor
  static blowup() {
    this.scalingMonitor = true
    transition(this.container.scale, {x:2, y:2}, 400, {
      onComplete: () => this.scalingMonitor = false
    })
  }

  // scale down the monitor
  static shrink() {
    this.scalingMonitor = true
    transition(this.container.scale, {x:1, y:1}, 400, {
      onComplete: () => this.scalingMonitor = false
    })
  }

  // create display object for the monitor
  static mkMonitor() {
    let monitor = PIXI.Sprite.from("monitor-nobg.png")
    monitor.scale.set(0.25)
    // hardcode monitor position to place well on left side of screen
    monitor.position.x = -80

    let container = new PIXI.Container()
    container.addChild(monitor)

    // set the container's position to be the bottom left corner of the monitor
    container.pivot.set(15,460)
    
    // initialize monitor position to bottom
    container.y = this.bottomPos()
    container.x = 30

    monitor.interactive = true

    // create mouse interactions
    // click to scale up the monitor
    // hover to pull it up
    let blownup = false
    container.onmouseover = () => {blownup || this.scalingMonitor || this.pullup()}
    container.onmouseout = () => {blownup || this.scalingMonitor || this.putaway()}
    monitor.onmousedown = () => {
        if (blownup) {
            this.shrink()
            this.putaway()
        } else {
            this.blowup()
            this.pullup()
        }
        blownup = !blownup
    }

    // hardcode hit area for the monitor sprite
    monitor.hitArea = new PIXI.Rectangle(350,150,2100,2000)

    return container
  }

  static initialize() {
    // animate the filters
    let [crt,glitch] = Monitor.filters
    app.ticker.add(() => {
      crt.time += 0.5
      if (crt.time > 1000) crt.time = 0
      let jitter = Math.random()
      if (jitter < 0.5) glitch.seed = jitter
      if (jitter < 0.2) glitch.slices = Math.random()*10
    })

    Monitor.container = Monitor.mkMonitor()
    app.stage.addChild(Monitor.container)
  }

  /**
   * Give the monitor a screen to display keyed by the given name
   * @param {string} name
   * @param {UICard} uicard 
   */
  static assignScreen(name, uicard) {
    let window = uicard

    Monitor.screens[name] = window

    // hardcode position of UI to fit on monitor screen
    window.position.set(78,108)

    window.filters = Monitor.filters

    window.visible = false

    this.container.addChild(window)
  }

  /**
   * Display the window keyed to the given name
   * @param {string} name 
   */
  static switchTo(name) {
    if (Monitor.screens[name] === undefined) throw `There is no screen for ${name}`
    for (const window in Monitor.screens) Monitor.screens[window].visible = false
    Monitor.screens[name].visible = true
    Monitor.currentScreen = name
  }

  // return a UICard fit for the monitor screen
  static newWindow() {
    return new UICard(385,290)
  }

  // destroy the display object of the window
  static destroyWindow(name) {
    const window = Monitor.screens[name]
    if (window) {
      window.destroy({children:true})
      delete Monitor.screens[name]
    }
  }

}


let nematodeDisplayUI = undefined
let nematodeDisplayStats = undefined
let startedDisplayUpdate = false
/**
 * call when a nematode becomes selected to update the UI
 */ 
function displaySelectedNematode() {
  // destroy the previous nematode display
  Monitor.destroyWindow("nematode")

  // create text for nematode stats
  nematodeDisplayStats = new PIXI.Text(world.selectedNematode.mkStatString(), new PIXI.TextStyle({
    fontSize: 18,
    fontFamily: "Courier New",
    fontVariant: "small-caps",
    fontWeight: "bold",
    letterSpacing: 2,
    fill: 0x00cc00,
    fontSize: 28
  }))

  // assign new display
  nematodeDisplayUI = mkNematodeDisplay(world.selectedNematode)
  Monitor.assignScreen("nematode",
    Monitor.newWindow()
      .addElement(nematodeDisplayUI)
      .addButton(() => storeNematode(world.selectedNematode), "store nematode")
      .addButton(() => downloadJSON(world.selectedNematode.toJson(), "nematode.json"), "export nematode")
      .addElement(nematodeDisplayStats)
      .make(false)
  )
  Monitor.switchTo("nematode")
  Monitor.pullup()

  if (!startedDisplayUpdate)
  app.ticker.add(() => {
    if (nematodeDisplayUI && world.selectedNematode.exists) {
      nematodeDisplayUI.updateNematodeDisplay()
      nematodeDisplayStats.text = world.selectedNematode.mkStatString()
    }
  })
  startedDisplayUpdate = true
}

// list of nematodes to store
// TODO allow sortby functions in nematode store
let storeNematodes = []

/**
 * Add the given nematodes to the store list and update display
 * @param  {...Nematode} nematodes 
 */
function storeNematode(...nematodes) {
  for (const nema of nematodes)
    if (storeNematodes.includes(nema)) continue
    else storeNematodes.push(nema)
  updateNematodeStore()
}

/**
 * Pull a nematode off the store list and update display
 * @param {Nematode} nematode 
 */
function removeNematodeFromStore(nematode) {
  const i = storeNematodes.indexOf(nematode)
  if (i==-1) throw `Nematode cannot be removed from store because it isn't in the store`
  storeNematodes.splice(i,1)
  console.log(storeNematodes)
  updateNematodeStore()
}

/**
 * Prompt the user to select nematode json files to insert in the store
 */
function importNematodes() {
  // TODO error check that uploaded file is valid
  upload()
    .then(filelist => {
      let texts = []
      for (let i = 0; i < filelist.length; i++)
        texts.push(filelist.item(i).text())
      return Promise.all(texts)
    })
    .then(jsonStrings => {
      // create a new nematode from each imported file
      const nematodes = jsonStrings.map(JSON.parse).map(obj => new Nematode(obj))
      storeNematode(...nematodes) // add them to the store display
      nematodes.forEach(n => n.Destroy()) // remove them from the world
      // TODO might want to allow Nematodes to be constructed without immediately placing them in the world
    })
}

/**
 * remake the store list screen
 * 
 * TODO add sortby function as argument
 */
function updateNematodeStore() {
  // clear the store window
  Monitor.destroyWindow("store")

  let storeListWindow = Monitor.newWindow()
    .addText("Nematode Store")
    .addButton(importNematodes, "import nematode")


  for (const nema of storeNematodes)
    storeListWindow
      .addText("")
      .addElement(mkNematodeDisplay(nema))
      .addButton(() => downloadJSON(nema.toJson(), "nematode.json"), "export")
      .addButton(() => removeNematodeFromStore(nema), "remove")
  
  Monitor.assignScreen("store", storeListWindow.make(false))
  if (Monitor.currentScreen === "store") Monitor.switchTo("store")
}