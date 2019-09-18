/**
 * Such a bliss to take a deep dive into an interesting piece of code, just
 * focus and lock in, get a distance from your everyday matters, avoid your
 * anxieties and problems. While your life lasts.
 *
 * Use nicotine shots if you want to prolongue the distance.
 */

class Dictionary extends Object {
  map(callback) {
    const dictionary = new Dictionary();
    const keys = Object.keys(this);
    for (let key of keys) {
      dictionary[key] = callback(this[key], key, this);
    }
    return dictionary;
  }

  filter(callback) {
    const dictionary = new Dictionary();
    const keys = Object.keys(this);
    for (let key of keys) {
      if (callback(this[key], key, this)) {
        dictionary[key] = this[key];
      }
    }
    return dictionary;
  }

  toPairs() {
    const array = new Array();
    const keys = Object.keys(this);
    for (let key of keys) {
      array.push([key, this[key]]);
    }
    return array;
  }

  getLength() {
    return Object.keys(this).length;
  }
}

Math.randomBetween = function() {
  const end = arguments[arguments.length - 1];
  const start = arguments[arguments.length - 2] || 0;
  if (end < start) return start;
  return start + Math.random() * (end - start);
};

class MarkovChain {
  constructor(chainLength) {
    this.keywords = new Dictionary();
    this.chainLength = chainLength;
  }

  decision(choises) {
    return 0;
  }

  add(words) {
    words = words.concat(["__END__"]);

    const l = words.length - this.chainLength;
    let slice, keyword, nextWord, nextWords;
    for (let i = 0; i < l; i++) {
      slice = words.slice(i, i + this.chainLength);
      keyword = slice.join(" ");
      nextWord = words[i + this.chainLength];
      nextWords = this.keywords[keyword];
      if (typeof nextWords === "undefined") {
        this.keywords[keyword] = new Dictionary();
        nextWords = this.keywords[keyword];
      }
      if (typeof nextWords[nextWord] === "undefined") {
        nextWords[nextWord] = 0;
      }
      nextWords[nextWord] += 1;
    }
  }

  getInitialKeyword(rewards) {
    const instance = this;
    let wraps = Object.keys(this.keywords).map(function(keyword) {
      return [keyword, instance.getUtility(keyword, rewards)];
    });
    wraps = wraps
      .filter(wrap => {
        return wrap[1] > 0;
      })
      .sort(function(a, b) {
        return b[1] - a[1];
      });
    if (wraps.length === 0) {
      return;
    }
    const r = this.decision(wraps);
    return wraps[r][0];
  }

  getSentence(keyword, rewards) {
    const words = keyword.split(" ");
    let nextWord;
    while (true) {
      keyword = words.slice(-1 * this.chainLength).join(" ");
      nextWord = this.getNextWord(keyword, rewards);
      if (nextWord === "__END__" || typeof nextWord === "undefined") {
        break;
      }
      words.push(nextWord);
    }
    return words.join(" ");
  }

  getNextWord(keyword, rewards) {
    const instance = this;
    const keywordSlice = keyword
      .split(" ")
      .slice(1)
      .join(" ");
    const wraps = this.keywords[keyword]
      .toPairs()
      .map(function(wordCountPair) {
        const nextWord = wordCountPair[0];

        const nextKeyword = keywordSlice + " " + nextWord;
        let nextKeywordUtility = 0;
        if (keyword !== nextKeyword) {
          nextKeywordUtility = instance.getUtility(nextKeyword, rewards);
        }

        return [nextWord, nextKeywordUtility];
      })
      .sort(function(a, b) {
        return b[1] - a[1];
      });
    const r = this.decision(wraps);
    return wraps[r][0];
  }

  getUtility(keyword, rewards) {
    const keywordSlice = keyword
      .split(" ")
      .slice(1)
      .join(" ");
    const r = rewards.filter(reward => keyword.split(" ").indexOf(reward) > -1)
      .length;
    if (typeof this.keywords[keyword] === "undefined") {
      return r;
    }
    const nextWords = this.keywords[keyword].toPairs();
    const nextWordsSum = nextWords.reduce(function(prev, curr) {
      return prev + curr[1];
    }, 0);
    const maxProbWord = nextWords.sort(function(a, b) {
      return b[1] - a[1];
    })[0];

    const nextKeyword = keywordSlice + " " + maxProbWord[0];
    let nextKeywordUtility = 0;
    if (keyword !== nextKeyword) {
      nextKeywordUtility = this.getUtility(nextKeyword, rewards);
    }

    const g = 0.9;
    var u = r + g * maxProbWord[1] / nextWordsSum * nextKeywordUtility
    // const u = r + g * nextKeywordUtility;
    return u;
  }

  stats() {
    let nextWordsLengths = 0;
    let nextWordsLengthsP = 0;
    let nextWords;
    for (let key of Object.keys(this.forward)) {
      nextWords = this.forward[key];
      for (let k of Object.keys(nextWords)) nextWordsLengths += nextWords[k];
      nextWordsLengthsP += this.forward[key].getLength();
    }
    let stats = {
      keysTotal: Object.keys(this.forward).length,
      averageNextWordsLength:
        nextWordsLengths / Object.keys(this.forward).length,
      averageNextWordsLengthP:
        nextWordsLengthsP / Object.keys(this.forward).length
    };
    return stats;
  }
}

class Tamabotchi {
  constructor(chainLength) {
    this.chainLength = chainLength;
    this.markovChain = {
      forward: new MarkovChain(chainLength),
      backward: new MarkovChain(chainLength)
    };
    this.markovChain.forward.decision = this.decision.bind(
      this.markovChain.forward
    );
    this.markovChain.backward.decision = this.decision.bind(
      this.markovChain.backward
    );
  }

  learn(sentence) {
    const words = sentence
      .replace(/([;,.?!".])/g, " $1 ")
      .replace(/\s+/g, " ")
      .trim()
      .split(/\s/);
    this.markovChain.forward.add(words);
    this.markovChain.backward.add(words.reverse());
  }

  decision(choises) {
    return Math.round((Math.random() * choises.length) / this.chainLength);
  }

  getRewards(words) {
      const words_to_keep_count = Math.ceil(words.length / 3);
      const words_to_keep = words
          .sort(function(a, b) {
              // b - a because the biggest length to be first
              return b.length - a.length;
          })
          .slice(0, words_to_keep_count);
      const rewards = words.filter(word => words_to_keep.indexOf(word) > -1);
      return rewards;
  };

  saySomething(sentence) {
    const words = sentence.replace(/[;,.?!".\s]+/g, " ").trim().split(/\s/);

    const rewards = this.getRewards(words)
    console.log(`rewards: ${rewards}`);

    const keyword = this.markovChain.forward.getInitialKeyword(rewards);
    console.log(`keyword: ${keyword}`);

    if (typeof keyword === "undefined") {
      if (rewards.length === 1 && rewards[0] === "") {
        return `What?`;
      }
      const r = Math.floor(Math.random() * rewards.length);
      return `What does "${rewards[r]}" even mean?`;
    }

    const f = this.markovChain.forward.getSentence(keyword, rewards);
    const b = this.markovChain.backward.getSentence(keyword
        .split(" ")
        .reverse()
        .join(" "), rewards.reverse());
    let reply =
      b
        .split(" ")
        .reverse()
        .join(" ") + f.substr(keyword.length);
    reply = reply.replace(/\s+([;,.?!])/g, "$1 ").replace(/\s+/g, " ");
    return reply;
  }
}

if (typeof module === "object") {
  module.exports = Tamabotchi;
}
