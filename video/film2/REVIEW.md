# REVIEW — « Le soir de Mama Rose » (film v2)

Deux montages, même histoire, mêmes assets :
- `film2/` — vertical 1080×1920 (TikTok, Reels, statut WhatsApp)
- `film2-wide/` — 1920×1080 (ordinateur, présentation, YouTube)

Durée 46,8 s · 30 fps · H.264 yuv420p · AAC 48 kHz.

## Choix créatifs
- Storyline A : une vendeuse (Mama Rose, Douala, 18h) traverse tout le parcours — inscription, validation Régie, diffusion, studio, paiement.
- Charte OCD uniquement : orange #f16903, noir #111111, blanc ; motif wax ; Archivo large (125 %).
- Vrais écrans du site, pas de maquettes dessinées.
- Musique afro 100 BPM ; coupes calées sur les temps ; sons sur les actions visibles (tap, whoosh, pop, ping, impact).

## Mesuré (pas écouté)
- Loudness finale : I −15,7 LUFS, crête −1,5 dBFS (loudnorm + alimiter), pour les deux versions.
- Le mix a été vérifié par mesure, pas à l'oreille : à écouter une fois au casque avant publication.

## Point le plus faible
- Scène Régie (19,2–24 s) : le texte du tableau reste petit, surtout en vertical. Le zoom 1,5 puis le toast à 2,4 compensent, mais la lecture détaillée n'est pas possible sur téléphone.

## Avertissements gardés
- `hyperframes check` : lint `nested_structure` et quelques chevauchements de layout voulus (téléphone + ordinateur en s6, cartes du studio). Aucun erreur.
