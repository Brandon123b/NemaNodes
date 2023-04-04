
class NNDisplay {
        
    // The size/position of the diagram
    static xSize = 250;
    static ySize = 200;
    static nodeSize = 10;
    static xPadding = NNDisplay.nodeSize;
    static yPadding = NNDisplay.nodeSize;

    // style for node labels
    static textStyle = new PIXI.TextStyle({
        fontFamily: 'Courier New',
        fontSize: 18,
        fill: 0x00cc00,
        letterSpacing: 2,
        fontWeight: "bold"
    })

    /* Draws a connection
    * graphics: The graphics object to draw to
    * connection: The connection to draw
    * nodeLocations: The locations of the nodes
    */
    static DrawConnectionLine(graphics, connection, nodeLocations, nodes) {
        // The width of the line
        const lineWidth = 3;

        // map connection weight to [0,1]
        let clamped = clamp(connection.weight*2,-1,1) // multiply by 2 for a bit more intensity
        const weight = (clamped + 1)/2
        const hue = Math.floor(weight*125)
        const sat = Math.abs(clamped*100) // near-zero connection weight maps to white
        const color = Color.fromHSV(hue,sat,90)

        // Set the line style
        graphics.lineStyle(lineWidth, color);

        // Draw the line
        graphics.moveTo(nodeLocations[nodes.indexOf(connection.from)].x, nodeLocations[nodes.indexOf(connection.from)].y);
        graphics.lineTo(nodeLocations[nodes.indexOf(connection.to)].x, nodeLocations[nodes.indexOf(connection.to)].y);
    }

    /* Draws a node
    * graphics: The graphics object to draw to
    * node: The node to draw
    * loc: The location to draw the node
    */
    static DrawNodeCircle(graphics, node, loc) {
        const activation = clamp((node.activation+1)/2,0,1)
        const r = activation < 0.5 ? 255 : Math.round(255 - (activation - 0.5) * 2 * 255);
        const g = activation > 0.5 ? 255 : Math.round(activation * 2 * 255);
        const color = Color.fromRGB(r,g,0)
        
        // Set the fill color
        graphics.beginFill(color);

        // Add a blue border
        graphics.lineStyle(2, 0x0000ff);

        // Draw the circle
        graphics.drawCircle(loc.x, loc.y, NNDisplay.nodeSize);
    }

    /**
     * Create a display object for the given NeatNN
     * 
     * The returned display object has method .updateNNDisplay()
     * to redraw the NN based on its current neuron activations.
     * 
     * @param {NeatNN} nn 
     * @returns {PIXI.Container}
     */
    static mkNNDisplay(nn) {
        let g = new PIXI.Graphics()
        // mapping of nodes to their positions in this display
        let nodeLocations = calculateNodeLocations(nn)
        let textLabels = []

        // get the string for a node's label
        let mkLabel = node => (node.label ? node.label + "\n" : "") + node.activation.toFixed(5)
        
        // draw the node circles and edge lines 
        let draw = () => {
            g.clear()

            for(let i = 0; i < nn.connections.length; i++)
            this.DrawConnectionLine(g, nn.connections[i], nodeLocations, nn.nodes)

            for(let i = 0; i < nodeLocations.length; i++)
            this.DrawNodeCircle(g, nn.nodes[i], nodeLocations[i])

            // update text labels
            nn.nodes.forEach((node, i) => {
                textLabels[i].text = mkLabel(node)
            })

        }
        
        let container = new PIXI.Container()
        container.addChild(g)

        // create hit circles to display node labels on mouse over
        nodeLocations.forEach((pos,i) => {
            let node = nn.nodes[i]
            let type = node.nodeType

            // make an object to detect mouse for each node
            let hitCircle = new PIXI.Container()
            hitCircle.position = pos

            // create labels for input/output neurons
            let nodeLabelText = new PIXI.Text(mkLabel(node),NNDisplay.textStyle)
            nodeLabelText.position = pos
            if (type === NodeType.Input || type === NodeType.Hidden)
                nodeLabelText.x += NNDisplay.nodeSize
            else if (type === NodeType.Output) // output neuron labels placed to left of node
                nodeLabelText.x -= nodeLabelText.width
            nodeLabelText.y -= nodeLabelText.height/2
            nodeLabelText.visible = false
            textLabels.push(nodeLabelText)

            // background for text so it is readable
            let textbg = new PIXI.Graphics(0)
            textbg.beginFill(0)
            textbg.drawRect(nodeLabelText.x-5, nodeLabelText.y-5, nodeLabelText.width+10,nodeLabelText.height+10)
            textbg.endFill(0)
            textbg.visible = false

            container.addChild(hitCircle)
            container.addChild(textbg)
            container.addChild(nodeLabelText)

            hitCircle.hitArea = new PIXI.Circle(0,0,NNDisplay.nodeSize)
            hitCircle.interactive = true
            hitCircle.onmouseover = () => nodeLabelText.visible = textbg.visible = true
            hitCircle.onmouseout = () => nodeLabelText.visible = textbg.visible = false
        })

        container.updateNNDisplay = draw
        draw()
        return container
    }


}

/**
 * Map each node from the neural network to a position in its display
 * @param {NeatNN} nn 
 * @returns locations for each node
 */
function calculateNodeLocations(nn) {
    var nodeLocations = [];                      // The x,y locations of the nodes
    var nodeDepths = nn.FindDepths();          // The depth of each node
    var maxDepth = Math.max(...nodeDepths) + 1;  // The max depth of the network
    var nodeDepthsCount = [];                    // The number of nodes at each depth
    var yPositionsUsed = [];                     // The y positions that are already used

    // Set the depths of the output nodes to the max depth
    for (let i = 0; i < nn.outputCount; i++) {
        nodeDepths.push(maxDepth);
    }

    // Initialize the count of nodes at each depth to 0
    for (let i = 0; i < maxDepth + 1; i++) {
        nodeDepthsCount[i] = 0;
    }

    // Count the number of nodes at each depth
    for (let i = 0; i < nodeDepths.length; i++) {
        nodeDepthsCount[nodeDepths[i]]++;
    }

    // Initialize the y positions used to 0
    for (let i = 0; i < maxDepth + 1; i++) {
        yPositionsUsed[i] = 0;
    }

    // Calculate the x,y locations of the nodes
    for (let i = 0; i < nn.nodes.length; i++) {

        // Set the x location to the x padding plus the max x size divided by the number of layers
        var xLoc = nodeDepths[i] * (NNDisplay.xSize) / (maxDepth-1)

        // Center the nodes at the y location
        var yLoc = (NNDisplay.ySize) * (yPositionsUsed[nodeDepths[i]]) / nodeDepthsCount[nodeDepths[i]];
        yLoc += NNDisplay.ySize / (2*nodeDepthsCount[nodeDepths[i]]) // set nodes to the center of their column section
        yPositionsUsed[nodeDepths[i]]++;

        // Add the location to the list of locations
        nodeLocations.push(new PIXI.Point(xLoc + NNDisplay.xPadding, yLoc + NNDisplay.yPadding));
    }

    return nodeLocations
}