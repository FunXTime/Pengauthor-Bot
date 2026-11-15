import "dotenv/config";
import main from "./main.json" with { type: "json" };
import help from "./help.json" with { type: "json" };
import tips from "./tips.json" with { type: "json" };
import editorTips from "./editor-tips.json" with { type: "json" };
import threadMappings from "./threads.json" with { type: "json" };
import thumbnails from "./thumbnails.json" with { type: "json" };
import research from "./research.json" with { type: "json" };
import boilerplates from "./boilerplates.json" with { type: "json" };
import devOverrides from "./dev-overrides.json" with { type: "json" };
import armyColors from "./colors/armies.json" with { type: "json" };
import organizationColors from "./colors/organizations.json" with { type: "json" };
import colorMappings from "./colors/mappings.json" with { type: "json" };

const useDevOverrides = process.env.DEVELOPMENT_MODE?.toLowerCase() === "true";
const config = {
  help,
  tips,
  editorTips,
  threadMappings,
  thumbnails,
  boilerplates,
  research,
  armyColors,
  organizationColors,
  colorMappings,

  ...main,
  ...(useDevOverrides ? devOverrides : {}),

  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  supabase: {
    url: process.env.SUPABASE_URL,
    secretKey: process.env.SUPABASE_SECRET_KEY
  },
  logTimestamps: process.env.LOG_TIMESTAMPS?.toLowerCase() === "true"
};

for (const [name, value] of Object.entries({
  DISCORD_TOKEN: config.token,
  DISCORD_CLIENT_ID: config.clientId,
  SUPABASE_URL: config.supabase.url,
  SUPABASE_SECRET_KEY: config.supabase.secretKey
})) {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
}

export default config;
