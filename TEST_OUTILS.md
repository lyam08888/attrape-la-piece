# Test des Outils - Guide de Vérification

## Fonctionnalités à Tester

### 1. Chargement des Assets d'Outils
- [ ] Les icônes d'outils s'affichent dans la barre d'outils
- [ ] Les assets PNG sont utilisés en priorité sur les icônes générées
- [ ] Aucune erreur de chargement dans la console

### 2. Sélection d'Outils
- [ ] **Clic** : Cliquer sur un outil dans la barre le sélectionne
- [ ] **Clavier** : Touches 1-7 sélectionnent les outils
- [ ] **Molette** : Molette de souris change l'outil sélectionné
- [ ] L'outil sélectionné est mis en surbrillance

### 3. Système de Minage
- [ ] **Clic gauche maintenu** : Mine les blocs à portée
- [ ] **Efficacité** : Différents outils minent différents blocs plus vite
- [ ] **Portée** : Ne peut miner que les blocs à 4 tuiles de distance
- [ ] **Particules** : Particules colorées selon le type de bloc
- [ ] **Main nue** : Peut miner terre, herbe, sable, feuilles

### 4. Durabilité des Outils
- [ ] **Barres de durabilité** : Visibles sous chaque outil
- [ ] **Couleurs** : Vert → Jaune → Rouge selon l'usure
- [ ] **Réduction** : Durabilité diminue en minant
- [ ] **Outils cassés** : Deviennent gris et semi-transparents
- [ ] **Efficacité réduite** : Outils cassés minent très lentement

### 5. Réparation d'Outils
- [ ] **Touche R** : Répare l'outil sélectionné si matériaux disponibles
- [ ] **Matériaux requis** : Fer pour outils métalliques, bois pour arc/canne
- [ ] **Réparation automatique** : Lente régénération au fil du temps
- [ ] **Messages** : Confirmations de réparation dans le log

### 6. Affichage des Informations
- [ ] **Panneau d'infos** : Sous la barre d'outils
- [ ] **Nom de l'outil** : Affiché clairement
- [ ] **Durabilité** : Chiffres et statut (Cassé, Usé, etc.)
- [ ] **Matériaux de réparation** : Indique ce qui est nécessaire
- [ ] **Instructions** : "Appuyez sur R pour réparer"

## Types d'Outils et Leurs Spécialités

### Pioche (Pickaxe)
- **Efficace sur** : Pierre, Charbon, Fer, Or, Diamant, Lapis, Granit, etc.
- **Durabilité** : 100
- **Réparation** : Fer

### Pelle (Shovel)
- **Efficace sur** : Terre, Herbe, Sable, Sable d'âme
- **Durabilité** : 80
- **Réparation** : Fer

### Hache (Axe)
- **Efficace sur** : Bois, Feuilles (tous types)
- **Durabilité** : 90
- **Réparation** : Fer

### Épée (Sword)
- **Efficace sur** : Feuilles, Combat
- **Durabilité** : 70
- **Réparation** : Fer

### Couteau (Knife)
- **Efficace sur** : Feuilles (moins efficace que l'épée)
- **Durabilité** : 60
- **Réparation** : Fer

### Arc (Bow)
- **Usage** : Combat à distance (futur)
- **Durabilité** : 50
- **Réparation** : Bois

### Canne à Pêche (Fishing Rod)
- **Usage** : Pêche (futur)
- **Durabilité** : 40
- **Réparation** : Bois

## Contrôles

- **1-7** : Sélection directe d'outil
- **Molette** : Cycle entre les outils
- **Clic** : Sélection par clic sur la barre
- **Clic gauche maintenu** : Minage
- **R** : Réparation d'outil
- **E** : Action alternative

## Messages de Debug

Ouvrez la console (F12) pour voir :
- Chargement des assets d'outils
- Sélection d'outils
- Progression du minage
- Réparations d'outils
- Erreurs éventuelles