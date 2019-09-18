const { appendFile, readFile } = require("fs");
const { promisify } = require("util");
const { RTMClient } = require("@slack/rtm-api");

const config = require("./config");
const Tamabotchi = require("./tamabotchi");

const tamabotchi = new Tamabotchi(3);
const knowledge = [];

const rtm = new RTMClient(config.token);

rtm.on("message", async event => {
  try {
    if (
      event.type !== "message" ||
      !event.text ||
      !event.user ||
      event.user === config.id
    ) {
      return;
    }

    const direct_message = event.channel[0] === "D";
    const mentioned = `<@${config.id}>`;
    const mentioned_regexp = new RegExp(mentioned, "g");

    if (event.text.indexOf(mentioned) > -1 || direct_message) {
      const sentence = event.text.replace(mentioned_regexp, "");
      reply = tamabotchi.saySomething(sentence);
      if (knowledge.indexOf(reply) > -1) {
        reply = "> " + reply;
      }
      reply = reply.replace(/<@self>/g, `<@${event.user}>`);

      await rtm.sendMessage(reply, event.channel);
    }

    const sentence = event.text.replace(mentioned_regexp, "<@self>");
    knowledge.push(sentence);
    tamabotchi.learn(sentence);
    await promisify(appendFile)("books/history.txt", sentence + "�");
  } catch (error) {
    console.error(error);
  }
});

const main = async () => {
  const books = ["books/history.txt"].concat(config.books);
  for (let bookSrc of books) {
    const content = await promisify(readFile)(bookSrc, "utf-8");
    for (let sentence of content.split(/[.�]/)) {
      knowledge.push(sentence);
      tamabotchi.learn(sentence);
    }
    console.log(`read book ${bookSrc}`);
  }

  await rtm.start();
  console.log("started");
};

main();
