const fallbackAppUrl = "https://exit-planner-spec.vercel.app";

export const APP_NAME = "Exit Planner";
export const APP_SUBTITLE = "Exit strategy for held coins";
export const APP_DESCRIPTION =
  "Track held tokens, set take-profit and stop-loss lines, and jump into a chart from Farcaster or the browser.";
export const APP_TAGLINE = "Plan exits with clarity";
export const APP_OG_TITLE = "Exit Planner";
export const APP_OG_DESCRIPTION = "Plan TP and SL lines for tokens on Base and Ethereum.";
export const APP_PRIMARY_CATEGORY = "finance";
export const APP_TAGS = ["trading", "portfolio", "base", "crypto", "charts"] as const;
export const APP_SPLASH_BACKGROUND = "#0f0f23";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? fallbackAppUrl;
export const BASE_APP_ID =
  process.env.NEXT_PUBLIC_BASE_APP_ID ?? "69d12a501c79be726bd519ff";

const accountAssociation = {
  header: process.env.FARCASTER_ACCOUNT_ASSOCIATION_HEADER ?? "",
  payload: process.env.FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD ?? "",
  signature: process.env.FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE ?? "",
};

export const farcasterManifest = {
  accountAssociation,
  miniapp: {
    version: "1",
    name: APP_NAME,
    subtitle: APP_SUBTITLE,
    description: APP_DESCRIPTION,
    iconUrl: `${APP_URL}/icon.png`,
    splashImageUrl: `${APP_URL}/splash.png`,
    splashBackgroundColor: APP_SPLASH_BACKGROUND,
    homeUrl: APP_URL,
    primaryCategory: APP_PRIMARY_CATEGORY,
    tags: [...APP_TAGS],
    heroImageUrl: `${APP_URL}/preview.png`,
    tagline: APP_TAGLINE,
    ogTitle: APP_OG_TITLE,
    ogDescription: APP_OG_DESCRIPTION,
    ogImageUrl: `${APP_URL}/preview.png`,
    screenshotUrls: [
      `${APP_URL}/preview.png`,
      `${APP_URL}/preview.png`,
      `${APP_URL}/preview.png`,
    ],
    requiredChains: ["eip155:8453", "eip155:1"],
    requiredCapabilities: [],
    noindex: false,
  },
} as const;

export const farcasterEmbed = {
  version: "1",
  imageUrl: `${APP_URL}/preview.png`,
  button: {
    title: "Open Exit Planner",
    action: {
      type: "launch_miniapp",
      name: APP_NAME,
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: APP_SPLASH_BACKGROUND,
    },
  },
} as const;
