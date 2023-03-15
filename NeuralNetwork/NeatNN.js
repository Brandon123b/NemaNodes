/* NeatNN.js
* A neural network that uses the NEAT algorithm
*
* Public functions:
*   SetInput(index, newValue) - Sets the input of the neural network
*   RunNN() - Runs the neural network
*   GetOutput(index) - Gets the output of the neural network
*   DrawNN(graphics, xSize, ySize, circleSize) - Draws the neural network
*   Mutate() - Mutates the neural network
*   GetPenalty() - Gets the penalty of the neural network
*   Clone() - Clones the neural network
*
* TODO:
*   Serialize() - Serializes the neural network
*   Deserialize() - Deserializes the neural network
*/


class NeatNN {

    constructor(_inputCount, _outputCount, isCloning = false) {
        this.inputCount = _inputCount;
        this.outputCount = _outputCount;

        this.nodes = [];
        this.connections = [];

        this.inputs = [];
        this.outputs = [];

        this.penalty = 0;       // The penalty of the network (increases for larger networks)

        // If the network is not being cloned, create the network
        if (isCloning)
            return;

        // Create the input nodes
        for(let i = 0; i < this.inputCount; i++){
            this.nodes.push(new Node(NodeType.Input));
            this.inputs.push(0);
        }
        
        // Create the output nodes
        for(let i = 0; i < this.outputCount; i++)
            this.nodes.push(new Node(NodeType.Output));
        
        // Create the connections between the input and output nodes
        for(let i = 0; i < this.inputCount; i++) {
            for(let j = 0; j < this.outputCount; j++) {

                if (Math.random() < .5)
                    this.connect(this.nodes[i], this.nodes[this.nodes.length - this.outputCount + j]);
            }
        }

        // Default the input values
        for(let i = 0; i < this.inputCount; i++)
            this.inputs.push(0);

        // Default the output values
        for(let i = 0; i < this.outputCount; i++)
            this.outputs.push(0);

        // Calculate the penalty of the network
        this.CalculatePenalty();
    }

    // Run the neural network
    RunNN() {

        // For each node, calculate the activation
        for(let i = 0; i < this.nodes.length; i++) {
                
            // Get the node
            var node = this.nodes[i];

            // If the node is an input node, set the activation to the input value and continue
            if(node.nodeType === NodeType.Input) {
                node.CalculateActivation(this.inputs[i]);
                continue;
            }
            
            // If not an input node, Calculate the activation of the node (without an input)
            node.CalculateActivation();
        }

        // Get the offset of the first output node
        var offset = this.nodes.length - this.outputCount;

        // Set the output values
        for(let i = 0; i < this.outputCount; i++) {
            this.outputs[i] = this.nodes[offset + i].activation;
        }
    }

    /* Connect two nodes
    * from: The node that the connection is coming from
    * to: The node that the connection is going to
    * weight: The weight of the connection (Can be undefined for a random weight)
    */
    connect(from, to, weight) {
        
        // If the nodes are already connected, throw an error
        if(from.IsConnectedTo(to)){

            this.PrintConnectionIndexes();

            console.log(this.nodes.indexOf(from) + " -> " + this.nodes.indexOf(to) + " is already connected");
            throw new Error("Nodes are already connected");
        }

        // If the connection is going from a higher index to a lower index, throw an error
        if (this.nodes.indexOf(from) > this.nodes.indexOf(to)){
            throw new Error("Connection is going from a higher index to a lower index");
        }

        // Create the connection
        var newConnection = new Connection(from, to, weight);

        // Add the connection to the list of connections
        this.connections.push(newConnection);

        // Add the connection to the nodes
        from.AddOutgoingConnection(newConnection);
        to.AddIncomingConnection(newConnection);
    }

    /* Disconnect two nodes
    * connection: The connection to disconnect
    */
    disconnect(connection) {

        // Remove the connection from the list of connections
        this.connections.splice(this.connections.indexOf(connection), 1);

        // Remove the connection from the nodes
        connection.from.RemoveOutgoingConnection(connection);
        connection.to.RemoveIncomingConnection(connection);
    }

    /* Calculate the penalty of the network
    *  Penalty is calculated by the number of connections and nodes
    */ 
    CalculatePenalty() {
        this.penalty = this.connections.length * 0.01 + this.nodes.length * 0.05;
    }

    // ---------------------------- Mutate Functions ------------------------------------

    // Mutate the network
    Mutate() {

        var mutateWeightChance = 0.6;
        var mutateBiasChance = 0.3;
        var mutateAddConnectionChance = 0.06;
        var mutateRemoveConnectionChance = 0.05;
        var mutateAddNodeChance = 0.05;
        var mutateRemoveConnectionChance = 0.04;

        // Mutate the weight of a random connection
        if (Math.random() < mutateWeightChance){

            for (let i = 0; i < 2; i++)
                this.MutateModifyWeight();
        }

        // Mutate the bias of a random node
        if (Math.random() < mutateBiasChance){

            for (let i = 0; i < 2; i++)
                this.MutateModifyBias();
        }
        
        // Add a random connection to the network
        if (Math.random() < mutateAddConnectionChance){

            this.MutateAddConnection();
        }
        
        // Remove a random connection from the network
        if (Math.random() < mutateRemoveConnectionChance){

            this.MutateRemoveConnection();
        }
        
        // Add a random node to the network
        if (Math.random() < mutateAddNodeChance){

            this.MutateAddNode();
        }

        // Remove a random node from the network
        if (Math.random() < mutateRemoveConnectionChance){

            this.MutateRemoveNode();
        }

        // Calculate the new penalty of the network
        this.CalculatePenalty();

        // Return the mutated network to allow for chaining
        return this;
    }

    // Modify the weight of a random connection
    MutateModifyWeight() {

        // If there are no connections, return
        if (this.connections.length === 0)
            return;

        // Pick a random connection
        var randomIndex = Math.floor(Math.random() * this.connections.length);
        var connection = this.connections[randomIndex];

        // Modify the weight of the connection (between -.5 and .5)
        connection.weight += (Math.random() - .5);
    }

    // Modify the bias of a random node
    MutateModifyBias() {

        // Pick a random node (not an input node)
        var randomIndex = Math.floor(Math.random() * (this.nodes.length - this.inputCount));
        var node = this.nodes[this.inputCount + randomIndex];

        // Modify the bias of the node (between -.5 and .5)
        node.bias += Math.random() - .5;
    }

    // Add a random connection to the network
    MutateAddConnection() {

        // Create a list of all possible connections
        var possibleConnections = [];

        // For each node
        for(let i = 0; i < this.nodes.length; i++) {

            // Get the node
            var node = this.nodes[i];

            // If the node is an output node, continue
            if(node.nodeType === NodeType.Output)
                continue;

            // For every node that the current node is not connected to
            for(let j = i; j < this.nodes.length; j++) {

                // Node cannot connect to itself
                if (i === j)
                    continue;

                // Node cannot connect to an input node
                if (this.nodes[j].nodeType === NodeType.Input)
                    continue;
                
                // If the conection is not already in the list of connections, add it to the list of possible connections
                if (!this.nodes[i].IsConnectedTo(this.nodes[j]))
                    possibleConnections.push({ from: this.nodes[i], to: this.nodes[j] });
                
            }
        }  

        // If there are no possible connections, return
        if (possibleConnections.length === 0)
            return;
        
        // Pick a random connection
        var randomIndex = Math.floor(Math.random() * possibleConnections.length);

        // Connect the nodes    
        this.connect(possibleConnections[randomIndex].from, possibleConnections[randomIndex].to);
    }
    
    // Removes a random connection from the network
    MutateRemoveConnection() {

        // Add all eligible connections to a list
        var eligibleConnections = [];

        for(let i = 0; i < this.connections.length; i++) {

            // If the from and to nodes have more than one connection, add the connection to the list of eligible connections
            // Or if the connection is between an input or output node
            if (this.connections[i].from.nodeType !== NodeType.Hidden && this.connections[i].to.nodeType !== NodeType.Hidden ||
                this.connections[i].from.outgoingConnections.length > 1 && this.connections[i].to.incomingConnections.length > 1)
                eligibleConnections.push(this.connections[i]);
        }

        // If there are no eligible connections, return
        if (eligibleConnections.length === 0)
            return;
        
        // Pick a random connection
        var randomIndex = Math.floor(Math.random() * eligibleConnections.length);
        var connection = eligibleConnections[randomIndex];

        // Disconnect the connection
        this.disconnect(connection);
    }

    // Add a random node to the network
    MutateAddNode() {

        if (this.connections.length === 0)
            return;
            
        // Pick a random connection
        var randomIndex = Math.floor(Math.random() * this.connections.length);
        var connection = this.connections[randomIndex];

        // Disconnect the connection
        this.disconnect(connection);

        // Create a new node
        var newNode = new Node(NodeType.Hidden);

        // Place the node just before the node that the connection was going to, but before the output nodes
        var newIndex = Math.min(this.nodes.indexOf(connection.to), this.nodes.length - this.outputCount);
        
        // Add the new node to the list of nodes
        this.nodes.splice(newIndex, 0, newNode);

        // Connect the new node to the old nodes
        this.connect(connection.from, newNode, 1);
        this.connect(newNode, connection.to, connection.weight);
    }

    // Removes a random node from the network
    MutateRemoveNode() {

        var internalNodeCount = this.nodes.length - this.inputCount - this.outputCount;
        // If there are no internal nodes, return
        if (internalNodeCount === 0)
            return;
        
        // Pick a random node (not an input or output node)
        var randomIndex = Math.floor(Math.random() * internalNodeCount) + this.inputCount;

        // Get the node
        var node = this.nodes[randomIndex];

        // First, connect all the incoming nodes to all the outgoing nodes

        // For each incoming connection
        for(let i = 0; i < node.incomingConnections.length; i++) {
                
            // For each outgoing connection
            for(let j = 0; j < node.outgoingConnections.length; j++) {

                // Connect the incoming node to the outgoing node if it is not already connected
                if (!node.incomingConnections[i].from.IsConnectedTo(node.outgoingConnections[j].to))
                    this.connect(node.incomingConnections[i].from, node.outgoingConnections[j].to, node.incomingConnections[i].weight * node.outgoingConnections[j].weight);
            }
        }

        // Then, remove the connections from the node

        while (node.outgoingConnections.length > 0)
            this.disconnect(node.outgoingConnections[0]);

        while (node.incomingConnections.length > 0)
            this.disconnect(node.incomingConnections[0]);

        // Remove the node from the list of nodes
        this.nodes.splice(randomIndex, 1);

    }

    // ---------------------------- Draw Functions --------------------------------------

    /** Draws the neural network to the canvas
     * Draws the nn to the top left of the canvas using the given graphics object
     * The network is drawn with the input nodes on the left, the output nodes on the right, and the hidden nodes in the middle
     * This function is not optimized and should not be used too often
     * @param {PIXI.Graphics} graphics The graphics object to draw to
     * @param {number} xSize The width of the canvas
     * @param {number} ySize The height of the canvas
     * @param {number} nodeSize The size of the nodes
     */
    DrawNN(graphics, xSize = 300, ySize = 200, nodeSize = 10) {

        var xPadding = 35;
        var yPadding = 20;

        var nodeLocations = [];                     // The x,y locations of the nodes
        var nodeDepths = this.FindDepths();         // The depth of each node
        var maxDepth = Math.max(...nodeDepths) + 1; // The max depth of the network
        var nodeDepthsCount = [];                   // The number of nodes at each depth
        var yPositionsUsed = [];                     // The y positions that are already used

        // Draw a black rounded rectangle as the background
        graphics.beginFill(0x000000);
        graphics.drawRoundedRect(10, 10, xSize, ySize, 20);
        graphics.endFill();

        // Set the depths of the output nodes to the max depth
        for (let i = 0; i < this.outputCount; i++) {
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
        for (let i = 0; i < this.nodes.length; i++) {

            // Set the x location to the x padding plus the max x size divided by the number of layers
            var xLoc = xPadding + nodeDepths[i] * (xSize - xPadding * 2) / (maxDepth-1);

            // Center the nodes at the y location
            var yLoc = yPadding + (ySize - yPadding * 2) * (yPositionsUsed[nodeDepths[i]] + .5) / nodeDepthsCount[nodeDepths[i]];
            yPositionsUsed[nodeDepths[i]]++;

            // Add the location to the list of locations
            nodeLocations.push(new PIXI.Point(xLoc, yLoc));
        }

        // Draw the connections
        for(let i = 0; i < this.connections.length; i++) {
            this.DrawConnection(graphics, this.connections[i], nodeLocations);
        }

        // Draw the nodes
        for(let i = 0; i < nodeLocations.length; i++) {
            this.DrawNode(graphics, this.nodes[i], nodeLocations[i], nodeSize);
        }

    }

    /* Draws a node
    * graphics: The graphics object to draw to
    * node: The node to draw
    * loc: The location to draw the node
    * nodeSize: The size of circle to draw for the node
    */
    DrawNode(graphics, node, loc, nodeSize) {

        // The intensity of the color
        var intensity = Math.min(255, Math.abs(node.activation * 255));
        intensity = Math.floor(intensity).toString(16).toUpperCase();

        // If the intensity is only one digit, add a 0 to the front
        if(intensity.length === 1)
            intensity = "0" + intensity;
        
        // If the activation is less than 0, make the color red, otherwise make it green
        var color = (node.activation < 0) ? "0x" + intensity + "0000" : "0x00" + intensity + "00";

        // Set the fill color
        graphics.beginFill(color);

        // Add a blue border
        graphics.lineStyle(1 , 0x0000FF);

        // Draw the circle
        graphics.drawCircle(loc.x, loc.y, nodeSize);
    }

    /* Draws a connection
    * graphics: The graphics object to draw to
    * connection: The connection to draw
    * nodeLocations: The locations of the nodes
    */
    DrawConnection(graphics, connection, nodeLocations) {
            
        // The width of the line
        var lineWidth = 3;

        // The intensity of the color
        var intensity = Math.min(255, Math.abs(connection.weight * 255));
        intensity = Math.floor(intensity).toString(16).toUpperCase();

        // If the intensity is only one digit, add a 0 to the front
        if(intensity.length === 1)
            intensity = "0" + intensity;

        // If the weight is less than 0, make the color red, otherwise make it green
        var color = (connection.weight < 0) ? "0x" + intensity + "0000" : "0x00" + intensity + "00";

        // Set the line style
        graphics.lineStyle(lineWidth, color);

        // Draw the line
        graphics.moveTo(nodeLocations[this.nodes.indexOf(connection.from)].x, nodeLocations[this.nodes.indexOf(connection.from)].y);
        graphics.lineTo(nodeLocations[this.nodes.indexOf(connection.to)].x, nodeLocations[this.nodes.indexOf(connection.to)].y);
    }

    /* Finds the depth of each node
    * Returns: An array of the depths of each node
    */
    FindDepths(){

        var nodeDepths = [];
        
        // Set the depth of the input nodes to 0
        for (let i = 0; i < this.inputCount; i++) {
            nodeDepths.push(0);
        }

        // Loop through the nodes and find the depth of each node
        for (let i = this.inputCount; i < this.nodes.length - this.outputCount; i++) {

            // The depth of the current node
            var depth = 0;

            // Get the node
            var node = this.nodes[i];

            //console.log("Node: " + i + " " + node)

            for (let j = 0; j < node.incomingConnections.length; j++) {

                // Get the depth of the node that the connection is coming from
                var fromDepth = nodeDepths[this.nodes.indexOf(node.incomingConnections[j].from)];

                // Set the depth to the max of the current depth and the depth of the node that the connection is coming from
                depth = Math.max(depth, fromDepth);
            }

            // Add one to the depth
            depth++;

            // Add the depth to the list of depths
            nodeDepths[i] = depth;
        }

        // Get the max depth
        var maxDepth = Math.max(...nodeDepths);

        // Set the depth of the output nodes to the max depth + 1
        for (let i = this.nodes.length - this.outputCount; i < this.nodes.length; i++) 
            nodeDepths.push(maxDepth + 1);

        return nodeDepths;
    }

    // ---------------------------- Print Functions ------------------------------------

    PrintNodes() {
        console.log("Printing Nodes: ");

        for (let i = 0; i < this.nodes.length; i++) {
            console.log("  " + this.nodes[i]);
        }
    }

    PrintConnections() {
        console.log("Printing Connections: ");

        for (let i = 0; i < this.connections.length; i++) {
            console.log("    " + this.connections[i]);
        }
    }

    PrintConnectionIndexes() {
        console.log("Printing Connection Indexes: ");
        
        for (let i = 0; i < this.connections.length; i++) {
            console.log("    " + this.nodes.indexOf(this.connections[i].from) + " -> " + this.nodes.indexOf(this.connections[i].to));
        }
    }

    // ---------------------------- Getters and Setters --------------------------------
    
    // Set the input value of the node
    SetInput(index, value) {

        // Check if the index is valid
        if (index >= this.inputCount)
            throw "You are trying to set an input that does not exist";

        // Set the input
        this.inputs[index] = value;
    }

    // Get the output value of the node
    GetOutput(index) {

        // Get the output
        return this.outputs[index];
    }

    // Get the penalty
    GetPenalty() {
        return this.penalty;
    }

    // ---------------------------- Other Functions ------------------------------------

    /** Returns a clone of the neural network
     * 
     * @returns a clone of the neural network
     */
    Clone() {

        // Create a new neural network
        var newNN = new NeatNN(this.inputCount, this.outputCount, true);

        // For each node in the old neural network
        for (let i = 0; i < this.nodes.length; i++) {

            // Get the node
            var node = this.nodes[i];

            // Create a new node and set the type and bias
            var newNode = new Node(node.nodeType);
            newNode.bias = node.bias;

            // Add the new node to the new neural network
            newNN.nodes.push(newNode);
        }

        // For each connection in the old neural network
        for (let i = 0; i < this.connections.length; i++) {

            // Get the connection
            var connection = this.connections[i];

            var fromIndex = this.nodes.indexOf(connection.from);
            var toIndex = this.nodes.indexOf(connection.to);
            
            // Connect the nodes in the new neural network
            newNN.connect(newNN.nodes[fromIndex], newNN.nodes[toIndex], connection.weight)
        }

        return newNN;
    }

    Destroy() {

        // Destroy the nodes
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].Destroy();
        }

        // Destroy the connections
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].Destroy();
        }

        // Set the nodes and connections to null
        this.nodes = null;
        this.connections = null;

        // Set the inputs and outputs to null (for good measure)
        this.inputs = null;
        this.outputs = null;
    }
}

/** Represents a connection between two nodes in the neural network
 * 
 */
class Connection {

    /** Create a connection
    * _from: The node that the connection is coming from
    * _to: The node that the connection is going to
    * _weight: The weight of the connection
    */
    constructor(_from, _to, _weight) {
        this.from = _from;
        this.to = _to;

        if (_weight === undefined)
            this.weight = Math.random() * 2 - 1;
        else
            this.weight = _weight;
    }

    toString() {
        return "{ Connection: " + this.from + " -> " + this.to + " " + this.weight + " }";
    }

    Destroy() {
        this.from = null;
        this.to = null;
    }
}