# Reelio — starter kit

Squelette fonctionnel pour un abonnement qui génère des vidéos UGC par IA à partir
des produits e-commerce d'un client, les publie automatiquement sur TikTok et
Instagram, puis analyse leur performance.

C'est un **starter, pas un produit fini**. Le but : te donner une base qui tourne
et un endroit clair où brancher chaque service externe, sans que tu aies à partir
de zéro ni à comprendre l'architecture tout seul.

## Ce qui est déjà construit

- Page d'accueil marketing + page tarifs (3 paliers par nombre de réseaux connectés)
- Dashboard : ajouter un produit, générer une vidéo, planifier une publication, voir l'analytique
- Base de données SQLite locale (fichier `data/app.db`, créé automatiquement)
- Abonnement Stripe (checkout + webhook)
- Deux fournisseurs externes abstraits dans `lib/` — ils tournent en **mode démo**
  (données simulées) tant que tu n'as pas encore de clé API, donc tu peux tester
  tout le produit avant même d'avoir un compte payant

## Ce qu'il te reste à faire, dans l'ordre

### 1. Fais tourner le projet en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000 — tout fonctionne déjà en mode démo (vidéo d'exemple,
publication simulée, chiffres d'analytique aléatoires).

### 2. Crée tes comptes externes (aucun ne demande de revue qui prend des semaines)

- **Postiz** (postiz.com) ou **Ayrshare** (ayrshare.com) — connecte directement tes
  comptes TikTok et Instagram, pas de demande d'app à soumettre à Meta/TikTok.
  Récupère ta clé API et colle-la dans `POSTING_PROVIDER_API_KEY` (fichier `.env.local`,
  à créer à partir de `.env.example`).
- **Creatify** (creatify.ai) ou **HeyGen** (heygen.com) — génération vidéo IA.
  Colle la clé dans `VIDEO_PROVIDER_API_KEY`.
- **Stripe** (stripe.com) — crée un compte, active le mode test, crée 3 produits
  récurrents correspondant aux paliers dans `lib/pricing.ts`, colle les IDs de prix
  dans `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_GROWTH` / `STRIPE_PRICE_PRO`, et la
  clé secrète dans `STRIPE_SECRET_KEY`.

Important : la forme exacte des requêtes vers Creatify/HeyGen et Postiz/Ayrshare
dans `lib/videoProvider.ts` et `lib/postingProvider.ts` est une structure générique.
Une fois que tu as un compte, ouvre leur documentation API et ajuste les champs
exacts (nom des paramètres, format de la réponse) — c'est le seul endroit à toucher.

### 3. Teste avec 1 à 3 clients pilotes avant d'automatiser à fond

Ne cherche pas à activer l'analyse concurrentielle ni le multi-comptes tout de
suite. Fais tourner ce starter pour 1-3 marques e-commerce que tu connais,
gratuitement ou à prix réduit, pour valider que le produit livre de la valeur
avant de vendre l'abonnement plus largement.

### 4. Déploie en ligne

Ce projet est fait pour être déployé sur **Vercel** (gratuit pour démarrer) :
connecte le dépôt Git, ajoute les variables de `.env.example` dans les réglages
Vercel, et c'est en ligne. La base SQLite locale ne survit pas aux redéploiements
sur Vercel — une fois que tu as des clients réels, migre vers une base hébergée
(Supabase ou Neon, toutes deux ont un plan gratuit).

### 5. Ajoute une vraie authentification avant d'avoir plusieurs clients

Ce starter est **mono-espace** : un seul tableau de bord, pas de connexion par
client. Dès que tu as plus d'un client payant, ajoute une authentification
(Clerk ou NextAuth sont les plus simples à brancher sur Next.js) pour que chaque
client ne voie que ses propres produits et vidéos.

## Structure du projet

```
app/
  page.tsx                    landing page
  tarifs/page.tsx              page de paiement (Stripe checkout)
  dashboard/                   espace client (produits, vidéos, planification, analytique)
  api/                         routes serveur (génération vidéo, publication, Stripe...)
lib/
  db.ts                        base SQLite (produits, vidéos, posts, analytics)
  videoProvider.ts             connexion au fournisseur de génération vidéo
  postingProvider.ts           connexion au fournisseur de publication + heuristique "meilleur moment"
  stripe.ts                    client Stripe
  pricing.ts                   définition des 3 paliers d'abonnement
```
