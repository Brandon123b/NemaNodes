/**
 * compose functions
 */
const compose = (...functions) => args => functions.reduceRight((arg, fn) => fn(arg), args)


/**
 * Register mouse drag events for some object
 * 
 * @param {PIXI.DisplayObject} registerDisplayObject object to register initial mouse click on 
 * @param {PIXI.DisplayObject} dragTarget object whose coordinate space is used
 * @param {function} dragStartAction function (x, y) => ... action to take when dragging begins
 * @param {function} dragMoveAction function (dx, dy, x, y) => ... action to perform given mouse displacement (by default, simply translate dragTarget's position)
 * @param {function} dragEndAction function (x, y) => ... action to perform when dragging ends
 * @param {boolean} rightMouse drag on right click, default = false
 */
function createDragAction(registerDisplayObject, dragTarget, dragStartAction, dragMoveAction, dragEndAction, rightMouse = false) {
  let dragging = false
  let previousMousePoint = null

  if (!dragStartAction)
    dragStartAction = (x, y) => {} // default dragstart action is NOP

  // default action is to translate the target object's position point
  if (!dragMoveAction)
    dragMoveAction = (dx, dy) => {dragTarget.x += dx; dragTarget.y += dy}

  if (!dragEndAction)
    dragEndAction = (x, y) => {} // default ending action is NOP
  
  // while dragging, apply displaceFunc to the change in mouse position
  let onDragMove = function(mouseEvent) {
    if (dragging) {
      const { x, y } = previousMousePoint
      dragTarget.parent.toLocal(mouseEvent.global, null, previousMousePoint)
      dragMoveAction(previousMousePoint.x - x, previousMousePoint.y - y, previousMousePoint.x, previousMousePoint.y)
    }
  }

  // begin tracking mouse position
  let onDragStart = function(mouseEvent) {
    // only activate the drag action if the correct mouse button is being held
    if ((!rightMouse && mouseEvent.buttons == 1) || (rightMouse && mouseEvent.buttons == 2)) {
      dragging = true
      app.stage.on('pointermove', onDragMove)
      previousMousePoint = dragTarget.parent.toLocal(mouseEvent.global)
      dragStartAction(previousMousePoint.x, previousMousePoint.y)
    }
  }

  // deregister the callback placed on the stage to stop dragging
  let onDragEnd = function(mouseEvent) {
    if (dragging) {
      app.stage.off('pointermove', onDragMove)
      dragging = false
      previousMousePoint = null
      const {x,y} = dragTarget.parent.toLocal(mouseEvent.global)
      dragEndAction(x,y)
    }
  }

  registerDisplayObject
    .on('pointerdown', onDragStart)
    .on('pointerup', onDragEnd)
    .on('pointerupoutside', onDragEnd)
}

class Required{}
/**
 * Fill the undefined attributes of the given object according to the default object
 * 
 * useful for objects used to pass parameters
 * 
 * @param {object} obj 
 * @param {object} defaults default values to insert into obj if obj.key is undefined.
 *     Set defaults.key to Required if obj must specify its value
 */
function fillDefaults(obj, defaults) {
  for (prop in defaults)
  if (obj[prop] === undefined) {
    if (defaults[prop] === Required)
      throw `Object ${obj} must supply value for ${prop}`
    obj[prop] = defaults[prop]
  }

  return obj
}

/**
 * Add a blur to the given objects list of filters
 * 
 * @param {PIXI.DisplayObject} obj obj to blur 
 * @param {number} amount strength of blur
 */
function addBlur(obj, amount) {
  let blur = new PIXI.BlurFilter(amount)
  addFilter(obj, blur)
}

/**
 * Apply a filter to a display object
 * @param {PIXI.DisplayObject} obj 
 * @param {PIXI.Filter} filter 
 */
function addFilter(obj, filter) {
  obj.filters = obj.filters || []
  obj.filters.push(filter)
}

/**
 * Remove the filter from the display object
 * @param {PIXI.DisplayObject} obj 
 * @param {PIXI.Filter} filter 
 */
function removeFilter(obj, filter) {
  if (obj.filters) obj.filters = obj.filters.filter(f => f != filter)
}

// static class to query if a key is being pressed
class Keys {
  static #pressedKeys = new Set()
  static debug = false
  static #actions = {}

  static {
    addEventListener("keydown", e => {
      if (!e.repeat) {
        this.#pressedKeys.add(e.code)
        if (this.debug) console.log(e.code, "pressed")
        for (const action of this.#actions[e.code] || []) action()
      }
    })

    addEventListener("keyup", e => {
      this.#pressedKeys.delete(e.code)
      if (this.debug) console.log(e.code, "lifted")
    })

    // prevent right clicks from bringing up the context menu
    addEventListener("contextmenu", e => {
      e.preventDefault()
      if (this.debug) console.log("right click")
    })
  }

  /**
   * Return true if the given key code is being pressed
   * @param {string} key string like 'Space' or 'KeyW' or 'ShiftLeft' 
   */
  static keyPressed(key) {
    return this.#pressedKeys.has(key)
  }

  /**
   * 
   * @param {string} key code for key 
   * @param {function} action callback to be performed on key down
   */
  static addAction(key, action) {
    if (this.#actions[key])
      this.#actions[key].push(action)
    else
      this.#actions[key] = [action]
  }
}

/**
 * Download the given string to a file
 * 
 * @param {string} content 
 * @param {string} fileName 
 * @param {string} contentType text/plain typically
 */
function download(content, fileName, contentType) {
  var a = document.createElement("a");
  var file = new Blob([content], {type: contentType});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href)
}


/**
 * Convert the given object to JSON and download it to user machine
 * 
 * @param {object} obj 
 * @param {string} filename 
 */
function downloadJSON(obj, filename) {
  download(JSON.stringify(obj), filename, 'text/plain')
}

/**
 * Prompt the user to select files
 * @return {Promise} promise containing list of selected files
 */
async function upload() {
  let a = document.createElement("input")
  a.setAttribute("type", "file")
  a.setAttribute("multiple", "") // to allow selecting multiple files
  a.click()
  let files = await new Promise((resolve, reject) => {
    a.onchange = () => resolve(a.files)
  })
  return files
}


/**
 * start animation loop for transitions. not meant to be called again
 */
function animateWithTween(time) {
  requestAnimationFrame(animateWithTween)
  TWEEN.update(time)
}
requestAnimationFrame(animateWithTween)


/**
 * 
 * @param {*} obj object to tween
 * @param {*} to object properties to tween toward
 * @param {*} duration duration of animation
 * @param {*} opts {
 * easing: easing function to use
 * onUpdate: action to perform for each update
 * onComplete: action to perform when transition succeeds
 * }
 */
function transition(obj, to, duration, opts = {}) {
  fillDefaults(opts, {
    easing: TWEEN.Easing.Quadratic.Out,
    onUpdate: () => {},
    onComplete: () => {}
  })

  new TWEEN.Tween(obj)
    .to(to, duration)
    .easing(opts.easing)
    .onUpdate(opts.onUpdate)
    .onComplete(opts.onComplete)
    .start()
}

/**
 * 
 * @param {number} val 
 * @param {number} min 
 * @param {number} max 
 * @returns {number} value clamped within the bounds
 */
function clamp(val,min,max) {
  return Math.max(Math.min(val,max),min)
}


/**
 * Color converter to produce color values that PIXI can read.
 * It is really annoying that our PIXI doesn't work according to these docs:
 * https://pixijs.download/dev/docs/PIXI.html#ColorSource
 */
class Color {
  /**
   * 
   * @param {number} h 0-360 
   * @param {number} s 0-100 
   * @param {number} v 0-100
   * @returns {number} hex rgb color number
   */
  static fromHSV(h,s,v) {
    let r, g, b, i, f, p, q, t;
    h /= 360;
    s /= 100;
    v /= 100;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
  
    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    return Color.fromRGB(r*255,g*255,b*255)
  }

  /**
   * 
   * @param {number} r 0-255 
   * @param {number} g 0-255
   * @param {number} b 0-255
   * @return {number} hex color number
   */
  static fromRGB(r,g,b) {
    let val = Math.floor(clamp(r,0,255))
    val = val << 8
    val += Math.floor(clamp(g,0,255))
    val = val << 8
    val += Math.floor(clamp(b,0,255))
    return val
  }
}