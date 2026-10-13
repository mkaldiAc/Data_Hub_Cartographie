# DATA HUB — Cartographie des pools de données

Application web statique autonome de suivi des **domaines de données**, de leurs **dépendances** et de leur **couverture temporelle**, compatible avec un hébergement Nginx/Docker.

## Démarrer

Les fichiers `index.html`, `style.css` et `app.js` constituent l'application sans dépendances et sans CDN.

Démarrage sans Docker : `python -m http.server 8080`, puis ouvrir http://localhost:8080 dans Microsoft Edge ou Chrome.

Démarrage en conteneur : `docker compose up --build -d`, puis ouvrir http://localhost:8080.

Un simple double-clic sur `index.html` peut afficher la page, mais la sauvegarde directe sur fichier nécessite un contexte navigateur compatible et sécurisé (**localhost ou HTTPS**).

## Fonctionnalités

- Cartographie SVG avec dépendances multiples, domaines autonomes, recherche, focus, zoom, panoramique et sélection.
- Calques « Structure seule », « Couverture » et « Évolution » ; curseur temporel et sélection d'une date passée ou future.
- Administration des domaines : création, modification, suppression, dépendances, détection des cycles et protection des domaines utilisés comme parents.
- Administration des jalons : un taux 0–100 %, une date et un commentaire ; les jalons futurs sont des prévisions.
- Import/export JSON, brouillon persistant dans le navigateur, ouverture, création et sauvegarde explicite d'un fichier JSON via l'API File System Access d'Edge/Chrome.
- Référentiel de départ de **35 domaines** basé sur la cartographie fournie ; aucun taux de couverture fictif.

### Règles de calcul

À une date D, un domaine prend la valeur de son **dernier jalon daté au plus tard D**. Sans jalon antérieur, il est « non renseigné » (pas 0 %). Aucune interpolation entre les dates. La moyenne est calculée uniquement sur les domaines renseignés. Le calque « Évolution » affiche la différence en points entre le dernier jalon et son prédécesseur, ou depuis zéro pour le premier jalon.

## Teams : fonctionnement exact

Les fichiers d'un canal Teams sont hébergés dans SharePoint. **Déposer simplement une application HTML dans un répertoire Teams ne crée pas un site web partagé et ne permet pas au JavaScript d'écrire librement sur SharePoint.**

### Solution disponible dans cette version — petit groupe, mises à jour séquentielles

1. Synchroniser sur le poste Windows le répertoire du canal Teams via **OneDrive**.
2. Héberger l'application sur **localhost** ou sur un site **HTTPS** interne, puis l'ouvrir dans Edge/Chrome.
3. Dans « Partage & stockage », cliquer « Créer un fichier dans un dossier » et choisir le répertoire Teams **synchronisé localement** ; sinon « Ouvrir un fichier existant ».
4. Après une modification, cliquer **« Enregistrer sur le dossier »**. OneDrive synchronise le JSON avec SharePoint, puis Teams.
5. Les autres utilisateurs doivent ouvrir ou **recharger** ce fichier pour consulter la dernière version.

**Limites :** aucune synchronisation instantanée ; aucune fusion, aucun verrouillage ou protection en cas de modifications simultanées ; risque de conflits OneDrive. Les modifications non enregistrées sont seulement conservées dans le navigateur courant. Le handle du fichier doit être rouvert à chaque nouvelle session. L'application ne gère ni compte utilisateur ni droits d'administration.

### Architecture recommandée pour un usage collaboratif de production

Héberger l'application statique sur une URL HTTPS (Azure Static Web Apps ou serveur intranet), éventuellement intégrée dans un onglet Teams, et adosser les données à **SharePoint Lists** via Microsoft Graph et une authentification Microsoft Entra ID, avec contrôle des droits et des écritures concurrentes. **Cette intégration n'est pas réalisée** par le présent prototype : elle nécessite une configuration tenant et des permissions adaptées.

## Architecture et données

```text
index.html    — interface et formulaires
style.css     — présentation Aiguillon responsive
app.js        — cartographie SVG, calculs, données et sauvegarde
Dockerfile    — build du conteneur Nginx
nginx.conf    — configuration du serveur statique
compose.yaml  — démarrage local du conteneur
```

Schéma JSON (version 1) :

```json
{
  "version": 1,
  "domains": [
    {"id": "d1", "name": "Patrimoine", "description": "", "parents": []}
  ],
  "milestones": [
    {"id": "j1", "domainId": "d1", "date": "2026-12-31", "value": 40, "note": "Objectif"}
  ],
  "updatedAt": "2026-10-13T12:00:00.000Z"
}
```

La validation rejette les identifiants en double, dépendances invalides et cycles.

## Charte graphique et protection du dépôt source

Palette, typographies, contrastes et navigation inspirés des fichiers `Ariane/humain/application_scenario/ui-theme/Aiguillon_design/theme/{tokens,shell,components}.css` et `SPECIFICATIONS_DESIGN.md`, consultés **en lecture seule**. Les nouveaux styles sont indépendants. **Aucun fichier d'ARIANE n'a été modifié.**

## Points de vigilance avant diffusion large

Vérifier la fidélité du relevé des liens avec les référents métier, préciser la définition opérationnelle de la couverture (table, indicateur, champ, fraîcheur, etc.), organiser une validation des trajectoires, et sécuriser les droits d'écriture avant passage en production.

## Version HTML unique — expérimentation Edge / Chrome

Le fichier [DATA_HUB_Cartographie.html](./DATA_HUB_Cartographie.html) embarque les styles, les scripts et les données. Il peut être copié dans un dossier Teams et partagé comme une pièce jointe, sans Docker ni serveur.

**Test sous Windows / Edge :**

1. Téléchargez `DATA_HUB_Cartographie.html` via GitHub, puis enregistrez-le dans un dossier local Windows (de préférence avant de le déposer sur Teams).
2. Ouvrez le fichier par double-clic avec **Microsoft Edge**. Saisissez un premier jalon dans **Administration**.
3. Cliquez sur **Enregistrer**. Au premier usage, choisissez explicitement **le même fichier HTML** dans la fenêtre système et accordez le droit d'écriture. L'application ne peut pas découvrir automatiquement le handle du fichier déjà ouvert.
4. Une fois le message de confirmation affiché, fermez puis rouvrez le HTML pour vérifier que le jalon a été enregistré dans le document lui-même.
5. Testez **Enregistrer une copie** : une version HTML autonome différente est créée, sans remplacer l'original.

**Sécurité et limites :**
- La [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker) exige une action utilisateur et les permissions du navigateur. Son fonctionnement peut être bloqué par la politique de sécurité de l'entreprise.
- Le bouton Enregistrer compare l'identifiant de révision intégré au document sélectionné avec celui de l'application. En cas de différence, il refuse l'écrasement ; il ne fusionne pas les modifications concurrentes.
- **La comparaison n'est pas un verrou transactionnel**. Ne pas éditer le même fichier à plusieurs en même temps, particulièrement dans un dossier OneDrive/Teams synchronisé.
- Une ouverture directe `file://` est à tester dans le navigateur cible. Si le sélecteur n'est pas disponible, utilisez **Enregistrer une copie** ou exécutez via localhost/HTTPS.
- Les copies enregistrées contiennent également le code applicatif : ne partagez que des fichiers provenant d'une source maîtrisée. Le destinataire doit ouvrir le HTML en tant que fichier local (Teams peut bloquer la prévisualisation du HTML).

La version multi-fichiers et sa compatibilité Docker sont conservées pour les développements ultérieurs.

### Correctif Chrome — 13 octobre 2026

La sauvegarde HTML autonome a été corrigée : lorsque le document sélectionné possède une révision différente, l'application tente désormais une **fusion à trois versions** des domaines et jalons au lieu de refuser systématiquement. Les conflits sur le même domaine ou la même paire domaine/date restent bloquants. Après la première autorisation du fichier HTML, la saisie de jalons et l'édition des domaines déclenchent une sauvegarde automatique différée (600 ms). Les modifications avant cette première autorisation restent en mémoire tant que l'utilisateur n'a pas cliqué sur **Enregistrer**. Un indicateur en haut de page permet de distinguer l'état enregistré de l'état non enregistré.

**Important :** le correctif est validé par compilation syntaxique du script et par tests de la fusion et de sa protection contre les conflits. La boîte de dialogue et l'écriture dans Chrome sur le PC utilisateur restent à tester. Une copie HTML antérieure ne se met pas à jour automatiquement : retéléchargez le fichier depuis le dépôt avant le nouveau test.

## Version HTML autonome — interface revue (13 octobre 2026)

- **Cartographie** : positionnement initial vertical et organisé par familles en reprenant le schéma de référence. La sélection et les calques de couverture restent accessibles.
- **Déplacement manuel** : saisir un pool et le glisser, puis relâcher. Ses coordonnées sont stockées dans `positions` au sein du JSON intégré au HTML et réutilisées au prochain lancement. Depuis **Administration → Domaines & dépendances**, l'action « Réinitialiser le placement » restaure la disposition de référence.
- **Administration** : deux onglets séparés (« Couverture des données » et « Domaines & dépendances »), suppression d'un domaine et de ses jalons, blocage si d'autres domaines dépendent de ce domaine.
- **Enregistrement** : les boutons « Enregistrer une copie » et « Exporter JSON » sont visibles uniquement dans **Administration**. L'enregistrement d'un jalon, d'un domaine ou d'un déplacement demande l'autorisation d'écrire dans le fichier HTML lors de la première utilisation. Les modifications suivantes sont sauvegardées automatiquement. Aucun bouton général « Enregistrer » n'est requis.
- **Thème** : le bandeau latéral reprend l'image de fond de `Aiguillon_design` intégrée en Base64 dans le document lui-même, sans fichier adjacent ni modification du dépôt ARIANE.

La cartographie peut être déplacée (glissement du fond) et zoomée (molette ou boutons). Un domaine peut être repositionné en le faisant glisser directement. Pour transmettre les données, partagez le HTML **après confirmation de l'enregistrement**. Deux utilisateurs ne doivent pas éditer simultanément un même fichier partagé. Le format JSON reste compatible avec les anciennes données sans `positions`.

## Audit et évolutions du 13 octobre 2026 — cartographie et matrice

- **Défaut corrigé** : `new Map(referenceLayout)` traitait les triplets `[nom,x,y]` comme des paires et renvoyait des coordonnées invalides. La conversion explicite `referenceLayout.map(([name,x,y])=>[name,{x,y}])` restaure les 35 positions initiales distinctes.
- **Cartographie** : cartouches sobres, fond blanc sans calque ; avec le calque « Couverture », le remplissage passe linéairement de `#eaf1fb` à 0 % à `#203864` à 100 %. Les valeurs absentes restent blanches ; le texte passe au blanc sur fond sombre.
- **Administration** : la saisie des taux s'effectue dans une matrice : lignes = domaines ; colonnes = dates de constat. On ajoute une date, puis on saisit des pourcentages entiers 0–100 avant de cliquer « Enregistrer les couvertures ». Une cellule vide signifie « non renseigné ». La suppression d'une colonne est confirmée et supprime tous les jalons de cette date.
- **Compatibilité** : les fichiers HTML déjà enregistrés sans `statementDates` reconstruisent leurs dates à partir des jalons existants. Les coordonnées enregistrées sont maintenues.
- **Contrôles exécutés** : compilation JavaScript ; 35 domaines, 35 positions numériques distinctes, dimensions de carte non nulles ; deux dates de constat conservées après validation JSON ; palette de 0 % et 100 % contrôlée.

**Limite de validation** : ces contrôles sont structurels. Un test visuel et un cycle de sauvegarde/réouverture dans Chrome restent nécessaires sur le poste utilisateur. Si l'ancien document HTML contenait des données modifiées, en faire une copie avant de le remplacer par la nouvelle version, car l'ancienne version ne se met pas à jour d'elle-même.

## Correctif date de constat et sauvegarde du placement — 13 octobre 2026

- La cartographie comporte désormais un bouton **« Enregistrer le placement »**. Le déplacement d'un pool modifie ses coordonnées et affiche un indicateur d'enregistrement en attente ; le bouton sauvegarde explicitement toutes les positions dans le HTML après consentement Chrome (ou dans le fichier déjà autorisé). Les modifications de couverture conservent leur propre sauvegarde.
- Quand une date de constat est **déjà présente**, le bouton « Ajouter une date » n'affiche plus une alerte : il signale l'existence de cette date et fait défiler la matrice jusqu'à la colonne existante, temporairement surlignée. Si toutes ses valeurs sont vides, la date demeure présente jusqu'à sa suppression volontaire.
- Les cellules de couverture modifiées mais **non encore validées** sont conservées lors du rafraîchissement de la matrice, notamment après ajout d'une date. Le navigateur avertit à la fermeture si ces saisies ne sont pas validées.
- Vérifications réalisées : compilation JS, 35 domaines et coordonnées valides, sérialisation des coordonnées de placement et des dates, présence des commandes dans le HTML autonome. **Un essai réel sous Chrome et la réouverture du fichier restent nécessaires pour confirmer le flux système d'autorisation et d'écriture.**

## Correctif du 13 octobre 2026 — Matrice visible, plein écran et positionnement

- Les cartouches de la carte ont été agrandis de 198×66 à 228×86 unités SVG, avec une typographie plus lisible. Un bouton **Plein écran** permet d'afficher la cartographie dans le navigateur ; une vue agrandie de secours est prévue si l'API de plein écran est refusée.
- La matrice de couverture a été reconstruite avec des sections **thead/tbody** explicites et des règles CSS ciblées qui neutralisent les règles génériques responsables de l'affichage incorrect des cellules. Les **35 domaines** restent visibles même sans date ; ajouter une date ouvre autant de cellules de saisie qu'il y a de domaines.
- Contrôles de cohérence : 35 domaines, sérialisation d'une date et d'un pourcentage, restauration des positions dans le JSON, compilation JavaScript et présence du mécanisme de plein écran.
- Pour la sauvegarde d'un déplacement, cliquer **Enregistrer le placement**, sélectionner le HTML en cours d'utilisation si Chrome le demande, attendre sa confirmation, puis fermer et rouvrir le fichier. Une autre copie du fichier dans le dossier Téléchargements ne se met pas à jour automatiquement.

Un test interactif dans le navigateur Chrome de l'utilisateur reste requis pour confirmer toutes les autorisations de fichier locales.

## Correctif d'initialisation et personnalisation — 13 octobre 2026

- Cause identifiée sur les captures aux indicateurs vides : une référence à `milestoneDate`, supprimé de l'interface, provoquait une erreur JavaScript au démarrage. Cette instruction a été retirée.
- Sélecteur de couleur de fond sur la cartographie (`input type=color`) et persistance dans `mapBackground` du JSON embarqué. Fond blanc par défaut. Conservation lors d'une fusion de versions non conflictuelles.
- Cartouches SVG agrandis à 264 × 104 unités et police portée à 23 unités dans les libellés.
- Le bouton de sauvegarde de la carte attend désormais la fin d'une écriture déjà en cours avant de démarrer la suivante, évitant qu'un clic soit ignoré.
- Audit par simulation DOM : 35 domaines affichés dans les indicateurs au démarrage, date d'observation initialisée, ajout d'une date produisant 35 champs dans la matrice ; compilation JavaScript vérifiée. Les permissions et l'écriture réelles nécessitent toujours un essai dans Chrome.

Attention : téléchargez le nouveau HTML depuis GitHub. Gardez une copie de l'ancien fichier si vous y avez stocké des données, car le dépôt GitHub et la copie locale ne synchronisent pas leurs données automatiquement.

## Interface cartographie compacte et frise chronologique proportionnelle (13 octobre 2026)

- La barre de commandes et la navigation temporelle se trouvent désormais **dans le panneau cartographie**, au-dessus du graphe, y compris en plein écran. L'ancien bandeau séparé est supprimé pour libérer de la hauteur.
- Les dates de la frise proviennent de toutes les dates de constat du référentiel (`statementDates`) et des dates des jalons (`milestones`), sans devoir posséder une valeur de couverture à chaque date.
- Les positions des points sont calculées sur la base de la différence **réelle en jours** depuis le premier constat, divisée par la durée totale. La distance entre deux repères n'est donc pas artificiellement régulière. Les repères sont cliquables ; le glissement sélectionne le constat le plus proche. Les dates prospectives sont distinguées par un contour en tirets.
- Avec une seule date, le curseur reste sur cette date ; sans date, il présente un état neutre indiquant qu'aucun constat n'est enregistré.
- Test logique : 14/10/2026, 14/11/2026 et 14/11/2027 → second repère à **7,8 %** de l'axe ; les 35 domaines sont préservés et le JavaScript est compilable.

Le test final des interactions graphiques dans Chrome est à réaliser sur le fichier autonome téléchargé depuis ce dépôt.

## Simplification et réimport JSON (13 octobre 2026)

- Cartographie : suppression des commandes Recherche, Focus, calendrier libre et Aujourd’hui. La sélection des constats s'effectue exclusivement par la frise proportionnelle. Dates de constat agrandies (13 px) pour faciliter la lecture.
- Administration : nouveau bouton **Importer JSON** à côté de **Exporter JSON** dans l'en-tête. Accepte les exports historiques du schéma `version:1`, y compris ceux ne contenant pas `statementDates`, `positions` ou `mapBackground` ; les valeurs absentes sont reconstituées ou initialisées par défaut.
- Import : analyse complète et validation du JSON, vérification des références des domaines, absence de cycle, validité des jalons et rejet des doublons domaine/date, confirmation avant écrasement, téléchargement préalable de sécurité du référentiel courant, puis mise à jour et écriture dans le HTML. En cas d'échec, l'interface indique qu'il reste à enregistrer ou à exporter une copie.
- Le schéma reste en **version 1** et conserve les propriétés JSON additionnelles inconnues pour favoriser la compatibilité avec de futures évolutions. Toute version supérieure non prise en charge est rejetée explicitement au lieu d'être importée partiellement.
- Audit réalisé : compilation du JavaScript, 35 domaines de référence, import d'un ancien modèle sans nouveaux champs, reconstruction de la date de constat et conservation d'un champ additionnel. Test complet de sélection de fichier dans Chrome à valider sur le poste utilisateur.

## Correctif import JSON et frise allégée

- Correction de l'erreur Chrome `showOpenFilePicker: Must be handling a user gesture` : après sélection asynchrone et confirmation de l'import JSON, l'application ne lance plus automatiquement le sélecteur du fichier HTML. Les données sont chargées dans l'application et restent marquées **non enregistrées** jusqu'au clic explicite sur **Enregistrer le HTML** (nouveau bouton Administration). Si un fichier HTML était déjà autorisé dans la session, l'application peut le sauvegarder sans nouveau sélecteur.
- En cas d'import, ne fermez pas le navigateur avant le message de confirmation de sauvegarde, ou utilisez **Enregistrer une copie**. L'import et l'écriture dans le fichier sont deux opérations distinctes.
- Frise : suppression des mentions `7 constats`, `Carte modifiée ...` et des bornes temporelles inférieure/supérieure ; pas de libellés de dates sous les points, pour empêcher les chevauchements. La date sélectionnée reste visible à gauche et chaque repère expose sa date par infobulle et libellé accessible.
- Les dates prospectives sont représentées avec des points **bleu clair** et le segment temporel après la date courante en bleu clair, les constats passés restant bleu soutenu.
- Tests techniques : syntaxe JS valide, aucune référence `$()` vers des éléments DOM supprimés, bouton de sauvegarde et mécanisme d'import présents. Le comportement du sélecteur natif doit être validé dans Chrome sur le poste Windows.

## Déplacement libre dans les quatre directions et renommage

- Correction du blocage des cartouches aux bords : suppression de la borne `Math.max(10, ...)`, qui empêchait de déplacer « Comptabilité générale » à gauche ou tout autre domaine au-dessus de la zone initiale. Les coordonnées X/Y peuvent être négatives, sans modifier le schéma JSON `version: 1`.
- Le repère SVG conserve désormais des dimensions fixes (2160 × 1400) pendant un glissement : il ne s'étire plus lorsqu'un domaine est déplacé hors des limites de départ. Le déplacement calcule les unités à partir de l'échelle réelle du SVG, et la vue défile automatiquement lorsque le curseur est proche des quatre bords.
- **Recentrer** recalcule le zoom et la translation à partir de tous les domaines, y compris en positions négatives ou éloignées. Les coordonnées restent sauvegardées dans `positions` lors de **Enregistrer la carte**.
- Dans **Administration → Domaines & dépendances → Référentiel des domaines**, chaque ligne possède désormais **Renommer**. Le nom peut aussi être édité dans la fiche du domaine. L'ID technique est conservé, donc les jalons de couverture, liens de dépendance et positions ne sont pas réinitialisés. Un nom en doublon est refusé.
- Contrôles réalisés : compilation JS, sérialisation/réimport de coordonnées négatives, positions éloignées et nom modifié, présence de l'action Renommer. Test des gestes graphiques dans Chrome à confirmer sur le poste utilisateur.

## Cadrage optimisé et zoom précis — 13 octobre 2026

- Le bouton **Recentrer** utilise les dimensions effectives de l'élément SVG et son comportement `preserveAspectRatio=meet` pour ajuster la vue à l'emprise réelle des cartouches. La marge visée est d'environ **22 pixels** au lieu du large centrage précédent. Les cartouches négatifs ou éloignés sont inclus.
- Dans l'en-tête de la carte, le pourcentage est désormais un **champ numérique modifiable**, de **5 à 500 %** (pas de 0,5 % dans le champ). Les boutons `+` et `−` ajustent le zoom de 10 points ; la molette reste utilisable. Les changements de zoom préservent le point central de la vue.
- Le panneau **Disposition de la carte / Réinitialiser le placement** a été supprimé de **Administration → Domaines & dépendances** ; les positions existantes demeurent dans le JSON sauvegardé.
- Tests structurels : compilation JavaScript et absence de références DOM aux commandes supprimées. Le rendu visuel exact du cadrage est à vérifier dans Chrome.

## Fonction « Réponse métier » — schéma JSON v2

Un troisième onglet **Administration → Réponse métier** permet de créer et modifier des métiers. Chaque métier possède :
- un identifiant immuable (`id`) ;
- une direction (`direction`) ;
- un nom de métier (`name`) ;
- une liste non vide d'identifiants de domaines (`domainIds`).

Exemple :
```json
{
  "version": 2,
  "businessResponses": [
    {
      "id": "METIER_001",
      "direction": "Direction du patrimoine",
      "name": "Gestion technique",
      "domainIds": ["d8", "d10"]
    }
  ]
}
```

Ce tableau est une nouvelle propriété du JSON principal : `domains`, `milestones`, `statementDates`, `positions` et `mapBackground` sont conservés. Les fichiers v1 sont automatiquement convertis en v2 avec `businessResponses: []`. Les exports v2 restent importables avec le validateur, et le mécanisme de sauvegarde HTML, de révision et de fusion à trois versions tient compte de `businessResponses`.

La maturité d'un métier à la date d'observation est la **moyenne simple des couvertures connues** de ses domaines rattachés. Une couverture inconnue est exclue de la moyenne et son absence est signalée ; elle n'est pas traitée comme 0 %. Si aucune couverture n'est connue, le métier est non évaluable. La maturité d'une direction est la moyenne simple des métiers évaluables (chacun ayant le même poids). La vue d'analyse se trouve sous la cartographie et suit le sélecteur temporel.

Les domaines ne peuvent pas être supprimés tant qu'ils sont affectés à au moins un métier : retirer d'abord ces affectations.

### Navigation sans surlignage

Les événements natifs `selectstart` et `dragstart` sont annulés dans le conteneur SVG, avec `pointerdown.preventDefault()` en phase de capture et désactivation CSS de la sélection. Les formulaires d'administration ne sont pas affectés.

### Audit

Validations réalisées dans le moteur JavaScript : compilation, migration v1→v2, export/import du modèle v2, refus des références de domaines absentes, moyenne de deux couvertures (60 et 80 → 70), moyenne partielle si un domaine est non renseigné (60 et inconnu → 60), absence de références DOM manquantes. Le parcours d'écriture via File System Access et le test de sélection pendant le glissement demandent encore un test physique dans Chrome.
