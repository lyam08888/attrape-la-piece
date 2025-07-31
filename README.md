Super Pixel Adventure 2
Bienvenue dans Super Pixel Adventure 2, une refonte technique et visuelle majeure du jeu de plateforme classique. Ce projet a été entièrement reconstruit pour offrir une expérience plus riche, plus dynamique et visuellement impressionnante.

🌟 Évolutions Techniques Majeures
Moteur Modulaire : Le code est maintenant divisé en fichiers spécialisés (player.js, enemy.js, world.js) pour une meilleure organisation et des performances accrues.

Monde Procédural : Chaque partie génère un monde unique avec des plateformes, des pièges et des secrets, offrant une rejouabilité infinie.

Monde Vivant et Dynamique :

Cycle Jour/Nuit : Regardez le ciel changer de couleur, du lever au coucher du soleil, avec des étoiles qui apparaissent la nuit.

Décors Multi-couches : Le monde a gagné en profondeur grâce à un système de parallaxe.

Physique Réaliste : Le moteur physique a été amélioré avec une gestion de la friction, une physique aquatique et des collisions plus précises.

Gameplay Approfondi :

Ennemis Variés : Affrontez 3 types d'ennemis avec des comportements uniques.
Moteur de minage : cassez les blocs du terrain avec vos outils et récoltez les ressources.

Animations Dynamiques : le héros adopte maintenant des postures
différentes lorsqu'il marche, saute ou vole, offrant un rendu plus vivant.

Checkpoints : Votre progression est sauvegardée à des points clés du niveau.

Interface enrichie :
- Barre d'EXP avec affichage du niveau.
- Inventaire complet (touche **I**).
- Menu des compétences (touche **P**).
- Menu des commandes remis à jour.

## Cassage de blocs

Le module `miningEngine.js` gère la destruction des tuiles. Maintenez l'action sur un bloc pour remplir la jauge de minage. Une fois pleine, le bloc se transforme en objet collectable qui rejoint l'inventaire au contact du joueur (`player.inventory`). Intégrez simplement le moteur en appelant `updateMining(game, keys, mouse)` à chaque frame.

🚀 Comment Lancer le Jeu
Vérifiez votre dépôt GitHub : Assurez-vous que le dossier assets de votre dépôt GitHub contient bien tous les fichiers images listés.

Ouvrez index.html : Lancez ce fichier dans un navigateur web moderne.

Jouez ! Le jeu chargera les assets depuis votre GitHub et sera prêt à jouer.
