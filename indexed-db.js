class IndexedDb {
    static async create() {
        let instance = new IndexedDb()

        return new Promise(function (resolve, reject) {
            let request = indexedDB.open("tamabotchi")

            request.onupgradeneeded = function (event) {
                let store = event.target.result.createObjectStore("history", { keyPath: "id", autoIncrement: true })
                store.createIndex("value", "value", { unique: false })
            }

            request.onsuccess = function (event) {
                instance.db = event.target.result
                resolve(instance)
            }

            request.onerror = request.onblocked = function (event) {
                reject(event.target.error)
            }
        })
    }

    async retrieveHistory() {
        let instance = this

        return new Promise(function (resolve, reject) {
            let store = instance.db.transaction("history").objectStore("history")
            let request = store.getAllKeys()

            request.onerror = reject

            request.onsuccess = async function (event) {
                let historyKeys = event.target.result
                let historyAccumulator = []
                for (let k in historyKeys) {
                    let key = historyKeys[k]
                    historyAccumulator.push(await instance.retrieveHistoryBucket(key))
                    console.log(`retrieved about ${Math.round(100 * k / historyKeys.length)}%`)
                }
                resolve(historyAccumulator)
            }
        })
    }

    async retrieveHistoryBucket(key) {
        let instance = this

        return new Promise(function (resolve, reject) {
            let store = instance.db.transaction("history").objectStore("history")
            let request = store.get(key)

            request.onerror = reject

            request.onsuccess = function (event) {
                let bucket = event.target.result
                if (typeof bucket === 'undefined') {
                    reject('lalala')
                } else {
                    resolve(bucket.value)
                }
            }
        })
    }

    async storeSentence(sentence) {
        let instance = this

        return new Promise(function (resolve, reject) {
            let store = instance.db.transaction("history", "readwrite").objectStore("history")
            let request = store.put({ value: sentence })

            request.onerror = reject

            request.onsuccess = resolve
        })
    }
}
