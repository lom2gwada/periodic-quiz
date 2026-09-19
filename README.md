# Periodic Quiz

Quiz sur le **tableau périodique des éléments** (118 éléments), construit sur le modèle de [Quiz Caraïbes](https://github.com/lom2gwada/quiz-caraibes) : React + TypeScript + Vite, questions générées automatiquement à partir d'un tableau de données, connexion partagée avec les autres applis du même projet Supabase.

## Fonctionnalités

- **Tableau périodique interactif** (`🧪 Tableau`) : grille 18 × 7 + lanthanides/actinides, tuiles colorées par catégorie, légende cliquable pour mettre une catégorie en évidence, clic → fiche de l'élément.
- **Fiches** : numéro, symbole, masse atomique, catégorie, groupe, période, état, électronégativité, points de fusion/ébullition, masse volumique, année de découverte, configuration électronique, états d'oxydation.
- **Quiz générés** depuis les données (QCM directs et inversés, estimations, classements, associations, vrai/faux, texte à trous), avec filtres par catégorie de question et difficulté ; modes classique, contre-la-montre et sans-faute.
- **Historique, radar/heatmap de réussite, classement partagé** entre joueurs, profil (pseudo, avatar, thème, langue).
- **Interface en 5 langues** (fr, en, es, nl, ht) ; **données en français et anglais** (les autres langues retombent sur le français pour les noms d'éléments).
- **Édition admin** des fiches et du panneau de génération, directement depuis l'appli.

## Données

[`src/data/elements.csv`](src/data/elements.csv) est généré par [`scripts/build-elements.mjs`](scripts/build-elements.mjs) à partir du [tableau périodique PubChem](https://pubchem.ncbi.nlm.nih.gov/periodic-table/) (NCBI, données libres de droits), complété par les noms français, le groupe/la période et les catégories en français. Températures converties en °C ; masse volumique laissée vide pour les gaz. Les traductions anglaises ([`src/data/elements.i18n.ts`](src/data/elements.i18n.ts)) sont générées par [`scripts/build-elements-i18n.mjs`](scripts/build-elements-i18n.mjs).

Régénérer :

```bash
curl -o pubchem.csv "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/CSV"
node scripts/build-elements.mjs pubchem.csv
node scripts/build-elements-i18n.mjs pubchem.csv
```

## Base de données

Même projet Supabase que [Quiz Caraïbes](https://github.com/lom2gwada/quiz-caraibes) et Oliver Quiz : **mêmes comptes** (`auth.users`), tables préfixées `periodic_*` (profils, historique, jeu de données `periodic_elements`, config `periodic_schema`, passes invités, admins, vues de classement).

## Architecture

Cette appli est un **jeu de données + des vues** posés sur le moteur commun [`quiz-engine`](https://github.com/lom2gwada/quiz-engine), inclus comme sous-module git dans `engine/` (génération de quiz, jeu, historique, classement, connexion, liens invités, édition admin, i18n…).

- `src/appConfig.ts` : identité de l'appli pour le moteur (préfixe de stockage `periodic-quiz`, préfixe des tables Supabase `periodic_`, libellés propres).
- `src/appSpec.tsx` : jeu de données embarqué, construction du `Dataset` (traductions, tableau périodique, tuiles d'éléments) et accès à la version en base.
- `engine/` : à ne modifier que pour ce qui doit changer dans **les deux** applis (voir son README).

Après un `git clone`, récupérer le moteur avec `git submodule update --init` (ou cloner avec `--recurse-submodules`). Le workflow de déploiement le fait déjà.

## Développement

```bash
npm install
npm run dev      # serveur de développement
npm test         # tests unitaires (vitest)
npm run build    # typecheck + build de production
```

Déploiement : GitHub Pages, à chaque push sur `master` (`.github/workflows/deploy.yml`).
