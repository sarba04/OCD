# REVIEW — « OCD Live, nouvelle version » (voix off)

- Vertical 1080×1920 (`film3/`) et ordinateur 1920×1080 (`film3-wide/`, mêmes assets) ; 50,4 s, 30 fps, scènes calées sur les mesures (100 BPM).
- Présentation générale du site, accent sur la demande de Boovan : 01 Nouveau design · 02 Lives par pays · 03 Lien TikTok (+ abonnement) · 04 Validation par l'équipe · 05 Shorts · 06 Studio (Carte OCD) → récap → fin.
- Paiement et reçu retirés à la demande. Pas d'avant/après.
- Un téléphone porteur traverse les chapitres ; fonds noir / orange wax en alternance ; vrais écrans du site.
- Voix off : `TEXTE-VOIX-OFF.md` ; version guide = texte affiché en bas (classe `guide` sur #root).

## Son (mesuré, pas écouté)
- Rendu sans musique, puis mixage ffmpeg : bruitages −27 LUFS, musique −24 LUFS → « musique basse » ≈ −23,3 LUFS, crête −4,9 dBFS ; « sans musique » ≈ −27 LUFS.

## Points faibles
- Régie (≈ 27–31 s) : tableau petit sur téléphone, compensé par le zoom sur le message vert.
- Shorts : un seul short dans la démo, plan court et statique.

## Avertissements gardés
- `nested_structure_needs_subcomposition`, `composition_file_too_large` : scènes dans un seul fichier, voulu pour décliner vite en 16:9.
