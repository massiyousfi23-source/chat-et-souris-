# Chat & Souris — La chasse de l'appart

Jeu 3D pour téléphone et ordinateur : tu cours derrière un chat tigré qui chasse des souris à travers trois pièces très colorées. Les souris dorées valent dix fois plus qu'une souris grise, mais certaines cachent un chat noir et blanc capable de retirer des points d'un coup de patte.

## Jouer

- Souris grise : **+10 points**
- Souris dorée : **+100 points**
- Fausse souris dorée / coup de patte : **−50 points**
- Pièces : salon, cuisine et chambre

### Commandes

| Action | Clavier | Téléphone |
| --- | --- | --- |
| Avancer | ↑, Z ou W | Glisser le doigt vers le haut, ou bouton ↑ |
| Reculer | ↓ ou S | Glisser vers le bas, ou bouton ↓ |
| Tourner | ← → , Q / D ou A / D | Glisser à gauche / à droite, ou boutons ← → |
| Pause | P ou Espace | Bouton Pause |

Sur téléphone, on pose le doigt n'importe où sur le jeu : un joystick apparaît sous le doigt.

## Fonctionnalités

- vraie 3D (Three.js) avec caméra qui suit le chat ;
- chat tigré, chat noir et blanc et souris modélisés en 3D et animés (pattes, queue, tête) ;
- trois pièces meublées : canapé, cuisine avec îlot, chambre avec lit et armoire ;
- radar en haut à droite pour repérer les souris et la souris dorée ;
- les meubles et les murs entre la caméra et le chat deviennent transparents ;
- souris dorée cachée signalée par un rayon de lumière, piège animé du chat noir et blanc ;
- qualité graphique qui s'adapte automatiquement si l'appareil est lent ;
- score record conservé sur l'appareil ;
- effets sonores, pause, partage du score et mode hors connexion ;
- application web installable (PWA).

## Lancer localement

Le projet ne nécessite aucune compilation, mais il doit être servi par un petit serveur (les modules JavaScript ne marchent pas en ouvrant le fichier directement) :

```bash
python -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

Pour tester, ajouter `?debug` à l'adresse : l'état du jeu est alors accessible dans la console via `window.chatSouris`.

## Structure

```text
assets/characters/  images des chats (écrans d'accueil et de fin)
icons/              icônes de l'application
vendor/             Three.js r187 (minifié, licence MIT)
index.html          structure de l'interface
styles.css          mise en page et effets visuels
game.js             règles, niveaux, commandes et interface
scene3d.js          rendu 3D : caméra, synchronisation, effets, radar
models.js           modèles 3D : chats, souris, meubles et pièces
manifest.webmanifest
sw.js               cache hors connexion
```

Après une modification de `game.js`, `scene3d.js`, `models.js` ou `styles.css`, changer le numéro `?v=` dans `index.html`, `game.js`, `scene3d.js` et `sw.js` (et le nom du cache dans `sw.js`) pour que les joueurs reçoivent la nouvelle version.

Le jeu est entièrement statique et se publie directement avec GitHub Pages.
