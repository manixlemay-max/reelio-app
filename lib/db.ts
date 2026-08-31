import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import type { Product, Video, Post, AnalyticsRow, Platform } from "./types";

// Set on Vercel automatically once you connect a Postgres database under
// Storage tab (Neon-backed). See README for the one-time setup.
const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED;

function getSql() {
  if (!connectionString) {
    throw new Error(
      "No database connected. Go to your Vercel project > Storage > Create Database > Postgres, then redeploy."
    );
  }
  return neon(connectionString);
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          image_url TEXT,
          created_at TEXT NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS videos (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          video_url TEXT,
          status TEXT NOT NULL,
          provider TEXT NOT NULL,
          external_job_id TEXT,
          created_at TEXT NOT NULL
        )
      `;
      // Backfill for databases created before this column existed.
      await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS external_job_id TEXT`;
      await sql`
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          video_id TEXT NOT NULL,
          platform TEXT NOT NULL,
          hashtags TEXT NOT NULL,
          scheduled_at TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS analytics (
          id TEXT PRIMARY KEY,
          post_id TEXT NOT NULL,
          views INTEGER NOT NULL DEFAULT 0,
          likes INTEGER NOT NULL DEFAULT 0,
          comments INTEGER NOT NULL DEFAULT 0,
          shares INTEGER NOT NULL DEFAULT 0,
          captured_at TEXT NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          business_name TEXT NOT NULL,
          product_description TEXT NOT NULL,
          social_handles TEXT,
          notes TEXT,
          created_at TEXT NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          email TEXT,
          tier_id TEXT,
          status TEXT NOT NULL,
          current_period_end TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `;
      // Link each product to the client (lead) it belongs to, so posts go to
      // that client's own social accounts instead of a random connected one.
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_id TEXT`;
      // Each client's own Postiz integration IDs, one per platform.
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS tiktok_integration_id TEXT`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram_integration_id TEXT`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS youtube_integration_id TEXT`;
      // Unguessable token used for the client's public, login-free report page.
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS report_token TEXT`;
      // The AI avatar this client picked for all their videos, plus how many
      // times they've swapped it — limited per plan (see Tier.avatarChangesAllowed).
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS avatar_id TEXT`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS voice_id TEXT`;
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS avatar_changes_used INTEGER NOT NULL DEFAULT 0`;
      // Free-text notes from the client on what to mention/emphasize in
      // their videos (a promo code, a feature, a call to action).
      await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS video_notes TEXT`;
      // Self-serve cancellation: whether the client already asked to cancel
      // (access continues until the period ends), and why they left.
      await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE`;
      await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT`;
      await sql`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT`;
      // Client help requests submitted from their report page (no login,
      // no need to know Manix's email) — shows up on the Clients dashboard.
      await sql`
        CREATE TABLE IF NOT EXISTS support_requests (
          id TEXT PRIMARY KEY,
          lead_id TEXT NOT NULL,
          message TEXT NOT NULL,
          resolved BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TEXT NOT NULL
        )
      `;
      // Manix's in-app reply, shown back to the client on their report page.
      await sql`ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS response TEXT`;
      await sql`ALTER TABLE support_requests ADD COLUMN IF NOT EXISTS responded_at TEXT`;
    })();
  }
  return schemaReady;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    leadId: row.lead_id ?? null,
    createdAt: row.created_at,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toVideo(row: any): Video {
  return {
    id: row.id,
    productId: row.product_id,
    videoUrl: row.video_url,
    status: row.status,
    provider: row.provider,
    externalJobId: row.external_job_id,
    createdAt: row.created_at,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPost(row: any): Post {
  return {
    id: row.id,
    videoId: row.video_id,
    platform: row.platform,
    hashtags: row.hashtags,
    scheduledAt: row.scheduled_at,
    status: row.status,
    createdAt: row.created_at,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAnalytics(row: any): AnalyticsRow {
  return {
    id: row.id,
    postId: row.post_id,
    views: row.views,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    capturedAt: row.captured_at,
  };
}

// --- Products ---
export async function createProduct(input: {
  name: string;
  description: string;
  imageUrl?: string;
  leadId?: string | null;
}): Promise<Product> {
  const sql = getSql();
  await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await sql`
    INSERT INTO products (id, name, description, image_url, lead_id, created_at)
    VALUES (${id}, ${input.name}, ${input.description}, ${input.imageUrl ?? null}, ${input.leadId ?? null}, ${createdAt})
  `;
  return {
    id,
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl ?? null,
    leadId: input.leadId ?? null,
    createdAt,
  };
}

export async function updateProductLead(id: string, leadId: string | null): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`UPDATE products SET lead_id = ${leadId} WHERE id = ${id}`;
}

// All products belonging to one client, oldest first — used by the
// automation cron to know which product to generate the next video for.
export async function getProductsByLead(leadId: string): Promise<Product[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM products WHERE lead_id = ${leadId} ORDER BY created_at ASC`;
  return rows.map(toProduct);
}

export async function listProducts(): Promise<Product[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`;
  return rows.map(toProduct);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
  return rows[0] ? toProduct(rows[0]) : undefined;
}

// Cascades: removes analytics + posts + videos tied to this product before
// removing the product itself, so nothing orphaned is left behind.
export async function deleteProduct(id: string): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`
    DELETE FROM analytics WHERE post_id IN (
      SELECT posts.id FROM posts
      JOIN videos ON videos.id = posts.video_id
      WHERE videos.product_id = ${id}
    )
  `;
  await sql`
    DELETE FROM posts WHERE video_id IN (
      SELECT id FROM videos WHERE product_id = ${id}
    )
  `;
  await sql`DELETE FROM videos WHERE product_id = ${id}`;
  await sql`DELETE FROM products WHERE id = ${id}`;
}

// --- Videos ---
export async function createVideo(input: {
  productId: string;
  provider: string;
  status: Video["status"];
  videoUrl?: string | null;
  externalJobId?: string | null;
}): Promise<Video> {
  const sql = getSql();
  await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await sql`
    INSERT INTO videos (id, product_id, video_url, status, provider, external_job_id, created_at)
    VALUES (${id}, ${input.productId}, ${input.videoUrl ?? null}, ${input.status}, ${input.provider}, ${input.externalJobId ?? null}, ${createdAt})
  `;
  return {
    id,
    productId: input.productId,
    videoUrl: input.videoUrl ?? null,
    status: input.status,
    provider: input.provider,
    externalJobId: input.externalJobId ?? null,
    createdAt,
  };
}

export async function updateVideo(
  id: string,
  input: { status: Video["status"]; videoUrl?: string | null }
): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`
    UPDATE videos SET status = ${input.status}, video_url = ${input.videoUrl ?? null} WHERE id = ${id}
  `;
}

export async function listVideos(): Promise<(Video & { productName: string })[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`
    SELECT videos.*, products.name as product_name
    FROM videos JOIN products ON products.id = videos.product_id
    ORDER BY videos.created_at DESC
  `;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({ ...toVideo(r), productName: r.product_name }));
}

export async function getVideo(id: string): Promise<Video | undefined> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM videos WHERE id = ${id}`;
  return rows[0] ? toVideo(rows[0]) : undefined;
}

// Deletes a video and anything scheduled/posted from it (posts + their
// analytics), same cascade pattern as deleteProduct above.
export async function deleteVideo(id: string): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`
    DELETE FROM analytics WHERE post_id IN (
      SELECT id FROM posts WHERE video_id = ${id}
    )
  `;
  await sql`DELETE FROM posts WHERE video_id = ${id}`;
  await sql`DELETE FROM videos WHERE id = ${id}`;
}

// Most recent video generated for any product belonging to this client —
// used by the automation cron to pace out recurring monthly videos.
export async function getLatestVideoForLead(leadId: string): Promise<Video | undefined> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`
    SELECT videos.* FROM videos
    JOIN products ON products.id = videos.product_id
    WHERE products.lead_id = ${leadId}
    ORDER BY videos.created_at DESC
    LIMIT 1
  `;
  return rows[0] ? toVideo(rows[0]) : undefined;
}

// --- Posts ---
export async function createPost(input: {
  videoId: string;
  platform: Platform;
  hashtags: string;
  scheduledAt: string;
  status: Post["status"];
}): Promise<Post> {
  const sql = getSql();
  await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await sql`
    INSERT INTO posts (id, video_id, platform, hashtags, scheduled_at, status, created_at)
    VALUES (${id}, ${input.videoId}, ${input.platform}, ${input.hashtags}, ${input.scheduledAt}, ${input.status}, ${createdAt})
  `;
  return {
    id,
    videoId: input.videoId,
    platform: input.platform,
    hashtags: input.hashtags,
    scheduledAt: input.scheduledAt,
    status: input.status,
    createdAt,
  };
}

export async function deletePost(id: string): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`DELETE FROM analytics WHERE post_id = ${id}`;
  await sql`DELETE FROM posts WHERE id = ${id}`;
}

// Whether a video has already been posted (or attempted) to a given
// platform — lets the auto-posting cron skip work it already did, while
// still retrying platforms a client connects later.
export async function hasPostForVideoPlatform(videoId: string, platform: Platform): Promise<boolean> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT id FROM posts WHERE video_id = ${videoId} AND platform = ${platform} LIMIT 1`;
  return rows.length > 0;
}

// Lightweight analytics slice for one client — just what
// suggestBestPostingTime() needs (platform, capturedAt, views) — used by the
// auto-posting cron to time posts based on that client's own history.
export async function getAnalyticsForLead(
  leadId: string
): Promise<{ platform: Platform; capturedAt: string; views: number }[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`
    SELECT analytics.views as views, analytics.captured_at as captured_at, posts.platform as platform
    FROM analytics
    JOIN posts ON posts.id = analytics.post_id
    JOIN videos ON videos.id = posts.video_id
    JOIN products ON products.id = videos.product_id
    WHERE products.lead_id = ${leadId}
  `;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({ platform: r.platform, capturedAt: r.captured_at, views: r.views }));
}

export async function updatePostSchedule(id: string, scheduledAt: string): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`UPDATE posts SET scheduled_at = ${scheduledAt} WHERE id = ${id}`;
}

export async function listPosts(): Promise<(Post & { videoUrl: string | null; productName: string })[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`
    SELECT posts.*, videos.video_url as video_url, products.name as product_name
    FROM posts
    JOIN videos ON videos.id = posts.video_id
    JOIN products ON products.id = videos.product_id
    ORDER BY posts.scheduled_at DESC
  `;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({ ...toPost(r), videoUrl: r.video_url, productName: r.product_name }));
}

// --- Analytics ---
export async function recordAnalytics(input: {
  postId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}): Promise<AnalyticsRow> {
  const sql = getSql();
  await ensureSchema();
  const id = randomUUID();
  const capturedAt = new Date().toISOString();
  await sql`
    INSERT INTO analytics (id, post_id, views, likes, comments, shares, captured_at)
    VALUES (${id}, ${input.postId}, ${input.views}, ${input.likes}, ${input.comments}, ${input.shares}, ${capturedAt})
  `;
  return {
    id,
    postId: input.postId,
    views: input.views,
    likes: input.likes,
    comments: input.comments,
    shares: input.shares,
    capturedAt,
  };
}

export async function listAnalytics(): Promise<(AnalyticsRow & { platform: Platform; productName: string })[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`
    SELECT analytics.*, posts.platform as platform, products.name as product_name
    FROM analytics
    JOIN posts ON posts.id = analytics.post_id
    JOIN videos ON videos.id = posts.video_id
    JOIN products ON products.id = videos.product_id
    ORDER BY analytics.captured_at DESC
  `;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => ({ ...toAnalytics(r), platform: r.platform, productName: r.product_name }));
}


// --- Leads (new client sign-ups from the public /welcome form) ---
export type Lead = {
  id: string;
  name: string;
  email: string;
  businessName: string;
  productDescription: string;
  socialHandles: string | null;
  notes: string | null;
  tiktokIntegrationId: string | null;
  instagramIntegrationId: string | null;
  youtubeIntegrationId: string | null;
  reportToken: string | null;
  avatarId: string | null;
  voiceId: string | null;
  avatarChangesUsed: number;
  videoNotes: string | null;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLead(row: any): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    businessName: row.business_name,
    productDescription: row.product_description,
    socialHandles: row.social_handles,
    notes: row.notes,
    tiktokIntegrationId: row.tiktok_integration_id ?? null,
    instagramIntegrationId: row.instagram_integration_id ?? null,
    youtubeIntegrationId: row.youtube_integration_id ?? null,
    reportToken: row.report_token ?? null,
    avatarId: row.avatar_id ?? null,
    voiceId: row.voice_id ?? null,
    avatarChangesUsed: row.avatar_changes_used ?? 0,
    videoNotes: row.video_notes ?? null,
    createdAt: row.created_at,
  };
}

export async function createLead(input: {
  name: string;
  email: string;
  businessName: string;
  productDescription: string;
  socialHandles?: string;
  notes?: string;
}): Promise<Lead> {
  const sql = getSql();
  await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await sql`
    INSERT INTO leads (id, name, email, business_name, product_description, social_handles, notes, created_at)
    VALUES (${id}, ${input.name}, ${input.email}, ${input.businessName}, ${input.productDescription}, ${input.socialHandles ?? null}, ${input.notes ?? null}, ${createdAt})
  `;
  return {
    id,
    name: input.name,
    email: input.email,
    businessName: input.businessName,
    productDescription: input.productDescription,
    socialHandles: input.socialHandles ?? null,
    notes: input.notes ?? null,
    tiktokIntegrationId: null,
    instagramIntegrationId: null,
    youtubeIntegrationId: null,
    reportToken: null,
    avatarId: null,
    voiceId: null,
    avatarChangesUsed: 0,
    videoNotes: null,
    createdAt,
  };
}

export async function listLeads(): Promise<Lead[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC`;
  return rows.map(toLead);
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM leads WHERE id = ${id}`;
  return rows[0] ? toLead(rows[0]) : undefined;
}

export async function getLeadByToken(token: string): Promise<Lead | undefined> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM leads WHERE report_token = ${token}`;
  return rows[0] ? toLead(rows[0]) : undefined;
}

// Lazily generates a report_token for leads created before this feature
// existed. Safe to call every time the link is displayed or visited.
export async function ensureLeadReportToken(id: string): Promise<string> {
  const sql = getSql();
  await ensureSchema();
  const existing = await getLead(id);
  if (existing?.reportToken) return existing.reportToken;
  const token = randomUUID();
  await sql`UPDATE leads SET report_token = ${token} WHERE id = ${id}`;
  return token;
}

// Everything a client is allowed to see about their own account: their
// videos, their scheduled/posted content, and the analytics captured for it.
// Scoped strictly by lead_id so one client can never see another's data.
export async function getClientReport(leadId: string): Promise<{
  videos: (Video & { productName: string })[];
  posts: (Post & { videoUrl: string | null; productName: string })[];
  analytics: (AnalyticsRow & { platform: Platform; productName: string })[];
}> {
  const sql = getSql();
  await ensureSchema();

  const videoRows = await sql`
    SELECT videos.*, products.name as product_name
    FROM videos JOIN products ON products.id = videos.product_id
    WHERE products.lead_id = ${leadId}
    ORDER BY videos.created_at DESC
  `;
  const postRows = await sql`
    SELECT posts.*, videos.video_url as video_url, products.name as product_name
    FROM posts
    JOIN videos ON videos.id = posts.video_id
    JOIN products ON products.id = videos.product_id
    WHERE products.lead_id = ${leadId}
    ORDER BY posts.scheduled_at DESC
  `;
  const analyticsRows = await sql`
    SELECT analytics.*, posts.platform as platform, products.name as product_name
    FROM analytics
    JOIN posts ON posts.id = analytics.post_id
    JOIN videos ON videos.id = posts.video_id
    JOIN products ON products.id = videos.product_id
    WHERE products.lead_id = ${leadId}
    ORDER BY analytics.captured_at DESC
  `;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videos: videoRows.map((r: any) => ({ ...toVideo(r), productName: r.product_name })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posts: postRows.map((r: any) => ({ ...toPost(r), videoUrl: r.video_url, productName: r.product_name })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analytics: analyticsRows.map((r: any) => ({ ...toAnalytics(r), platform: r.platform, productName: r.product_name })),
  };
}

// Save which Postiz-connected account (integration id) belongs to this
// client, per platform. Leave a field undefined to leave it unchanged.
export async function updateLeadIntegrations(
  id: string,
  input: {
    tiktokIntegrationId?: string | null;
    instagramIntegrationId?: string | null;
    youtubeIntegrationId?: string | null;
  }
): Promise<Lead | undefined> {
  const sql = getSql();
  await ensureSchema();
  const existing = await getLead(id);
  if (!existing) return undefined;
  const tiktok = input.tiktokIntegrationId !== undefined ? input.tiktokIntegrationId : existing.tiktokIntegrationId;
  const instagram =
    input.instagramIntegrationId !== undefined ? input.instagramIntegrationId : existing.instagramIntegrationId;
  const youtube = input.youtubeIntegrationId !== undefined ? input.youtubeIntegrationId : existing.youtubeIntegrationId;
  await sql`
    UPDATE leads
    SET tiktok_integration_id = ${tiktok},
        instagram_integration_id = ${instagram},
        youtube_integration_id = ${youtube}
    WHERE id = ${id}
  `;
  return { ...existing, tiktokIntegrationId: tiktok, instagramIntegrationId: instagram, youtubeIntegrationId: youtube };
}

// Sets (or changes) the client's chosen AI avatar. Pass incrementChangeCount
// = true only when this is an actual change (not their first pick) — the
// caller is responsible for checking the plan's change limit first.
export async function updateLeadAvatar(
  id: string,
  avatarId: string,
  voiceId: string | null,
  incrementChangeCount: boolean
): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  if (incrementChangeCount) {
    await sql`
      UPDATE leads
      SET avatar_id = ${avatarId}, voice_id = ${voiceId}, avatar_changes_used = avatar_changes_used + 1
      WHERE id = ${id}
    `;
  } else {
    await sql`UPDATE leads SET avatar_id = ${avatarId}, voice_id = ${voiceId} WHERE id = ${id}`;
  }
}

export async function updateLeadVideoNotes(id: string, notes: string): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`UPDATE leads SET video_notes = ${notes} WHERE id = ${id}`;
}


// --- Subscriptions (kept in sync from Stripe webhooks) ---
export type Subscription = {
  id: string;
  customerId: string;
  email: string | null;
  tierId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancellationReason: string | null;
  cancellationFeedback: string | null;
  createdAt: string;
  updatedAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSubscription(row: any): Subscription {
  return {
    id: row.id,
    customerId: row.customer_id,
    email: row.email,
    tierId: row.tier_id,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
    cancellationReason: row.cancellation_reason ?? null,
    cancellationFeedback: row.cancellation_feedback ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Insert or update a subscription row keyed by Stripe subscription id.
// Fields left undefined are not overwritten on conflict.
export async function upsertSubscription(input: {
  id: string;
  customerId: string;
  email?: string | null;
  tierId?: string | null;
  status: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  const now = new Date().toISOString();
  await sql`
    INSERT INTO subscriptions (id, customer_id, email, tier_id, status, current_period_end, cancel_at_period_end, created_at, updated_at)
    VALUES (${input.id}, ${input.customerId}, ${input.email ?? null}, ${input.tierId ?? null}, ${input.status}, ${input.currentPeriodEnd ?? null}, ${input.cancelAtPeriodEnd ?? false}, ${now}, ${now})
    ON CONFLICT (id) DO UPDATE SET
      customer_id = EXCLUDED.customer_id,
      email = COALESCE(EXCLUDED.email, subscriptions.email),
      tier_id = COALESCE(EXCLUDED.tier_id, subscriptions.tier_id),
      status = EXCLUDED.status,
      current_period_end = COALESCE(EXCLUDED.current_period_end, subscriptions.current_period_end),
      cancel_at_period_end = ${input.cancelAtPeriodEnd ?? false},
      updated_at = ${now}
  `;
}

// Records why a client canceled — set directly by the self-serve cancel
// flow so Manix can see it on the Clients dashboard without opening Stripe.
export async function recordCancellationFeedback(
  subscriptionId: string,
  reason: string,
  feedback: string | null
): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`
    UPDATE subscriptions
    SET cancellation_reason = ${reason}, cancellation_feedback = ${feedback}, cancel_at_period_end = TRUE, updated_at = ${new Date().toISOString()}
    WHERE id = ${subscriptionId}
  `;
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM subscriptions ORDER BY updated_at DESC`;
  return rows.map(toSubscription);
}

export async function getSubscriptionByEmail(email: string): Promise<Subscription | undefined> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM subscriptions WHERE email = ${email} ORDER BY updated_at DESC LIMIT 1`;
  return rows[0] ? toSubscription(rows[0]) : undefined;
}

// --- Support requests (client "need help?" messages from their report page) ---
export type SupportRequest = {
  id: string;
  leadId: string;
  message: string;
  resolved: boolean;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSupportRequest(row: any): SupportRequest {
  return {
    id: row.id,
    leadId: row.lead_id,
    message: row.message,
    resolved: row.resolved,
    response: row.response ?? null,
    respondedAt: row.responded_at ?? null,
    createdAt: row.created_at,
  };
}

export async function createSupportRequest(leadId: string, message: string): Promise<SupportRequest> {
  const sql = getSql();
  await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await sql`
    INSERT INTO support_requests (id, lead_id, message, resolved, created_at)
    VALUES (${id}, ${leadId}, ${message}, FALSE, ${createdAt})
  `;
  return { id, leadId, message, resolved: false, response: null, respondedAt: null, createdAt };
}

// Manix's in-app reply — the client will see this on their own report page
// next time they check it, no email needed either way.
export async function respondToSupportRequest(id: string, response: string): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`
    UPDATE support_requests
    SET response = ${response}, responded_at = ${new Date().toISOString()}, resolved = TRUE
    WHERE id = ${id}
  `;
}

export async function listSupportRequestsByLead(leadId: string): Promise<SupportRequest[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM support_requests WHERE lead_id = ${leadId} ORDER BY created_at DESC`;
  return rows.map(toSupportRequest);
}

export async function listAllSupportRequests(): Promise<SupportRequest[]> {
  const sql = getSql();
  await ensureSchema();
  const rows = await sql`SELECT * FROM support_requests ORDER BY created_at DESC`;
  return rows.map(toSupportRequest);
}

export async function resolveSupportRequest(id: string): Promise<void> {
  const sql = getSql();
  await ensureSchema();
  await sql`UPDATE support_requests SET resolved = TRUE WHERE id = ${id}`;
}
