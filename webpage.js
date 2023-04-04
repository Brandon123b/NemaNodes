// The PIXI application
var app;

// The world class
var world;

// The last time the game loop was called
var lastTime = 0;

// Count the time since the last food spawn
let timeSinceFoodSpawn = 0;
let timeSinceStart = 0;

// flag for game pause
let paused = false

let gameSpeedMult = 1
const minGameSpeedMult = 1
const maxGameSpeedMult = 10
// Slow Update counter (The currently updated frame)
let slowUpdateCounter = 0;
let foodUpdateCounter = 0

// Starts everything
function main(){

    // Create the application helper and add its render target to the page
    app = new PIXI.Application({resizeTo: window});
    document.body.appendChild(app.view);
    app.ticker.maxFPS = 60

    // Create the world, TODO make world static class
    world = new World();

    // Create the UI
    CreateUI();

    // Start the trainer (Used for training/spawning Smart Nematodes)
    // This must be in a promise because it loads a file
    NematodeTrainer.Initialize().then(() => {

        // Add some "Smart" nematodes
        world.SpawnSmartNematodes(500);

        // Add some food
        world.SpawnFood(1000);
        
        setInterval(mainLoop, 1000/60)
    });
}

// create a UI card
function CreateUI(){
    let container = new PIXI.Container()

    let ui = Monitor.newWindow()
        .addText("User tools")
        .startToggleGroup()
        .addToggle(enabled => world.draggableObjects = enabled, "drag tool", true)
        .addToggle(enabled => World.foodBrushOn = enabled, "food brush", false)
        .addToggle(enabled => World.nematodeBrushOn = enabled, "nematode brush", false)
        .addToggle(enabled => World.eraseBrushOn = enabled, "eraser", false)
        .addSlider(x => World.brushRadius = x, 0, 100, World.brushRadius, 1, "brush radius")
        .endToggleGroup()
        .addText("")
        .addText("Nematodes")
        .addToggle(enabled => NNDisplay.DRAW_LABELS = enabled, "Draw NN Labels", NNDisplay.DRAW_LABELS)
        .addToggle(enabled => world.energyBarOn = enabled, "Show nematode energy levels", false)
        .addButton(x => NematodeTrainer.Download(), "Download Training Data")
        .addSlider(x => NeatNN.MUTATION_MULTIPLIER = x, 0, 5, NeatNN.MUTATION_MULTIPLIER, .1, "Nematode NN mutation multiplier")
        .addText("")
        .addText("Environment")
        .addSlider(x => world.maxNumFood = x, 0, world.maxNumFood*2, world.maxNumFood, 5, "max food number")
        .addSlider(x => world.foodReplenishRate = x, 0, world.maxReplenishRate, world.foodReplenishRate, 1, "food replenish rate")
        .addSlider(x => World.radius = x, 50, World.radius*3, World.radius, 10, "petri dish radius")
        .addText("")
        .addText("Performance")
        .addSlider(x => world.SlowUpdateInterval = x, 1, 10, world.SlowUpdateInterval, 1, "slow update interval")
        .startToggleGroup()
        .addText("")
        .addText("world zone size")
        .addToggle(enabled => enabled && world.rezone(World.SMALL_ZONE_SIZE), "small", world.zoneSize() == World.SMALL_ZONE_SIZE)
        .addToggle(enabled => enabled && world.rezone(World.MED_ZONE_SIZE), "medium", world.zoneSize() == World.MED_ZONE_SIZE)
        .addToggle(enabled => enabled && world.rezone(World.LARGE_ZONE_SIZE), "large", world.zoneSize() == World.LARGE_ZONE_SIZE)
        .addToggle(enabled => enabled && world.rezone(World.XL_ZONE_SIZE), "xl", world.zoneSize() == World.XL_ZONE_SIZE)
        .endToggleGroup()
        .addText("")
        .addText("Debug")
        .addToggle(enabled => world.drawZones = enabled, "draw world zones", world.drawZones)
        .addToggle(enabled => world.drawEyeRays = enabled, "draw nematode raycasts", world.drawEyeRays)
        .addToggle(enabled => world.drawSmell = enabled, "draw nematode smell", world.drawSmell)
        .addSlider(x => gameSpeedMult = x, minGameSpeedMult, maxGameSpeedMult, gameSpeedMult, 1, "game speed")
        .make(false) // set false to not round corners

    Monitor.initialize()
    Monitor.assignScreen("options", ui)
    Monitor.switchTo("options")
}

/**
 * Perform any graphics drawing or things that should be updated even while paused
 */
function DrawLoop(delta) {
    // update the canvas
    world.canvas.drawWorld(delta)
}

/**
 * Make any updates to the game world
 *  @param {number} delta - Time since last frame in seconds
*/
function GameLoop(delta) {
    if (paused) return

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
    slowUpdateCounter %= world.SlowUpdateInterval
    // Update the nematodes
    world.forEachNematode((n, i) => {
        if (i % world.SlowUpdateInterval == slowUpdateCounter)
            n.SlowUpdate()
        n.Update(delta)
    })

    foodUpdateCounter++
    foodUpdateCounter %= Food.FOOD_UPDATE_INTERVAL
    // slow update on food
    world.forEach((f, i) => {
        if (i % Food.FOOD_UPDATE_INTERVAL == foodUpdateCounter) f.SlowUpdate()
    }, Food)

    // If there is an extinction event
    if (world.numNematodes() == 0){
        console.log("Extinction event at " + timeSinceStart.toFixed(1) + " seconds. Spawned 500 nematodes.");
        world.SpawnSmartNematodes(500);
    }

}

/**
 * The main loop
 */
function mainLoop() {
    // Find the time in seconds since the last frame
    var delta = (performance.now() - lastTime) / 1000;
    lastTime = performance.now();

    // Clear the graphics (eye raycasts, NN display, zone outlines)
    world.canvas.worldGraphics.clear()
    world.canvas.screenGraphics.clear()
    let eyerays = world.drawEyeRays
    world.drawEyeRays = false
    for (let i = 0; i < gameSpeedMult; i++) {
        // only draw eyerays on the last game loop 
        if (i == gameSpeedMult-1) world.drawEyeRays = eyerays
        GameLoop(delta)
    }
    DrawLoop(delta)
}

// Very easy to miss this line
main();

