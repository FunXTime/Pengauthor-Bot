import { SlashCommandBuilder, MessageFlags } from "discord.js";
import {
  container, emoji, commandMention, text
} from "../lib/components.js";
import { getAutocompleteOptions } from "../lib/utils.js";
import config from "../config/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get help with using the Pengauthor Discord bot")
    .addStringOption((option) => option
      .setName("command")
      .setDescription("Optional: The command you specifically need help with")
      .setAutocomplete(true)
      .setRequired(false)
    )
    .addBooleanOption((option) => option
      .setName("ephemeral")
      .setDescription("Optional: Hide the response from others in the chat")
      .setRequired(false)
    ),
  messageCommands: [ "help", "commands", "command", "cmds", "cmd" ],

  async autocomplete({ interaction }) {
    const options = getAutocompleteOptions(
      config.help,
      interaction.options.getFocused()
    );
    return await interaction.respond(
      options.map((option) => ({
        ...option,
        name: `/${option.name}`
      }))
    );
  },

  async execute({ interaction, message, args }) {
    const ephemeral = interaction?.options.getBoolean("ephemeral") ?? false;
    const client = interaction?.client || message?.client;

    let commandName;
    function normalizeCommandName(value) {
      if (!value) return value;
      return value
        .trim()
        .replace(
          new RegExp(`^(?:${config.prefix}|<@!?${client.user.id}>)\\s*`, "i"), ""
        )
        .replace(/^\/\s*/, "")
        .toLowerCase();
      }

    if (interaction) commandName = normalizeCommandName(
      interaction.options.getString("command")
    );
    else if (message) commandName = normalizeCommandName(
      args.join(" ")
    );

    const originalCommand = commandName
      ? [...client.commands.values()].find(
        (command) => command.data?.name === commandName
          || command.messageCommands?.includes(commandName)
      ) : null;

    if (!commandName) {
      const commands = Object.entries(config.help)
        .filter(([name]) => client.application.commands.cache.some(
          (command) => command.name === name
        ))
        .map(([name, command]) =>
          `${(command.subcommands?.length
            ? command.subcommands.map((subcommand) => commandMention(client, name, subcommand))
            : [commandMention(client, name)]
          ).join(" ")}\n`
          + `${command.shortDescription || "A new command currently lacking documentation."}`
        );
      const reply = {
        components: [
          container(
            text(
              `## ${emoji("Command")} Pengauthor Commands\n`
            + `${commands.join("\n\n")}`
            + `\n\n-# Use \`/help <command>\` for more information about a specific command.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      };
      if (interaction) return await interaction.reply(reply);
      if (message) return await message.reply(reply);
    }
    else if (!originalCommand) {
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **Command not found!**\n`
            + `A command named \`${commandName}\` doesn't seem to exist.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      };
      if (interaction) return await interaction.reply(reply);
      if (message) return await message.reply(reply);
    }
    else {
      const slashCommand = originalCommand
        ? client.application.commands.cache.find(
          (command) => command.name === originalCommand.data?.name
        ) : null;
      const messageCommands = originalCommand?.messageCommands || [];
      const help = config.help[originalCommand?.data?.name || commandName];
      const compatibility = (
        `${slashCommand
          ? `\n**Slash command${help?.subcommands?.length > 1 ? "s" : ""}:** ${
            help?.subcommands?.length
              ? help.subcommands.map((subcommand) =>
                `</${slashCommand.name} ${subcommand}:${slashCommand.id}>`
              ).join(" ")
              : `</${slashCommand.name}:${slashCommand.id}>`
          }`
          : "**Slash command:** _Not supported_"}` +
        `\n` +
        `**Message command${messageCommands.length == 1 ? "" : "s"}:** ${messageCommands.length ? messageCommands.map((alias) => `\`${config.prefix}${alias}\``).join(" ") : "_Not supported_"}`
      );
      const args = help?.args?.length ? (
        `**Arguments:**\n`
      + help.args.flatMap((arg) => Object.entries(arg)
          .map(([name, description]) => {
            const required = name.startsWith("_");
            const displayName = required ? name.slice(1) : name;
            const formattedName = required ? `__\`${displayName}\`__` : `\`${displayName}\``;
            return `- ${formattedName} — ${description}`;
          })
        ).join("\n")
      ) : "";
      const reply = {
        components: [
          container(
            text(
              `## ${emoji("Command")} ${originalCommand?.data?.name || commandName}\n`
            + `${help?.description || "This command is new and seems like it needs a description. Tell Fun X Time that."}`
            + `${compatibility ? `\n${compatibility}` : `\n`}`
            + `${args ? `\n${args}\n\n-# **Required arguments** are __underlined__!` : `\n`}`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      };
      if (interaction) return await interaction.reply(reply);
      if (message) return await message.reply(reply);
    }
  }
};
