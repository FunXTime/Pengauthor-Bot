# Creating a Command

To build a command for the Pengauthor Discord bot, you need to complete the following steps…

1. Create a JavaScript file in this directory that dictates the working of the command
2. Enlist the command file using `index.js` to make it discoverable by the bot
3. Optionally, write the command's information in `/config/help.json` to add it to the `help` command

If you are creating, changing, or removing a slash command, you must run `npm run deploy` in the terminal to make Discord aware of the change. Discord will further update the slash command and its options for all clients. After deploying, reload Discord if your client does not immediately receive the change.

## Command Data

All commands stored in `/commands` should be syntactically consistent. For the file to be seen as a command, it should export an object…

```js
export default {
  data: new SlashCommandBuilder() // Add "data" if you are building a slash command
    .setName("")                  // Set the name of the slash command
    .setDescription("")           // Set the description of the slash command
    /* Optional: Further add options for the slash command here */,
  messageCommands: [ "", "" ],    // Add "messageCommands" to support message command and aliases

  // Add this "autocomplete" method if autocompletion is supported
  async execute({ interaction }) {
    // Use the autocompletion implementation and follow this format
    const focused = interaction.options.getFocused(true);
    const options = {
      arg1: { "text": "value" },
      arg2: { "text": "value" },
      ...
    };
    if (options[focused.name]) await sendAutocomplete(interaction, options[focused.name]);
  },

  // "interaction" is required for slash commands, "message" and "args" are required for messages:
  async execute({ interaction, message, args }) {
    // The program to run when the command is issued
  }
}
```

## Documenting the Command

Public commands are expected to be documented. To do so, update `/config/help.json`. A command's documentation is an object within the top-level array:

```json
  "command-name": { // The object key is the command's name; must match the slash command name
    "shortDescription": "", // A short description used for the command list
    "description": "", // An elaborate description used for command-specific assistance
    "subcommands": [""] // Subcommands of the slash command if supported
    "args": [{
      "_example1": "", // A required argument with a description
      "_example2": "", // A required argument with a description
      "example3": "", // An optional argument with a description
      "example4": "", // An optional argument with a description
    }]
  }
```
