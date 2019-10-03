type Probabilities = Map<string, number>;
type Transitions = Map<string, Probabilities>;

export class ChainMap {
  transitions: Transitions;

  constructor(public chain_length: number) {
    this.transitions = new Map<string, Probabilities>();
  }

  add_word = (chain_of_words: string, next_word: string) => {
    let probabilities = this.transitions.get(chain_of_words);
    if (!probabilities) {
      probabilities = new Map<string, number>();
    }
    let probability = probabilities.get(next_word);
    if (!probability) {
      probability = 0;
    }
    probabilities.set(next_word, probability + 1);
    this.transitions.set(chain_of_words, probabilities);
  };

  get_next_word = (array_of_words: string[], rewards: string[]) => {
    const words_without_first = array_of_words.slice(1);
    const probabilities = this.transitions.get(array_of_words.join(" "));
    console.log(array_of_words + " > " + (probabilities && probabilities.size));
    if (!probabilities) {
      return;
    }
    let utility: number;
    let max_probability = -1;
    let max_next_word = "";
    for (let next_word of probabilities.keys()) {
      utility = this.get_utility(
        words_without_first.concat([next_word]),
        rewards
      );
      if (rewards.indexOf(next_word) > -1) {
        // rewards.splice(rewards.indexOf(next_word), 1);
      } else if (utility > max_probability) {
        max_probability = utility;
        max_next_word = next_word;
      }
    }
    console.log(array_of_words + " > " + max_next_word);
    return max_next_word;
  };

  get_utility = (
    array_of_words: string[],
    rewards: string[],
    call_stack_length: number = 50
  ) => {
    const words_without_first = array_of_words.slice(1);

    var r = rewards.filter(reward => array_of_words.indexOf(reward) > -1)
      .length;
    let probabilities = this.transitions.get(array_of_words.join(" "));
    if (!probabilities) {
      return r;
    }
    let next_words_probabilities_sum = 0;
    let max_probability = -1;
    let max_next_word = "";
    for (let [next_word, probability] of probabilities) {
      next_words_probabilities_sum += probability;
      if (probability > max_probability) {
        max_probability = probability;
        max_next_word = next_word;
      }
    }

    var next_chain_of_words = words_without_first.concat([max_next_word]);
    var next_utility = 0;
    if (
      array_of_words.join(" ") !== next_chain_of_words.join(" ") &&
      call_stack_length > 0
    ) {
      call_stack_length--;
      next_utility = this.get_utility(
        next_chain_of_words,
        rewards,
        call_stack_length
      );
    }

    var g = 0.9;
    var u =
      r + ((g * max_probability) / next_words_probabilities_sum) * next_utility;
    return u;
  };

  get_initial_chain_of_words = (chains_of_words: string[], rewards: string[]) => {
    let utility: number;
    let max_utility = -1;
    let max_chain_of_words = "";
    for (let chain_of_words of chains_of_words) {
      utility = this.get_utility(chain_of_words.split(" "), rewards);
      if (utility > max_utility) {
        max_utility = utility;
        max_chain_of_words = chain_of_words;
      }
    }
    console.log(max_utility);
    
    return max_chain_of_words;
  };
}
