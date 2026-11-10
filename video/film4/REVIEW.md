# REVIEW — visite complète du site (commentée par le créateur)

- Vertical 1080×1920 (`film4/`) et ordinateur 1920×1080 (`film4-wide/`, mêmes assets) ; 110,8 s, 30 fps.
- Matière : parcours réels enregistrés sur le site (Playwright + capture CDP à densité 2 : 780×1328 téléphone, 1920×1200 ordinateur), coupés et accélérés à la saisie (ffmpeg), placés dans un téléphone / un ordinateur.
- Boucle complète montrée : envoi du lien (Les Saveurs d'Awa) → validation réelle dans la Régie → la boutique apparaît dans le fil.
- Paiement retiré du montage à la demande (coupe du récap à la confirmation).
- Rythme : cartes de chapitre orange wax (1,6 s), étape en cours en haut, poussées de caméra sur les moments clés ; musique bouclée (fondu enchaîné 3 s) sous un niveau bas pour la voix.

## Son (mesuré, pas écouté)
- Musique −24 LUFS + bruitages −27 LUFS → « musique basse » ≈ −23,7 LUFS, crête −4,9 dBFS.

## Points faibles
- Cartes de chapitre courtes (1,2 s lisibles) : voulu pour le rythme, signalé par `line_unread` sur « Je suis en live ».
- Shorts : un seul short dans la démo, plan court.
- Version ordinateur : pendant la poussée sur la Régie, l'ordinateur frôle le texte de gauche.
