// Generates a product-tailored caption/hashtag suggestion — no LLM call,
// just keyword extraction + a curated mix of niche + high-reach hashtags,
// which is the standard "specific + broad" hashtag strategy that actually
// performs on TikTok/Instagram (a handful of proven generic ones alongside
// hashtags nobody else outside your niche is using).

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "this", "that", "your", "you",
  "our", "we", "is", "are", "it", "to", "of", "in", "on", "at", "by", "as",
  "from", "be", "will", "can", "has", "have", "product", "products", "item",
  "items", "just", "also", "very", "more", "most", "than", "then", "into",
  "about", "their", "them", "they", "its", "get", "gets", "make", "makes",
]);

const HOOK_TEMPLATES = [
  (name: string) => `Why everyone is talking about ${name} right now`,
  (name: string) => `POV: you finally tried ${name}`,
  (name: string) => `${name} is the upgrade you didn't know you needed`,
  (name: string) => `I wasn't expecting ${name} to be this good`,
  (name: string) => `Okay but ${name} actually delivers`,
  (name: string) => `${name} — the honest review nobody asked for`,
];

const GENERIC_HASHTAGS = ["#tiktokmademebuyit", "#musthave", "#smallbusiness", "#ugccreator", "#shopsmall", "#viralproduct", "#fyp"];

function extractKeywords(text: string, max: number): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (raw.length < 4 || STOPWORDS.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, max)
    .map(([word]) => `#${word}`);
}

export function buildSmartCaption(productName: string, productDescription: string): string {
  const hook = HOOK_TEMPLATES[Math.floor(Math.random() * HOOK_TEMPLATES.length)](productName);
  const niche = extractKeywords(`${productName} ${productDescription}`, 4);
  const brand = `#${productName.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
  const generic = GENERIC_HASHTAGS.sort(() => Math.random() - 0.5).slice(0, 4);
  const hashtags = Array.from(new Set([brand, ...niche, ...generic])).join(" ");
  return `${hook}\n\n${hashtags}`.slice(0, 500);
}
