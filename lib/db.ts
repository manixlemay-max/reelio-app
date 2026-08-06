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
    })();
  }
  return schemaReady;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(row: any): Product {
  return { id: row.id, name: row.name, description: row.description, imageUrl: row.image_url, createdAt: row.created_at };
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
export async function createProduct(input: { name: string; description: string; imageUrl?: string }): Promise<Product> {
  const sql = getSql();
  await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  await sql`
    INSERT INTO products (id, name, description, image_url, created_at)
    VALUES (${id}, ${input.name}, ${input.description}, ${input.imageUrl ?? null}, ${createdAt})
  `;
  return { id, name: input.name, description: input.description, imageUrl: input.imageUrl ?? null, createdAt };
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
