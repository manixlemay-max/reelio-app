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
    // Mode démo : aucune clé configurée → on renvoie une vidéo d'exemple
    // pour que le reste du produit (dashboard, planification, analytics) soit testable
    // sans dépendre d'un compte payant pendant le développement.
    return {
      status: "ready",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
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
