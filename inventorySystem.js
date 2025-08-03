// inventorySystem.js - Système d'inventaire et de crafting

import { SURVIVAL_ITEMS } from './survivalItems.js';

export class InventoryItem {
    constructor(name, quantity = 1, metadata = {}) {
        this.name = name;
        this.quantity = quantity;
        this.metadata = metadata;
        this.maxStack = this.getMaxStack();
    }

    getMaxStack() {
        const stackSizes = {
            // Outils (ne se stackent pas)
            'pickaxe': 1, 'shovel': 1, 'axe': 1, 'sword': 1, 'knife': 1,
            'bow': 1, 'fishing_rod': 1,
            
            // Matériaux (se stackent)
            'wood': 64, 'stone': 64, 'dirt': 64, 'sand': 64,
            'coal': 64, 'iron': 64, 'gold': 64, 'diamond': 64,
            
            // Nourriture
            'bread': 16, 'apple': 16, 'meat': 16,
            
            // Autres
            'stick': 64, 'rope': 32
        };
        
        return stackSizes[this.name] || 64;
    }

    canStackWith(other) {
        return this.name === other.name && 
               JSON.stringify(this.metadata) === JSON.stringify(other.metadata) &&
               this.quantity < this.maxStack;
    }

    addQuantity(amount) {
        const canAdd = Math.min(amount, this.maxStack - this.quantity);
        this.quantity += canAdd;
        return amount - canAdd; // Retourne la quantité non ajoutée
    }
}

export class Inventory {
    constructor(size = 32) {
        this.size = size;
        this.slots = new Array(size).fill(null);
    }

    addItem(itemName, quantity = 1, metadata = {}) {
        let remaining = quantity;
        
        // D'abord, essayer de stack avec des items existants
        for (let i = 0; i < this.size && remaining > 0; i++) {
            const slot = this.slots[i];
            if (slot && slot.name === itemName && slot.canStackWith(new InventoryItem(itemName, 1, metadata))) {
                remaining = slot.addQuantity(remaining);
            }
        }
        
        // Ensuite, créer de nouveaux stacks si nécessaire
        while (remaining > 0) {
            const emptySlot = this.findEmptySlot();
            if (emptySlot === -1) break; // Inventaire plein
            
            const newItem = new InventoryItem(itemName, 0, metadata);
            const added = Math.min(remaining, newItem.maxStack);
            newItem.quantity = added;
            this.slots[emptySlot] = newItem;
            remaining -= added;
        }
        
        return remaining === 0; // Retourne true si tout a été ajouté
    }

    removeItem(itemName, quantity = 1) {
        let remaining = quantity;
        
        for (let i = 0; i < this.size && remaining > 0; i++) {
            const slot = this.slots[i];
            if (slot && slot.name === itemName) {
                const toRemove = Math.min(remaining, slot.quantity);
                slot.quantity -= toRemove;
                remaining -= toRemove;
                
                if (slot.quantity <= 0) {
                    this.slots[i] = null;
                }
            }
        }
        
        return quantity - remaining; // Retourne la quantité effectivement supprimée
    }

    hasItem(itemName, quantity = 1) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.name === itemName) {
                total += slot.quantity;
                if (total >= quantity) return true;
            }
        }
        return false;
    }

    getItemCount(itemName) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot && slot.name === itemName) {
                total += slot.quantity;
            }
        }
        return total;
    }

    findEmptySlot() {
        for (let i = 0; i < this.size; i++) {
            if (!this.slots[i]) return i;
        }
        return -1;
    }

    moveItem(fromSlot, toSlot) {
        if (fromSlot < 0 || fromSlot >= this.size || toSlot < 0 || toSlot >= this.size) {
            return false;
        }
        
        const fromItem = this.slots[fromSlot];
        const toItem = this.slots[toSlot];
        
        if (!fromItem) return false;
        
        if (!toItem) {
            // Slot de destination vide
            this.slots[toSlot] = fromItem;
            this.slots[fromSlot] = null;
        } else if (fromItem.canStackWith(toItem)) {
            // Stack avec l'item existant
            const remaining = toItem.addQuantity(fromItem.quantity);
            if (remaining === 0) {
                this.slots[fromSlot] = null;
            } else {
                fromItem.quantity = remaining;
            }
        } else {
            // Échanger les items
            this.slots[fromSlot] = toItem;
            this.slots[toSlot] = fromItem;
        }
        
        return true;
    }

    clear() {
        this.slots.fill(null);
    }

    serialize() {
        return this.slots.map(slot => slot ? {
            name: slot.name,
            quantity: slot.quantity,
            metadata: slot.metadata
        } : null);
    }

    deserialize(data) {
        this.slots = data.map(slotData => slotData ? 
            new InventoryItem(slotData.name, slotData.quantity, slotData.metadata) : 
            null
        );
    }
}

export class CraftingRecipe {
    constructor(id, pattern, result, shapeless = false) {
        this.id = id;
        this.pattern = pattern; // 3x3 array ou array d'ingrédients pour shapeless
        this.result = result; // { name, quantity, metadata }
        this.shapeless = shapeless;
    }

    matches(craftingGrid) {
        if (this.shapeless) {
            return this.matchesShapeless(craftingGrid);
        } else {
            return this.matchesShaped(craftingGrid);
        }
    }

    matchesShaped(craftingGrid) {
        // Vérifier si le pattern correspond exactement
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                const expected = this.pattern[y][x];
                const actual = craftingGrid[y * 3 + x];
                
                if (expected === null && actual !== null) return false;
                if (expected !== null && (actual === null || actual.name !== expected)) return false;
            }
        }
        return true;
    }

    matchesShapeless(craftingGrid) {
        const required = [...this.pattern];
        const available = craftingGrid.filter(item => item !== null).map(item => item.name);
        
        if (required.length !== available.length) return false;
        
        for (const item of available) {
            const index = required.indexOf(item);
            if (index === -1) return false;
            required.splice(index, 1);
        }
        
        return required.length === 0;
    }
}

export class CraftingSystem {
    constructor() {
        this.recipes = new Map();
        this.initializeRecipes();
    }

    initializeRecipes() {
        // Outils de base
        this.addRecipe(new CraftingRecipe('wooden_pickaxe', [
            ['wood', 'wood', 'wood'],
            [null, 'stick', null],
            [null, 'stick', null]
        ], { name: 'pickaxe', quantity: 1, metadata: { material: 'wood' } }));

        this.addRecipe(new CraftingRecipe('wooden_axe', [
            ['wood', 'wood', null],
            ['wood', 'stick', null],
            [null, 'stick', null]
        ], { name: 'axe', quantity: 1, metadata: { material: 'wood' } }));

        this.addRecipe(new CraftingRecipe('wooden_shovel', [
            [null, 'wood', null],
            [null, 'stick', null],
            [null, 'stick', null]
        ], { name: 'shovel', quantity: 1, metadata: { material: 'wood' } }));

        this.addRecipe(new CraftingRecipe('wooden_sword', [
            [null, 'wood', null],
            [null, 'wood', null],
            [null, 'stick', null]
        ], { name: 'sword', quantity: 1, metadata: { material: 'wood' } }));

        // Outils en pierre
        this.addRecipe(new CraftingRecipe('stone_pickaxe', [
            ['stone', 'stone', 'stone'],
            [null, 'stick', null],
            [null, 'stick', null]
        ], { name: 'pickaxe', quantity: 1, metadata: { material: 'stone' } }));

        // Matériaux
        this.addRecipe(new CraftingRecipe('sticks', [
            [null, null, null],
            [null, 'wood', null],
            [null, 'wood', null]
        ], { name: 'stick', quantity: 4 }));

        this.addRecipe(new CraftingRecipe('planks', ['wood'], { name: 'wood', quantity: 4 }, true));

        // Nourriture
        this.addRecipe(new CraftingRecipe('bread', [
            ['wheat', 'wheat', 'wheat'],
            [null, null, null],
            [null, null, null]
        ], { name: 'bread', quantity: 1 }));

        // Blocs utilitaires
        this.addRecipe(new CraftingRecipe('crafting_table', [
            ['wood', 'wood', null],
            ['wood', 'wood', null],
            [null, null, null]
        ], { name: 'crafting_table', quantity: 1 }));

        this.addRecipe(new CraftingRecipe('chest', [
            ['wood', 'wood', 'wood'],
            ['wood', null, 'wood'],
            ['wood', 'wood', 'wood']
        ], { name: 'chest', quantity: 1 }));
    }

    addRecipe(recipe) {
        this.recipes.set(recipe.id, recipe);
    }

    craft(craftingGrid) {
        for (const recipe of this.recipes.values()) {
            if (recipe.matches(craftingGrid)) {
                return recipe.result;
            }
        }
        return null;
    }

    getAvailableRecipes(inventory) {
        const available = [];
        
        for (const recipe of this.recipes.values()) {
            if (this.canCraft(recipe, inventory)) {
                available.push(recipe);
            }
        }
        
        return available;
    }

    canCraft(recipe, inventory) {
        const required = new Map();
        
        if (recipe.shapeless) {
            recipe.pattern.forEach(item => {
                required.set(item, (required.get(item) || 0) + 1);
            });
        } else {
            recipe.pattern.flat().forEach(item => {
                if (item !== null) {
                    required.set(item, (required.get(item) || 0) + 1);
                }
            });
        }
        
        for (const [item, quantity] of required) {
            if (!inventory.hasItem(item, quantity)) {
                return false;
            }
        }
        
        return true;
    }
}

// Fonctions utilitaires pour l'interface
export function updateInventoryUI(inventory, game = null) {
    const inventoryGrid = document.getElementById('inventoryGrid');
    if (!inventoryGrid) return;

    inventoryGrid.innerHTML = '';

    for (let i = 0; i < inventory.size; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.dataset.slotIndex = i;

        // Autoriser le drop sur chaque slot
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', e => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');
            if (!data) return;

            if (data.startsWith('inv:')) {
                const from = parseInt(data.split(':')[1], 10);
                if (!isNaN(from)) {
                    inventory.moveItem(from, i);
                    updateInventoryUI(inventory, game);
                }
            } else if (data.startsWith('tool:') && game && game.player) {
                const index = parseInt(data.split(':')[1], 10);
                const toolName = game.player.tools[index];
                if (toolName && inventory.addItem(toolName, 1)) {
                    game.player.tools.splice(index, 1);
                    if (game.player.selectedToolIndex >= game.player.tools.length) {
                        game.player.selectedToolIndex = Math.max(0, game.player.tools.length - 1);
                    }
                    if (typeof game.updateToolbar === 'function') game.updateToolbar();
                    updateInventoryUI(inventory, game);
                }
            } else if (data.startsWith('chest:') && game && game.openChest) {
                const index = parseInt(data.split(':')[1], 10);
                const lootItem = game.openChest.loot[index];
                if (lootItem) {
                    const before = inventory.getItemCount(lootItem.item);
                    inventory.addItem(lootItem.item, lootItem.quantity);
                    const added = inventory.getItemCount(lootItem.item) - before;
                    if (added > 0) {
                        lootItem.quantity -= added;
                        game.logger?.log?.(`Trouvé: ${added}x ${lootItem.item}`);
                        if (SURVIVAL_ITEMS.some(item => item.toLowerCase().replace(/\s+/g, '_') === lootItem.item)) {
                            game.questSystem?.updateQuestProgress('collect_survival_items', { amount: 1 });
                            if (game.statistics) {
                                game.statistics.survivalItemsFound = (game.statistics.survivalItemsFound || 0) + 1;
                            }
                        }
                        if (lootItem.quantity <= 0) {
                            game.openChest.loot.splice(index, 1);
                        }
                        if (game.renderChestUI) game.renderChestUI();
                        updateInventoryUI(inventory, game);
                    }
                }
            }
        });

        const item = inventory.slots[i];
        if (item) {
            slot.draggable = true;
            slot.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', `inv:${i}`);
            });

            const icon = document.createElement('img');
            icon.src = `assets/${item.name}.png`;
            icon.onerror = () => {
                // Fallback vers une icône générée
                icon.style.display = 'none';
                const text = document.createElement('div');
                text.textContent = item.name.substring(0, 2).toUpperCase();
                text.style.fontSize = '10px';
                text.style.color = '#fff';
                slot.appendChild(text);
            };
            slot.appendChild(icon);

            if (item.quantity > 1) {
                const quantity = document.createElement('div');
                quantity.textContent = item.quantity;
                quantity.style.position = 'absolute';
                quantity.style.bottom = '2px';
                quantity.style.right = '2px';
                quantity.style.fontSize = '10px';
                quantity.style.color = '#fff';
                quantity.style.textShadow = '1px 1px 0 #000';
                slot.style.position = 'relative';
                slot.appendChild(quantity);
            }
        }

        inventoryGrid.appendChild(slot);
    }
}

export function initializeCraftingUI(craftingSystem) {
    const craftingGrid = document.getElementById('craftingGrid');
    const resultSlot = document.getElementById('resultSlot');
    
    if (!craftingGrid || !resultSlot) return;

    // Créer la grille de crafting 3x3
    craftingGrid.innerHTML = '';
    const craftingSlots = [];
    
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.dataset.craftingIndex = i;
        craftingGrid.appendChild(slot);
        craftingSlots.push(slot);
    }

    // Fonction pour mettre à jour le résultat du crafting
    const updateCraftingResult = () => {
        const grid = craftingSlots.map(slot => {
            const item = slot.dataset.item;
            return item ? { name: item } : null;
        });
        
        const result = craftingSystem.craft(grid);
        
        resultSlot.innerHTML = '';
        if (result) {
            const icon = document.createElement('img');
            icon.src = `assets/${result.name}.png`;
            icon.onerror = () => {
                icon.style.display = 'none';
                const text = document.createElement('div');
                text.textContent = result.name.substring(0, 2).toUpperCase();
                text.style.fontSize = '10px';
                text.style.color = '#fff';
                resultSlot.appendChild(text);
            };
            resultSlot.appendChild(icon);
            
            if (result.quantity > 1) {
                const quantity = document.createElement('div');
                quantity.textContent = result.quantity;
                quantity.style.position = 'absolute';
                quantity.style.bottom = '2px';
                quantity.style.right = '2px';
                quantity.style.fontSize = '10px';
                quantity.style.color = '#fff';
                quantity.style.textShadow = '1px 1px 0 #000';
                resultSlot.style.position = 'relative';
                resultSlot.appendChild(quantity);
            }
            
            resultSlot.dataset.result = JSON.stringify(result);
        }
    };

    // Ajouter les événements de drag & drop (simplifié pour cet exemple)
    craftingSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            // Logique de placement d'items dans la grille de crafting
            updateCraftingResult();
        });
    });

    resultSlot.addEventListener('click', () => {
        // Logique pour récupérer l'item crafté
        const result = resultSlot.dataset.result;
        if (result) {
            // Ajouter l'item à l'inventaire et vider la grille de crafting
            updateCraftingResult();
        }
    });
}