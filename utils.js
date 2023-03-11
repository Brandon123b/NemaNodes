/**
 * Register mouse drag events for some object
 * 
 * @param {PIXI.DisplayObject} registerDisplayObject object to register initial mouse click on 
 * @param {PIXI.DisplayObject} dragTarget object whose coordinate space is used
 * @param {function} dragStartAction function (x, y) => ... action to take when dragging begins
 * @param {function} dragMoveAction function (dx, dy) => ... action to perform given mouse displacement (by default, simply translate dragTarget's position)
 * @param {function} dragEndAction function (x, y) => ... action to perform when dragging ends
 */
function createDragAction(registerDisplayObject, dragTarget, dragStartAction, dragMoveAction, dragEndAction) {
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
      dragMoveAction(previousMousePoint.x - x, previousMousePoint.y - y)
    }
  }

  // begin tracking mouse position
  let onDragStart = function(mouseEvent) {
    dragging = true
    app.stage.on('pointermove', onDragMove)
    previousMousePoint = dragTarget.parent.toLocal(mouseEvent.global)
    dragStartAction(previousMousePoint.x, previousMousePoint.y)
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
 * 
 * Deregister drag actions from the obj
 * Omit the function parameters to remove all drag actions
 * 
 * @param {PIXI.DisplayObject} registerObject to deregister actions on
 * @param {*} onDragStart 
 * @param {*} onDragMove 
 * @param {*} onDragEnd 
 */
function removeDragAction(registerObject, onDragStart, onDragMove, onDragEnd) {
  registerObject
    .off('pointerdown', onDragStart)
    .off('pointerup', onDragEnd)
    .off('pointerupoutside', onDragEnd)

  app.stage.off('pointermove', onDragMove)
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


function addBlur(obj, amount) {
  let blur = new PIXI.BlurFilter(amount)
  if (obj.filters) obj.filters.push(blur)
  else obj.filters = [blur]
}

// static class to query if a key is being pressed
class Keys {
  static #pressedKeys = new Set()
  static debug = true

  static {
    addEventListener("keydown", e => {
      if (!e.repeat) {
        this.#pressedKeys.add(e.key)
        if (this.debug) console.log(e.key, "pressed")
      }
    })
    addEventListener("keyup", e => {
      this.#pressedKeys.delete(e.key)
      if (this.debug) console.log(e.key, "lifted")
    })
  }

  /**
   * Return true if the given key is being pressed
   * @param {string} key string like 'd' or 'W' or 'Shift' 
   */
  static keyPressed(key) {
    return this.#pressedKeys.has(key)
  }
}