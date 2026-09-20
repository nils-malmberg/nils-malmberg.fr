#!/usr/bin/env sh
#
# Génère le PDF du cours à partir de project7-complet.html.
#
#     ./scripts/build-pdf.sh
#
# Aucune dépendance à installer : le script pilote le Chrome déjà présent sur
# la machine. Le fichier produit est celui que sert le bouton de téléchargement
# de project7.html ; il n'est pas versionné (voir .gitignore), il faut donc le
# régénérer puis le téléverser avec le reste du site après chaque modification
# du cours.
#
# Sous Windows, le lancer depuis Git Bash (livré avec Git pour Windows) ;
# cmd.exe et PowerShell ne savent pas exécuter un script shell.
#
# Pour imposer un autre navigateur :  CHROME=/chemin/vers/chrome ./scripts/build-pdf.sh

set -eu

# Git Bash réécrit les chemins POSIX en chemins Windows dans les arguments des
# programmes natifs, ce qui abîmerait l'URL file:// passée au navigateur.
# Ces deux variables le désactivent ; ailleurs elles sont simplement ignorées.
MSYS_NO_PATHCONV=1
MSYS2_ARG_CONV_EXCL='*'
export MSYS_NO_PATHCONV MSYS2_ARG_CONV_EXCL

cd "$(dirname "$0")/.."

# Chemin absolu dans la forme que le navigateur comprend. Sous Git Bash, pwd
# renvoie /c/Users/... que chrome.exe ne sait pas lire ; pwd -W donne C:/Users/…
# Ailleurs, pwd -W n'existe pas et l'on retombe sur pwd.
RACINE=$(pwd -W 2>/dev/null || pwd)

SOURCE="project7-complet.html"
SORTIE="media/projets/project7/cours-data-science-ml.pdf"

# Renvoie le chemin du navigateur, ou une chaîne vide. Ne échoue jamais :
# sous « set -e », un statut non nul ferait sortir le script en silence.
trouver_navigateur() {
  if [ -n "${CHROME:-}" ]; then printf '%s' "$CHROME"; return 0; fi
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
    "${LOCALAPPDATA:-}/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
    "/c/Program Files/Microsoft/Edge/Application/msedge.exe"
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

# MathJax est chargé depuis un CDN au moment du rendu : sans lui, les formules
# sortiraient en LaTeX brut. On prévient, sans bloquer : ce test dit seulement
# si CURL joint le CDN, alors que c'est le NAVIGATEUR qui le chargera — et il a
# ses propres réglages de proxy et son propre magasin de certificats. Sous
# Windows en particulier, Chrome y accède couramment quand curl échoue.
MATHJAX="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
if [ -z "${BUILD_PDF_SANS_TEST_RESEAU:-}" ] && command -v curl >/dev/null 2>&1; then
  if ! curl -sfIL --max-time 15 -o /dev/null "$MATHJAX"; then
    echo "build-pdf : curl ne joint pas le CDN MathJax." >&2
    echo "            Si votre navigateur y accède, la génération sera correcte." >&2
    echo "            Sinon les formules sortiront en LaTeX brut : ouvrez le PDF" >&2
    echo "            et vérifiez qu'une formule s'affiche, au module 8 par exemple." >&2
    echo "            (BUILD_PDF_SANS_TEST_RESEAU=1 pour passer ce test.)" >&2
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
  --print-to-pdf="$RACINE/$SORTIE.tmp" \
  "file://$RACINE/$SOURCE" >/dev/null 2>&1 || true
# ^ sous « set -e », un code de retour non nul sortirait d'ici sans passer par
#   la vérification ci-dessous ni par le nettoyage — et Chrome renvoie parfois
#   un code non nul alors que le PDF a bien été produit. C'est donc le fichier
#   obtenu, et lui seul, qui décide de la réussite.

# on ne remplace le PDF en place qu'une fois la génération réussie : une
# interruption ou un échec laisse intact celui qui était déjà là
if [ ! -s "$SORTIE.tmp" ]; then
  rm -f "$SORTIE.tmp"
  echo "build-pdf : la génération a échoué, le PDF existant est conservé." >&2
  exit 1
fi
mv -f "$SORTIE.tmp" "$SORTIE"
echo "build-pdf : $SORTIE ($(du -h "$SORTIE" | cut -f1))"
echo "build-pdf : fichier non versionné — pensez à le téléverser avec le site,"
echo "            c'est lui que sert le bouton de téléchargement de project7.html."
