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
