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
