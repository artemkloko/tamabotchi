importScripts('tamabotchi.js');
importScripts('indexed-db.js');
importScripts('xhr-book.js');

const main = async function () {
    let tamabotchi
    let storage
    let ready = false

    let receive = async function (event) {
        try {
            if (event.data.key === 'ready') {
                postMessage({ key: 'ready', value: ready })
            } else if (event.data.key === 'request') {
                if (event.data.value.split(/\s+/).indexOf('stats') > -1) {
                    response = JSON.stringify(tamabotchi.markovTable.stats())
                } else {
                    response = await tamabotchi.saySomething(event.data.value)
                    tamabotchi.learn(event.data.value)
                    storage.storeSentence(event.data.value)
                }
                postMessage({
                    key: 'response',
                    value: response
                })
            }
        } catch (error) {
            console.error(error)
            postMessage({ key: 'error', value: error.toString() })
        }
    }

    try {
        onmessage = receive
        tamabotchi = new Tamabotchi(3)
        storage = await IndexedDb.create()

        let history = await storage.retrieveHistory()
        for (let sentence of history) {
            tamabotchi.learn(sentence)
        }

        let books = ['books/history.txt']
        try {
            book = await XhrBook.create('config.json')
            config = JSON.parse(book.text)
            books = books.concat(config.books)
        } catch (error) {
            console.error(error);
        }
        for (bookSrc of books) {
            book = await XhrBook.create(bookSrc)
            while (true) {
                let sentence = await book.readNextSentence()
                if (typeof sentence === 'string') {
                    await tamabotchi.learn(sentence)
                } else {
                    break
                }
            }
        }

        ready = true

        postMessage({ key: 'ready', value: true })
    } catch (error) {
        console.error(error)
        postMessage({ key: 'error', value: error.toString() })
    }
}

main()
