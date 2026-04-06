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
        this.category = config.category || 'other';
        this.price = config.price || 0;
        
        // Freshness tracking (kept for display compatibility)
        this.daysUntilSpoilage = config.daysUntilSpoilage || 7;
        this.maxFreshness = this.daysUntilSpoilage;
        this.freshness = config.freshness !== undefined ? config.freshness : this.daysUntilSpoilage;
        
        // Exponential decay model: N(t) = 100 * e^(-k * dayAge), Ncrit = 40
        // k_base = ln(100/40) / daysUntilSpoilage = 0.916 / daysUntilSpoilage
        this.dayAge = config.dayAge || 0;
        this.qualityValue = config.qualityValue !== undefined ? config.qualityValue : 100;
        
        // Quantity (servings or units)
        this.quantity = config.quantity || 1;
        this.originalQuantity = config.originalQuantity || this.quantity;
        
        // Perishability rating (1-5, higher = spoils faster)
        this.perishability = config.perishability || this.calculatePerishability();
        
        // Storage
        this.location = config.location || this.getDefaultLocation();
        this.zoneName = config.zoneName || null;  // specific shelf, e.g. "Crisper Drawer"
        this.isProperlyStored = config.isProperlyStored !== undefined ? config.isProperlyStored : true;
        
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
     * Compute the spoilage rate constant k for this item.
     * k_base = ln(N0/Ncrit) / daysUntilSpoilage = ln(100/40) / maxFreshness ≈ 0.916 / maxFreshness
     * Storage multipliers reflect paper values: k_room/k_fridge = 0.25/0.10 = 2.5
     * @returns {number} k value
     */
    getSpoilageK() {
        const N0 = 100, Ncrit = 40;
        const kBase = Math.log(N0 / Ncrit) / Math.max(1, this.maxFreshness);
        
        if (this.location === 'freezer') return kBase * 0.1;
        if (!this.isProperlyStored) return kBase * 1.5;
        // Items that should be cold but are left at room temp decay 2.5x faster
        const shouldBeCold = ['fridge', 'freezer'].includes(this.getDefaultLocation());
        if (shouldBeCold && this.location === 'counter') return kBase * 2.5;
        return kBase;
    }

    /**
     * Update quality using first-order exponential decay: N(t) = 100 * e^(-k * dayAge)
     * Called daily by simulation. Also keeps freshness counter in sync for UI display.
     * @param {number} storageQuality - Quality of storage (0-1, used for legacy compatibility)
     * @returns {Object} Update result with status and qualityValue
     */
    updateFreshness(storageQuality = 0.7) {
        this.dayAge += 1;
        
        const k = this.getSpoilageK();
        this.qualityValue = Math.max(0, 100 * Math.exp(-k * this.dayAge));
        
        // Keep freshness in sync as approximate days remaining until Ncrit=40
        // daysRemaining = (ln(qualityValue) - ln(40)) / k  if quality > 40, else 0
        if (this.qualityValue > 40) {
            this.freshness = Math.max(0, (Math.log(this.qualityValue) - Math.log(40)) / k);
        } else {
            this.freshness = 0;
        }
        
        return {
            id: this.id,
            name: this.name,
            qualityValue: this.qualityValue,
            freshness: this.freshness,
            status: this.getStatus()
        };
    }
    
    /**
     * Get freshness status based on exponential quality value (Ncrit = 40)
     * Thresholds: fresh > 70, aging 50-70, expiring 40-50, spoiled <= 40
     * @returns {string} Status: 'fresh', 'aging', 'expiring', 'spoiled'
     */
    getStatus() {
        if (this.qualityValue <= 40) return 'spoiled';
        if (this.qualityValue <= 50) return 'expiring';
        if (this.qualityValue <= 70) return 'aging';
        return 'fresh';
    }
    
    /**
     * Get food quality as a percentage (0-100), directly from N(t)
     * @returns {number} qualityValue (0-100)
     */
    getFreshnessPercentage() {
        return Math.max(0, Math.min(100, this.qualityValue));
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
     * Check if item is spoiled (quality below Ncrit = 40)
     * @returns {boolean} True if spoiled
     */
    isSpoiled() {
        return this.qualityValue <= 40;
    }
    
    /**
     * Check if item is expiring soon (quality in 40-60 danger zone)
     * @returns {boolean} True if expiring soon
     */
    isExpiringSoon() {
        return this.qualityValue > 40 && this.qualityValue <= 60;
    }
    
    /**
     * Calculate spoilage probability based on quality value N(t).
     * Items near Ncrit=40 have high probability; well above it have low probability.
     * @param {number} storageQuality - Storage quality (0-1)
     * @returns {number} Probability of spoiling (0-1)
     */
    getSpoilageProbability(storageQuality = 0.7) {
        let probability;
        
        if (this.qualityValue <= 40) {
            probability = 1.0;        // Already at/below Ncrit — definitely waste
        } else if (this.qualityValue <= 50) {
            probability = 0.45;       // Just above threshold — very high risk
        } else if (this.qualityValue <= 60) {
            probability = 0.20;       // Approaching threshold — moderate risk
        } else if (this.qualityValue <= 70) {
            probability = 0.08;       // Aging but manageable
        } else {
            probability = 0.02;       // Fresh — minimal risk
        }
        
        // Storage quality modifier (properly stored = reduced risk)
        if (!this.isProperlyStored) {
            probability *= 1.5;
        } else {
            probability *= (2.0 - storageQuality);
        }
        
        // Freezer dramatically slows spoilage
        if (this.location === 'freezer') {
            probability *= 0.05;
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
        // Storage location change affects the k multiplier on the NEXT updateFreshness call.
        // No manual freshness adjustment needed — the exponential model handles it automatically.
        if (newLocation === 'freezer' && oldLocation !== 'freezer') {
            console.log(`❄️ ${this.name} moved to freezer — decay rate reduced 10x`);
        } else if (oldLocation === 'freezer' && newLocation !== 'freezer') {
            console.log(`🔥 ${this.name} thawed — decay rate restored, use soon!`);
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
            qualityValue: Math.round(this.qualityValue),
            freshnessPercent: this.getFreshnessPercentage(),
            spoilageK: this.getSpoilageK().toFixed(3),
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
        const c = new FoodItem({
            name: this.name,
            category: this.category,
            price: this.price,
            daysUntilSpoilage: this.daysUntilSpoilage,
            quantity: this.quantity,
            originalQuantity: this.originalQuantity,
            perishability: this.perishability,
            location: this.location,
            isProperlyStored: this.isProperlyStored,
            dayPurchased: this.dayPurchased,
            dayAge: this.dayAge,
            qualityValue: this.qualityValue,
            freshness: this.freshness,
            spriteKey: this.spriteKey,
            color: this.color
        });
        c.id = this.id;
        return c;
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
            dayAge: this.dayAge,
            qualityValue: this.qualityValue,
            quantity: this.quantity,
            originalQuantity: this.originalQuantity,
            perishability: this.perishability,
            location: this.location,
            zoneName: this.zoneName,
            isProperlyStored: this.isProperlyStored,
            dayPurchased: this.dayPurchased,
            expirationDate: this.expirationDate,
            spriteKey: this.spriteKey,
            color: this.color
        };
    }
    
    /**
     * Create FoodItem from JSON (restores exponential decay state)
     * @param {Object} json - JSON object
     * @returns {FoodItem} Reconstructed food item
     */
    static fromJSON(json) {
        const item = new FoodItem(json);
        item.id = json.id;
        item.dayAge = json.dayAge || 0;
        item.qualityValue = json.qualityValue !== undefined ? json.qualityValue : 100;
        if (typeof item.qualityValue !== 'number' || !Number.isFinite(item.qualityValue)) {
            item.qualityValue = 100;
        }
        item.freshness = json.freshness !== undefined ? json.freshness : item.daysUntilSpoilage;
        if (typeof item.freshness !== 'number' || !Number.isFinite(item.freshness)) {
            item.freshness = item.daysUntilSpoilage;
        }
        if (json.quantity !== undefined && json.quantity !== null) {
            item.quantity = json.quantity;
        }
        item.originalQuantity = json.originalQuantity != null
            ? json.originalQuantity
            : (json.quantity != null ? json.quantity : item.originalQuantity);
        item.isProperlyStored = json.isProperlyStored !== undefined ? json.isProperlyStored : true;
        item.zoneName = json.zoneName || null;
        return item;
    }
    
    /**
     * Compare items for sorting by freshness
     * @param {FoodItem} a - First item
     * @param {FoodItem} b - Second item
     * @returns {number} Comparison result
     */
    static compareByFreshness(a, b) {
        return a.qualityValue - b.qualityValue; // Ascending (lowest quality first = soonest to spoil)
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
