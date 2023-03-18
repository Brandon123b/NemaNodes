
class HashTable {
  #size
  
  // construct a hash table that will use the given hash function
  constructor(hashFunction) {
    this.hash = hashFunction
    this.underlying = {}
    this.#size = 0
  }

  // insert an item into the hash table
  insert(obj) {
    const code = this.hash(obj)
    let bucket = this.underlying[code]
    if (bucket) {
      if (bucket.has(obj)) return
      bucket.add(obj)
      this.#size++
    }
    else {
      this.underlying[code] = new Set().add(obj)
      this.#size++
    }
      
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
    if (hasObj) this.#size--
    return hasObj
  }

  /**
   * 
   * @returns number of items in this hash table
   */
  size() {
    return this.#size
  }

  /**
   * 
   * @param {*} key 
   * @returns the bucket associated with the key or an empty array
   * 
   * WARNING: MODIFYING THE BUCKET WILL CORRUPT THE HASH TABLE
   */
  getItemsWithKey(key) {
    return this.underlying[key] || []
  }

  /**
   * 
   * @returns list of all the keys of the hash table
   */
  keys() {
    return Object.keys(this.underlying)
  }

  /**
   * 
   * @returns new array constructed from the items of this hashtable
   */
  items() {
    let items = []
    for (const key of this.keys())
    this.underlying[key].forEach(n => items.push(n))
    return items
  }

}