import { MessageFlags, ButtonStyle, ComponentType } from "discord.js";
import config from "../config/index.js";
import { logger } from "./utils.js";

export { MessageFlags };

let cachedEmojis = [];
export async function loadEmojis(client) {
  const application = await client.application.fetch(config.clientId);
  cachedEmojis = await application.emojis.fetch();
  logger.info(`Loaded emoji (${cachedEmojis.size} emojis)`);
}

let cachedCommands = [];
export async function loadCommands(client) {
  cachedCommands = await client.application.commands.fetch();
  for (const command of cachedCommands.values()) {
    client.application.commands.cache.set(command.id, command);
  }
  logger.info(`Cached command data (${cachedCommands.size} commands)`);
}

export function emoji(query) {
  return cachedEmojis.find((emoji) => emoji.name === query || emoji.id === query);
}

export function timestamp(date = new Date(), format = "") {
  if (typeof date === "string") date = new Date(date);
  return `<t:${Math.floor(date.getTime() / 1000)}${format ? `:${format}` : ""}>`;
}

export function commandMention(client, commandName, subcommand) {
  const slashCommand = client.application.commands.cache.find(
    (command) => command.name === commandName
  );
  if (!slashCommand) return null;
  if (subcommand) return `</${slashCommand.name} ${subcommand}:${slashCommand.id}>`;
  return `</${slashCommand.name}:${slashCommand.id}>`;
}

export function actionRow(components = [], options = {}) {
  if (!Array.isArray(components)) {
    if (components?.type) components = [components];
    else {
      options = components;
      components = options.components || [];
    }
  }
  return {
    type: ComponentType.ActionRow,
    components
  };
}

export function button({
  custom_id = "",
  label = "",
  style = ButtonStyle.Primary,
  emoji = null,
  disabled = false,
  url = null
} = {}) {
  const component = {
    type: ComponentType.Button,
    custom_id,
    label,
    style,
    disabled
  };
  if (emoji) component.emoji = typeof emoji === "string"
    ? { name: emoji } : { id: emoji.id, name: emoji.name };
  if (url !== null) {
    delete component.custom_id;
    component.url = url;
  }
  return component;
}

export function container(components = [], options = {}) {
  if (!Array.isArray(components)) {
    if (components?.type) components = [components];
    else {
      options = components;
      components = options.components || [];
    }
  }
  const { accent_color = null, spoiler = false } = options;
  const component = {
    type: ComponentType.Container,
    components
  };
  if (accent_color !== null) component.accent_color = accent_color;
  if (spoiler) component.spoiler = spoiler;
  return component;
}

export function media(items = []) {
  if (typeof items === "string") items = [{
    media: { url: items }
  }];
  if (!Array.isArray(items)) items = items.items || [];
  return {
    type: ComponentType.MediaGallery,
    items
  };
}

export function section(components = [], options = {}) {
  if (!Array.isArray(components)) {
    if (components?.type) components = [components];
    else {
      options = components;
      components = options.components || [];
    }
  }
  const { accessory = null } = options;
  if (!accessory) return components;
  return {
    type: ComponentType.Section,
    components,
    accessory
  };
}

export function separator({ divider = true, spacing = 1 } = {}) {
  return {
    type: ComponentType.Separator,
    divider,
    spacing
  };
}

export function text(content = "") {
  if (typeof content === "object") content = content.content || "";
  return {
    type: ComponentType.TextDisplay,
    content
  };
}

export function thumbnail(url = "") {
  if (typeof url === "object") url = url.url || "";
  return {
    type: ComponentType.Thumbnail,
    media: { url }
  };
}
