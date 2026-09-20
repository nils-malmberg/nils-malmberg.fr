// ── Quiz des modules du cours ──────────────────────────────────────────────
// Chaque page de module déclare sa banque de questions dans window.QUIZ, puis
// ce moteur en tire cinq au hasard. Les questions déjà vues sont mémorisées
// dans le navigateur, pour que « recommencer » serve d'abord les autres.
(function () {
  const PAR_SERIE = 5;

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
