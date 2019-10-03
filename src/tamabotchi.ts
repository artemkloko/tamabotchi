import { ChainMap } from "./chain-map-map";

export class Tamabotchi {
  forward: ChainMap[];
  backward: ChainMap[];
  context: {
    forward: ChainMap;
    backward: ChainMap;
  };

  constructor() {
    this.forward = [new ChainMap(2), new ChainMap(3)];
    this.backward = [new ChainMap(2), new ChainMap(3)];
    this.context = {
      forward: new ChainMap(3),
      backward: new ChainMap(3)
    };
  }

  extract_words_from_sentence = (sentence: string) => {
    return sentence
      .replace(/([;,.?!".])/g, " $1 ")
      .replace(/\s+/g, " ")
      .trim()
      .split(/\s/);
  };

  add_words = (chain_map: ChainMap, words: string[]) => {
    const { chain_length } = chain_map;
    words = words.concat(["__END__"]);
    let chain_of_words: string;
    for (let i = 0, l = words.length - chain_length; i < l; i++) {
      chain_of_words = words.slice(i, i + chain_length).join(" ");
      chain_map.add_word(chain_of_words, words[i + chain_length]);
    }
  };

  add_words_reverse = (chain_map: ChainMap, words: string[]) => {
    const { chain_length } = chain_map;
    words = words.concat(["__END__"]);
    let chain_of_words: string;
    for (let i = 0, l = words.length - chain_length; i < l; i++) {
      chain_of_words = words.slice(i + 1, i + 1 + chain_length).join(" ");
      chain_map.add_word(words[i], chain_of_words);
    }
  };

  learn_sentence = (sentence: string) => {
    const words = this.extract_words_from_sentence(sentence);
    for (let chain_map of this.forward) {
      this.add_words(chain_map, words);
    }
    this.add_words_reverse(this.context.forward, words);
    words.reverse();
    for (let chain_map of this.backward) {
      this.add_words(chain_map, words);
    }
    this.add_words_reverse(this.context.forward, words);
  };

  learn_text = (text: string) => {
    const sentences = text.split(/[.�]/);
    let percent = 0;
    sentences.forEach((sentence, i) => {
      this.learn_sentence(sentences[i]);
      //   if (Math.ceil((i / sentences.length) * 100) > percent) {
      //     percent++;
      //     console.log(`read book ${percent}%`);
      //   }
    });
  };

  get_rewards_from_words = (words: string[]) => {
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

  reply_to_sentence = (sentence: string) => {
    const words = this.extract_words_from_sentence(sentence);

    let rewards = this.get_rewards_from_words(words);

    let time = new Date().getTime();
    const initial_chains_of_words = rewards.reduce(
      (aggr, reward) => {
        const chains_of_words = this.context.forward.transitions.get(reward);
        if (chains_of_words && chains_of_words.size > 0) {
          aggr = aggr.concat(Array.from(chains_of_words.keys()));
        }
        return aggr;
      },
      [] as string[]
    );
    console.log(initial_chains_of_words);

    const initial_chain_of_words = this.forward[
      this.forward.length - 1
    ].get_initial_chain_of_words(initial_chains_of_words, rewards);
    console.log(
      "get_initial_chain_of_words " +
        ((new Date().getTime() - time) / 1000).toFixed(3)
    );

    if (!initial_chain_of_words) {
      if (rewards.length === 1 && rewards[0] === "") {
        return `What?`;
      }
      var r = Math.floor(Math.random() * rewards.length);
      return `What does "${rewards[r]}" even mean?`;
    }
    rewards = rewards.concat(["__END__"]);
    const array_of_words = initial_chain_of_words.split(" ");

    time = new Date().getTime();
    const forward_words = this.reconstruct(
      this.forward,
      array_of_words,
      rewards
    );
    const backward_words = this.reconstruct(
      this.backward,
      array_of_words.reverse(),
      rewards.reverse()
    );
    console.log(
      "reconstruct " + ((new Date().getTime() - time) / 1000).toFixed(3)
    );

    const sentence_words = backward_words
      .reverse()
      .concat(forward_words.splice(array_of_words.length));

    return sentence_words.join(" ");
  };

  reconstruct = (
    chain_map: ChainMap[],
    initial_array_of_words: string[],
    rewards: string[]
  ) => {
    let chain_map_index = chain_map.length - 1;
    let final_array_of_words = initial_array_of_words.concat([]);
    let current_array_of_words: string[];
    let next_word: string | undefined;
    while (true) {
      if (!chain_map[chain_map_index]) {
        return final_array_of_words;
      }
      current_array_of_words = final_array_of_words.slice(
        -1 * chain_map[chain_map_index].chain_length
      );
      next_word = chain_map[chain_map_index].get_next_word(
        current_array_of_words,
        rewards
      );

      if (!next_word) {
        chain_map_index--;
        continue;
      }

      if (!next_word || next_word === "__END__") {
        return final_array_of_words;
      }

      final_array_of_words.push(next_word);

      if (chain_map_index < chain_map.length - 1) {
        chain_map_index++;
      }
    }
  };
}
