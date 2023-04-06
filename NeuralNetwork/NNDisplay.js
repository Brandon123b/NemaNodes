
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
    DrawConnectionLine(connection) {
        // The width of the line
        const lineWidth = 3;

        // map connection weight to [0,1]
        let clamped = clamp(connection.weight*2,-1,1) // multiply by 2 for a bit more intensity
        const weight = (clamped + 1)/2
        const hue = Math.floor(weight*125)
        const sat = Math.abs(clamped*100) // near-zero connection weight maps to white
        const color = Color.fromHSV(hue,sat,90)

        // Set the line style
        const alpha = Math.abs(clamped)
        this.graphics.lineStyle(lineWidth, color, alpha);

        // Draw the line
        let nodes = this.nn.nodes
        this.graphics.moveTo(this.nodeLocations[nodes.indexOf(connection.from)].x, this.nodeLocations[nodes.indexOf(connection.from)].y);
        this.graphics.lineTo(this.nodeLocations[nodes.indexOf(connection.to)].x, this.nodeLocations[nodes.indexOf(connection.to)].y);
    }

    /* Draws a node
    * graphics: The graphics object to draw to
    * node: The node to draw
    * loc: The location to draw the node
    */
    DrawNodeCircle(node, loc) {
        // if the NN is living use its node activiation for color
        // otherwise use its node bias
        const nactivation = node.activation || node.bias
        const activation = clamp((nactivation+1)/2,0,1)
        const r = activation < 0.5 ? 255 : Math.round(255 - (activation - 0.5) * 2 * 255);
        const g = activation > 0.5 ? 255 : Math.round(activation * 2 * 255);
        const color = Color.fromRGB(r,g,0)
        
        // Set the fill color
        this.graphics.beginFill(color);

        // Add a blue border
        this.graphics.lineStyle(2, 0x0000ff);

        // Draw the circle
        this.graphics.drawCircle(loc.x, loc.y, NNDisplay.nodeSize);
    }

    // return the string to be used as a label for a node
    // contains the node's input/output label, and its bias (or activation if the neural network is alive)
    mkLabel(node) {
        return (node.label ? node.label + "\n" : "") + (node.activation || node.bias).toFixed(5)
    }

    /**
     * Redraw the NN display
     */
    update() {
        this.graphics.clear()

        for(let i = 0; i < this.nn.connections.length; i++)
        this.DrawConnectionLine(this.nn.connections[i])

        for(let i = 0; i < this.nodeLocations.length; i++)
        this.DrawNodeCircle(this.nn.nodes[i], this.nodeLocations[i])

        // update text labels
        this.nn.nodes.forEach((node, i) => {
            this.textLabels[i].text = this.mkLabel(node)
        })
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
    constructor(nn) {
        this.nn = nn

        this.graphics = new PIXI.Graphics()
        // mapping of nodes to their positions in this display
        this.nodeLocations = this.calculateNodeLocations()
        // mapping of nodes to the text objects for their labels
        this.textLabels = []
        
        this.container = new PIXI.Container()
        this.container.addChild(this.graphics)

        // create hit circles to display node labels on mouse over
        this.nodeLocations.forEach((pos,i) => {
            let node = nn.nodes[i]
            let type = node.nodeType

            // make an object to detect mouse for each node
            let hitCircle = new PIXI.Container()
            hitCircle.position = pos

            // create labels for input/output neurons
            let nodeLabelText = new PIXI.Text(this.mkLabel(node),NNDisplay.textStyle)
            nodeLabelText.position = pos
            if (type === NodeType.Input || type === NodeType.Hidden)
                nodeLabelText.x += NNDisplay.nodeSize
            else if (type === NodeType.Output) // output neuron labels placed to left of node
                nodeLabelText.x -= nodeLabelText.width
            nodeLabelText.y -= nodeLabelText.height/2
            nodeLabelText.visible = false
            this.textLabels.push(nodeLabelText)

            // background for text so it is readable
            let textbg = new PIXI.Graphics(0)
            textbg.beginFill(0)
            textbg.drawRect(nodeLabelText.x-5, nodeLabelText.y-5, nodeLabelText.width+10,nodeLabelText.height+10)
            textbg.endFill(0)
            textbg.visible = false

            this.container.addChild(hitCircle)
            this.container.addChild(textbg)
            this.container.addChild(nodeLabelText)

            hitCircle.hitArea = new PIXI.Circle(0,0,NNDisplay.nodeSize)
            hitCircle.interactive = true
            hitCircle.onmouseover = () => nodeLabelText.visible = textbg.visible = true
            hitCircle.onmouseout = () => nodeLabelText.visible = textbg.visible = false
        })

        this.update()
    }


    /**
     * Map each node from the neural network to a position in its display
     * @returns locations for each node
     */
    calculateNodeLocations() {
        var nodeLocations = [];                      // The x,y locations of the nodes
        var nodeDepths = this.nn.FindDepths();          // The depth of each node
        var maxDepth = Math.max(...nodeDepths) + 1;  // The max depth of the network
        var nodeDepthsCount = [];                    // The number of nodes at each depth
        var yPositionsUsed = [];                     // The y positions that are already used

        // Set the depths of the output nodes to the max depth
        for (let i = 0; i < this.nn.outputCount; i++) {
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
        for (let i = 0; i < this.nn.nodes.length; i++) {

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
}

