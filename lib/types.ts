export type Product = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  // HeyGen's own asset id for imageUrl, once uploaded — needed to compose a
  // studio video that actually shows the product, not just a talking avatar.
  heygenAssetId: string | null;
  leadId: string | null;
  createdAt: string;
};

export type VideoStatus = "pending" | "ready" | "failed";

export type Video = {
  id: string;
  productId: string;
  videoUrl: string | null;
  status: VideoStatus;
  provider: string;
  externalJobId: string | null;
  createdAt: string;
};

export type Platform = "tiktok" | "instagram" | "youtube";

export type PostStatus = "scheduled" | "posted" | "failed";

export type Post = {
  id: string;
  videoId: string;
  platform: Platform;
  hashtags: string;
  scheduledAt: string;
  status: PostStatus;
  createdAt: string;
};

export type AnalyticsRow = {
  id: string;
  postId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  capturedAt: string;
};

export type Tier = {
  id: "starter" | "growth" | "pro";
  name: string;
  priceUsd: number;
  // Per-month equivalent when billed annually (20% off), shown in the UI.
  yearlyPriceUsd: number;
  // The exact annual total charged (yearlyPriceUsd * 12 would drift due to
  // rounding) — this is the real 20%-off number, e.g. 29*12*0.8 rounded.
  yearlyTotalUsd: number;
  networksAllowed: number;
  videosPerMonth: number;
  // Max distinct products a client can have videos made for. null = unlimited.
  productsAllowed: number | null;
  // How many times a client can swap their chosen AI avatar (their first
  // pick is free and doesn't count against this). null = unlimited.
  avatarChangesAllowed: number | null;
  competitorAnalysis: boolean;
  stripePriceEnvVar: string;
  stripePriceEnvVarYearly: string;
};
