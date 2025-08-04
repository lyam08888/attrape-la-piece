# 🪟 Système de Fenêtres Modulaires Windows 11

## 📋 Vue d'ensemble

Le jeu intègre maintenant un système de fenêtres modulaires inspiré de Windows 11, offrant une interface utilisateur moderne et intuitive pour gérer tous les aspects du jeu.

## 🎮 Fonctionnalités Principales

### Fenêtres Disponibles

1. **📦 Inventaire** (`I`) - Gestion des objets et équipements
2. **👤 Personnage** (`C`) - Statistiques et progression du joueur
3. **📜 Quêtes** (`Q`) - Suivi des missions et objectifs
4. **🗺️ Carte** (`M`) - Navigation dans le monde
5. **🔨 Artisanat** (`O`) - Création d'objets et équipements
6. **📖 Journal** (`J`) - Découvertes et lore du jeu
7. **🏪 Commerce** (`T`) - Échanges avec les marchands
8. **💬 Dialogue** - Conversations avec les PNJ

### Contrôles des Fenêtres

#### Raccourcis Clavier
- `I` - Ouvrir/Fermer l'inventaire
- `C` - Ouvrir/Fermer le personnage
- `Q` - Ouvrir/Fermer les quêtes
- `M` - Ouvrir/Fermer la carte
- `J` - Ouvrir/Fermer le journal
- `O` - Ouvrir/Fermer l'artisanat
- `T` - Ouvrir/Fermer le commerce
- `Échap` - Fermer toutes les fenêtres

#### Boutons de Fenêtre
- **➖ Minimiser** - Réduit la fenêtre dans la taskbar
- **🔲 Maximiser** - Agrandit la fenêtre en plein écran
- **❌ Fermer** - Ferme complètement la fenêtre

#### Interactions Souris
- **Glisser-déposer** - Déplacer les fenêtres par leur barre de titre
- **Redimensionner** - Utiliser les poignées de redimensionnement
- **Double-clic** - Sur la barre de titre pour maximiser/restaurer
- **Clic droit** - Menu contextuel (dans le contenu des fenêtres)

### Taskbar Intégrée

Une barre des tâches en bas de l'écran permet d'accéder rapidement à toutes les fenêtres :
- Clic pour ouvrir/fermer une fenêtre
- Indicateur visuel des fenêtres actives
- Style Windows 11 moderne

## 🎨 Interface Utilisateur

### Design Windows 11
- **Transparence** - Effet de flou et transparence moderne
- **Animations fluides** - Transitions et effets visuels
- **Thème sombre** - Interface adaptée au jeu
- **Icônes Font Awesome** - Iconographie cohérente

### Responsive Design
- Adaptation automatique à la taille d'écran
- Contraintes de redimensionnement intelligentes
- Interface tactile compatible

## 🔧 Architecture Technique

### Fichiers Principaux
- `simpleWindowManager.js` - Gestionnaire principal des fenêtres
- `modularUI.css` - Styles de base de l'interface
- `windows11-style.css` - Styles Windows 11 avancés

### Intégration
- **index.html** - Fenêtres HTML intégrées
- **game.js** - Initialisation du WindowManager
- **Système modulaire** - Compatible avec l'architecture existante

## 📊 Contenu des Fenêtres

### 📦 Inventaire
- Grille d'objets 8x5 (40 emplacements)
- Statistiques de poids et d'or
- Fonctions de tri et filtrage
- Glisser-déposer d'objets

### 👤 Personnage
- Statistiques vitales (Vie, Mana)
- Attributs (Force, Agilité, Intelligence)
- Équipement (6 emplacements)
- Système de progression

### 📜 Quêtes
- Liste des quêtes actives
- Barres de progression
- Récompenses détaillées
- Classification par type (Divine, Infernale, Collection)

### 🗺️ Carte
- Carte du monde verticale (Paradis → Enfer)
- Marqueurs de biomes
- Position du joueur en temps réel
- Contrôles de navigation

### 🔨 Artisanat
- Recettes disponibles
- Station d'artisanat 3x3
- Aperçu du résultat
- Système de matériaux

### 📖 Journal
- Onglets (Découvertes, Lore, Succès)
- Historique des événements
- Système de timestamps
- Progression des découvertes

### 🏪 Commerce
- Inventaire du marchand
- Inventaire du joueur
- Système d'achat/vente
- Affichage de l'or disponible

## 🚀 Utilisation

### Pour les Joueurs
1. Utilisez les raccourcis clavier pour un accès rapide
2. Organisez vos fenêtres selon vos préférences
3. Utilisez la taskbar pour naviguer entre les fenêtres
4. Le système sauvegarde automatiquement les positions

### Pour les Développeurs
```javascript
// Accès au gestionnaire de fenêtres
window.windowManager.showWindow('inventoryWindow');
window.windowManager.hideWindow('characterWindow');
window.windowManager.toggleWindow('questWindow');

// Notifications
window.windowManager.showNotification('Message', 'success');

// Contenu dynamique
window.windowManager.generateWindowContent('inventoryWindow');
```

## 🔄 Compatibilité

### Navigateurs Supportés
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Fonctionnalités Avancées
- Backdrop-filter (transparence)
- CSS Grid et Flexbox
- ES6 Modules
- Font Awesome 6.4+

## 🐛 Dépannage

### Problèmes Courants
1. **Fenêtres ne s'affichent pas** - Vérifier la console pour les erreurs JS
2. **Styles manquants** - S'assurer que les CSS sont chargés
3. **Raccourcis ne fonctionnent pas** - Vérifier que le jeu a le focus

### Debug
```javascript
// Vérifier l'état du système
console.log(window.windowManager.windows);
console.log(window.windowManager.activeWindow);
```

## 📈 Évolutions Futures

### Fonctionnalités Prévues
- [ ] Système d'onglets dans les fenêtres
- [ ] Fenêtres flottantes détachables
- [ ] Thèmes personnalisables
- [ ] Raccourcis configurables
- [ ] Sauvegarde des layouts
- [ ] Mode multi-écrans

### Améliorations
- [ ] Performance optimisée
- [ ] Animations plus fluides
- [ ] Accessibilité améliorée
- [ ] Support mobile complet

---

*Système développé pour Super Pixel Adventure 2 - Version 1.0*