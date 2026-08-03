import Link from "next/link";
import { TIERS } from "@/lib/pricing";

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
        <p className="text-sm font-medium text-emerald-400 mb-4">
          Pour les marques e-commerce
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
          Des vidéos UGC générées par IA,
          <br /> publiées et analysées pour vous.
        </h1>
        <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10">
          Envoyez vos produits. Reelio génère les vidéos, les publie automatiquement
          sur TikTok et Instagram au meilleur moment, puis analyse la performance
          face à vos concurrents — chaque semaine, sans effort.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-emerald-500 text-neutral-950 px-6 py-3 font-medium hover:bg-emerald-400 transition"
          >
            Essayer le tableau de bord
          </Link>
          <Link
            href="/tarifs"
            className="rounded-full border border-neutral-700 px-6 py-3 font-medium hover:border-neutral-500 transition"
          >
            Voir les tarifs
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 grid sm:grid-cols-3 gap-6">
        {[
          {
            title: "1. Génération",
            body: "Ajoutez un produit, Reelio génère une vidéo style UGC prête à publier via un fournisseur IA.",
          },
          {
            title: "2. Publication",
            body: "Planification automatique sur TikTok et Instagram, avec les hashtags et l'heure optimale.",
          },
          {
            title: "3. Analyse",
            body: "Vues, engagement et comparaison à vos concurrents pour affiner la prochaine vidéo.",
          },
        ].map((step) => (
          <div key={step.title} className="rounded-2xl border border-neutral-800 p-6">
            <h3 className="font-medium mb-2">{step.title}</h3>
            <p className="text-sm text-neutral-400">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10">Tarifs</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div key={tier.id} className="rounded-2xl border border-neutral-800 p-6 flex flex-col">
              <h3 className="font-medium mb-1">{tier.name}</h3>
              <p className="text-3xl font-semibold mb-4">
                {tier.priceEur}€<span className="text-sm text-neutral-500 font-normal">/mois</span>
              </p>
              <ul className="text-sm text-neutral-400 space-y-2 flex-1 mb-6">
                <li>{tier.networksAllowed} réseau(x) connecté(s)</li>
                <li>{tier.videosPerMonth} vidéos / mois</li>
                <li>{tier.competitorAnalysis ? "Analyse concurrentielle incluse" : "Analyse de performance de base"}</li>
              </ul>
              <Link
                href="/tarifs"
                className="rounded-full border border-neutral-700 px-4 py-2 text-center text-sm hover:border-emerald-400 transition"
              >
                Choisir {tier.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
