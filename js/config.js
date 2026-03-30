/**
 * Phaser Game Configuration
 * Defines game window, physics, and scene management
 */

const gameConfig = {
    type: Phaser.AUTO, // WebGL with Canvas fallback
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#87CEEB', // Sky blue background
    
    // Responsive scaling
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720
    },
    
    // Physics not needed for this game (it's menu/UI driven)
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Set to true for development
        }
    },
    
    // Scene management (order matters for loading)
    scene: [
        BootScene,          // Asset loading and initialization
        TitleScene,         // Landing / title screen
        SetupScene,         // Household configuration
        ManagementScene,    // Main hub
        GroceryTravelScene, // Loading transition between scenes
        ShoppingMinigame,   // Shopping minigame
        CookingMinigame,    // Cooking minigame
        FridgeMinigame,     // Fridge organization minigame
        PlanningMinigame,   // Meal planning minigame
        SessionSummaryScene // Hidden score + end insights
    ],
    
    // DOM for overlays
    dom: {
        createContainer: true
    },
    
    // Audio settings
    audio: {
        disableWebAudio: false
    }
};

// Global game state (accessible across all scenes)
class GameState {
    constructor() {
        this.household = null;
        this.inventory = null;
        this.wasteModel = null;
        this.isInitialized = false;
        this.sessionSummary = null;
    }
    
    /**
     * Initialize game state with new household
     * @param {Object} config - Household configuration
     */
    initializeNew(config) {
        this.household = new Household(config);
        this.inventory = new Inventory();
        this.wasteModel = new StochasticModel();
        this.isInitialized = true;
        this.sessionSummary = null;
        
        console.log('🎮 Game state initialized');
    }
    
    /**
     * Load saved game state
     * @returns {boolean} True if load successful
     */
    load() {
        const household = Household.load();
        
        if (!household) {
            return false;
        }
        
        this.household = household;
        
        // Load inventory
        const savedInventory = localStorage.getItem('foodWasteSimulator_inventory');
        if (savedInventory) {
            this.inventory = Inventory.fromJSON(JSON.parse(savedInventory));
        } else {
            this.inventory = new Inventory();
        }
        
        this.wasteModel = new StochasticModel();
        this.isInitialized = true;
        this.sessionSummary = null;
        
        console.log('💾 Game state loaded');
        return true;
    }
    
    /**
     * Save entire game state
     */
    save() {
        if (!this.isInitialized) {
            console.warn('Cannot save - game not initialized');
            return;
        }
        
        this.household.save();
        localStorage.setItem('foodWasteSimulator_inventory', JSON.stringify(this.inventory.toJSON()));
        
        console.log('💾 Game state saved');
    }
    
    /**
     * Clear all saved data
     */
    clearSave() {
        Household.clearSave();
        localStorage.removeItem('foodWasteSimulator_inventory');
        this.isInitialized = false;
        this.sessionSummary = null;
        
        console.log('🗑️ All save data cleared');
    }
    
    /**
     * Advance to next day (runs daily simulation)
     * @returns {Object} Daily results
     */
    advanceDay() {
        if (!this.isInitialized) {
            console.error('Cannot advance day - game not initialized');
            return null;
        }
        
        // Update all item freshness
        this.inventory.updateAllFreshness(this.household.storageQuality);
        
        // Run waste simulation
        const wasteResults = this.wasteModel.calculateDailyWaste(this.household, this.inventory);
        
        // Update streak based on daily waste
        this.household.updateStreak(wasteResults.wasteWeight);
        
        // Check for achievements
        const newAchievements = this.household.checkAchievements();
        
        // Check for random events
        const randomEvent = this.wasteModel.generateRandomEvent(this.household);
        if (randomEvent) {
            this.wasteModel.applyEventEffects(randomEvent, this.household, this.inventory);
        }
        
        // Advance household day counter
        this.household.advanceDay();
        
        // End-of-session checkpoint
        const sessionComplete = this.household.hasReachedSessionEnd();
        if (sessionComplete) {
            this.household.sessionCompleted = true;
            this.sessionSummary = this.household.getSessionInsights();
        }
        
        // Auto-save
        this.save();
        
        return {
            day: this.household.day,
            wasteResults: wasteResults,
            randomEvent: randomEvent,
            newAchievements: newAchievements,
            stats: this.household.getStats(),
            sessionComplete: sessionComplete,
            sessionSummary: this.sessionSummary
        };
    }
}

// Create global game state instance
const gameState = new GameState();
