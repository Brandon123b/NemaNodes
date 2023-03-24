// The PIXI application
var app;

// The world class
var world;

// The last time the game loop was called
var lastTime = 0;

// Count the time since the last food spawn
let timeSinceFoodSpawn = 0;
let timeSinceStart = 0;

// Slow Update counter (The currently updated frame)
let slowUpdateCounter = 0;

// Starts everything
function main(){

    // Create the application helper and add its render target to the page
    app = new PIXI.Application({resizeTo: window});
    document.body.appendChild(app.view);

    // Create the world, TODO make world static class
    world = new World();

    // Create the UI
    CreateUI();

    // Add some nematodes
    world.SpawnNematodes(5000);

    // Add some food
    world.SpawnFood(5000);

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
        .addToggle(enabled => world.draggableObjects = enabled, "drag tool", true)
        .addToggle(enabled => world.foodBrushOn = enabled, "food brush", false)
        .addSlider(x => world.foodBrushRadius = x, 0, 100, world.foodBrushRadius, 1, "brush radius")
        .addToggle(enabled => world.nematodeBrushOn = enabled, "nematode brush", false)
        .addSlider(x => world.nematodeBrushRadius = x, 0, 100, world.nematodeBrushRadius, 1, "brush radius")
        .endToggleGroup()
        .addText("Environment")
        .addSlider(x => world.maxNumFood = x, 0, world.maxNumFood*2, world.maxNumFood, 5, "max food number")
        .addSlider(x => world.foodReplenishRate = x, 0, world.maxReplenishRate, world.foodReplenishRate, 1, "food replenish rate")
        .addSlider(x => World.radius = x, 50, World.radius*3, World.radius, 10, "petri dish radius")
        .addText("Performance")
        .addSlider(x => world.SlowUpdateInterval = x, 1, 10, world.SlowUpdateInterval, 1, "slow update interval")
        .addText("Debug")
        .addToggle(enabled => world.drawZones = enabled, "draw world zones", world.drawZones)
        .addToggle(enabled => world.drawEyeRays = enabled, "draw nematode raycasts", world.drawEyeRays)
        .make()

    // Enable drag tool by default
    world.draggableObjects = true

    app.stage.addChild(ui)
    ui.position.y = 300
}


/** GameLoop Called every frame from the ticker 
 *  @param {number} delta - Time since last frame in seconds
*/
function GameLoop(delta) {

    // Clear the graphics (eye raycasts, NN display, zone outlines)
    world.canvas.worldGraphics.clear();
    world.canvas.screenGraphics.clear();

    // Update the time
    timeSinceFoodSpawn += delta;
    timeSinceStart += delta;

    // Spawn food every second
    if (timeSinceFoodSpawn > 1){
        timeSinceFoodSpawn -= 1;

        // Spawn food
        world.SpawnFood(world.foodReplenishRate);
    }

    // Slow update (Runs each nematode's SlowUpdate() function every SlowUpdateInterval frames)
    slowUpdateCounter++;
    if (slowUpdateCounter >= world.SlowUpdateInterval){
        slowUpdateCounter = 0;
    }

    // SlowUpdate the nematodes
    let i = 0;
    world.forEachNematode(
    n => {
        // Only update when the slow update counter is the correct frame
        if (i++ % world.SlowUpdateInterval == slowUpdateCounter){
            n.SlowUpdate(delta)
        }
    })

    // Update the nematodes
    world.forEachNematode(n => n.Update(delta))

    // update the canvas
    world.canvas.drawWorld(delta)

    // If there is an extinction event
    if (world.numNematodes() == 0){
        console.log("Extinction event at " + timeSinceStart.toFixed(1) + " seconds. Spawned 2000 nematodes.");
        world.SpawnNematodes(2000);
    }
}

// Very easy to miss this line
main();