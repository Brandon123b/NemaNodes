
// This is a simple example of how to use PIXI.js to create a game loop and render a sprite to the screen.
// I expect everything will be changed, but this is a good starting point.

// Copy/Pasted this (Don't know what it does)
var width = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

// Copy/Pasted this (Don't know what it does)
var height = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;

// Create the application helper and add its render target to the page
app = new PIXI.Application({width, height});
document.body.appendChild(app.view);

// Simple background color
//app.renderer.background.color = 0x0000FF;

// resize app window

// Create list of nematodes
let world = new World(1000,1000,10,10)

// Add a nematode to the list
let n1 = new Nematode()
let n2 = new Nematode()
let n3 = new Nematode()

world.add(n1)
world.add(n2)
world.add(n3)
world.updatePos(n2, new PIXI.Point(10,10))
world.updatePos(n1, new PIXI.Point(20,20))
world.updatePos(n3, new PIXI.Point(600,600))


// Start the game loop
app.ticker.add((delta) => {
    GameLoop(delta);
});


/**
 * GameLoop Called every frame from the ticker 
 * @param {number} delta - The time since the last frame
*/
function GameLoop(delta) {

    // Update the nematodes
    world.forEach(n => n.Update(delta))
    // update the canvas
    world.canvas.drawWorld(world)
}

