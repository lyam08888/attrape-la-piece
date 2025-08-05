# 🎮 Attrape la Pièce - Jeu RPG Complet

Un jeu RPG 2D complet avec système de classes, équipements, quêtes, combat et ambiance immersive.

## 🚀 Démarrage Rapide

1. **Lancer le serveur local :**
   ```bash
   python -m http.server 8000
   ```

2. **Ouvrir le jeu :**
   Aller sur `http://localhost:8000` dans votre navigateur

3. **Commencer l'aventure :**
   - Cliquer sur "Démarrer le Jeu"
   - Choisir votre classe de personnage
   - Commencer à jouer !

## 🎯 Fonctionnalités Principales

### 🏛️ Système de Classes
- **Guerrier** : Spécialisé en combat rapproché et défense
- **Mage** : Maître de la magie et des sorts
- **Voleur** : Expert en agilité et attaques critiques  
- **Paladin** : Équilibre entre combat et magie divine

### ⚔️ Système de Combat
- Combat en temps réel contre divers ennemis
- Système de dégâts critiques
- Compétences spéciales par classe
- Effets visuels et sonores

### 🎒 Système d'Équipement
- Inventaire complet avec 40 emplacements
- Équipements par slot (arme, armure, accessoires)
- Système de rareté avec couleurs
- Bonus de stats automatiques

### 📜 Système de Quêtes
- Quêtes variées : combat, collection, exploration
- Système de prérequis
- Récompenses en XP et objets
- Suivi automatique du progrès

### 🌍 Monde Vivant
- Génération procédurale du terrain
- Système météorologique dynamique
- Cycle jour/nuit
- Effets de particules et d'ambiance

### 🎵 Système d'Ambiance
- Sons synthétiques (pas de fichiers externes)
- Musique d'ambiance contextuelle
- Effets sonores pour toutes les actions
- Contrôle du volume

## 🎮 Contrôles

### Mouvement
- **WASD** ou **Flèches** : Se déplacer
- **Espace** : Sauter / Attaquer
- **Shift** : Courir (consomme de l'endurance)

### Interface
- **Tab** : Basculer l'interface RPG
- **I** : Ouvrir/fermer l'inventaire
- **C** : Ouvrir/fermer le panneau personnage
- **J** : Ouvrir/fermer les quêtes
- **K** : Ouvrir/fermer les compétences
- **Escape** : Fermer toutes les fenêtres

### Actions Rapides
- **1-4** : Utiliser les potions des slots rapides
- **Q/W** : Utiliser les compétences de classe

### Système
- **F5** : Sauvegarder la partie
- **F9** : Charger la partie
- **M** : Activer/désactiver l'audio
- **F2** : Afficher/masquer les logs de debug

## 🏗️ Architecture du Code

### Fichiers Principaux
- `index.html` : Page principale du jeu
- `main.js` : Logique principale et initialisation
- `engine.js` : Moteur de jeu et boucle principale
- `player.js` : Logique du joueur
- `world.js` : Génération et gestion du monde

### Systèmes RPG
- `characterClasses.js` : Système de classes de personnage
- `equipmentSystem.js` : Gestion des équipements et inventaire
- `questSystem.js` : Système de quêtes complet
- `combatSystem.js` : Logique de combat
- `enemySystem.js` : IA et gestion des ennemis

### Interface et Ambiance
- `modularRPGInterface.js` : Interface utilisateur modulaire
- `ambianceSystem.js` : Sons, particules, météo, éclairage
- `rpg-interface.css` : Styles pour l'interface RPG

### Configuration
- `gameConfig.js` : Configuration centralisée du jeu

## 🎨 Personnalisation

### Ajouter une Nouvelle Classe
1. Modifier `characterClasses.js`
2. Ajouter les données de classe dans `CHARACTER_CLASSES`
3. Définir les compétences et bonus

### Créer de Nouveaux Ennemis
1. Modifier `enemySystem.js`
2. Ajouter le type d'ennemi dans `getEnemyData()`
3. Définir les stats et comportements

### Ajouter des Objets
1. Modifier `equipmentSystem.js`
2. Ajouter l'objet dans `EQUIPMENT_DATABASE`
3. Définir les stats et effets

### Créer des Quêtes
1. Modifier `questSystem.js`
2. Ajouter la quête dans `initializeQuests()`
3. Définir objectifs et récompenses

## 🔧 Configuration Avancée

Le fichier `gameConfig.js` permet de personnaliser :
- Vitesse du joueur et physique
- Nombre d'ennemis et difficulté
- Taille de l'inventaire
- Durée des cycles jour/nuit
- Volume audio par défaut
- Et bien plus...

## 🐛 Debug et Développement

### Logs de Debug
- Appuyer sur **F2** pour afficher les logs
- Niveaux : debug, info, warn, error

### Console de Développement
- Ouvrir les outils de développement (F12)
- Accéder à l'objet `game` global
- Modifier les propriétés en temps réel

### Commandes Utiles
```javascript
// Donner de l'XP
game.player.gainXP(1000, game);

// Ajouter un objet
game.equipmentManager.addToInventory('steel_sword', 1);

// Compléter une quête
game.questManager.completeQuest('first_blood', game.player, game);

// Changer la météo
game.ambianceSystem.weatherSystem.currentWeather = 'rain';
```

## 📱 Compatibilité

- **Navigateurs** : Chrome, Firefox, Safari, Edge (modernes)
- **Résolution** : Optimisé pour 1920x1080, responsive
- **Performance** : 60 FPS sur la plupart des appareils

## 🎯 Fonctionnalités Futures

- [ ] Multijoueur en ligne
- [ ] Plus de classes et compétences
- [ ] Système de guildes
- [ ] Donjons procéduraux
- [ ] Commerce entre joueurs
- [ ] Système de crafting avancé

## 🤝 Contribution

Le code est modulaire et bien documenté. Pour contribuer :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Tester vos modifications
4. Soumettre une pull request

## 📄 Licence

Ce projet est sous licence MIT. Libre d'utilisation et de modification.

---

**Amusez-vous bien dans votre aventure ! 🎮✨**