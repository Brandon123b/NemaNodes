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

    // Add some nematodes
    world.SpawnNematodes(5000);

    // Add some food
    world.SpawnFood(5000);
    
    setInterval(mainLoop, 1000/60)
}

// create a UI card
function CreateUI(){
    let container = new PIXI.Container()

    let ui = new UICard(385, 290)
        .addText("User tools")
        .startToggleGroup()
        .addToggle(enabled => world.draggableObjects = enabled, "drag tool", true)
        .addToggle(enabled => World.foodBrushOn = enabled, "food brush", false)
        .addToggle(enabled => World.nematodeBrushOn = enabled, "nematode brush", false)
        .addToggle(enabled => World.eraseBrushOn = enabled, "eraser", false)
        .addSlider(x => World.brushRadius = x, 0, 100, World.brushRadius, 1, "brush radius")
        .endToggleGroup()
        .addText("Environment")
        .addSlider(x => world.maxNumFood = x, 0, world.maxNumFood*2, world.maxNumFood, 5, "max food number")
        .addSlider(x => world.foodReplenishRate = x, 0, world.maxReplenishRate, world.foodReplenishRate, 1, "food replenish rate")
        .addSlider(x => World.radius = x, 50, World.radius*3, World.radius, 10, "petri dish radius")
        .addText("Performance")
        .addSlider(x => world.SlowUpdateInterval = x, 1, 10, world.SlowUpdateInterval, 1, "slow update interval")
        .startToggleGroup()
        .addText("world zone size")
        .addToggle(enabled => enabled && world.rezone(World.SMALL_ZONE_SIZE), "small", world.zoneSize() == World.SMALL_ZONE_SIZE)
        .addToggle(enabled => enabled && world.rezone(World.MED_ZONE_SIZE), "medium", world.zoneSize() == World.MED_ZONE_SIZE)
        .addToggle(enabled => enabled && world.rezone(World.LARGE_ZONE_SIZE), "large", world.zoneSize() == World.LARGE_ZONE_SIZE)
        .addToggle(enabled => enabled && world.rezone(World.XL_ZONE_SIZE), "xl", world.zoneSize() == World.XL_ZONE_SIZE)
        .endToggleGroup()
        .addText("Debug")
        .addToggle(enabled => world.drawZones = enabled, "draw world zones", world.drawZones)
        .addToggle(enabled => world.drawEyeRays = enabled, "draw nematode raycasts", world.drawEyeRays)
        .addSlider(x => gameSpeedMult = x, minGameSpeedMult, maxGameSpeedMult, gameSpeedMult, 1, "game speed")
        .make(false) // set false to not round corners

    let monitor = PIXI.Sprite.from("monitor-nobg.png")
    monitor.scale.set(0.25)
    // hardcode monitor position to place well on left side of screen
    monitor.position.x = -80
    // hardcode position of UI to fit on monitor screen
    ui.position.set(78,108)
    container.addChild(monitor)
    container.addChild(ui)

    // initialize monitor position to bottom
    container.y = app.screen.height-200

    monitor.interactive = true
    // scroll contents with the mousewheel
    monitor.onwheel = e => {
        const scroll = e.deltaY
        if (scroll > 0)
            container.y -= 50
        else
            container.y += 50
        
        container.position.clamp([0,0], [app.screen.height-monitor.height*0.6,app.screen.height-200])
    }

    // hardcode hit area for the monitor sprite
    monitor.hitArea = new PIXI.Rectangle(350,150,2100,1700)

    app.stage.addChild(container)
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

    // If there is an extinction event
    if (world.numNematodes() == 0){
        console.log("Extinction event at " + timeSinceStart.toFixed(1) + " seconds. Spawned 2000 nematodes.");
        world.SpawnNematodes(2000);
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