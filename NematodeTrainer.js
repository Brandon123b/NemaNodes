/* This class is used to train the nematodes by storing the smartest nematodes in a priority queue. This is also
 * used to load the smart nematodes from a file and to download the smart nematodes to a file.
 *
 * Author: Brandon Hall
 */

class NematodeTrainer {

    // Only store new nematodes if we are training
    static isTraining = true;

    // Will disable loading data from a file on start
    static disableLoad = true;

    // The maximum number of nematodes to store
    static maxNematodes = 2000;

    // The priority queue of smart nematodes json objects
    static priorityQueue;

    /* Load the nematode data from a file and creates the priority queue */
    static async Initialize() {

        // Create a compare function for the priority queue (Based on age)
        var compare = (a, b) => { return a.age - b.age };

        // Create the priority queue
        NematodeTrainer.priorityQueue = new PriorityQueue(compare, NematodeTrainer.maxNematodes);

        // Don't load data if we are only storing new data
        if (NematodeTrainer.disableLoad)
            return;

        // Load all data from the stored smart nematode data
        await NematodeTrainer.LoadData();
    }

    /* Loads the nematode data from a JSON file */
    static async LoadData() {

        // The name of the file to load
        const fileName = "SmartNematodeData.json";
        
        // Load the data using "await" to ensure the data is loaded before continuing
        try {
            const response = await fetch(fileName);
            const nematodes = await response.json();
            for (const nematode of nematodes) {
                NematodeTrainer.priorityQueue.Add(nematode);
            }
        } catch (error) {
            console.error(error);
        }
    }
       

    /* Adds a nematode to the priority queue 
     * This specifically takes a Json object from nematode.toJson()
     * nematode: The nematode to add to the queue
     */
    static AddNematode(nematode) {

        // Add the nematode to the queue
        NematodeTrainer.priorityQueue.Add(nematode);
    }

    /* Downloads the nematode data as a JSON file */
    static Download() {

        // May be null if UI calls this before the queue is initialized
        if (NematodeTrainer.priorityQueue != null)
            downloadJSON(NematodeTrainer.priorityQueue.GetAllValues(), "SmartNematodeData.json");
    }

    /* Returns a random nematode from the queue 
     * Returns: A random nematode from the queue (As a json object)
     */
    static GetRandomNematode() {
        return NematodeTrainer.priorityQueue.GetRandomElement();
    }

    /* Prints the nematode data to the console */
    static Print(){
        NematodeTrainer.priorityQueue.Print();
    }
}