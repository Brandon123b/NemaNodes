
// Copy/Pasted this (Don't know what it does)
var width = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

// Copy/Pasted this (Don't know what it does)
var height = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;

// The PIXI application
var app;

// The world class
var world;

// Starts everything
function main(){

    // Create the application helper and add its render target to the page
    app = new PIXI.Application({width, height});
    document.body.appendChild(app.view);

    // Create the world
    world = new World(1000,1000,100,100);

    // Create the fps counter
    CreateFpsCounter();

    // Add some nematodes
    SpawnNematodes(1000);

    // Add some food
    SpawnFood(5000);

    // Start the game loop
    app.ticker.add(() => {

        // Find the time in seconds since the last frame
        var delta = app.ticker.deltaMS / 1000;
        GameLoop(delta );
    });
}

/** Spawn a number of nematodes
 * 
 * @param {*} number The number of nematodes to spawn
 */
function SpawnNematodes(number){
    for (let i = 0; i < number; i++) {
        world.selectedNematode = new Nematode()
    }
}

/** Spawn a number of food
 * 
 * @param {*} number The number of food to spawn
 */
function SpawnFood(number){
    for (let i = 0; i < number; i++) {
        food_init_pos = new PIXI.Point().RandomPosition(800);
        new Food(food_init_pos)
    }
}

// Create the fps counter
function CreateFpsCounter(){
        
    // Create the fps counter
    fpsCounter = new PIXI.Text("FPS: 0", {fontFamily : 'Arial', fontSize: 20, fill : 0x00FF00, align : 'center'});
    fpsCounter.x = 10;
    fpsCounter.y = 8;
    app.stage.addChild(fpsCounter);
}

/**
 * GameLoop Called every frame from the ticker 
 * @param {number} delta - Time since last frame in seconds
*/
function GameLoop(delta) {

    // Add food to the world
    if (Math.random() < 1) {
        food_init_pos = new PIXI.Point().RandomPosition(800);
        new Food(food_init_pos)
    }

    // Clear the graphics
    world.canvas.worldGraphics.clear();
    world.canvas.screenGraphics.clear();
    world.canvas.screenGraphics.removeChildren();

    // Update the nematodes
    world.forEachNematode(n => n.Update(delta))
    
    // update the canvas
    world.canvas.drawWorld(world)

    // Update the fps counter
    fpsCounter.text = "FPS: " + Math.round(app.ticker.FPS);
}

// Very easy to miss this line
main();