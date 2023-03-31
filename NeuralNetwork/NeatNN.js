/* NeatNN.js
* A neural network that uses the NEAT algorithm
*
* Created by: Brandon Hall
*
* Public functions:
*   SetInput(index, newValue) - Sets the input of the neural network
*   RunNN() - Runs the neural network
*   GetOutput(index) - Gets the output of the neural network
*   DrawNN(graphics, xSize, ySize, circleSize) - Draws the neural network
*   Mutate() - Mutates the neural network
*   GetPenalty() - Gets the penalty of the neural network
*   Clone() - Clones the neural network
*   toJson() - Creates a JSON object from the neural network
*   fromJson(json) - Creates a neural network from a JSON object
*/


class NeatNN {

    static MUTATION_MULTIPLIER = 1;       // The mutation multiplier of the neural network

    constructor(_inputCount, _outputCount, dontRandomize = false) {
        this.inputCount = _inputCount;
        this.outputCount = _outputCount;

        this.nodes = [];
        this.connections = [];

        this.inputs = [];
        this.outputs = [];

        this.penalty = 0;       // The penalty of the network (increases for larger networks)

        // If the network is not being cloned or loaded, create the network
        if (dontRandomize)
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

                // If the input is undefined, throw an error
                if (this.inputs[i] === undefined)
                    throw new Error("ERROR: NeatNN input " + i + " is undefined");

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
    connect(from, to, weight = null) {
        
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
        this.penalty = this.connections.length * 0.002 + this.nodes.length * 0.005;
    }

    // ---------------------------- Mutate Functions ------------------------------------ //

    // Mutate the network
    Mutate() {

        var mutateWeightChance =            0.6  * NeatNN.MUTATION_MULTIPLIER;
        var mutateBiasChance =              0.3  * NeatNN.MUTATION_MULTIPLIER;
        var mutateAddConnectionChance =     0.05 * NeatNN.MUTATION_MULTIPLIER;
        var mutateRemoveConnectionChance =  0.05 * NeatNN.MUTATION_MULTIPLIER;
        var mutateAddNodeChance =           0.03 * NeatNN.MUTATION_MULTIPLIER;
        var mutateRemoveConnectionChance =  0.03 * NeatNN.MUTATION_MULTIPLIER;

        // Mutate the weight of a random connection
        while (mutateWeightChance > 0 && Math.random() < mutateWeightChance){
            mutateWeightChance -= 1;

            this.MutateModifyWeight();
        }

        // Mutate the bias of a random node
        while (mutateBiasChance > 0 && Math.random() < mutateBiasChance){
            mutateBiasChance -= 1;

            this.MutateModifyBias();
        }
        
        // Add a random connection to the network
        while (mutateAddConnectionChance > 0 && Math.random() < mutateAddConnectionChance){
            mutateAddConnectionChance -= 1;

            this.MutateAddConnection();
        }
        
        // Remove a random connection from the network
        while (mutateRemoveConnectionChance > 0 && Math.random() < mutateRemoveConnectionChance){
            mutateRemoveConnectionChance -= 1;

            this.MutateRemoveConnection();
        }
        
        // Add a random node to the network
        while (mutateAddNodeChance > 0 && Math.random() < mutateAddNodeChance){
            mutateAddNodeChance -= 1;

            this.MutateAddNode();
        }

        // Remove a random node from the network
        while (mutateRemoveConnectionChance > 0 && Math.random() < mutateRemoveConnectionChance){
            mutateRemoveConnectionChance -= 1;

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

    /* Updates the display of the network using the gicen NNDisplay
     * @param {NNDisplay} diagram - The NNDisplay that will be used to draw the network
     */
    UpdateDisplay(diagram) {

        // The padding between the outside of the box and the nodes
        const xPadding = 35;
        const yPadding = 20;

        // The amount of space to the left to allow for the node labels
        const leftPadding = (NNDisplay.DRAW_LABELS) ? NNDisplay.leftPadding : 0;

        var nodeLocations = [];                      // The x,y locations of the nodes
        var nodeDepths = this.FindDepths();          // The depth of each node
        var maxDepth = Math.max(...nodeDepths) + 1;  // The max depth of the network
        var nodeDepthsCount = [];                    // The number of nodes at each depth
        var yPositionsUsed = [];                     // The y positions that are already used

        // If the network has been destroyed, return
        if (this.nodes === null)
            return;

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
            var xLoc = xPadding + nodeDepths[i] * (NNDisplay.xSize - xPadding * 2) / (maxDepth-1) + leftPadding;
    
            // Center the nodes at the y location
            var yLoc = yPadding + (NNDisplay.ySize - yPadding * 2) * (yPositionsUsed[nodeDepths[i]] + .5) / nodeDepthsCount[nodeDepths[i]];
            yPositionsUsed[nodeDepths[i]]++;
    
            // Add the location to the list of locations
            nodeLocations.push(new PIXI.Point(xLoc + NNDisplay.xPos, yLoc + NNDisplay.yPos));
        }

        // Sets the diagram to the given node locations
        diagram.SetNN(nodeLocations, this.connections, this.nodes);
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

        // Check if the value is a number
        if (isNaN(value))
            throw "You are trying to set an input " + index + " to a non-number: " + value;

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

    /* Returns a clone of the neural network */
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

    /* Returns a json object of this NN */
    toJson() {

        var nodesJson = [];
        var connectionsJson = [];

        // For each node
        for (let i = 0; i < this.nodes.length; i++) {
            nodesJson.push(this.nodes[i].toJson());
        }

        // For each connection
        for (let i = 0; i < this.connections.length; i++) {
            connectionsJson.push(this.connections[i].toJson(this.nodes));
        }

        return {
            inputCount: this.inputCount,
            outputCount: this.outputCount,
            nodesJson: nodesJson,
            connectionsJson: connectionsJson
        };
    }

    /* Creates a new NN from a json object */
    static fromJson(json) {

        var nn = new NeatNN(json.inputCount, json.outputCount, true);

        // For each node
        for (let i = 0; i < json.nodesJson.length; i++) {
            nn.nodes.push(Node.fromJson(json.nodesJson[i]));
        }

        // For each connection
        for (let i = 0; i < json.connectionsJson.length; i++) {

            var fromNode = nn.nodes[json.connectionsJson[i].from];
            var toNode = nn.nodes[json.connectionsJson[i].to];
            var weight = json.connectionsJson[i].weight;

            //console.log("From: " + fromNode + " To: " + toNode + " Weight: " + weight);

            nn.connect(fromNode, toNode, weight)
        }

        // Ensure the penalty is calculated
        nn.CalculatePenalty();

        return nn;
    }

    /* Sets most values to null to avoid memory leaks */
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
    constructor(_from, _to, _weight = null) {
        this.from = _from;
        this.to = _to;

        if (_weight === null)
            this.weight = Math.random() * 2 - 1;
        else
            this.weight = _weight;
    }

    toString() {
        return "{ Connection: " + this.from + " -> " + this.to + " " + this.weight + " }";
    }

    /* Returns a json object of this Connection */
    toJson(nodes) {
        return {
            from: nodes.indexOf(this.from),
            to: nodes.indexOf(this.to),
            weight: this.weight
        }
    }

    /* Creates a new Connection from a json object */
    static fromJson(json, nodes) {

        // Add the connection to the nodes
        nodes[json.from].AddIncomingConnection(nodes[json.to]);
        nodes[json.to].AddOutgoingConnection(nodes[json.from]);

        return new Connection(nodes[json.from], nodes[json.to], json.weight);
    }

    /* Sets most values to null to avoid memory leaks */
    Destroy() {
        this.from = null;
        this.to = null;
    }
}


