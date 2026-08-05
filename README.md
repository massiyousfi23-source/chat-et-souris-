# Chat & Souris — La chasse de l'appart

Mini-jeu mobile dans lequel un chat tigré chasse des souris à travers trois pièces très colorées. Les souris dorées valent dix fois plus qu'une souris grise, mais certaines cachent un chat noir et blanc capable de retirer des points d'un coup de patte.

## Jouer

- Souris grise : **+10 points**
- Souris dorée : **+100 points**
- Fausse souris dorée / coup de patte : **−50 points**
- Pièces : salon, cuisine et chambre
- Commandes : flèches, ZQSD, WASD, glissement tactile ou pavé directionnel

## Fonctionnalités

- interface responsive pensée pour le téléphone ;
- personnages 3D créés à partir des chats de référence ;
- obstacles et cachettes intégrés au mobilier ;
- transformation animée de la souris dorée piégée ;
- score record conservé sur l'appareil ;
- effets sonores, pause, partage du score et mode hors connexion ;
- application web installable (PWA).

## Lancer localement

Le projet ne nécessite aucune compilation :

```bash
python -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

## Structure

```text
assets/characters/  sprites PNG des chats et des souris
icons/              icônes de l'application
index.html          structure de l'interface
styles.css          mise en page et effets visuels
game.js             moteur, niveaux et interactions
manifest.webmanifest
sw.js               cache hors connexion
```

Le jeu est entièrement statique et peut être publié directement avec GitHub Pages.
