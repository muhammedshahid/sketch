/**
 * options = {
 * dbVersion : 1,
  objectStores: {
    // Object store definitions here
    objectStoreName1: {
      keyPath: 'keyPropertyName', // Optional: Property name used as the key for items
      indexes: [
        {
          name: 'indexName1',
          path: 'indexPath1', // Property path for indexing
          options: {
            unique: true, // Optional: Ensures unique values for this index
            multiEntry: true // Optional: Allows storing multiple values for the same key in this index (non-unique)
          }
        },
        // More index definitions here (if needed)
      ]
    },
    objectStoreName2: {
      // ... similar definition for another object store
    }
  }
};

 */

const objectStoresSchema = {
    'processing': {
        keyPath: 'id',
        indexes: []
    },
}

//{id:String, sketch:Blob, version:ArrayOfBlob(10), current:Number}

const options = {
    dbVersion: 1,
    objectStores: objectStoresSchema
}

class IndexedDB {
    constructor() {
        this.dbName = `sobel`;
        this.objectStores = options.objectStores;
        this.dbVersion = options.dbVersion
        this.db = null;
    }

    setAllToNull() {
        for (const key in this) {
            if (this.hasOwnProperty(key)) { // Check for own properties
                this[key] = null;
            }
        }
    }

    async getDBVersion() {
        try {
            const databases = await indexedDB.databases();
            return databases.find(db => db.name === this.dbName)?.version || 1;
        } catch (error) {
            console.error('Error getting IndexedDB version:', error);
            return null;
        }
    }

    // make fn to update objeCtstore scema / indexes properties(unique etc)

    async open() {
        let currentVersion = await this.getDBVersion()
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion || currentVersion);

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                for (const storeName in this.objectStores) {
                    const store = this.objectStores[storeName];
                    if (!this.db.objectStoreNames.contains(storeName)) {
                        const objectStore = this.db.createObjectStore(storeName, { keyPath: store.keyPath });
                        if (store.indexes) {
                            for (const index of store.indexes) {
                                objectStore.createIndex(index.name, index.path, index.options);
                            }
                        }
                    }
                }
            };

            request.onsuccess = (event) => {
                delete this.objectStores
                this.db = event.target.result;
                this.dbVersion = event.target.result.version
                resolve(this); // Resolve with the instantiated IndexedDB object
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async createObjectStores(objectStores) {
        /**objectStores has same structure as options.objectStores in mentioned above options*/
        if (!this.db) {
            throw new Error('IndexedDB is not open. Call open() first.');
        }

        const currentVersion = this.db.version;
        this.db.close(); // Close the existing connection

        this.dbVersion = currentVersion + 1
        this.objectStores = objectStores

        return this.open()
    }

    async deleteObjectStore(objectStoreName) {
        if (!this.db) {
            throw new Error('IndexedDB is not open. Call open() first.');
        }

        const currentVersion = this.db.version;
        const request = window.indexedDB.open(this.dbName, currentVersion + 1); // Open with incremented version

        return new Promise((resolve, reject) => {
            request.onupgradeneeded = (event) => {
                const db = event.target.result; // Access database object
                db.deleteObjectStore(objectStoreName); // Delete the specific object store
                //console.log('Object store', objectStoreName, 'deleted.');
            };

            request.onsuccess = (event) => {
                //console.log('Database opened (new version) after object store deletion.');
                resolve({ status: true }); // Resolve the Promise (optional reconnection can be done here)
            };

            request.onerror = (event) => {
                //console.error('Error deleting object store:', event.target.error);
                resolve({ status: false, error: event.target.error });
            };
        });
    }

    async deleteDatabase() {
        const request = window.indexedDB.deleteDatabase(this.dbName);

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                this.dbName = null;
                this.objectStores = null;
                this.dbVersion = null
                this.db = null;
                resolve({ status: true });
            };

            request.onerror = (event) => {
                //console.error('Error deleting database:', event.target.error);
                reject({ status: false, error: event.target.error });
            };
        });
    }

    // CRUD operations with improved error handling and type safety:

    async add(objectStoreName, objArray) {
        if (!this.db) {
            throw new Error('IndexedDB is not open. Call open() first.');
        }

        const transaction = this.db.transaction(objectStoreName, 'readwrite');
        const objectStore = transaction.objectStore(objectStoreName);
        const ids = [];
        let error = {}

        for (const obj of objArray) {
            try {
                const req = objectStore.add(obj); // Don't await here

                req.onsuccess = (event) => {
                    ids.push(event.target.result); // Push ID on successful completion
                };

                req.onerror = (event) => {
                    //console.error('Error adding item:', obj, event.target.error);
                    error['key'] = obj
                    error['code'] = event.target.error
                    // handle individual errors differently here
                };
            } catch (error) {
                //console.error('Error adding item:', obj, error);
                // Handle errors outside of 'add' method if needed
            }
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve({ status: true });
            transaction.onerror = (event) => resolve({ status: false, error: error });
        });
    }

    async get(objectStoreName, keys) {
        if (!this.db) {
            throw new Error('IndexedDB is not open. Call open() first.');
        }
        const transaction = this.db.transaction(objectStoreName, 'readonly');
        const objectStore = transaction.objectStore(objectStoreName);
        let results = []
        let error = {}
        for (const key of keys) {
            try {
                const req = objectStore.get(key);

                req.onsuccess = (event) => {
                    if (event.target.result)
                        results.push(event.target.result);
                };

                req.onerror = (event) => {
                    error['key'] = key
                    error['code'] = event.target.error
                    //console.error(key, event.target.error);
                    // handle individual errors differently here
                };
            } catch (error) {
                // console.error('Error getting item:', key, error);
                // Handle errors outside of 'add' method if needed
            }
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve({ status: true, data: results });
            transaction.onerror = (event) => resolve({ status: false, data: results, error: error });
        });
    }

    async getAll(objectStoreName) {
        if (!this.db) {
            throw new Error('IndexedDB is not open. Call open() first.');
        }

        const transaction = this.db.transaction(objectStoreName, 'readonly');
        const objectStore = transaction.objectStore(objectStoreName);
        const request = objectStore.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                resolve({ status: true, data: event.target.result }); // Array of all items
            };

            request.onerror = (event) => {
                resolve({ status: false, error: event.target.error });
            };
        });
    }

    async put(objectStoreName, objArray) {
        if (!this.db) {
            throw new Error('IndexedDB is not open. Call open() first.');
        }
        const transaction = this.db.transaction(objectStoreName, 'readwrite');
        const objectStore = transaction.objectStore(objectStoreName);
        const successfulPuts = []; // Array to store successful put results
        let error = {}

        for (const obj of objArray) {
            try {
                const req = objectStore.put(obj); // Don't await here

                req.onsuccess = (event) => {
                    successfulPuts.push(event.target.result); // Store successful put result (key)
                };

                req.onerror = (event) => {
                    error['key'] = obj
                    error['code'] = event.target.error
                    //console.error('Error adding item:', obj, event.target.error);
                    // Handle individual errors here (log, retry, etc.)
                };
            } catch (error) {
                //console.error('Error adding item:', obj, error);
                // Handle general errors outside of 'put' method
            }
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                resolve({ status: true }); // Resolve with array of successful put results (keys)
            };

            transaction.onerror = (event) => {
                resolve({ status: false, error: error });
            };
        });
    }

    async delete(objectStoreName, keys) {
        if (!this.db) {
            throw new Error('IndexedDB is not open. Call open() first.');
        }

        const transaction = this.db.transaction(objectStoreName, 'readwrite');
        const objectStore = transaction.objectStore(objectStoreName);

        return new Promise((resolve, reject) => {
            const requests = keys.map(key => objectStore.delete(key)); // Create delete requests for each key

            Promise.all(requests)
                .then(() => {
                    //console.log('Items with specified keys deleted successfully.');
                    resolve({ status: true });
                })
                .catch(error => {
                    console.error('Error deleting items:', error);
                    resolve({ status: false, error: error });
                });
        });
    }

    async clear(objectStoreName) {
        if (!this.db) {
            throw new Error('IndexedDB is not open. Call open() first.');
        }

        const transaction = this.db.transaction(objectStoreName, 'readwrite');
        const objectStore = transaction.objectStore(objectStoreName);

        return new Promise((resolve, reject) => {
            const request = objectStore.clear();

            request.onsuccess = () => {
                //console.log('Object store cleared successfully.');
                resolve({ status: true });
            };

            request.onerror = (event) => {
                console.error('Error clearing object store:', event.target.error);
                resolve({ status: false, error: event.target.error });
            };
        });
    }
}    