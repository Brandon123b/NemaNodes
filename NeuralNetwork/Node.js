
class Node {

    constructor(_nodeType) {
        this.nodeType = _nodeType;
        this.bias = Math.random() - .5;     // Random number between -0.5 and 0.5
        
        this.activation;                    // The activation of the node (Will be calculated in the CalculateActivation function)
        
        this.incomingConnections = [];      // The connections that are coming into this node
        this.outgoingConnections = [];      // The connections that are going out of this node

    }

    // Add an incoming connection to the node
    AddIncomingConnection(connection) {
        this.incomingConnections.push(connection);
    }

    // Add an outgoing connection from the node
    AddOutgoingConnection(connection) {

        if (this.IsConnectedTo(connection.to)){
            throw new Error("Node is already connected to the node that the connection is going to");
            return;
        }

        this.outgoingConnections.push(connection);
    }

    // Remove an incoming connection from the node
    RemoveIncomingConnection(connection) {
        this.incomingConnections.splice(this.incomingConnections.indexOf(connection), 1);
    }

    // Remove an outgoing connection from the node
    RemoveOutgoingConnection(connection) {
        this.outgoingConnections.splice(this.outgoingConnections.indexOf(connection), 1);
    }

    /** Check if the node is connected to another node
     * Returns true if the node is connected to the other node, false otherwise
     */
    IsConnectedTo(node) {
        for(let i = 0; i < this.outgoingConnections.length; i++) {
            if(this.outgoingConnections[i].to === node) {
                return true;
            }
        }

        return false;
    }

    /** Calculate the activation of the node
     * The activation of the node is the sum of the activation of the input nodes multiplied by the weight of the connection
     * Will be called on every node except the input nodes
    */
    CalculateActivation(input) {

        // If the node is an input node, set the activation to the input value and return
        if (this.nodeType === NodeType.Input) {

            this.activation = input;
            return;
        }
        
        // Reset the activation to the bias
        this.activation = this.bias;

        // For each incoming connection, add the activation of the node to the activation of this node
        for(let i = 0; i < this.incomingConnections.length; i++) {
            var conn = this.incomingConnections[i];
            this.activation += conn.from.activation * conn.weight;
        }

        // Calculate the sigmoid of the activation
        this.activation = this.sigmoid(this.activation);
    }

    /** Calculate the sigmoid of the activation
     * Range: -1 to 1
    */ 
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x)) * 2 - 1;
    }

    // Return a string representation of the node
    toString() {
        return "{ Node: Type(" + this.nodeType + "), Activation(" + this.activation + "), Bias(" + this.bias + ") }";
    }

    Destroy() {

        // Clear the incoming connections
        this.incomingConnections = null;
        this.outgoingConnections = null;
    }

    /* Return a JSON representation of the node
    * The connections are not included in the JSON because they are not needed to recreate the node
    */
    toJson() {

        return {
            bias: this.bias,
            nodeType: this.nodeType
        }
    }

    // Load a node from a JSON object
    static fromJson(json) {
        var node = new Node(json.nodeType);
        node.bias = json.bias;

        return node;
    }
}


// Represents the type of node as an enum
const NodeType = {
	Input: 0,
    Hidden: 1,
    Output: 2
}