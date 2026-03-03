/**
 * FoodItem Model
 * Represents a single food item with freshness tracking and spoilage logic
 */

class FoodItem {
    /**
     * Create a new food item
     * @param {Object} config - Item configuration
     */
    constructor(config) {
        // Core properties
        this.id = this.generateId();
        this.name = config.name || 'Unknown Item';
        this.category = config.category || 'other'; // 'produce', 'dairy', 'meat', 'grains', 'frozen', 'other'
        this.price = config.price || 0;
        
        // Freshness tracking
        this.daysUntilSpoilage = config.daysUntilSpoilage || 7;
        this.maxFreshness = this.daysUntilSpoilage; // Original freshness for comparison
        this.freshness = this.daysUntilSpoilage; // Current days remaining
        
        // Quantity (servings or units)
        this.quantity = config.quantity || 1;
        this.originalQuantity = this.quantity;
        
        // Perishability rating (1-5, higher = spoils faster)
        this.perishability = config.perishability || this.calculatePerishability();
        
        // Storage
        this.location = config.location || this.getDefaultLocation(); // 'pantry', 'fridge', 'freezer', 'counter'
        this.isProperlyStored = true; // Set by fridge minigame
        
        // Metadata
        this.dayPurchased = config.dayPurchased || 1;
        this.expirationDate = this.dayPurchased + this.daysUntilSpoilage;
        
        // Visual properties (for UI)
        this.spriteKey = config.spriteKey || this.name.toLowerCase().replace(/\s+/g, '-');
        this.color = config.color || this.getCategoryColor();
    }
    
    /**
     * Generate unique ID for this item
     * @returns {string} Unique identifier
     */
    generateId() {
        return `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Calculate perishability rating based on category
     * @returns {number} Perishability (1-5)
     */
    calculatePerishability() {
        const ratings = {
            'produce': 4,      // High - fruits/veggies spoil quickly
            'dairy': 3,        // Medium-high - milk, yogurt, cheese
            'meat': 5,         // Very high - must be careful
            'fish': 5,         // Very high - spoils fastest
            'grains': 1,       // Low - pasta, rice, bread (if dry)
            'frozen': 1,       // Low - stays fresh if kept frozen
            'canned': 1,       // Low - shelf-stable
            'condiments': 2,   // Low-medium - sauces, spreads
            'other': 2         // Default medium-low
        };
        return ratings[this.category] || 2;
    }
    
    /**
     * Get default storage location based on category
     * @returns {string} Storage location
     */
    getDefaultLocation() {
        const locations = {
            'produce': 'fridge',
            'dairy': 'fridge',
            'meat': 'fridge',
            'fish': 'fridge',
            'grains': 'pantry',
            'frozen': 'freezer',
            'canned': 'pantry',
            'condiments': 'fridge',
            'other': 'pantry'
        };
        return locations[this.category] || 'pantry';
    }
    
    /**
     * Get category color for visual coding
     * @returns {string} Hex color
     */
    getCategoryColor() {
        const colors = {
            'produce': '#4CAF50',    // Green
            'dairy': '#FFFFFF',      // White
            'meat': '#F44336',       // Red
            'fish': '#2196F3',       // Blue
            'grains': '#FFC107',     // Amber
            'frozen': '#00BCD4',     // Cyan
            'canned': '#9E9E9E',     // Grey
            'condiments': '#FF9800', // Orange
            'other': '#757575'       // Dark grey
        };
        return colors[this.category] || '#757575';
    }
    
    /**
     * Update freshness (called daily by simulation)
     * @param {number} storageQuality - Quality of storage (0-1)
     * @returns {Object} Update result with status
     */
    updateFreshness(storageQuality = 0.7) {
        // Calculate decay rate based on perishability and storage
        const baseDecay = 1.0; // Standard 1 day decay
        const perishabilityFactor = this.perishability / 3; // 0.33 - 1.66
        const storageFactor = this.isProperlyStored ? storageQuality : 0.5; // Poor storage = faster decay
        
        // Frozen items don't decay (or very slowly)
        if (this.location === 'freezer') {
            this.freshness -= 0.1; // Very slow decay even in freezer
        } else {
            const decayRate = baseDecay * perishabilityFactor * (2.0 - storageFactor);
            this.freshness -= decayRate;
        }
        
        return {
            id: this.id,
            name: this.name,
            freshness: this.freshness,
            status: this.getStatus()
        };
    }
    
    /**
     * Get freshness status
     * @returns {string} Status: 'fresh', 'aging', 'expiring', 'spoiled'
     */
    getStatus() {
        if (this.freshness <= 0) return 'spoiled';
        if (this.freshness <= 1) return 'expiring';
        if (this.freshness <= 2) return 'aging';
        return 'fresh';
    }
    
    /**
     * Get freshness percentage (for visual indicators)
     * @returns {number} Percentage (0-100)
     */
    getFreshnessPercentage() {
        return Math.max(0, Math.min(100, (this.freshness / this.maxFreshness) * 100));
    }
    
    /**
     * Get color based on freshness (for UI)
     * @returns {string} Hex color
     */
    getFreshnessColor() {
        const percentage = this.getFreshnessPercentage();
        
        if (percentage >= 60) return '#4CAF50'; // Green - fresh
        if (percentage >= 30) return '#FFC107'; // Yellow - aging
        if (percentage > 0) return '#FF5722';   // Orange-red - expiring
        return '#9E9E9E';                        // Grey - spoiled
    }
    
    /**
     * Check if item is spoiled
     * @returns {boolean} True if spoiled
     */
    isSpoiled() {
        return this.freshness <= 0;
    }
    
    /**
     * Check if item is expiring soon (1 day or less)
     * @returns {boolean} True if expiring soon
     */
    isExpiringSoon() {
        return this.freshness > 0 && this.freshness <= 1;
    }
    
    /**
     * Calculate spoilage probability (for stochastic model)
     * @param {number} storageQuality - Storage quality (0-1)
     * @returns {number} Probability of spoiling (0-1)
     */
    getSpoilageProbability(storageQuality = 0.7) {
        // Base probability from freshness
        let probability = 0;
        
        if (this.freshness <= 0) {
            probability = 1.0; // Already spoiled
        } else if (this.freshness <= 1) {
            probability = 0.6; // Very high risk
        } else if (this.freshness <= 2) {
            probability = 0.3; // Moderate risk
        } else if (this.freshness <= 3) {
            probability = 0.1; // Low risk
        } else {
            probability = 0.05; // Minimal risk
        }
        
        // Modify by storage quality
        if (!this.isProperlyStored) {
            probability *= 1.5; // Poor storage increases risk
        } else {
            probability *= (2.0 - storageQuality); // Good storage reduces risk
        }
        
        // Frozen items have very low spoilage risk
        if (this.location === 'freezer') {
            probability *= 0.1;
        }
        
        return Math.min(probability, 1.0);
    }
    
    /**
     * Consume some quantity of this item
     * @param {number} servings - Servings to consume
     * @returns {boolean} True if consumption successful
     */
    consume(servings = 1) {
        if (this.quantity <= 0) {
            console.warn(`Cannot consume ${this.name} - none left`);
            return false;
        }
        
        if (this.isSpoiled()) {
            console.warn(`Cannot consume ${this.name} - spoiled!`);
            return false;
        }
        
        const consumedAmount = Math.min(servings, this.quantity);
        this.quantity -= consumedAmount;
        
        console.log(`🍽️ Consumed ${consumedAmount} servings of ${this.name} (${this.quantity} remaining)`);
        return true;
    }
    
    /**
     * Move item to different storage location
     * @param {string} newLocation - 'pantry', 'fridge', 'freezer', 'counter'
     */
    moveToLocation(newLocation) {
        const oldLocation = this.location;
        this.location = newLocation;
        
        // Freezing extends freshness significantly
        if (newLocation === 'freezer' && oldLocation !== 'freezer') {
            this.freshness += 30; // Add 30 days when frozen
            console.log(`❄️ ${this.name} frozen - freshness extended`);
        }
        
        // Moving from freezer to thaw
        if (oldLocation === 'freezer' && newLocation !== 'freezer') {
            console.log(`🔥 ${this.name} thawed - use soon!`);
        }
    }
    
    /**
     * Check if item is in correct storage location
     * @returns {boolean} True if properly stored
     */
    isInCorrectLocation() {
        const correctLocation = this.getDefaultLocation();
        return this.location === correctLocation;
    }
    
    /**
     * Get display name with quantity
     * @returns {string} Display string
     */
    getDisplayName() {
        const quantityStr = this.quantity > 1 ? ` (${this.quantity})` : '';
        return `${this.name}${quantityStr}`;
    }
    
    /**
     * Get detailed info for tooltips
     * @returns {Object} Info object
     */
    getDetailedInfo() {
        return {
            name: this.name,
            category: this.category,
            quantity: this.quantity,
            price: `$${this.price.toFixed(2)}`,
            status: this.getStatus(),
            freshness: `${Math.max(0, this.freshness).toFixed(1)} days`,
            freshnessPercent: this.getFreshnessPercentage(),
            location: this.location,
            properlyStored: this.isInCorrectLocation(),
            dayPurchased: this.dayPurchased,
            expirationDate: this.expirationDate,
            perishability: this.perishability
        };
    }
    
    /**
     * Get educational tip about this item
     * @returns {string} Educational tip
     */
    getEducationalTip() {
        const tips = {
            'produce': 'Store fruits and veggies in the crisper drawer to keep them fresh longer!',
            'dairy': 'Keep dairy on middle shelves where temperature is most consistent.',
            'meat': 'Store raw meat on the bottom shelf to prevent drips onto other foods.',
            'fish': 'Fish should be eaten within 1-2 days or frozen immediately.',
            'grains': 'Dry grains can last months in the pantry - check for pests!',
            'frozen': 'Frozen foods can last months but check for freezer burn.',
            'canned': 'Canned goods last years but use before "best by" date for quality.',
            'condiments': 'Many condiments last months after opening if refrigerated.',
            'other': 'Check expiration dates and store food properly to reduce waste!'
        };
        return tips[this.category] || tips['other'];
    }
    
    /**
     * Calculate average weight per serving (for waste calculation)
     * @returns {number} Weight in pounds
     */
    getWeightPerServing() {
        const weights = {
            'produce': 0.5,      // ~0.5 lbs per serving
            'dairy': 0.25,       // ~0.25 lbs (1 cup milk)
            'meat': 0.5,         // ~0.5 lbs (8 oz)
            'fish': 0.5,         // ~0.5 lbs
            'grains': 0.125,     // ~0.125 lbs (2 oz dry pasta)
            'frozen': 0.3,       // Varies
            'canned': 0.4,       // ~0.4 lbs
            'condiments': 0.1,   // Small amounts
            'other': 0.3         // Default
        };
        return weights[this.category] || 0.3;
    }
    
    /**
     * Calculate total weight of this item
     * @returns {number} Total weight in pounds
     */
    getTotalWeight() {
        return this.quantity * this.getWeightPerServing();
    }
    
    /**
     * Calculate total value of remaining quantity
     * @returns {number} Value in dollars
     */
    getCurrentValue() {
        return (this.quantity / this.originalQuantity) * this.price;
    }
    
    /**
     * Clone this food item (useful for adding to inventory)
     * @returns {FoodItem} New instance with same properties
     */
    clone() {
        return new FoodItem({
            name: this.name,
            category: this.category,
            price: this.price,
            daysUntilSpoilage: this.daysUntilSpoilage,
            quantity: this.quantity,
            perishability: this.perishability,
            location: this.location,
            dayPurchased: this.dayPurchased,
            spriteKey: this.spriteKey,
            color: this.color
        });
    }
    
    /**
     * Export to JSON for saving
     * @returns {Object} JSON-serializable object
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            price: this.price,
            daysUntilSpoilage: this.daysUntilSpoilage,
            maxFreshness: this.maxFreshness,
            freshness: this.freshness,
            quantity: this.quantity,
            originalQuantity: this.originalQuantity,
            perishability: this.perishability,
            location: this.location,
            isProperlyStored: this.isProperlyStored,
            dayPurchased: this.dayPurchased,
            expirationDate: this.expirationDate,
            spriteKey: this.spriteKey,
            color: this.color
        };
    }
    
    /**
     * Create FoodItem from JSON
     * @param {Object} json - JSON object
     * @returns {FoodItem} Reconstructed food item
     */
    static fromJSON(json) {
        const item = new FoodItem(json);
        item.id = json.id;
        item.freshness = json.freshness;
        item.quantity = json.quantity;
        item.isProperlyStored = json.isProperlyStored;
        return item;
    }
    
    /**
     * Compare items for sorting by freshness
     * @param {FoodItem} a - First item
     * @param {FoodItem} b - Second item
     * @returns {number} Comparison result
     */
    static compareByFreshness(a, b) {
        return a.freshness - b.freshness; // Ascending (least fresh first)
    }
    
    /**
     * Compare items for sorting by category
     * @param {FoodItem} a - First item
     * @param {FoodItem} b - Second item
     * @returns {number} Comparison result
     */
    static compareByCategory(a, b) {
        return a.category.localeCompare(b.category);
    }
    
    /**
     * Compare items for sorting by expiration date
     * @param {FoodItem} a - First item
     * @param {FoodItem} b - Second item
     * @returns {number} Comparison result
     */
    static compareByExpirationDate(a, b) {
        return a.expirationDate - b.expirationDate;
    }
}

// Make available for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodItem;
}
