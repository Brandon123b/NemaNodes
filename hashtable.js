
class HashTable {
  // construct a hash table that will use the given hash function
  constructor(hashFunction) {
    this.hash = hashFunction
    this.underlying = {}
  }

  // insert an item into the hash table
  insert(obj) {
    const code = this.hash(obj)
    let bucket = this.underlying[code]
    if (bucket)
      bucket.add(obj)
    else
      this.underlying[code] = new Set().add(obj)
  }

  // remove an object from the hash table
  remove(obj) {
    const code = this.hash(obj)
    let bucket = this.underlying[code]
    let hasObj = false
    if (bucket) {
      hasObj = bucket.delete(obj)
      if (bucket.size == 0)
        delete this.underlying[code]
    }
    
    return hasObj
  }
  
  // do some procedure for each bucket of items in the hash table
  // operation: function that operates on a list of items
  //
  // Example: hashtable.forEachBucket(items => console.log(items.length))
  //          will print out the number of items stashed in each bucket
  //
  // WARNING: modifying the item list will modify the hash table
  forEachBucket(operation) {
    Object.values(this.underlying).forEach(operation)
  }

  // return the items associated with a hash key
  // 
  // WARNING: modifying the returned collection will modify the hash table
  getItemsWithKey(key) {
    return this.underlying[key];
  }

  // return the keys of the hash table
  keys() {
    return Object.keys(this.underlying)
  }

}