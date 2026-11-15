import config from "../config/index.js";

const now = () => new Date().toISOString();
export const logger = {
  info:  (message) => console.info (`[${now()}]  [INFO] ${message}`),
  warn:  (message) => console.warn (`[${now()}]  [WARN] ${message}`),
  error: (message) => console.error(`[${now()}] [ERROR] ${message}`),
  event: (message) => console.log  (`[${now()}] [EVENT] ${message}`)
};

export function getAutocompleteOptions(options, value) {
  const query = value.toLowerCase();
  return Object.keys(options)
    .filter((name) => name.toLowerCase().includes(query))
    .slice(0, 25)
    .map((name) => ({ name, value: name }));
}

export async function sendAutocomplete(interaction, options) {
  await interaction.respond(
    getAutocompleteOptions(options, interaction.options.getFocused())
  );
}

export function toEST(input) {
  const [day, month] = input.split("-").map(Number);
  const now = new Date();
  let year = now.getFullYear();

  const getDate = (year, month, day) => {
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      timeZoneName: "shortOffset"
    }).formatToParts(date);
    const offset = parts.find((part) => part.type === "timeZoneName").value;
    const hours = Number(offset.replace("GMT", ""));
    return new Date(Date.UTC(year, month - 1, day, -hours, 0, 0));
  };

  let date = getDate(year, month, day);
  if (date < now) year++, date = getDate(year, month, day);

  return date;
}
