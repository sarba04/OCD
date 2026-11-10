# REVIEW — « OCD Live V2 » (avant / après, voix off)

- Vertical 1080×1920 (`film3/`) et ordinateur 1920×1080 (`film3-wide/`, mêmes assets) ; 60 s, 30 fps.
- Histoire : AVANT (la V1 qui passe au gris) → V2 → 01 Annuaire · 02 Lien TikTok + Régie · 03 Shorts · 04 Carte OCD · 05 Mobile Money → récap → fin.
- Un seul téléphone porteur traverse les chapitres ; les fonds alternent noir / orange wax à chaque chapitre.
- Vrais écrans : V1 capturée depuis le commit d920777 (accueil recadré sous la carte d'Afrique, réservation) ; V2 depuis le site actuel.
- Texte de la voix off et minutage : `TEXTE-VOIX-OFF.md`. Une version « guide » affiche le texte en bas de l'écran pour enregistrer.

## Son (mesuré, pas écouté)
- Rendus sans musique, puis mixage ffmpeg : bruitages −27 LUFS, musique −24 LUFS → « musique basse » ≈ −22,7 LUFS, crête −4,6 dBFS ;
  « sans musique » ≈ −24,4 LUFS. La voix enregistrée doit sortir vers −14/−16 LUFS pour passer devant.

## Points faibles
- Régie (≈ 27–31 s) : texte du tableau petit sur téléphone, compensé par le zoom sur le message vert.
- Chapitre 03 (Shorts) : un seul short disponible dans la démo, le plan est donc court et statique.

## Avertissements gardés
- `nested_structure_needs_subcomposition`, `composition_file_too_large` (scènes dans un seul fichier, voulu pour la reprise rapide en 16:9).
- Téléphone volontairement hors cadre pendant ses sorties (`data-layout-allow-overflow`).
