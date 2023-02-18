
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
app.renderer.background.color = 0x0000FF;

// Create list of nematodes
nematodeList = [];

// Add a nematode to the list
nematodeList.push(new Nematode());

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
    for (var i = 0; i < nematodeList.length; i++)
        nematodeList[i].Update(delta);
}