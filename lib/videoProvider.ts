// Abstraction autour du fournisseur de génération vidéo IA (Creatify, HeyGen, etc.)
//
// IMPORTANT: le corps de la requête/réponse ci-dessous est une structure GÉNÉRIQUE,
// pas une copie exacte de l'API de Creatify ou HeyGen — vérifie et adapte les champs
// exacts (endpoint, auth, format de payload) à la documentation officielle du
// fournisseur au moment où tu obtiens ta clé API. C'est le seul endroit du code à
// modifier pour brancher un vrai fournisseur.

type GenerateVideoInput = {
  productName: string;
  productDescription: string;
  imageUrl?: string | null;
};

type GenerateVideoResult = {
  status: "ready" | "pending" | "failed";
  videoUrl: string | null;
  provider: string;
};

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult> {
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;
  const apiUrl = process.env.VIDEO_PROVIDER_API_URL; // ex: https://api.creatify.ai/api/v1/videos

  if (!apiKey || !apiUrl) {
    // Demo mode: no key configured yet -> return a sample video hosted on this
    // same app (public/demo-video.mp4) so the rest of the product (dashboard,
    // scheduling, analytics, and the real Postiz posting flow) can be tested
    // without a paid provider AND without depending on a third-party host that
    // might block server-to-server fetches (some hosts return 403 to fetches
    // without a browser-like origin).
    // Prefer an explicitly configured public URL, then Vercel's stable
    // production domain, then the per-deployment URL, then localhost.
    // (The per-deployment VERCEL_URL can be behind Vercel's deployment
    // protection even when the main domain isn't, which would block our
    // own server from fetching its own file.)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";
    return {
      status: "ready",
      videoUrl: `${appUrl}/demo-video.mp4`,
      provider: "mock",
    };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      product_name: input.productName,
      product_description: input.productDescription,
      image_url: input.imageUrl ?? undefined,
      style: "ugc",
    }),
  });

  if (!response.ok) {
    return { status: "failed", videoUrl: null, provider: "live" };
  }

  const data = await response.json();
  // Adapte ce mapping à la vraie forme de réponse du fournisseur choisi.
  return {
    status: data.status === "completed" ? "ready" : "pending",
    videoUrl: data.video_url ?? null,
    provider: "live",
  };
}
