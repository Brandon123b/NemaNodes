let n1 = new Nematode(); n2 = new Nematode(); n3 = new Nematode();
let w = new World(1000, 500, 10,10)
w.add(n1); w.add(n2); w.add(n3)
w.updatePos(n1, 300,150); w.updatePos(n2, 300,150); w.updatePos(n3, 300,150);

let results = w.getObjectsAtZone(30,15)

if (results.includes(n1) && results.includes(n2) && results.includes(n3) && results.length == 3)
  console.log("test passed")
else
  console.log("TEST FAILED")

results = w.getObjectsAt(300,150,10)

if (results.includes(n1) && results.includes(n2) && results.includes(n3) && results.length == 3)
  console.log("test passed")
else
  console.log("TEST FAILED")


w.updatePos(n1, 311,150)

results = w.getObjectsAt(300,150,10)

if (results.includes(n2) && results.includes(n3) && results.length == 2)
  console.log("test passed")
else
  console.log("TEST FAILED")

w.updatePos(n1, 309,148)
w.updatePos(n2, 20,20)

results = w.getObjectsAt(300,150,10)

if (results.includes(n1) && results.includes(n3) && results.length == 2)
  console.log("test passed")
else
  console.log("TEST FAILED")

