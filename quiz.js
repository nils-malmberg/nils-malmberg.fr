// ── Quiz des modules du cours ──────────────────────────────────────────────
// Chaque page de module déclare sa banque de questions dans window.QUIZ, puis
// ce moteur en tire cinq au hasard. Les questions déjà vues sont mémorisées
// dans le navigateur, pour que « recommencer » serve d'abord les autres.
(function () {
  const PAR_SERIE = 5;

  // Les styles vivent ici, avec le code qui produit le balisage, plutôt que
  // dans style.css : les deux ne peuvent alors jamais se désynchroniser — une
  // feuille de styles périmée en cache laissait sinon le quiz sans encadré ni
  // couleurs. Chaque variable a une valeur de repli, pour que le quiz reste
  // lisible même sans la feuille du site.
  const STYLES = `
.bloc-quiz { margin-top: var(--space-12, 3rem); }
.quiz {
  max-width: 800px;
  padding: var(--space-6, 1.5rem);
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #c4c9d2);
  border-radius: var(--radius-lg, 0.75rem);
  color: var(--color-text, #1a1d24);
  font-size: 1rem;
  line-height: 1.6;
  text-align: left;
}
.quiz * { box-sizing: border-box; }
.quiz h2 {
  margin: 0 0 var(--space-2, 0.5rem);
  font-family: var(--font-display, sans-serif);
  font-size: 1.5rem; font-weight: 700; line-height: 1.2;
  color: var(--color-text, #1a1d24);
}
.quiz p { margin: 0; text-align: left; max-width: none; hyphens: none; }
.quiz-accueil p {
  margin-top: var(--space-3, 0.75rem);
  color: var(--color-text-muted, #5a6070); font-size: 0.9375rem;
}
.quiz-entete {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: var(--space-4, 1rem); flex-wrap: wrap;
}
.quiz-compteur {
  font-family: var(--font-mono, monospace); font-size: 0.8125rem;
  color: var(--color-text-muted, #5a6070); white-space: nowrap;
}
.quiz-barre {
  height: 3px; margin: var(--space-4, 1rem) 0 var(--space-6, 1.5rem);
  background: var(--color-surface-offset, #e8eaed);
  border-radius: 9999px; overflow: hidden;
}
.quiz-barre span {
  display: block; height: 100%; width: 0;
  background: var(--color-primary, #0a6e8a); border-radius: 9999px;
  transition: width var(--transition, 180ms ease);
}
.quiz p.quiz-question {
  margin-bottom: var(--space-5, 1.25rem);
  font-weight: 600; font-size: 1.0625rem; line-height: 1.5;
  color: var(--color-text, #1a1d24);
}
.quiz-choix { display: flex; flex-direction: column; gap: var(--space-2, 0.5rem); }
.quiz-option {
  display: block; width: 100%; margin: 0; text-align: left;
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  font-family: inherit; font-size: 0.9375rem; line-height: 1.5;
  color: var(--color-text, #1a1d24);
  background: var(--color-bg, #f5f6f7);
  border: 1px solid var(--color-border, #c4c9d2);
  border-radius: var(--radius-md, 0.5rem);
  cursor: pointer;
  transition: border-color var(--transition, 180ms ease), background var(--transition, 180ms ease);
}
.quiz-option:hover:not(:disabled) {
  border-color: var(--color-primary, #0a6e8a);
  background: var(--color-surface-2, #f0f2f5);
}
.quiz-option:disabled { cursor: default; opacity: 1; }
.quiz-option.juste { border-color: var(--color-success, #2d7a4a); border-width: 2px; }
.quiz-option.faux { border-color: var(--color-error, #c0392b); border-width: 2px; }
.quiz-option.juste::before,
.quiz-option.faux::before { font-weight: 700; margin-right: 0.5rem; }
.quiz-option.juste::before { content: "\\2713"; color: var(--color-success, #2d7a4a); }
.quiz-option.faux::before { content: "\\2715"; color: var(--color-error, #c0392b); }
.quiz-explication {
  margin-top: var(--space-5, 1.25rem);
  padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
  background: var(--color-bg, #f5f6f7);
  border-radius: var(--radius-md, 0.5rem);
  border-left: 3px solid var(--color-error, #c0392b);
}
.quiz-explication.ok { border-left-color: var(--color-success, #2d7a4a); }
.quiz-explication h4 {
  margin: 0 0 var(--space-2, 0.5rem);
  font-family: var(--font-display, sans-serif);
  font-size: 0.9375rem; font-weight: 700; line-height: 1.3;
  color: var(--color-error, #c0392b);
}
.quiz-explication.ok h4 { color: var(--color-success, #2d7a4a); }
.quiz-explication p { font-size: 0.9375rem; color: var(--color-text-muted, #5a6070); }
.quiz-explication code, .quiz-option code, .quiz-question code {
  font-family: var(--font-mono, monospace); font-size: 0.9em;
}
.quiz-actions { margin-top: var(--space-5, 1.25rem); }
.quiz-bilan { padding: var(--space-4, 1rem) 0; }
.quiz p.quiz-score {
  margin-bottom: var(--space-2, 0.5rem);
  font-family: var(--font-display, sans-serif); font-size: 2.5rem; font-weight: 800;
  line-height: 1.1; color: var(--color-primary, #0a6e8a); text-align: center;
}
.quiz .quiz-bilan p:last-child {
  color: var(--color-text-muted, #5a6070); font-size: 0.9375rem; text-align: center;
}
@media print { .bloc-quiz { display: none !important; } }
`;

  function poserStyles() {
    if (document.getElementById('quiz-styles')) return;
    const e = document.createElement('style');
    e.id = 'quiz-styles';
    e.textContent = STYLES;
    document.head.appendChild(e);
  }

  function melanger(tableau) {
    const t = tableau.slice();
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  }

  function memoire(cle) {
    try {
      const v = localStorage.getItem(cle);
      return v ? JSON.parse(v) : [];
    } catch (e) { return []; }
  }

  function memoriser(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) { /* mode privé */ }
  }

  // Tire PAR_SERIE questions en privilégiant celles qui n'ont pas encore été
  // posées ; quand la banque est épuisée, on repart d'une ardoise propre.
  function tirer(banque, cle) {
    const total = banque.length;
    let vues = memoire(cle).filter((i) => i < total);
    if (total - vues.length < PAR_SERIE) vues = [];

    const neuves = melanger(banque.map((_, i) => i).filter((i) => vues.indexOf(i) === -1));
    const choisies = neuves.slice(0, Math.min(PAR_SERIE, total));
    memoriser(cle, vues.concat(choisies));
    return choisies.map((i) => banque[i]);
  }

  function creer(balise, classe, html) {
    const e = document.createElement(balise);
    if (classe) e.className = classe;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function demarrer(hote, banque, cle) {
    const serie = tirer(banque, cle).map(function (q) {
      // on mélange aussi les propositions : la bonne réponse ne doit pas
      // toujours occuper la même place
      const options = melanger(q.choix.map((texte, i) => ({ texte: texte, juste: i === q.bonne })));
      return { enonce: q.q, options: options, explication: q.explication };
    });

    let index = 0;
    let score = 0;
    hote.innerHTML = '';

    const entete = creer('div', 'quiz-entete');
    entete.appendChild(creer('h2', null, 'Quiz'));
    const compteur = creer('span', 'quiz-compteur');
    entete.appendChild(compteur);
    hote.appendChild(entete);

    const barre = creer('div', 'quiz-barre');
    const jauge = creer('span');
    barre.appendChild(jauge);
    hote.appendChild(barre);

    const corps = creer('div', 'quiz-corps');
    hote.appendChild(corps);

    function afficherQuestion() {
      const q = serie[index];
      compteur.textContent = 'Question ' + (index + 1) + ' sur ' + serie.length;
      jauge.style.width = (index / serie.length) * 100 + '%';
      corps.innerHTML = '';
      corps.appendChild(creer('p', 'quiz-question', q.enonce));

      const liste = creer('div', 'quiz-choix');
      const boutons = [];
      q.options.forEach(function (option) {
        const b = creer('button', 'quiz-option', option.texte);
        b.type = 'button';
        b.addEventListener('click', function () { repondre(option, boutons); });
        boutons.push(b);
        liste.appendChild(b);
      });
      corps.appendChild(liste);
    }

    function repondre(choisie, boutons) {
      const q = serie[index];
      if (choisie.juste) score++;

      boutons.forEach(function (b, i) {
        b.disabled = true;
        if (q.options[i].juste) b.classList.add('juste');
        else if (q.options[i] === choisie) b.classList.add('faux');
      });

      const bloc = creer('div', 'quiz-explication' + (choisie.juste ? ' ok' : ''));
      bloc.appendChild(creer('h4', null, choisie.juste ? 'Correct' : 'Ce n’était pas la bonne réponse'));
      bloc.appendChild(creer('p', null, q.explication));
      corps.appendChild(bloc);

      const dernière = index === serie.length - 1;
      const suite = creer('button', 'btn btn-primary', dernière ? 'Voir le résultat' : 'Question suivante →');
      suite.type = 'button';
      suite.addEventListener('click', function () {
        index++;
        if (dernière) afficherResultat(); else afficherQuestion();
      });
      const actions = creer('div', 'quiz-actions');
      actions.appendChild(suite);
      corps.appendChild(actions);
      suite.focus();
    }

    function afficherResultat() {
      compteur.textContent = 'Terminé';
      jauge.style.width = '100%';
      corps.innerHTML = '';

      const messages = [
        'Le module mérite une relecture — les explications ci-dessus sont un bon point de départ.',
        'Les bases sont là, mais quelques notions méritent un retour dans le module.',
        'Bonne maîtrise d’ensemble ; relancez une série pour couvrir le reste de la banque.',
        'Le module est acquis. Relancez une série pour tomber sur d’autres questions.'
      ];
      const part = score / serie.length;
      const message = messages[part < 0.4 ? 0 : part < 0.7 ? 1 : part < 1 ? 2 : 3];

      const bilan = creer('div', 'quiz-bilan');
      bilan.appendChild(creer('p', 'quiz-score', score + ' / ' + serie.length));
      bilan.appendChild(creer('p', null, message));
      corps.appendChild(bilan);

      const rejouer = creer('button', 'btn btn-primary', 'Recommencer');
      rejouer.type = 'button';
      rejouer.addEventListener('click', function () { demarrer(hote, banque, cle); });
      const actions = creer('div', 'quiz-actions');
      actions.appendChild(rejouer);
      corps.appendChild(actions);
      rejouer.focus();
    }

    afficherQuestion();
  }

  document.addEventListener('DOMContentLoaded', function () {
    const hote = document.getElementById('quiz');
    const banque = window.QUIZ;
    if (!hote || !banque || !banque.length) return;
    poserStyles();

    const cle = 'quiz-vues-' + (document.body.dataset.module || location.pathname);

    // écran d'accueil : on ne démarre pas tout seul, le module se lit d'abord
    const accueil = creer('div', 'quiz-accueil');
    accueil.appendChild(creer('h2', null, 'Quiz : vérifier ses acquis'));
    accueil.appendChild(creer('p', null,
      PAR_SERIE + ' questions tirées au hasard parmi ' + banque.length +
      '. Chaque réponse est commentée, juste ou fausse — c’est là que se fait la révision. ' +
      'Le bouton « Recommencer » tire une nouvelle série, en évitant les questions déjà posées.'));
    const lancer = creer('button', 'btn btn-primary', 'Commencer le quiz');
    lancer.type = 'button';
    lancer.addEventListener('click', function () { demarrer(hote, banque, cle); });
    const actions = creer('div', 'quiz-actions');
    actions.appendChild(lancer);
    accueil.appendChild(actions);
    hote.appendChild(accueil);
  });
})();
