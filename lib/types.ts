export type Product = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
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
  competitorAnalysis: boolean;
  stripePriceEnvVar: string;
  stripePriceEnvVarYearly: string;
};
