/**
 * Setup Scene
 * Allows players to configure household parameters before starting
 * Kid-friendly UI with visual selections
 */

class SetupScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SetupScene' });
        
        // Selected parameters
        this.selectedIncome = 'medium';
        this.selectedFamilySize = 3;
        this.selectedStoreDistance = 'medium';
        this.selectedAgeRange = '9-12';
        this.selectedAwareness = 40;
    }
    
    create() {
        console.log('⚙️ SetupScene: Creating household configuration screen');
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0, 0);
        
        // Title
        this.add.text(width / 2, 60, '🏠 Set Up Your Household', {
            fontSize: '52px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#333333',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(width / 2, 120, 'Choose your family settings to begin!', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Create configuration sections
        const startY = 155;
        const sectionSpacing = 115;
        
        this.createFamilySizeSelector(width / 2, startY);
        this.createAgeRangeSelector(width / 2, startY + sectionSpacing);
        this.createIncomeSelector(width / 2, startY + sectionSpacing * 2);
        this.createStoreDistanceSelector(width / 2, startY + sectionSpacing * 3);
        
        // Start button
        this.createStartButton(width / 2, height - 62);
        
        // Back to title button (if we add title screen later)
        this.createBackButton(60, 60);
    }
    
    /**
     * Create family size selector
     */
    createFamilySizeSelector(x, y) {
        // Label
        this.add.text(x, y - 30, '👨‍👩‍👧‍👦 Household Size:', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Options (1-6 people)
        const options = [1, 2, 3, 4, 5, 6];
        const buttonSpacing = 90;
        const startX = x - (options.length * buttonSpacing) / 2 + buttonSpacing / 2;
        
        options.forEach((size, index) => {
            const btn = this.createOptionButton(
                startX + index * buttonSpacing,
                y + 20,
                size.toString(),
                size === this.selectedFamilySize
            );
            
            // Attach event to the background rectangle, not the container
            const bg = btn.getData('buttonBg');
            bg.on('pointerdown', () => {
                this.selectedFamilySize = size;
                this.refreshFamilySizeButtons();
            });
            
            btn.setData('familySize', size);
            btn.setData('type', 'familySizeButton');
        });
    }
    
    /**
     * Create age range selector
     */
    createAgeRangeSelector(x, y) {
        this.add.text(x, y - 30, '🧒 Age Range:', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const options = [
            { value: '4-8', label: '4-8' },
            { value: '9-12', label: '9-12' },
            { value: '13-15', label: '13-15' },
            { value: '16+', label: '16+' }
        ];
        
        const buttonSpacing = 130;
        const startX = x - (options.length * buttonSpacing) / 2 + buttonSpacing / 2;
        
        options.forEach((option, index) => {
            const btn = this.createOptionButton(
                startX + index * buttonSpacing,
                y + 20,
                option.label,
                option.value === this.selectedAgeRange,
                110
            );
            
            const bg = btn.getData('buttonBg');
            bg.on('pointerdown', () => {
                this.selectedAgeRange = option.value;
                this.refreshAgeRangeButtons();
            });
            
            btn.setData('ageRange', option.value);
            btn.setData('type', 'ageRangeButton');
        });
    }
    
    /**
     * Create income selector
     */
    createIncomeSelector(x, y) {
        // Label
        this.add.text(x, y - 30, '💰 Household Income:', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Options
        const options = [
            { value: 'low', label: 'Low', description: 'Careful budgeting' },
            { value: 'medium', label: 'Medium', description: 'Balanced budget' },
            { value: 'high', label: 'High', description: 'Flexible spending' }
        ];
        
        const buttonSpacing = 180;
        const startX = x - (options.length * buttonSpacing) / 2 + buttonSpacing / 2;
        
        options.forEach((option, index) => {
            const btn = this.createOptionButton(
                startX + index * buttonSpacing,
                y + 20,
                option.label,
                option.value === this.selectedIncome,
                140
            );
            
            // Attach event to the background rectangle, not the container
            const bg = btn.getData('buttonBg');
            bg.on('pointerdown', () => {
                this.selectedIncome = option.value;
                this.refreshIncomeButtons();
            });
            
            btn.setData('income', option.value);
            btn.setData('type', 'incomeButton');
            
            // Description text
            this.add.text(startX + index * buttonSpacing, y + 65, option.description, {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#ffffff'
            }).setOrigin(0.5);
        });
    }
    
    /**
     * Create store distance selector
     */
    createStoreDistanceSelector(x, y) {
        // Label
        this.add.text(x, y - 30, '🏪 Distance to Store:', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Options
        const options = [
            { value: 'close', label: 'Close', icon: '🚶' },
            { value: 'medium', label: 'Medium', icon: '🚗' },
            { value: 'far', label: 'Far', icon: '🚙' }
        ];
        
        const buttonSpacing = 180;
        const startX = x - (options.length * buttonSpacing) / 2 + buttonSpacing / 2;
        
        options.forEach((option, index) => {
            const btn = this.createOptionButton(
                startX + index * buttonSpacing,
                y + 20,
                `${option.icon} ${option.label}`,
                option.value === this.selectedStoreDistance,
                140
            );
            
            // Attach event to the background rectangle, not the container
            const bg = btn.getData('buttonBg');
            bg.on('pointerdown', () => {
                this.selectedStoreDistance = option.value;
                this.refreshStoreDistanceButtons();
            });
            
            btn.setData('storeDistance', option.value);
            btn.setData('type', 'storeDistanceButton');
        });
    }
    
    /**
     * Create a selectable option button
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} label - Button text
     * @param {boolean} selected - Is this option selected?
     * @param {number} width - Button width
     * @returns {Phaser.GameObjects.Container} Button container
     */
    createOptionButton(x, y, label, selected = false, width = 70) {
        const container = this.add.container(x, y);
        
        // Button background
        const bg = this.add.rectangle(0, 0, width, 60, selected ? 0x4CAF50 : 0xffffff, selected ? 1 : 0.8);
        bg.setStrokeStyle(4, selected ? 0xffffff : 0x333333);
        bg.setInteractive({ useHandCursor: true });
        
        // Button text
        const text = this.add.text(0, 0, label, {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: selected ? '#ffffff' : '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([bg, text]);
        container.setData('bg', bg);
        container.setData('text', text);
        container.setData('selected', selected);
        container.setData('buttonBg', bg); // Store reference for parent to use
        
        // Hover effects
        bg.on('pointerover', () => {
            if (!container.getData('selected')) {
                bg.setFillStyle(0xeeeeee);
            }
        });
        
        bg.on('pointerout', () => {
            if (!container.getData('selected')) {
                bg.setFillStyle(0xffffff, 0.8);
            }
        });
        
        return container;
    }
    
    /**
     * Refresh family size buttons to show selection
     */
    refreshFamilySizeButtons() {
        this.refreshButtons('familySizeButton', 'familySize', this.selectedFamilySize);
    }
    
    /**
     * Refresh income buttons to show selection
     */
    refreshIncomeButtons() {
        this.refreshButtons('incomeButton', 'income', this.selectedIncome);
    }
    
    /**
     * Refresh age range buttons to show selection
     */
    refreshAgeRangeButtons() {
        this.refreshButtons('ageRangeButton', 'ageRange', this.selectedAgeRange);
    }
    
    /**
     * Refresh store distance buttons to show selection
     */
    refreshStoreDistanceButtons() {
        this.refreshButtons('storeDistanceButton', 'storeDistance', this.selectedStoreDistance);
    }
    
    /**
     * Generic button refresh method
     * @param {string} type - Button type to refresh
     * @param {string} dataKey - Data key to check
     * @param {any} selectedValue - Currently selected value
     */
    refreshButtons(type, dataKey, selectedValue) {
        this.children.list.forEach(child => {
            if (child.getData && child.getData('type') === type) {
                const isSelected = child.getData(dataKey) === selectedValue;
                child.setData('selected', isSelected);
                
                const bg = child.getData('bg');
                const text = child.getData('text');
                
                if (bg && text) {
                    bg.setFillStyle(isSelected ? 0x4CAF50 : 0xffffff, isSelected ? 1 : 0.8);
                    bg.setStrokeStyle(4, isSelected ? 0xffffff : 0x333333);
                    text.setColor(isSelected ? '#ffffff' : '#333333');
                }
            }
        });
    }
    
    /**
     * Create start button
     */
    createStartButton(x, y) {
        const button = this.add.container(x, y);
        
        // Button background
        const bg = this.add.rectangle(0, 0, 300, 70, 0xFF9800);
        bg.setStrokeStyle(5, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        
        // Button text
        const text = this.add.text(0, 0, '▶️ Start Game!', {
            fontSize: '32px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        
        // Hover effects
        bg.on('pointerover', () => {
            bg.setFillStyle(0xFFA726);
            button.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0xFF9800);
            button.setScale(1);
        });
        
        // Click to start game
        bg.on('pointerdown', () => {
            this.startGame();
        });
        
        // Pulse animation
        this.tweens.add({
            targets: button,
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    /**
     * Create back button
     */
    createBackButton(x, y) {
        const button = this.add.container(x, y);
        
        const bg = this.add.circle(0, 0, 30, 0xffffff, 0.8);
        bg.setStrokeStyle(3, 0x333333);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, '←', {
            fontSize: '32px',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0xeeeeee);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0xffffff, 0.8);
        });
        
        bg.on('pointerdown', () => {
            this.scene.start('TitleScene');
        });
    }
    
    /**
     * Start the game with selected parameters
     */
    startGame() {
        console.log('🎮 Starting game with configuration:', {
            income: this.selectedIncome,
            familySize: this.selectedFamilySize,
            storeDistance: this.selectedStoreDistance,
            ageRange: this.selectedAgeRange,
            startingAwareness: this.selectedAwareness
        });
        
        // Initialize game state
        gameState.initializeNew({
            income: this.selectedIncome,
            familySize: this.selectedFamilySize,
            storeDistance: this.selectedStoreDistance,
            ageRange: this.selectedAgeRange,
            startingAwareness: this.selectedAwareness
        });
        
        // Seed hidden score from onboarding choices (not shown to player now)
        gameState.household.recordDecision('setup_profile', 0, {
            ageRange: this.selectedAgeRange,
            familySize: this.selectedFamilySize
        });
        
        // Save initial state
        gameState.save();
        
        // Transition to management scene
        this.cameras.main.fadeOut(500);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('ManagementScene');
            console.log('✅ Game initialized! Starting management scene.');
        });
    }
}
