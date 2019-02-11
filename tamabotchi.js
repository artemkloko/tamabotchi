/**
 * Such a bliss to take a deep dive into an interesting piece of code, just
 * focus and lock in, get a distance from your everyday matters, avoid your
 * anxieties and problems. While your life lasts.
 *
 * Use nicotine shots if you want to prolongue the distance.
 */

class Dictionary extends Object {
    map(callback) {
        let dictionary = new Dictionary()
        let keys = Object.keys(this)
        for (let key of keys) {
            dictionary[key] = callback(this[key], key, this)
        }
        return dictionary
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

    getLength() {
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

    decision(choises) {
        return 0
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

    getInitialKeyword(rewards) {
        let instance = this
        let wraps = Object.keys(this.keywords).map(function (keyword) {
            return [keyword, instance.getUtility(keyword, rewards)]
        })
        wraps = wraps.filter(wrap => {
            return wrap[1] > 0
        }).sort(function (a, b) {
            return b[1] - a[1]
        })
        if (wraps.length === 0) {
            return
        }
        let r = this.decision(wraps)
        return wraps[r][0]
    }

    getSentence(keyword, rewards) {
        let words = keyword.split(' ')
        while (true) {
            let keyword = words.slice(-1 * this.chainLength).join(' ')
            let nextWord = this.getNextWord(keyword, rewards)
            if (nextWord === '__END__' || typeof nextWord === 'undefined') {
                break
            }
            words.push(nextWord)
        }
        return words.join(' ')
    }

    getNextWord(keyword, rewards) {
        var instance = this
        var keywordSlice = keyword.split(' ').slice(0, this.chainLength - 1).join(' ')
        var wraps = this.keywords[keyword].toPairs().map(function (wordCountPair) {
            var nextWord = wordCountPair[0]

            var nextKeyword = keywordSlice + ' ' + nextWord
            var nextKeywordUtility = 0
            if (keyword !== nextKeyword) {
                nextKeywordUtility = instance.getUtility(nextKeyword, rewards)
            }

            return [nextWord, nextKeywordUtility]
        }).sort(function (a, b) {
            return b[1] - a[1]
        })
        let r = this.decision(wraps)
        return wraps[r][0]
    }

    getUtility(keyword, rewards) {
        var keywordSlice = keyword.split(' ').slice(0, this.chainLength - 1).join(' ')
        var r = rewards.filter(reward => keyword.split(' ').indexOf(reward) > -1).length
        try {
            if (typeof this.keywords[keyword] === 'undefined') {
                return r
            }
            let nextWords = this.keywords[keyword].toPairs()
            let nextWordsSum = nextWords.reduce(function (prev, curr) {
                return prev + curr[1]
            }, 0)
            var maxProbWord = nextWords.sort(function (a, b) {
                return b[1] - a[1]
            })[0]

            var nextKeyword = keywordSlice + ' ' + maxProbWord[0]
            var nextKeywordUtility = 0
            if (keyword !== nextKeyword) {
                nextKeywordUtility = this.getUtility(nextKeyword, rewards)
            }

            var g = 0.9
            // var u = r + g * maxProbWord[1] / nextWordsSum * nextKeywordUtility
            var u = r + g * nextKeywordUtility
            return u
        } catch (error) {
            // console.log(error)
            return r
        }
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
        this.markovChain.forward.decision = this.decision.bind(this.markovChain.forward)
        this.markovChain.backward.decision = this.decision.bind(this.markovChain.backward)
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

    decision(choises) {
        return Math.round(Math.random() * choises.length / this.chainLength)
    }

    async saySomething(sentence) {
        sentence = sentence.replace(/[;,.?!".\s]+/g, ' ').trim()

        let rewards = sentence.split(/\s/)
            .map(function (word, wordIndex) {
                return [word, wordIndex]
            })
            .sort(function (a, b) {
                // b - a because the biggest length to be first
                return b[0].length - a[0].length
            })
            .filter(function (wrapWord, wrapIndex, wraps) {
                var toKeep = Math.ceil(wraps.length * 1 / 3)
                return wrapIndex < toKeep
            })
            .sort(function (a, b) {
                return a[1] - b[1]
            })
            .map(function (wrapWord) {
                return wrapWord[0]
            })
        console.log(`rewards: ${rewards}`)

        let keyword = this.markovChain.forward.getInitialKeyword(rewards)
        console.log(`keyword: ${keyword}`)

        if (typeof keyword === 'undefined') {
            if (rewards.length === 1 && rewards[0] === '') {
                return `What?`
            }
            var r = Math.floor(Math.random() * rewards.length)
            return `What does "${rewards[r]}" even mean?`
        }

        let f = this.markovChain.forward.getSentence(keyword, rewards)
        let b = this.markovChain.backward.getSentence(keyword.split(' ').reverse().join(' '), rewards.reverse())
        let reply = b.split(' ').reverse().join(' ') + f.substr(keyword.length)
        reply = reply.replace(/\s+([;,.?!])/g, '$1 ').replace(/\s+/g, ' ')
        return reply
    }
}

if (typeof module === 'object') {
    module.exports = Tamabotchi
}
