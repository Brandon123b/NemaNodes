
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
let world = new World(1000,1000,100,100)
world.drawZones = true

// Want to separete this nematode to draw the neural network
var firstNeatode;

// Add some nematodes to the world
for (let i = 0; i < 100; i++) {
    let n = new Nematode()

    if (firstNeatode == undefined) {
        firstNeatode = n;
    }
}

//Add some food for testing
for (let i = 0; i < 15; i++) {
    food_init_pos = new PIXI.Point(Math.random() * 500 - 250, Math.random() * 500 - 250)
    let n = new Food(world, food_init_pos)
}

// Create the fps counter
fpsCounter = new PIXI.Text("FPS: 0", {fontFamily : 'Arial', fontSize: 20, fill : 0x00FF00, align : 'center'});
fpsCounter.x = 10;
fpsCounter.y = 8;
app.stage.addChild(fpsCounter);


// Start the game loop
app.ticker.add(() => {

    // Find the time in seconds since the last frame
    var delta = app.ticker.deltaMS / 1000;
    GameLoop(delta );
});


/**
 * GameLoop Called every frame from the ticker 
 * @param {number} delta - Time since last frame in seconds
*/
function GameLoop(delta) {

    // Clear the graphics
    world.canvas.worldGraphics.clear();
    world.canvas.screenGraphics.clear();

    // Update the nematodes
    world.forEachNematode(n => n.Update(delta))
    // update the canvas
    world.canvas.drawWorld(world)

    // Update the fps counter
    fpsCounter.text = "FPS: " + Math.round(app.ticker.FPS);
}

