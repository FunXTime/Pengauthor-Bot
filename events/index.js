import ready from "./ready.js";
import interactionCreate from "./interactionCreate.js";
import messageCreate from "./messageCreate.js";

const events = [
  ready,
  interactionCreate,
  messageCreate
];

export default function registerEvents(client) {
  for (const event of events) {
    const handler = (...args) => event.execute(...args);
    if (event.once) client.once(event.name, handler);
    else client.on(event.name, handler);
  }
}
