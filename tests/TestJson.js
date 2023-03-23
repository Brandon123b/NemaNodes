
/* Tests the NeatNN.toJson() and NeatNN.fromJson() functions.
*  Creates a NeatNN, converts it to JSON, creates a new NeatNN from the JSON, and compares the two NeatNNs.
*  Also tests the initial NeatNN and the new NeatNN to make sure they have the same outputs.
*/ 
function TestNNJson() {

    var passed = true;

    // Create a new NeatNN with 7 inputs and 6 outputs
    var nn1 = new NeatNN(7, 6);

    // Create a JSON object from the NeatNN
    var json1 = nn1.toJson();

    // Create a new NeatNN from the JSON object
    var nn2 = NeatNN.fromJson(json1);

    // Create a JSON object from the new NeatNN
    var json2 = nn2.toJson();

    // Compare the JSON objects
    if (JSON.stringify(json1) == JSON.stringify(json2)) {
        console.log("-- NeatNN has identical JSON objects");
    }
    else {
        console.log("-- FAILED: NeatNN has different JSON objects");
        passed = false;
    }

    // Create 7 random inputs
    var inputs = [];
    for (var i = 0; i < 7; i++) {
        inputs.push((Math.random() - .5) * 2);
    }

    // Set the inputs of the NeatNNs
    for (var i = 0; i < 7; i++) {
        nn1.SetInput(i, inputs[i]);
        nn2.SetInput(i, inputs[i]);
    }

    // Run the NeatNNs
    nn1.RunNN();
    nn2.RunNN();

    var outputPass = true;

    // Get the outputs of the NeatNNs
    var outputs1 = [];
    var outputs2 = [];
    for (var i = 0; i < 6; i++) {
        outputs1.push(nn1.GetOutput(i));
        outputs2.push(nn2.GetOutput(i));

        // Compare the outputs
        if (outputs1[i] != outputs2[i]) {
            console.log("-- FAILED: NeatNN has different outputs: " + outputs1[i] + " != " + outputs2[i]);
            outputPass = false;
            passed = false;
        }
    }

    if (outputPass) {
        console.log("-- NeatNN has identical outputs");
    }

    if (passed) {
        console.log("--- TestNNJson passed! ---");
    }

}

/* Tests the Nematode.toJson() and Nematode(json) functions.
*  Creates a Nematode, converts it to JSON, creates a new Nematode from the JSON, and compares the two Nematodes.
*  Also tests the initial Nematode and the new Nematode to make sure they have the same outputs.
*  WARNING: Since Nematodes can eat food, the test may fail. Should remove the ability to eat food for this test. (or have none)
*/
function TestNematodeJson() {

    var passed = true;

    // Create a new Nematode
    var nem1 = new Nematode();

    // Update the Nematode to age it 1 second (all at once)
    nem1.Update(1);

    // Create a JSON object from the Nematode
    var json1 = nem1.toJson();

    // Create a new Nematode from the JSON object
    var nem2 = new Nematode(json1);

    // Create a JSON object from the new Nematode
    var json2 = nem2.toJson();

    // Compare the JSON objects
    if (JSON.stringify(json1) == JSON.stringify(json2)) {

        console.log("-- Nematode has identical JSON objects");
    }
    else {

        console.log("-- FAILED: Nematode has different JSON objects");
        passed = false;
    }

    // Simulate 100 frames
    for (var i = 0; i < 100; i++) {

        var delta = Math.random();
        
        // Update the values using the nn
        nem1.SlowUpdate();
        nem2.SlowUpdate();

        // Move the Nematodes and update the vars
        nem1.Update(delta);
        nem2.Update(delta);
    }

    // Create another JSON object from the Nematode (after Update())
    json1 = nem1.toJson();
    json2 = nem2.toJson();

    // Compare the JSON objects (again)
    if (JSON.stringify(json1) == JSON.stringify(json2)) {

        console.log("-- Nematode has identical JSON objects (again)");
    }
    else {

        console.log("-- FAILED: Nematode has different JSON objects (again)");
        passed = false;
    }

    // Test the vars of the Nematodes
    if (nem1.age != nem2.age) {

        console.log("-- FAILED: Nematode has different ages: " + nem1.age + " != " + nem2.age);
        passed = false;
    }
    if (nem1.energy != nem2.energy) {

        console.log("-- FAILED: Nematode has different energies: " + nem1.energy + " != " + nem2.energy);
        passed = false;
    }
    if (nem1.size != nem2.size) {

        console.log("-- FAILED: Nematode has different sizes: " + nem1.size + " != " + nem2.size);
        passed = false;
    }
    if (nem1.speed != nem2.speed) {

        console.log("-- FAILED: Nematode has different speeds: " + nem1.speed + " != " + nem2.speed);
        passed = false;
    }
    if (nem1.turnSpeed != nem2.turnSpeed) {

        console.log("-- FAILED: Nematode has different turn speeds: " + nem1.turnSpeed + " != " + nem2.turnSpeed);
        passed = false;
    }
    if (nem1.GetX() != nem2.GetX() || nem1.GetY() != nem2.GetY()) {

        console.log("-- FAILED: Nematode has different positions: (" + nem1.GetX() + ", " + nem1.GetY() + ") != (" + nem2.GetX() + ", " + nem2.GetY() + ")");
        passed = false;
    }
    if (nem1.direction.x != nem2.direction.x || nem1.direction.y != nem2.direction.y) {

        console.log("-- FAILED: Nematode has different directions: (" + nem1.direction.x + ", " + nem1.direction.y + ") != (" + nem2.direction.x + ", " + nem2.direction.y + ")");
        passed = false;
    }

    if (passed) {
        console.log("--- TestNematodeJson passed! ---");
    }


}

// Run the test
// TestNNJson();
// TestNematodeJson();  // WARNING: Since Nematodes can eat food, the test may fail. Should remove the ability to eat food for this test. (or have none)