# OCD Live

**Passe en live. Place ton produit.**

Le site de réservation d'OCD Live : un vendeur choisit son live **au studio à Lomé** ou **à distance** (Afrique et diaspora), son jour de décembre, son heure et son pack, puis présente son business. L'équipe OCD reçoit la fiche à la seconde, et le vendeur repart avec son **Pass Live** et une **affiche prête à partager** pour faire venir ses clients.

> Le marketing avant la vente : le site ne vend pas un créneau, il vend de la visibilité. Tout le parcours est pensé pour capter ce qui passera à l'écran : le produit, le numéro WhatsApp, l'adresse.

---

## Le concept : « Le Lien »

Le logo OCD est un lien : le O et le C forment un **∞**, le C et le D s'emboîtent comme deux **maillons coupés à 45°**. Le studio, c'est une **carte d'Afrique rétroéclairée** avec les lettres orange et « Live » en noir.

Le site reprend ces trois signatures, sans rien ajouter de générique :

| Signature | Dans le site |
|---|---|
| La coupe à 45° du logo | Coins des cartes, boutons, billets et bandeaux |
| Le rétroéclairage du mur | Halo chaud sur l'élément choisi, carte d'Afrique lumineuse |
| Les maillons C-D | Barre de progression en chaîne qui s'emboîte à chaque étape |

Couleurs mesurées sur le logo : orange `#F16903`, noir chaud `#16120E`, papier `#FBF8F3`. Police : Bricolage Grotesque (une seule, 41 Ko).

## Le parcours (4 étapes, 2 minutes)

1. **Ta scène** : l'accueil ne pose qu'une question, *au studio ou à distance ?* Les deux choix sont visibles sans défiler, même sur un petit téléphone.
2. **Ton jour et ton heure** : tout décembre. Sous chaque jour, 7 petits traits montrent les créneaux déjà pris. Les créneaux du soir sont marqués *Prime time*. À distance, l'heure est affichée **chez le vendeur** (Douala, Paris…) et à Lomé.
3. **Ton pack** : 6 packs avec le prix à l'heure. Un pack qui ne tient pas dans le créneau est grisé avec la raison (« Un live de 4 h doit commencer au plus tard à 18:00 »).
4. **Ton business** : nom, catégorie, phrase de présentation, photo, numéro WhatsApp, adresse. Un **aperçu en direct** montre le bandeau tel que les clients le verront pendant le live.
5. **Vérifie et confirme** : le Pass Live, le moyen de paiement (Flooz, Mixx by Yas, espèces au studio, ou « l'équipe me contacte »).

Après confirmation :
- **Pass Live** numéroté avec QR code (la régie le scanne à l'arrivée et ouvre directement la fiche).
- **Affiche 1080×1920** générée dans le téléphone, aux couleurs du studio, avec l'heure locale du vendeur et son WhatsApp. Un bouton la partage directement en statut WhatsApp / TikTok.
- **Ajout à l'agenda** (.ics avec rappels la veille et 2 h avant), message WhatsApp pré-rempli à l'équipe, liste « Prépare ton live ».

## La Régie (`/regie`)

L'espace de l'équipe OCD, en mode sombre (salle de contrôle) :

- **Chiffres** : réservations, encaissé, à encaisser, taux de remplissage de décembre.
- **Prochain live** en tête de page.
- **Planning** : frise 8h–22h, un jour par ligne (agenda sur mobile).
- **Fiches** : recherche, filtres, fiche complète du vendeur (photo, présentation, numéro affiché, adresse, contact WhatsApp / appel), changement de statut (*payé, confirmé, live fait, absent, annulé*).
- **Bandeau du live** : un lien à coller dans OBS ou TikTok LIVE Studio qui affiche le nom, le produit, le numéro et l'adresse du vendeur pendant son live.
- **Export Excel** de toutes les réservations.
- **Candidatures animatrices** (formulaire public sur `/animatrice`).

À chaque réservation, l'équipe reçoit une notification rédigée comme une phrase :

> 🔴 Afi Mensah (Afi Wax Couture, pagnes & wax) a réservé le mardi 8 décembre de 10h00 à 11h30 et viendra au studio à Lomé.

## Les 6 packs

Les prix sont des propositions, modifiables dans `src/lib/config.ts`.

| Pack | Contenu | Prix |
|---|---|---|
| Essentiel | 1 live de 1h30 | ~~20 000 F~~ **15 000 F** (lancement) |
| Marathon | 1 live de 4 h | 35 000 F |
| Vitrine | 1h30 + teaser vidéo tourné et publié avant le live | 30 000 F |
| Série | 3 lives de 1h30, 3 jours de suite | 50 000 F |
| Spotlight Boovan | Boovan publie ta vidéo, annonce ton live, puis live 1h30 | 75 000 F |
| Mois OCD | 4 lives (1 par semaine) + 1 annonce + priorité le soir | 120 000 F |

---

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000. Sans base de données, le site tourne en **mode démo** : le planning est pré-rempli avec des réservations fictives et la Régie s'ouvre avec le mot de passe `regie2026`.

## Mettre en ligne (environ 10 minutes)

1. **Base de données** : crée un projet gratuit sur [supabase.com](https://supabase.com), puis copie *Project Settings → Database → Connection string → Transaction pooler* (port 6543). Les tables se créent toutes seules au premier appel.
2. **Hébergement** : sur [vercel.com](https://vercel.com), *Add New → Project*, importe ce dépôt GitHub.
3. **Variables** (Vercel → Settings → Environment Variables), voir `.env.example` :
   - `DATABASE_URL` : la chaîne Supabase
   - `ADMIN_PASSWORD` : le mot de passe de la Régie
   - `NEXT_PUBLIC_OCD_WHATSAPP`, `NEXT_PUBLIC_PAY_FLOOZ`, `NEXT_PUBLIC_PAY_MIXX`, `NEXT_PUBLIC_STUDIO_ADDRESS`
4. **Notifications Telegram** (gratuites, instantanées sur le téléphone) :
   - Dans Telegram, écris à **@BotFather** → `/newbot` → copie le jeton dans `TELEGRAM_BOT_TOKEN`.
   - Envoie un message à ton bot, puis ouvre `https://api.telegram.org/bot<JETON>/getUpdates` : le nombre après `"chat":{"id":` va dans `TELEGRAM_CHAT_ID`. Pour un groupe d'équipe, ajoute le bot au groupe et prends l'id du groupe.
5. **E-mail** (optionnel) : clé [Resend](https://resend.com) dans `RESEND_API_KEY`, destinataire dans `NOTIFY_EMAIL_TO`.
6. Redéploie. C'est en ligne.

## Personnaliser

Tout est dans `src/lib/config.ts` :
- `PACKS` : noms, prix, contenu, délais de réservation ;
- `SCHEDULE` : période ouverte, heures de début, durée, temps d'installation, jours fermés ;
- `CATEGORIES`, `FORBIDDEN`, `PAYMENT_METHODS`.

## Sous le capot

- **Next.js 16 + React 19 + Tailwind 4**, TypeScript. L'accueil est une page statique : il s'affiche avant même que le JavaScript arrive, même en 3G et dans le navigateur intégré de TikTok.
- **Zéro double réservation** : contrainte d'exclusion Postgres sur les plages horaires (live + 30 min d'installation) et verrou de transaction. Testé avec 10 réservations simultanées sur le même créneau : 1 acceptée, 9 refusées avec les créneaux libres les plus proches proposés.
- **Le prix et les créneaux sont recalculés côté serveur** (jamais ceux envoyés par le navigateur), validation des champs, pot de miel anti-robots, limite de tentatives.
- **Fuseaux horaires** : Lomé = GMT toute l'année ; l'heure locale du vendeur est calculée avec l'API `Intl` (heure d'hiver/été comprise pour la diaspora).
- **Accessibilité** : contrastes vérifiés (AA), focus visible, navigation au clavier, bouton retour du téléphone = étape précédente, mouvements réduits respectés.
- **Photo produit** compressée dans le téléphone (≈100 Ko) avant l'envoi.
- **Audit d'accessibilité** (axe-core, WCAG 2.1 AA) sur les 11 écrans du parcours et de la Régie : 0 violation. Navigation au clavier, focus visible, résumé d'erreurs, fermeture des fiches avec Échap, affichage sans débordement à 320 px (zoom 200 %).
- **Référencement Google** : données structurées schema.org (studio à Lomé, packs et prix en F CFA), `sitemap.xml`, `robots.txt` (Régie exclue), image d'aperçu pour WhatsApp et les réseaux.

## Skills Claude inclus

Le dossier `.claude/skills/` contient les skills officiels d'Anthropic utilisés pour ce projet (licence Apache 2.0) : `frontend-design`, `design-critique`, `ux-copy` et `accessibility-review`. Ils se chargent automatiquement dans les prochaines sessions Claude Code sur ce dépôt.

## Prochaines étapes possibles

- Paiement en ligne Flooz / Mixx by Yas / carte via **FedaPay** ou **CinetPay** (nécessite un compte marchand).
- Rappels automatiques J-1 et H-2 par **WhatsApp Cloud API**.
- Ouverture de janvier et des mois suivants (une ligne dans `SCHEDULE`).
- Version anglaise pour la diaspora anglophone.
