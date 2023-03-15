
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

// The last time the game loop was called
var lastTime = 0;

// Keeps a moving average of the fps (This smooths out the fps counter)
var movingFps = 60;

// The radius of the world (TODO: move this somewhere else)
const worldRadius = 2000;

// Count the time since the last food spawn
let timeSinceFoodSpawn = 0;

// Starts everything
function main(){

    // Create the application helper and add its render target to the page
    app = new PIXI.Application({width, height});
    document.body.appendChild(app.view);

    // Create the world
    world = new World(1000,1000,100,100);

    // Create the fps counter
    CreateFpsCounter();

    // Create the UI
    CreateUI();

    // Add some nematodes
    SpawnNematodes(5000);

    // Add some food
    SpawnFood(3000);

    // This starts the main loop (with a 60 target fps cap)
    setInterval(function() {

        // Find the time in seconds since the last frame
        var delta = (performance.now() - lastTime) / 1000;
        lastTime = performance.now();

        GameLoop(delta );

    }, 1000 / 60);
}

// create a UI card
function CreateUI(){
    
    let ui = new UICard(300)
        .addText("User tools")
        .startToggleGroup()
        .addToggle(enabled => world.draggableObjects = enabled, "drag tool", false)
        .addToggle(enabled => world.foodBrushOn = enabled, "food brush", false)
        .addSlider(x => world.foodBrushRadius = x, 0, 100, world.foodBrushRadius, 1, "brush radius")
        .addToggle(enabled => world.nematodeBrushOn = enabled, "nematode brush", false)
        .addSlider(x => world.nematodeBrushRadius = x, 0, 100, world.nematodeBrushRadius, 1, "brush radius")
        .endToggleGroup()
        .addText("Environment")
        .addSlider(x => world.maxNumFood = x, 0, world.maxNumFood*2, world.maxNumFood, 5, "max food number")
        .addSlider(x => world.foodReplenishRate = x, 0, world.maxReplenishRate, world.foodReplenishRate, 1, "food replenish rate")
        .addText("Debug")
        .addToggle(enabled => world.drawZones = enabled, "draw world zones", world.drawZones)
        .addToggle(enabled => world.drawEyeRays = enabled, "draw nematode raycasts", world.drawEyeRays)
        .make()

    app.stage.addChild(ui)
    ui.position.y = 300
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
 *  Will not spawn more than world.maxNumFood
 * 
 * @param {*} number The number of food to spawn
 */
function SpawnFood(number){
    for (let i = 0; i < number; i++) {

        //if (world.food.length >= world.maxNumFood) TODO: Implement this somehow
        //    return;

        new Food()
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

/** GameLoop Called every frame from the ticker 
 *  @param {number} delta - Time since last frame in seconds
*/
function GameLoop(delta) {

    timeSinceFoodSpawn += delta;

    // Spawn food every second
    if (timeSinceFoodSpawn > 1){
        timeSinceFoodSpawn -= 1;

        // Spawn food
        SpawnFood(world.foodReplenishRate);

        // Temp count of nematodes
        let nematodeCount = 0;

        world.forEachNematode(n => {nematodeCount++})

        console.log("Count: " + nematodeCount);

        if (nematodeCount == 0){
            console.log("No nematodes");
        }
    }

    // Clear the graphics
    world.canvas.screenGraphics.removeChildren();
    world.canvas.worldGraphics.clear();
    world.canvas.screenGraphics.clear();

    // Update the nematodes
    world.forEachNematode(n => n.Update(delta))
    

    // update the canvas
    world.canvas.drawWorld(world)

    // Update the moving fps
    movingFps = movingFps * 0.95 + 1 / delta * 0.05;

    // Update the fps counter
    fpsCounter.text = "FPS: " + (movingFps).toFixed(1);
}

// Very easy to miss this line
main();