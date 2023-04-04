class NNDisplay {

    static DRAW_LABELS = false;
        
    // The size/position of the diagram
    static xPos = 10;
    static yPos = 30;
    static xSize = 300;
    static ySize = 250;
    static nodeSize = 10;

    // The amount of padding needed for the labels
    static leftPadding = 120;
    static rightPadding = 80;

    /* Creates the text labels for the input and output nodes and adds them to the given container
     * container: The container to add the labels to
     */
    constructor(container) {

        // The text style for the input labels
        const inputStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 13,
            fill: 'white',
            lineHeight: 17
        });

        // The text style for the labels
        const outputStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 13,
            fill: 'white',
            lineHeight: 68
        });

        // The text for the input nodes
        const leftText = 
`Left Food Eye
Midle Food Eye
Right Food Eye
Left Nematode Eye
Midle Nematode Eye
Right Nematode Eye
Food Smell
Nematode Smell
Age
Energy
Distance from middle
Veclocity`

        // The text for the output nodes
        const rightText =
`Turn speed
Move speed
Bite`


        // The text objects for the labels
        this.inputLabel =  new PIXI.Text(leftText, inputStyle);
        this.outputLabel = new PIXI.Text(rightText, outputStyle);

        // Set the labels to be invisible
        this.inputLabel.visible = NNDisplay.DRAW_LABELS;
        this.outputLabel.visible = NNDisplay.DRAW_LABELS;

        // Add the labels to the container
        container.addChild(this.inputLabel);
        this.inputLabel.x = NNDisplay.xPos + 10;
        this.inputLabel.y = NNDisplay.yPos + 20;
        container.addChild(this.outputLabel);
        this.outputLabel.x = NNDisplay.xPos + NNDisplay.leftPadding + NNDisplay.xSize - 10;
        this.outputLabel.y = NNDisplay.yPos + 25;
    }

    /* Set the current node locations, connections, and nodes of this display
     * nodeLocations: The locations of the nodes
     * connections: The list of connections between the nodes
     * nodes: The list of nodes
     */
    SetNN(nodeLocations, connections, nodes) {

        // Store the NN data
        this.nodeLocations = nodeLocations;
        this.connections = connections;
        this.nodes = nodes;
    }

    /* Draws the neural network diagram using the given graphics object 
     * graphics: The graphics object to draw to
     */
    Draw(graphics) {

        const xSize = (NNDisplay.DRAW_LABELS) 
            ? NNDisplay.xSize + NNDisplay.leftPadding + NNDisplay.rightPadding 
            : NNDisplay.xSize;

        // Draw a black rounded rectangle as the background
        graphics.beginFill(0x000000);
        graphics.drawRoundedRect(NNDisplay.xPos, NNDisplay.yPos, xSize, NNDisplay.ySize, 20);
        graphics.endFill();
        
        // Draw the connections
        for(let i = 0; i < this.connections.length; i++) {
            this.DrawConnectionLine(graphics, this.connections[i], this.nodeLocations);
        }

        // Draw the nodes
        for(let i = 0; i < this.nodeLocations.length; i++) {
            this.DrawNodeCircle(graphics, this.nodes[i], this.nodeLocations[i]);
        }

        // Show/Hide the labels
        if (NNDisplay.DRAW_LABELS){
            this.inputLabel.visible = true;
            this.outputLabel.visible = true;
        }
        else {
            this.inputLabel.visible = false;
            this.outputLabel.visible = false;
        }
    }

    /* Draws a connection
    * graphics: The graphics object to draw to
    * connection: The connection to draw
    * nodeLocations: The locations of the nodes
    */
    DrawConnectionLine(graphics, connection, nodeLocations) {
            
        // The width of the line
        const lineWidth = 3;

        // The intensity of the color
        var intensity = Math.min(255, Math.abs(connection.weight * 255));
        intensity = Math.floor(intensity).toString(16).toUpperCase();

        // If the intensity is only one digit, add a 0 to the front
        if(intensity.length === 1)
            intensity = "0" + intensity;

        // If the weight is less than 0, make the color red, otherwise make it green
        const color = (connection.weight < 0) ? "0x" + intensity + "0000" : "0x00" + intensity + "00";

        // Set the line style
        graphics.lineStyle(lineWidth, color);

        // Draw the line
        graphics.moveTo(nodeLocations[this.nodes.indexOf(connection.from)].x, nodeLocations[this.nodes.indexOf(connection.from)].y);
        graphics.lineTo(nodeLocations[this.nodes.indexOf(connection.to)].x, nodeLocations[this.nodes.indexOf(connection.to)].y);
    }

    /* Draws a node
    * graphics: The graphics object to draw to
    * node: The node to draw
    * loc: The location to draw the node
    */
    DrawNodeCircle(graphics, node, loc) {

        // The intensity of the color
        var intensity = Math.min(255, Math.abs(node.activation * 255));
        intensity = Math.floor(intensity).toString(16).toUpperCase();

        // If the intensity is only one digit, add a 0 to the front
        if(intensity.length === 1)
            intensity = "0" + intensity;
        
        // If the activation is less than 0, make the color red, otherwise make it green
        const color = (node.activation < 0) ? "0x" + intensity + "0000" : "0x00" + intensity + "00";

        // Set the fill color
        graphics.beginFill(color);

        // Add a blue border
        graphics.lineStyle(1 , 0x0000FF);

        // Draw the circle
        graphics.drawCircle(loc.x, loc.y, NNDisplay.nodeSize);
    }
}