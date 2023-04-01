/* A priority queue is a data structure that allows you to add elements to it and remove the largest element from it.
 * It is useful for keeping track of the largest elements in a set of data.
 */


class PriorityQueue {

    constructor(compare, maxSize) {

        this.compare = compare;
        this.maxSize = maxSize;

        // Create an empty array
        this.values = [];
    }

    /* Adds an element to the priority queue */
    Add (element) {

        // Add the new element to the end of the array
        this.values.push(element);

        // Allow it to bubble up
        this.BubbleUp();

        // If the queue is too big, remove the smallest element
        if (this.values.length > this.maxSize) {
            this.Remove();
        }
    }

    /* Removes the last index of the priority queue (The one with the least priority) */
    Remove () {

        // If the queue is empty, return null
        if (this.values.length === 0) 
            return null;

        this.values.pop();
    }

    /* Bubble up the element at the end of the array to its proper place */
    BubbleUp () {

        // Get the index of the last element
        let index = this.values.length - 1;
        const element = this.values[index];

        // While not at the front of the array
        while (index > 0) {

            // If the element is greater than its parent, swap them
            if (this.compare(element, this.values[index - 1]) > 0) {
                this.Swap(index, index - 1);
            }
            else{
                // The element is in the right place
                return;
            }

            // Update the index
            index--;
        }
    }

    /* Swaps the elements at the given indices 
     * index1: The index of the first element
     * index2: The index of the second element
     */
    Swap (index1, index2) {
        
        const temp = this.values[index1];
        this.values[index1] = this.values[index2];
        this.values[index2] = temp;
    }

    /* Prints the priority queue (For testing) */
    Print () {
        for (let i = 0; i < this.values.length; i++) {
            console.log(this.values[i].toString());
        }
    }

    /* Gets a random element from the priority queue */
    GetRandomElement () {
            
        // Get a random index
        const index = Math.floor(Math.random() * this.values.length);

        // Return the element at the index
        return this.values[index];
    }

    /* Returns an array of all the elements in the priority queue */
    GetAllValues(){

        return this.values;
    }
}