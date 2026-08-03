import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import type { Product, Video, Post, AnalyticsRow, Platform } from "./types";

const dataDir = process.env.VERCEL ? "/tmp/data" : path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "app.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    imageUrl TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    videoUrl TEXT,
    status TEXT NOT NULL,
    provider TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    videoId TEXT NOT NULL,
    platform TEXT NOT NULL,
    hashtags TEXT NOT NULL,
    scheduledAt TEXT NOT NULL,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    postId TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    likes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    shares INTEGER NOT NULL DEFAULT 0,
    capturedAt TEXT NOT NULL
  );
`);

// --- Products ---
export function createProduct(input: { name: string; description: string; imageUrl?: string }): Product {
  const product: Product = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl ?? null,
    createdAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO products (id, name, description, imageUrl, createdAt) VALUES (@id, @name, @description, @imageUrl, @createdAt)`
  ).run(product);
  return product;
}

export function listProducts(): Product[] {
  return db.prepare(`SELECT * FROM products ORDER BY createdAt DESC`).all() as Product[];
}

export function getProduct(id: string): Product | undefined {
  return db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as Product | undefined;
}

// --- Videos ---
export function createVideo(input: { productId: string; provider: string; status: Video["status"]; videoUrl?: string | null }): Video {
  const video: Video = {
    id: randomUUID(),
    productId: input.productId,
    videoUrl: input.videoUrl ?? null,
    status: input.status,
    provider: input.provider,
    createdAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO videos (id, productId, videoUrl, status, provider, createdAt) VALUES (@id, @productId, @videoUrl, @status, @provider, @createdAt)`
  ).run(video);
  return video;
}

export function listVideos(): (Video & { productName: string })[] {
  return db
    .prepare(
      `SELECT videos.*, products.name as productName FROM videos JOIN products ON products.id = videos.productId ORDER BY videos.createdAt DESC`
    )
    .all() as (Video & { productName: string })[];
}

export function getVideo(id: string): Video | undefined {
  return db.prepare(`SELECT * FROM videos WHERE id = ?`).get(id) as Video | undefined;
}

// --- Posts ---
export function createPost(input: { videoId: string; platform: Platform; hashtags: string; scheduledAt: string; status: Post["status"] }): Post {
  const post: Post = {
    id: randomUUID(),
    videoId: input.videoId,
    platform: input.platform,
    hashtags: input.hashtags,
    scheduledAt: input.scheduledAt,
    status: input.status,
    createdAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO posts (id, videoId, platform, hashtags, scheduledAt, status, createdAt) VALUES (@id, @videoId, @platform, @hashtags, @scheduledAt, @status, @createdAt)`
  ).run(post);
  return post;
}

export function listPosts(): (Post & { videoUrl: string | null; productName: string })[] {
  return db
    .prepare(
      `SELECT posts.*, videos.videoUrl as videoUrl, products.name as productName
       FROM posts
       JOIN videos ON videos.id = posts.videoId
       JOIN products ON products.id = videos.productId
       ORDER BY posts.scheduledAt DESC`
    )
    .all() as (Post & { videoUrl: string | null; productName: string })[];
}

// --- Analytics ---
export function recordAnalytics(input: { postId: string; views: number; likes: number; comments: number; shares: number }): AnalyticsRow {
  const row: AnalyticsRow = {
    id: randomUUID(),
    postId: input.postId,
    views: input.views,
    likes: input.likes,
    comments: input.comments,
    shares: input.shares,
    capturedAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO analytics (id, postId, views, likes, comments, shares, capturedAt) VALUES (@id, @postId, @views, @likes, @comments, @shares, @capturedAt)`
  ).run(row);
  return row;
}

export function listAnalytics(): (AnalyticsRow & { platform: Platform; productName: string })[] {
  return db
    .prepare(
      `SELECT analytics.*, posts.platform as platform, products.name as productName
       FROM analytics
       JOIN posts ON posts.id = analytics.postId
       JOIN videos ON videos.id = posts.videoId
       JOIN products ON products.id = videos.productId
       ORDER BY analytics.capturedAt DESC`
    )
    .all() as (AnalyticsRow & { platform: Platform; productName: string })[];
}

export default db;
