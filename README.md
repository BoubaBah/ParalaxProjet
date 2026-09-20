# Horizons — Projet fictif d'effet parallaxe

Site vitrine fictif, one-page, construit en HTML/CSS/JS pur pour démontrer un
**effet parallaxe multi-couches** inspiré d'un showcase Wix Studio (voir la
vidéo de référence fournie) : premier plan rapide, plan intermédiaire moyen,
arrière-plan lent.

## Aperçu

- `index.html` — 6 sections : hero (lac au crépuscule), citation plein écran,
  ville la nuit, bloc statistiques, route au coucher de soleil (avec légende
  de vitesses inspirée de la vidéo), outro.
- `css/style.css` — mise en page, ambiance visuelle par section, animations.
- `js/main.js` — moteur parallaxe (translateY par couche selon `data-speed`),
  barre de progression, reveals au scroll, compteurs animés, particules
  flottantes.
- `assets/img/` — images fournies par l'utilisateur (lac, ville, route).

## Principe du parallaxe

Chaque élément portant un attribut `data-speed="X"` se déplace verticalement
en fonction de sa position par rapport au centre du viewport, multipliée par
`(1 - X)` :

- `data-speed="0.15–0.25"` → arrière-plan (bouge très peu, semble lointain)
- `data-speed="0.45–0.6"` → plan intermédiaire / texte
- `data-speed="0.75–1.1"` → premier plan (bouge plus vite, semble proche)

Le calcul se fait dans `requestAnimationFrame` pour rester fluide, et
`prefers-reduced-motion` désactive l'effet pour les utilisateurs qui le
demandent.

## Lancer le site en local

Aucune dépendance, aucun build. Il suffit de servir le dossier :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Personnaliser

- Remplacer les images dans `assets/img/` (mêmes noms de fichiers) pour
  changer les ambiances.
- Ajuster les valeurs `data-speed` dans `index.html` pour accentuer ou
  adoucir l'effet.
- Les couleurs et polices sont centralisées dans `:root` en haut de
  `css/style.css`.
