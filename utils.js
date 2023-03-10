// register events to make an object respond to mouse dragging
// registerDisplayObject: display object to register the intial mouse drag
// dragTarget: the displayObject whose coordinate space we use to translate mouse coordinates into 
//
// these 3 parameters are procedures to perform during the mouse dragging
// they each take the coordinates of the mouse translated into the dragTarget's parent's coordinate space
// dragStartAction: function (x, y) => ... action to take when dragging begins
// dragMoveFunction: function (dx, dy) => ... action to perform given mouse displacement (by default, simply translate dragTarget's position)
// dragEndAction: function (x, y) => ... action to perform when dragging ends
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