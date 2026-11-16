import config from "../../config/index.js";

export const DEFAULT_SITE = config.research.defaultSite;

export function getSite(site) {
  const siteInfo = config.research.sites[site];
  if (!config) throw new Error(`Unknown site: ${site}`);
  return siteInfo;
}

export async function wpFetch(
  endpoint, { site = DEFAULT_SITE, ...options } = {}
) {
  const { api, url } = getSite(site);
  const base = api === "wpcom"
    ? `https://public-api.wordpress.com/rest/v1.1/sites/${url}`
    : `https://${url}/wp-json`;
  const response = await fetch(`${base}/${endpoint}`, { ...options, cache: "no-store" });

  if (!response.ok) throw new Error(`WordPress request failed (${response.status})`);

  return response.json();
}
