#!/usr/bin/env sh
#
# Génère le PDF du cours à partir de project7-complet.html.
#
#     ./scripts/build-pdf.sh
#
# Aucune dépendance à installer : le script pilote le Chrome déjà présent sur
# la machine. Il est lancé automatiquement par .githooks/pre-commit dès que la
# page source ou la feuille de style changent, et le fichier produit est celui
# que sert le bouton de téléchargement de project7.html.
#
# Pour imposer un autre navigateur :  CHROME=/chemin/vers/chrome ./scripts/build-pdf.sh

set -eu

cd "$(dirname "$0")/.."

SOURCE="project7-complet.html"
SORTIE="media/projets/project7/cours-data-science-ml.pdf"

# Renvoie le chemin du navigateur, ou une chaîne vide. Ne échoue jamais :
# sous « set -e », un statut non nul ferait sortir le script en silence.
trouver_navigateur() {
  if [ -n "${CHROME:-}" ]; then printf '%s' "$CHROME"; return 0; fi
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  do
    if [ -x "$c" ]; then printf '%s' "$c"; return 0; fi
  done
  for c in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge brave-browser; do
    chemin=$(command -v "$c" 2>/dev/null) || chemin=""
    if [ -n "$chemin" ]; then printf '%s' "$chemin"; return 0; fi
  done
  return 0
}

NAVIGATEUR=$(trouver_navigateur)
if [ -z "$NAVIGATEUR" ]; then
  echo "build-pdf : aucun Chrome, Chromium ou Edge trouvé." >&2
  echo "            installez-en un, ou indiquez son chemin :" >&2
  echo "            CHROME=/chemin/vers/chrome $0" >&2
  exit 1
fi

[ -f "$SOURCE" ] || { echo "build-pdf : $SOURCE est introuvable." >&2; exit 1; }

# MathJax est chargé depuis un CDN au moment du rendu. Sans réseau, les
# formules sortiraient en LaTeX brut : mieux vaut s'arrêter et conserver le
# PDF existant que le remplacer par une version abîmée.
MATHJAX="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
if command -v curl >/dev/null 2>&1; then
  if ! curl -sf --max-time 5 -r 0-0 -o /dev/null "$MATHJAX"; then
    echo "build-pdf : $MATHJAX est injoignable." >&2
    echo "            sans lui les formules sortiraient en LaTeX brut ;" >&2
    echo "            le PDF existant est conservé tel quel." >&2
    exit 1
  fi
fi

# le bac à sable de Chrome ne fonctionne pas sous root (conteneurs, CI)
SUPPLEMENT=""
if [ "$(id -u)" = "0" ]; then SUPPLEMENT="--no-sandbox"; fi

mkdir -p "$(dirname "$SORTIE")"
echo "build-pdf : génération depuis $SOURCE…"

# --virtual-time-budget laisse à MathJax le temps de composer les formules et
# aux polices d'arriver ; sans lui, les formules sortiraient en LaTeX brut.
# La mise en page vient entièrement du bloc @media print de style.css.
# shellcheck disable=SC2086
"$NAVIGATEUR" \
  --headless \
  --disable-gpu \
  --no-pdf-header-footer \
  --virtual-time-budget=60000 \
  $SUPPLEMENT \
  --print-to-pdf="$SORTIE" \
  "file://$(pwd)/$SOURCE" >/dev/null 2>&1

[ -s "$SORTIE" ] || { echo "build-pdf : la génération a échoué." >&2; exit 1; }
echo "build-pdf : $SORTIE ($(du -h "$SORTIE" | cut -f1))"
