export type Product = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  createdAt: string;
};

export type VideoStatus = "pending" | "ready" | "failed";

export type Video = {
  id: string;
  productId: string;
  videoUrl: string | null;
  status: VideoStatus;
  provider: string;
  createdAt: string;
};

export type Platform = "tiktok" | "instagram";

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
  priceEur: number;
  networksAllowed: number;
  videosPerMonth: number;
  competitorAnalysis: boolean;
  stripePriceEnvVar: string;
};
