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

let gameSpeedMult = 2
const minGameSpeedMult = 0.5
const maxGameSpeedMult = 2
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

    // This starts the main loop
    let mainLoop = () => {
        // Find the time in seconds since the last frame
        var delta = (performance.now() - lastTime) / 1000;
        lastTime = performance.now();
    
        GameLoop(delta);
        // set timeout for next execution according to gamespeed
        setTimeout(mainLoop, 1000 / (60*gameSpeedMult))
    }
    
    mainLoop()
}

// create a UI card
function CreateUI(){
    
    let ui = new UICard(300,300)
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
        .addSlider(x => gameSpeedMult = x, minGameSpeedMult, maxGameSpeedMult, gameSpeedMult, 0.1, "game speed")
        .make()

    app.stage.addChild(ui)
    ui.position.y = 300

    // create Pause action
    let pHeight = 100
    let pWidth = 40
    let pMargin = 25
    let pauseSymbol = new PIXI.Graphics()
    pauseSymbol.beginFill(0xffffff)
    pauseSymbol.drawRect(0,0,pWidth,pHeight)
    pauseSymbol.drawRect(pWidth+pMargin,0,pWidth,pHeight)
    pauseSymbol.pivot.set(pWidth+pMargin/2, pHeight)
    app.stage.addChild(pauseSymbol)
    
    let setPauseSymbol = () => {
        pauseSymbol.visible = paused
        pauseSymbol.x = app.screen.width/2
        pauseSymbol.y = app.screen.height-pMargin
    }

    setPauseSymbol()
    // pause/unpause when the space bar is pressed
    Keys.addAction("Space", () => {
        paused = !paused
        setPauseSymbol()
    })
}


/** GameLoop Called every frame from the ticker 
 *  @param {number} delta - Time since last frame in seconds
*/
function GameLoop(delta) {
    // updates that shouldn't execute while game is paused go below this line
    if (paused) return

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