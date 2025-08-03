# Système de Minage et de Gravité des Blocs

## Description

Ce système implémente la fonctionnalité de minage et de gravité des blocs comme dans Minecraft. Les blocs avec gravité (sable, gravier, sable des âmes) tombent lorsqu'ils n'ont plus de support en dessous.

## Fonctionnalités

### Minage de blocs
- Le joueur peut miner des blocs en cliquant dessus avec la souris
- Différents outils ont des efficacités variées selon les types de blocs
- Les outils ont une durabilité limitée
- Les blocs minés peuvent laisser des objets à ramasser

### Gravité des blocs
- Les blocs de sable, de gravier et de sable des âmes tombent lorsqu'ils n'ont plus de support
- La gravité est vérifiée régulièrement dans la boucle de jeu
- Les blocs qui tombent deviennent des objets à ramasser

## Fichiers impliqués

### miningEngine.js
Contient la logique principale du minage et de la gravité:
- `updateMining()`: Gère le processus de minage
- `updateGravity()`: Vérifie et fait tomber les blocs avec gravité
- `destroyBlock()`: Détruit un bloc et gère les effets secondaires
- `checkBlockSupport()`: Vérifie si un bloc a besoin de support

### game.js
Intègre le système dans la boucle de jeu principale:
- Appelle `updateGravity()` régulièrement
- Gère la physique des objets à ramasser

## Types de blocs avec gravité

- SAND (Sable)
- GRAVEL (Gravier)
- SOUL_SAND (Sable des âmes)

## Améliorations possibles

1. Ajouter plus de types de blocs avec gravité
2. Implémenter la physique plus avancée (glissement, rebond, etc.)
3. Ajouter des effets sonores pour les blocs qui tombent
4. Optimiser les performances pour les mondes très larges

## Tests

Le fichier `test-mining.js` contient des fonctions de test pour vérifier le bon fonctionnement du système.
