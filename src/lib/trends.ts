import googleTrends from "google-trends-api";
import pRetry from "p-retry";
import { optionalEnv } from "./env";
import type { TrendTopic } from "./types";

type RawTrendingArticle = {
  title?: unknown;
};

type RawTrendingSearch = {
  title?: { query?: string };
  entityNames?: unknown;
  formattedTraffic?: string;
  articles?: RawTrendingArticle[];
};

function ensureStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function parseTrendResponse(raw: string): TrendTopic[] {
  try {
    const parsed = JSON.parse(raw);
    const firstDay =
      parsed?.default?.trendingSearchesDays?.[0]?.trendingSearches ?? [];
    if (!Array.isArray(firstDay)) {
      return [];
    }

    return firstDay.map((item: RawTrendingSearch) => {
      const entityNames = ensureStringArray(item?.entityNames);
      const articles = Array.isArray(item?.articles) ? item.articles : [];
      const summary =
        articles
          .map((article) =>
            typeof article?.title === "string" ? article.title : undefined,
          )
          .filter((title): title is string => Boolean(title))
          .slice(0, 3)
          .join(" • ") || item?.title?.query;
      const searchVolume = Number(item?.formattedTraffic?.replace(/\D/g, "")) || 0;
      return {
        title: item?.title?.query ?? "Untitled Trend",
        entityNames,
        summary: summary || "Trending topic",
        searchVolume,
      };
    });
  } catch (error) {
    console.error("Failed to parse Google Trends payload", error);
    return [];
  }
}

export async function fetchTrendingTopics(
  region = optionalEnv("DEFAULT_TREND_REGION") ?? "US",
): Promise<TrendTopic[]> {
  const today = new Date();

  const result = await pRetry(
    async () => {
      const payload = await googleTrends.dailyTrends({
        trendDate: today,
        geo: region,
      });
      const topics = parseTrendResponse(payload);
      if (!topics.length) {
        throw new Error(`No trends received for region ${region}`);
      }
      return topics;
    },
    {
      retries: 2,
      onFailedAttempt: (error) => {
        console.warn(
          `Retrying trend fetch (${error.attemptNumber}/${error.retriesLeft}), reason: ${error.message}`,
        );
      },
    },
  ).catch((error) => {
    console.error("Google Trends fetch failed, falling back to defaults", error);
    return [] as TrendTopic[];
  });

  if (result.length) {
    return result;
  }

  // Fallback topics in case the API fails entirely.
  return [
    {
      title: "Emerging AI Productivity Tools",
      entityNames: ["AI", "Productivity"],
      summary:
        "New AI tools are going viral for automating workflows across design, code, and marketing.",
      searchVolume: 50000,
    },
    {
      title: "Crypto Market Momentum",
      entityNames: ["Bitcoin", "Ethereum"],
      summary:
        "Crypto prices spike as institutional investors increase positions amid ETF approvals.",
      searchVolume: 42000,
    },
    {
      title: "Longevity Supplements Craze",
      entityNames: ["Longevity", "Health"],
      summary:
        "Biohackers and wellness influencers push longevity stacks promising anti-aging benefits.",
      searchVolume: 31000,
    },
  ];
}

export function selectTopTrend(topics: TrendTopic[]): TrendTopic {
  if (!topics.length) {
    throw new Error("No trend topics available to select from");
  }

  return topics
    .slice()
    .sort((a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0))[0];
}
