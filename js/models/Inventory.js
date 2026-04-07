/**
 * Inventory Model
 * Manages all food items in household (pantry, fridge, freezer)
 * Handles adding, removing, organizing, and querying items
 */

class Inventory {
    constructor() {
        // All food items currently owned
        this.items = [];
        
        // Organization by location
        this.locations = {
            'pantry': [],
            'fridge': [],
            'freezer': [],
            'counter': []
        };
        
        // Quick lookup by category
        this.categories = {
            'produce': [],
            'dairy': [],
            'meat': [],
            'fish': [],
            'grains': [],
            'frozen': [],
            'canned': [],
            'condiments': [],
            'other': []
        };
    }
    
    /**
     * Add a food item to inventory
     * @param {FoodItem} item - Food item to add
     */
    addItem(item) {
        if (!(item instanceof FoodItem)) {
            console.error('Cannot add non-FoodItem to inventory');
            return;
        }
        
        this.items.push(item);
        this.updateLocationIndex(item);
        this.updateCategoryIndex(item);
        
        console.log(`➕ Added to inventory: ${item.name} (${item.quantity} servings)`);
    }
    
    /**
     * Add multiple items at once
     * @param {Array<FoodItem>} items - Array of food items
     */
    addItems(items) {
        items.forEach(item => this.addItem(item));
    }
    
    /**
     * Remove an item from inventory
     * @param {string} itemId - Item ID to remove
     * @returns {FoodItem|null} Removed item or null
     */
    removeItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        
        if (index === -1) {
            console.warn(`Item ${itemId} not found in inventory`);
            return null;
        }
        
        const item = this.items.splice(index, 1)[0];
        this.rebuildIndices();
        
        console.log(`➖ Removed from inventory: ${item.name}`);
        return item;
    }
    
    /**
     * Consume quantity from an item
     * @param {string} itemId - Item ID
     * @param {number} servings - Servings to consume
     * @returns {boolean} True if successful
     */
    consumeItem(itemId, servings = 1) {
        const item = this.getItemById(itemId);
        
        if (!item) {
            console.warn(`Cannot consume - item ${itemId} not found`);
            return false;
        }
        
        const success = item.consume(servings);
        
        // Remove item if fully consumed
        if (item.quantity <= 0) {
            this.removeItem(itemId);
        }
        
        return success;
    }
    
    /**
     * Get item by ID
     * @param {string} itemId - Item ID
     * @returns {FoodItem|null} Found item or null
     */
    getItemById(itemId) {
        return this.items.find(item => item.id === itemId) || null;
    }
    
    /**
     * Get items by location
     * @param {string} location - 'pantry', 'fridge', 'freezer', 'counter'
     * @returns {Array<FoodItem>} Items in that location
     */
    getItemsByLocation(location) {
        return this.items.filter(item => item.location === location);
    }
    
    /**
     * Get items by category
     * @param {string} category - Food category
     * @returns {Array<FoodItem>} Items in that category
     */
    getItemsByCategory(category) {
        return this.items.filter(item => item.category === category);
    }
    
    /**
     * Get items by status
     * @param {string} status - 'fresh', 'aging', 'expiring', 'spoiled'
     * @returns {Array<FoodItem>} Items with that status
     */
    getItemsByStatus(status) {
        return this.items.filter(item => item.getStatus() === status);
    }
    
    /**
     * Get all spoiled items
     * @returns {Array<FoodItem>} Spoiled items
     */
    getSpoiledItems() {
        return this.items.filter(item => item.isSpoiled());
    }
    
    /**
     * Get items expiring soon (within 1 day)
     * @returns {Array<FoodItem>} Items expiring soon
     */
    getExpiringSoonItems() {
        return this.items.filter(item => item.isExpiringSoon());
    }
    
    /**
     * Get items sorted by freshness (least fresh first - FIFO)
     * @returns {Array<FoodItem>} Sorted items
     */
    getItemsSortedByFreshness() {
        return [...this.items].sort(FoodItem.compareByFreshness);
    }
    
    /**
     * Get items sorted by category
     * @returns {Array<FoodItem>} Sorted items
     */
    getItemsSortedByCategory() {
        return [...this.items].sort(FoodItem.compareByCategory);
    }
    
    /**
     * Get total inventory count
     * @returns {number} Number of unique items
     */
    getItemCount() {
        return this.items.length;
    }
    
    /**
     * Get total servings available
     * @returns {number} Total servings across all items
     */
    getTotalServings() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    /**
     * Get total value of inventory
     * @returns {number} Total dollar value
     */
    getTotalValue() {
        return this.items.reduce((sum, item) => sum + item.getCurrentValue(), 0);
    }
    
    /**
     * Check if inventory contains an item by name
     * @param {string} itemName - Name to search for
     * @returns {boolean} True if item exists
     */
    hasItem(itemName) {
        return this.items.some(item => 
            item.name.toLowerCase() === itemName.toLowerCase() && !item.isSpoiled()
        );
    }

    /**
     * Check if an item exists in inventory regardless of spoilage.
     * Used for educational display ("you have this but it's spoiled").
     */
    hasItemAny(itemName) {
        return this.items.some(item =>
            item.name.toLowerCase() === itemName.toLowerCase()
        );
    }
    
    /**
     * Check if inventory has sufficient quantity of an item
     * @param {string} itemName - Item name
     * @param {number} requiredQuantity - Required servings
     * @returns {boolean} True if sufficient quantity available
     */
    hasSufficientQuantity(itemName, requiredQuantity) {
        const matchingItems = this.items.filter(item => 
            item.name.toLowerCase() === itemName.toLowerCase() && !item.isSpoiled()
        );
        
        const totalQuantity = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`    🔎 Looking for "${itemName}": found ${matchingItems.length} item(s), total qty: ${totalQuantity}, need: ${requiredQuantity}`);
        return totalQuantity >= requiredQuantity;
    }
    
    /**
     * Find best item to use for a recipe (prioritize expiring items)
     * @param {string} itemName - Item name needed
     * @returns {FoodItem|null} Best item to use
     */
    findBestItemForRecipe(itemName) {
        const matchingItems = this.items.filter(item => 
            item.name.toLowerCase() === itemName.toLowerCase() && !item.isSpoiled()
        );
        
        if (matchingItems.length === 0) {
            return null;
        }
        
        // Sort by freshness (use items expiring soonest first)
        matchingItems.sort(FoodItem.compareByFreshness);
        return matchingItems[0];
    }
    
    /**
     * Update all items' freshness (called daily)
     * @param {number} storageQuality - Overall storage quality (0-1)
     * @returns {Array} Array of update results
     */
    updateAllFreshness(storageQuality = 0.7) {
        const results = [];
        
        this.items.forEach(item => {
            const result = item.updateFreshness(storageQuality);
            results.push(result);
        });
        
        return results;
    }
    
    /**
     * Remove all spoiled items
     * @returns {Array<FoodItem>} Removed spoiled items
     */
    removeSpoiledItems() {
        const spoiled = this.getSpoiledItems();
        
        spoiled.forEach(item => {
            this.removeItem(item.id);
        });
        
        console.log(`🗑️ Removed ${spoiled.length} spoiled items`);
        return spoiled;
    }
    
    /**
     * Move item to new location
     * @param {string} itemId - Item ID
     * @param {string} newLocation - New location
     * @returns {boolean} True if successful
     */
    moveItemToLocation(itemId, newLocation) {
        const item = this.getItemById(itemId);
        
        if (!item) {
            return false;
        }
        
        item.moveToLocation(newLocation);
        this.rebuildIndices();
        return true;
    }
    
    /**
     * Set whether an item is properly stored
     * @param {string} itemId - Item ID
     * @param {boolean} isProper - True if properly stored
     */
    setItemStorageQuality(itemId, isProper) {
        const item = this.getItemById(itemId);
        
        if (item) {
            item.isProperlyStored = isProper;
        }
    }
    
    /**
     * Calculate overall storage quality score
     * @returns {number} Quality score (0-1)
     */
    getStorageQuality() {
        if (this.items.length === 0) {
            return 0.7; // Default if no items
        }
        
        const properlyStoredCount = this.items.filter(item => 
            item.isInCorrectLocation() && item.isProperlyStored
        ).length;
        
        return properlyStoredCount / this.items.length;
    }
    
    /**
     * Get inventory summary for display
     * @returns {Object} Summary statistics
     */
    getSummary() {
        return {
            totalItems: this.getItemCount(),
            totalServings: this.getTotalServings(),
            totalValue: this.getTotalValue(),
            freshItems: this.getItemsByStatus('fresh').length,
            agingItems: this.getItemsByStatus('aging').length,
            expiringItems: this.getItemsByStatus('expiring').length,
            spoiledItems: this.getItemsByStatus('spoiled').length,
            storageQuality: this.getStorageQuality(),
            
            byLocation: {
                pantry: this.getItemsByLocation('pantry').length,
                fridge: this.getItemsByLocation('fridge').length,
                freezer: this.getItemsByLocation('freezer').length,
                counter: this.getItemsByLocation('counter').length
            },
            
            byCategory: {
                produce: this.getItemsByCategory('produce').length,
                dairy: this.getItemsByCategory('dairy').length,
                meat: this.getItemsByCategory('meat').length,
                fish: this.getItemsByCategory('fish').length,
                grains: this.getItemsByCategory('grains').length,
                frozen: this.getItemsByCategory('frozen').length,
                canned: this.getItemsByCategory('canned').length,
                condiments: this.getItemsByCategory('condiments').length,
                other: this.getItemsByCategory('other').length
            }
        };
    }
    
    /**
     * Update location index for fast lookup
     * @param {FoodItem} item - Item to index
     * @private
     */
    updateLocationIndex(item) {
        if (this.locations[item.location]) {
            if (!this.locations[item.location].includes(item)) {
                this.locations[item.location].push(item);
            }
        }
    }
    
    /**
     * Update category index for fast lookup
     * @param {FoodItem} item - Item to index
     * @private
     */
    updateCategoryIndex(item) {
        if (this.categories[item.category]) {
            if (!this.categories[item.category].includes(item)) {
                this.categories[item.category].push(item);
            }
        }
    }
    
    /**
     * Rebuild all indices (call after bulk operations)
     * @private
     */
    rebuildIndices() {
        // Clear indices
        Object.keys(this.locations).forEach(key => this.locations[key] = []);
        Object.keys(this.categories).forEach(key => this.categories[key] = []);
        
        // Rebuild
        this.items.forEach(item => {
            this.updateLocationIndex(item);
            this.updateCategoryIndex(item);
        });
    }
    
    /**
     * Clear entire inventory
     */
    clear() {
        this.items = [];
        this.rebuildIndices();
        console.log('🗑️ Inventory cleared');
    }
    
    /**
     * Export to JSON for saving
     * @returns {Object} JSON-serializable object
     */
    toJSON() {
        return {
            items: this.items.map(item => item.toJSON())
        };
    }
    
    /**
     * Load inventory from JSON
     * @param {Object} json - JSON object
     * @returns {Inventory} Reconstructed inventory
     */
    static fromJSON(json) {
        const inventory = new Inventory();
        
        if (json.items) {
            json.items.forEach(itemData => {
                const item = FoodItem.fromJSON(itemData);
                inventory.addItem(item);
            });
        }
        
        return inventory;
    }
}

// Make available for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Inventory;
}
