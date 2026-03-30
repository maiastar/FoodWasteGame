/**
 * Boot Scene
 * First scene that loads - handles asset loading and initialization
 */

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        console.log('🚀 BootScene: Loading assets...');
        
        // Create loading bar UI
        this.createLoadingUI();
        
        // Load food database
        this.load.json('foodDatabase', 'assets/data/food-database.json');
        
        // Load recipes
        this.load.json('recipes', 'assets/data/recipes.json');
        
        // Load educational content
        this.load.json('educationalContent', 'assets/data/educational-content.json');
        
        // Load hydra dialogue
        this.load.json('hydraDialogue', 'assets/data/hydra-dialogue.json');
        
        // Load hydra guide sprite
        this.load.image('hydraGuide', 'assets/sprites/Hydra Sprite.png');
        
        // TODO: Load sprite assets when we have them
        // this.load.atlas('food-items', 'assets/sprites/food-atlas.png', 'assets/sprites/food-atlas.json');
        
        // Track loading progress
        this.load.on('progress', (value) => {
            this.updateLoadingBar(value);
        });
        
        this.load.on('complete', () => {
            console.log('✅ All assets loaded');
        });
    }
    
    create() {
        console.log('🎮 BootScene: Initializing game...');
        
        // Check for saved game
        const hasSave = gameState.load();
        
        if (hasSave) {
            console.log('💾 Found saved game - going to management');
            if (gameState.household && gameState.household.sessionCompleted && gameState.household.getSessionInsights) {
                gameState.sessionSummary = gameState.household.getSessionInsights();
                this.scene.start('SessionSummaryScene', { summary: gameState.sessionSummary });
            } else {
                this.scene.start('ManagementScene');
            }
        } else {
            console.log('🆕 No saved game - starting setup');
            this.scene.start('SetupScene');
        }
    }
    
    /**
     * Create loading bar UI
     */
    createLoadingUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Title
        const title = this.add.text(width / 2, height / 2 - 100, '🍎 Food Waste Simulator', {
            fontSize: '48px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#333333',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        
        // Loading text
        this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff'
        });
        this.loadingText.setOrigin(0.5);
        
        // Progress bar background
        const barWidth = 400;
        const barHeight = 30;
        const barX = (width - barWidth) / 2;
        const barY = height / 2 + 50;
        
        const bgBar = this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333);
        bgBar.setOrigin(0, 0);
        
        // Progress bar fill
        this.progressBar = this.add.rectangle(barX + 5, barY + 5, 0, barHeight - 10, 0x4CAF50);
        this.progressBar.setOrigin(0, 0);
        
        this.maxBarWidth = barWidth - 10;
    }
    
    /**
     * Update loading bar progress
     * @param {number} value - Progress (0-1)
     */
    updateLoadingBar(value) {
        this.progressBar.width = this.maxBarWidth * value;
        this.loadingText.setText(`Loading... ${Math.floor(value * 100)}%`);
    }
    
    /**
     * Test screen to verify models are working
     */
    showTestScreen() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Clear loading UI
        this.children.removeAll();
        
        // Title
        this.add.text(width / 2, 80, '🎮 Phase 1 Complete!', {
            fontSize: '48px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Test the models
        const testConfig = {
            income: 'medium',
            familySize: 3,
            storeDistance: 'close',
            startingAwareness: 50
        };
        
        const testHousehold = new Household(testConfig);
        const testInventory = new Inventory();
        
        // Add some test food items
        const apple = new FoodItem({
            name: 'Apple',
            category: 'produce',
            price: 1.50,
            daysUntilSpoilage: 7,
            quantity: 3,
            dayPurchased: 1
        });
        
        const milk = new FoodItem({
            name: 'Milk',
            category: 'dairy',
            price: 3.99,
            daysUntilSpoilage: 7,
            quantity: 1,
            dayPurchased: 1
        });
        
        testInventory.addItem(apple);
        testInventory.addItem(milk);
        
        // Run stochastic model test
        const model = new StochasticModel();
        const wasteResults = model.calculateDailyWaste(testHousehold, testInventory);
        
        // Display test results
        const infoY = 180;
        const lineHeight = 35;
        let currentY = infoY;
        
        const infoTexts = [
            '✅ Core Models Loaded Successfully',
            '',
            '📊 Test Household:',
            `  Family: ${testHousehold.familySize} people (${testHousehold.income} income)`,
            `  Location: ${testHousehold.storeDistance} from store`,
            `  Waste Awareness: ${testHousehold.wasteAwareness}%`,
            `  Budget: $${testHousehold.budget.toFixed(2)}`,
            '',
            '🛒 Test Inventory:',
            `  Items: ${testInventory.getItemCount()}`,
            `  Total Value: $${testInventory.getTotalValue().toFixed(2)}`,
            `  Storage Quality: ${(testInventory.getStorageQuality() * 100).toFixed(0)}%`,
            '',
            '🧮 Stochastic Model Test:',
            `  Waste Multiplier: ${testHousehold.getCombinedWasteMultiplier().toFixed(2)}x`,
            `  Daily Waste: ${wasteResults.wasteWeight.toFixed(2)} lbs`,
            `  Waste Cost: $${wasteResults.wasteCost.toFixed(2)}`,
            '',
            '👉 Next: Implement scenes for gameplay'
        ];
        
        infoTexts.forEach(text => {
            this.add.text(width / 2, currentY, text, {
                fontSize: '20px',
                fontFamily: 'Fredoka, Arial',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            currentY += lineHeight;
        });
        
        // Instructions
        this.add.text(width / 2, height - 80, 'Press SPACE to see model details in console', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#FFD700'
        }).setOrigin(0.5);
        
        // Press space to log details
        this.input.keyboard.on('keydown-SPACE', () => {
            console.log('=== HOUSEHOLD EXPORT ===');
            console.log(testHousehold.export());
            console.log('=== INVENTORY SUMMARY ===');
            console.log(testInventory.getSummary());
            console.log('=== EDUCATIONAL STATS ===');
            console.log(model.getEducationalStats(testHousehold));
        });
    }
}
