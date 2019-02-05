/**
 * Such a bliss to take a deep dive into an interesting piece of code, just
 * focus and lock in, get a distance from your everyday matters, avoid your
 * anxieties and problems. While your life lasts.
 *
 * Use nicotine shots if you want to prolongue the distance.
 */

class Dictionary extends Object {
    map(callback) {
        let keys = Object.keys(this)
        for (let key of keys) {
            this[key] = callback(this[key], key, this)
        }
        return this
    }

    filter(callback) {
        let dictionary = new Dictionary()
        let keys = Object.keys(this)
        for (let key of keys) {
            if (callback(this[key], key, this)) {
                dictionary[key] = this[key]
            }
        }
        return dictionary
    }

    toPairs() {
        let array = new Array()
        let keys = Object.keys(this)
        for (let key of keys) {
            array.push([key, this[key]])
        }
        return array
    }

    getLength(){
        return Object.keys(this).length
    }
}

Math.randomBetween = function () {
    let end = arguments[arguments.length - 1]
    let start = arguments[arguments.length - 2] || 0
    if (end < start)
        return start
    return start + Math.random() * (end - start)
}

class MarkovChain {
    constructor(chainLength) {
        this.keywords = new Dictionary()
        this.chainLength = chainLength
    }

    add(words) {
        words = words.concat(['__END__'])

        let l = words.length - this.chainLength
        for (let i = 0; i < l; i++) {
            let slice = words.slice(i, i + this.chainLength)
            let keyword = slice.join(' ')
            let nextWord = words[i + this.chainLength]
            let nextWords = this.keywords[keyword]
            if (typeof nextWords === 'undefined') {
                this.keywords[keyword] = new Dictionary()
                nextWords = this.keywords[keyword]
            }
            if (typeof nextWords[nextWord] === 'undefined') {
                nextWords[nextWord] = 0
            }
            nextWords[nextWord] += 1
        }
    }

    get(keyword) {
        let words = keyword.split(' ')
        while (true) {
            let keyword = words.slice(-1 * this.chainLength).join(' ')
            let nextWord = this.next(keyword)
            if (nextWord === '__END__' || typeof nextWord === 'undefined') {
                break
            }
            words.push(nextWord)
        }
        return words.join(' ')
    }

    next(keyword) {
        let nextWords = this.keywords[keyword]
        let sorted = nextWords.toPairs().sort(function (a, b) {
            return b[1] - a[1]
        })
        return sorted[0][0]
    }

    stats() {
        let nextWordsLengths = 0
        let nextWordsLengthsP = 0
        for (let key of Object.keys(this.forward)) {
            let nextWords = this.forward[key]
            for (let k of Object.keys(nextWords))
                nextWordsLengths += nextWords[k]
            nextWordsLengthsP += this.forward[key].getLength()
        }
        let stats = {
            keysTotal: Object.keys(this.forward).length,
            averageNextWordsLength: nextWordsLengths / Object.keys(this.forward).length,
            averageNextWordsLengthP: nextWordsLengthsP / Object.keys(this.forward).length
        }
        return stats
    }
}

class Tamabotchi {
    constructor(chainLength) {
        this.chainLength = chainLength
        this.markovChain = {
            forward: new MarkovChain(chainLength),
            backward: new MarkovChain(chainLength)
        }
        this.markovChain.forward.next = this.next.bind(this.markovChain.forward)
        this.markovChain.backward.next = this.next.bind(this.markovChain.backward)
    }

    async learn(sentence) {
        let words = sentence
            .replace(/([;,.?!".])/g, ' $1 ')
            .replace(/\s+/g, ' ')
            .trim()
            .split(/\s/)
        this.markovChain.forward.add(words)
        this.markovChain.backward.add(words.reverse())
    }

    next(keyword) {
        let nextWords = this.keywords[keyword]
        let sorted = nextWords.toPairs().sort(function (a, b) {
            return b[1] - a[1]
        })
        let r = Math.round(Math.random() * sorted.length / this.chainLength)
        return sorted[r][0]
    }

    async saySomething(sentence) {
        sentence = sentence.replace(/[;,.?!".\s]+/g, ' ').trim()

        // sort words by their length
        let words = sentence.split(/\s/).sort(function (a, b) {
            return b.length - a.length
        })

        // keep only 1/this.chainLength of longest words
        let r = Math.round(Math.randomBetween(1, words.length / this.chainLength))
        words = words.slice(0, r)

        // make probabilities array by their length
        let probabilities = []
        words.forEach(word => {
            for (let i = 0, l = word.length; i < l; i++) {
                probabilities.push(word)
            }
        })

        // select a random
        r = Math.round(Math.randomBetween(probabilities.length - 1))
        let wordSelected = probabilities[r]
        console.log(`topic: ${wordSelected}`)

        // collect the keys that contain the selected word
        let keywords = this.markovChain.forward.keywords.filter(function (value, keyword) {
            return keyword.split(' ').indexOf(wordSelected) > -1
        }).map(function (nextWords) {
            // here i can also sum the values of nextWords
            return nextWords.getLength()
        }).toPairs().sort(function (a, b) {
            // transform to pairs sorted by value
            return b[1] - a[1]
        })

        // if no keys
        if (keywords.length === 0) {
            wordSelected = typeof wordSelected === 'undefined' ? 'that' : `"${wordSelected}"`
            return `What does ${wordSelected} even mean?`
        }

        // select one of the keys with biggest knowhow count
        r = Math.round(Math.randomBetween(keywords.length / this.chainLength))
        let keyword = keywords[r][0]
        console.log(`keyword: ${keyword}`)

        let f = this.markovChain.forward.get(keyword)
        let b = this.markovChain.backward.get(keyword.split(' ').reverse().join(' '))
        let reply = b.split(' ').reverse().join(' ') + f.substr(keyword.length)
        reply = reply.replace(/ ([;,.?!])/g, '$1 ')
        return reply
    }
}

if (typeof module === 'object') {
    module.exports = Tamabotchi
}
