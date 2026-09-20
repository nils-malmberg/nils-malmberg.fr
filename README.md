# nils-malmberg.fr

Site personnel statique : du HTML, du CSS et un fichier JavaScript, sans étape
de construction ni dépendance. Les pages sont à la racine, les ressources dans
`media/`.

Chaque page contient ses deux versions de langue dans deux blocs
`#<page>-content-fr` et `#<page>-content-en` ; `script.js` affiche l'un ou
l'autre selon le sélecteur de langue, et gère aussi le thème clair/sombre.

## Prévisualiser en local

Ouvrir un fichier directement suffit pour la plupart des pages, mais
`keywords.json` est chargé par `fetch`, ce qui échoue sur `file://`. Mieux vaut
servir le dossier :

```sh
python3 -m http.server 8000
# puis http://localhost:8000
```

## Générer le PDF du cours

Le cours de data science (`project7*.html`) est téléchargeable en PDF depuis sa
page d'accueil. Ce PDF **n'est pas versionné** : il pèse près de 5 Mo et serait
réécrit à chaque modification du cours. Il se régénère en local :

```sh
./scripts/build-pdf.sh
```

Le script pilote le Chrome (ou Chromium, ou Edge) déjà installé en mode
headless, et écrit `media/projets/project7/cours-data-science-ml.pdf`, soit
environ 460 pages. Il n'y a rien à installer.

Quelques précisions :

- **La source est `project7-complet.html`**, la page qui réunit les 28 modules
  et les trois annexes. La mise en page vient du bloc `@media print` de
  `style.css` : marges, saut de page avant chaque module, thème clair forcé,
  blocs de code et encadrés insécables.
- **Une connexion est nécessaire.** MathJax est chargé depuis un CDN au moment
  du rendu ; sans lui, les formules sortiraient en LaTeX brut. Le script
  vérifie que le CDN répond et s'arrête sinon, en laissant le PDF existant
  intact.
- **Pour un autre navigateur :** `CHROME=/chemin/vers/chrome ./scripts/build-pdf.sh`.
- **Après génération**, téléverser le PDF avec le reste du site : comme il est
  dans `.gitignore`, il ne part pas avec le dépôt, et le bouton de
  téléchargement renverrait une erreur 404 sans lui.
