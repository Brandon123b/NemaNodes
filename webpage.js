// The PIXI application
var app;

// The world class
var world;

// The last time the game loop was called
var lastTime = 0;

// Keeps a moving average of the fps (This smooths out the fps counter)
var movingFps = 60;

// Count the time since the last food spawn
let timeSinceFoodSpawn = 0;
let timeSinceStart = 0;

// flag for game pause
let paused = false

let gameSpeedMult = 1
const minGameSpeedMult = 0.5
const maxGameSpeedMult = 2

// Starts everything
function main(){

    // Create the application helper and add its render target to the page
    app = new PIXI.Application({resizeTo: window});
    document.body.appendChild(app.view);
    app.ticker.maxFPS = 60

    // Create the world, TODO make world static class
    world = new World();

    // Create the fps counter
    CreateFpsCounter();

    // Create the UI
    CreateUI();

    // Add some nematodes
    SpawnNematodes(4000);

    // Add some food
    SpawnFood(3000);

    let gameLoopsThisSecond = 0
    let lastSecond = performance.now()
    // This starts the main loop
    let mainLoop = () => {
        // Find the time in seconds since the last frame
        var delta = (performance.now() - lastTime) / 1000;
        lastTime = performance.now();
    
        GameLoop(delta);
        //console.log(delta)
        if (performance.now() - lastSecond > 1000)  {
            console.log(gameLoopsThisSecond, "game loops performed in the last second")
            gameLoopsThisSecond = 0
            lastSecond = performance.now()
        }
        else gameLoopsThisSecond++
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
        .addToggle(enabled => world.draggableObjects = enabled, "drag tool", false)
        .addToggle(enabled => world.foodBrushOn = enabled, "food brush", false)
        .addSlider(x => world.foodBrushRadius = x, 0, 100, world.foodBrushRadius, 1, "brush radius")
        .addToggle(enabled => world.nematodeBrushOn = enabled, "nematode brush", false)
        .addSlider(x => world.nematodeBrushRadius = x, 0, 100, world.nematodeBrushRadius, 1, "brush radius")
        .endToggleGroup()
        .addText("Environment")
        .addSlider(x => world.maxNumFood = x, 0, world.maxNumFood*2, world.maxNumFood, 5, "max food number")
        .addSlider(x => world.foodReplenishRate = x, 0, world.maxReplenishRate, world.foodReplenishRate, 1, "food replenish rate")
        .addSlider(x => World.radius = x, 500, World.radius*3, World.radius, 10, "petri dish radius")
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
    for (let i = 0; i < number && world.numFood() < world.maxNumFood; i++) {
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

    // Make the border thicker
    fpsCounter.style.strokeThickness = 2;

    // Set the border to black
    fpsCounter.style.stroke = 0x000000;
}

/**
 * DrawLoop is called by app.ticker
 * @param {*} delta time since last frame in seconds
 */
function DrawLoop(delta) {
    // Clear the graphics (eye raycasts, NN display, zone outlines)
    world.canvas.worldGraphics.clear();
    world.canvas.screenGraphics.clear();

    // update the canvas
    world.canvas.drawWorld(world)

    // Update the moving fps
    movingFps = movingFps * 0.95 + 1 / delta * 0.05;

    // Update the fps counter
    fpsCounter.text =   "FPS: " + (movingFps).toFixed(1) +
                        " | Time: " + timeSinceStart.toFixed(1) +
                        " | Nematodes: " + world.numNematodes() +
                        " | Food: " + world.numFood();
}

/** GameLoop Called every frame from the ticker 
 *  @param {number} delta - Time since last frame in seconds
*/
function GameLoop(delta) {
    // TODO maybe separate out this DrawLoop from the game loop
    // and add it to app.ticker
    DrawLoop(delta)

    // updates that shouldn't execute while game is paused go below this line
    if (paused) return

    // Update the time
    timeSinceFoodSpawn += delta;
    timeSinceStart += delta;

    // Spawn food every second
    if (timeSinceFoodSpawn > 1){
        timeSinceFoodSpawn -= 1;

        // Spawn food
        SpawnFood(world.foodReplenishRate);
    }

    // Update the nematodes
    world.forEachNematode(n => n.Update(delta))

    // If there is an extinction event
    if (world.numNematodes() == 0){
        console.log("Extinction event at " + timeSinceStart.toFixed(1) + " seconds. Spawned 2000 nematodes.");
        SpawnNematodes(2000);
    }

}

// Very easy to miss this line
main();