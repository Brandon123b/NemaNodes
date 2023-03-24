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


/**
 * Fill the undefined attributes of the given object according to the default object
 * 
 * useful for objects used to pass parameters
 * 
 * @param {object} obj 
 * @param {object} defaults 
 */
function fillDefaults(obj, defaults) {
  for (prop in defaults)
  if (obj[prop] === undefined)
    obj[prop] = defaults[prop]

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
  if (obj.filters) obj.filters.push(blur)
  else obj.filters = [blur]
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