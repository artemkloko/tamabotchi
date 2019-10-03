import { appendFile, readFile, readdir } from "fs";
import { promisify } from "util";
import { RTMClient } from "@slack/rtm-api";

import { Tamabotchi } from "./tamabotchi";
// import config from "../config";

const config: {
  [key: string]: string;
} = {
  SLACK_TOKEN: process.env.SLACK_TOKEN || "",
  SLACK_ID: process.env.SLACK_ID || ""
};

for (let key of Object.keys(config)) {
  if (!config[key]) {
    throw new Error(`Env var ${key} was not provided.`);
  }
}

const tamabotchi = new Tamabotchi();

const rtm = new RTMClient(config.SLACK_TOKEN);

rtm.on("message", async event => {
  let reply: string;
  try {
    if (
      event.type !== "message" ||
      !event.text ||
      !event.user ||
      event.user === config.SLACK_ID
    ) {
      return;
    }

    const inDirectMessage = event.channel[0] === "D";
    const mentioned = `<@${config.SLACK_ID}>`;
    const mentioned_regexp = new RegExp(mentioned, "g");

    if (event.text.indexOf(mentioned) > -1 || inDirectMessage) {
      const sentence = event.text.replace(mentioned_regexp, "");
      reply = tamabotchi
        .reply_to_sentence(sentence)
        .replace(/<@self>/g, `<@${event.user}>`);

      await rtm.sendMessage(reply, event.channel);
    }

    const sentence = event.text.replace(mentioned_regexp, "<@self>");
    tamabotchi.learn_sentence(sentence);
    await promisify(appendFile)("books/history.txt", sentence + "�");
  } catch (error) {
    console.error(error);
  }
});

export const main = async () => {
  const books = await promisify(readdir)("books");
  let start: number;
  for (let bookName of books) {
    const book = await promisify(readFile)("books/" + bookName, "utf-8");
    start = new Date().getTime();
    tamabotchi.learn_text(book);
    console.log(
      `read ${bookName} in ${(new Date().getTime() - start) / 1000}s`
    );
    // break;
  }
  await rtm.start();
  console.log("started");
};
