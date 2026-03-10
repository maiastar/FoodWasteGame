/**
 * Shopping Minigame Scene
 * Navigate grocery store, select items, manage budget
 * Teaches purchase planning and date checking
 */

class ShoppingMinigame extends Phaser.Scene {
    constructor() {
        super({ key: 'ShoppingMinigame' });
        
        this.household = null;
        this.inventory = null;
        this.cart = [];
        this.cartTotal = 0;
        this.availableItems = [];
        this.shoppingList = [];
        this.recipeCatalog = [];
        this.selectedPresetRecipes = [];
        this.planRecipesThisTrip = false;
    }
    
    create() {
        console.log('🛒 ShoppingMinigame: Starting shopping trip...');
        
        this.household = gameState.household;
        this.inventory = gameState.inventory;
        this.cart = [];
        this.cartTotal = 0;
        this.selectedPresetRecipes = [];
        this.planRecipesThisTrip = false;
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0xFFF8E1).setOrigin(0, 0);
        
        // Header
        this.createHeader();
        
        // Load food database
        const foodDatabase = this.cache.json.get('foodDatabase');
        this.availableItems = this.createStoreInventory(foodDatabase);
        
        const recipeData = this.cache.json.get('recipes');
        this.recipeCatalog = recipeData && recipeData.recipes ? recipeData.recipes : [];
        
        this.showPlanningPrompt(() => {
            if (this.planRecipesThisTrip) {
                this.showPresetRecipeSelector(() => {
                    this.generateShoppingList();
                    this.initializeShoppingInterface();
                });
            } else {
                this.generateShoppingList();
                this.initializeShoppingInterface();
            }
        });
    }
    
    /**
     * Create shopping interface once list is ready
     */
    initializeShoppingInterface() {
        
        // Create store layout
        this.createStore();
        
        // Create shopping UI
        this.createShoppingCart();
        this.createShoppingList();
        this.createBudgetDisplay();
        
        // Create checkout button
        this.createCheckoutButton();
        
        // Helpful tips
        this.createHintPanel();
        
        // Show hydra decision advice
        this.time.delayedCall(500, () => {
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                hydraGuide.showDecisionAdvice('shopping-entry', {
                    budget: this.household.budget,
                    listItems: this.shoppingList.length
                });
            }
        });
    }
    
    /**
     * Ask if player wants to plan recipes before shopping
     */
    showPlanningPrompt(onComplete) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.55).setOrigin(0, 0).setDepth(2900);
        overlay.setInteractive();
        
        const panel = this.add.rectangle(width / 2, height / 2, 760, 320, 0xffffff).setDepth(2901);
        panel.setStrokeStyle(4, 0x4CAF50);
        
        const title = this.add.text(width / 2, height / 2 - 90, 'Plan recipes before shopping?', {
            fontSize: '38px',
            fontFamily: 'Fredoka, Arial',
            color: '#2E7D32',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2902);
        
        const subtitle = this.add.text(width / 2, height / 2 - 40, 'This choice affects your shopping list.', {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#555555'
        }).setOrigin(0.5).setDepth(2902);
        
        const yesBtn = this.add.rectangle(width / 2 - 145, height / 2 + 60, 230, 58, 0x4CAF50).setDepth(2902);
        yesBtn.setStrokeStyle(3, 0xffffff);
        yesBtn.setInteractive({ useHandCursor: true });
        const yesText = this.add.text(width / 2 - 145, height / 2 + 60, 'Yes, plan', {
            fontSize: '26px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2903);
        
        const noBtn = this.add.rectangle(width / 2 + 145, height / 2 + 60, 230, 58, 0x9E9E9E).setDepth(2902);
        noBtn.setStrokeStyle(3, 0xffffff);
        noBtn.setInteractive({ useHandCursor: true });
        const noText = this.add.text(width / 2 + 145, height / 2 + 60, 'No, skip', {
            fontSize: '26px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2903);
        
        const cleanup = () => {
            overlay.destroy();
            panel.destroy();
            title.destroy();
            subtitle.destroy();
            yesBtn.destroy();
            yesText.destroy();
            noBtn.destroy();
            noText.destroy();
        };
        
        yesBtn.on('pointerdown', () => {
            this.planRecipesThisTrip = true;
            this.household.weeklyRecipePlanning = true;
            cleanup();
            onComplete();
        });
        
        noBtn.on('pointerdown', () => {
            this.planRecipesThisTrip = false;
            this.household.weeklyRecipePlanning = false;
            this.household.recordDecision('shopping_unplanned', -2, { reason: 'player_skipped_planning_prompt' });
            cleanup();
            onComplete();
        });
    }
    
    /**
     * Show preset recipes that shape shopping list
     */
    showPresetRecipeSelector(onComplete) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.65).setOrigin(0, 0).setDepth(3000);
        overlay.setInteractive();
        overlay.on('pointerdown', (_p, _x, _y, event) => { event.stopPropagation(); });
        
        const panel = this.add.rectangle(width / 2, height / 2, 860, 520, 0xffffff).setDepth(3001);
        panel.setStrokeStyle(4, 0x4CAF50);
        
        const modalTitle = this.add.text(width / 2, height / 2 - 210, '🧾 Pick Preset Recipes for This Week', {
            fontSize: '34px',
            fontFamily: 'Fredoka, Arial',
            color: '#2E7D32',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3002);
        
        const modalSubtitle = this.add.text(width / 2, height / 2 - 170, 'Choose up to 3 recipes. Your shopping list will adapt.', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#555555'
        }).setOrigin(0.5).setDepth(3002);
        
        const recipes = this.selectRandomRecipes(this.recipeCatalog, 6);
        const selectionText = this.add.text(width / 2, height / 2 + 145, 'Selected: 0/3', {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#2E7D32',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3002);
        
        const overlayObjects = [overlay, panel, modalTitle, modalSubtitle, selectionText];
        
        recipes.forEach((recipe, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = width / 2 - 200 + col * 400;
            const y = height / 2 - 90 + row * 78;
            
            const card = this.add.rectangle(x, y, 360, 64, 0xF5F5F5).setDepth(3002);
            card.setStrokeStyle(2, 0xCCCCCC);
            card.setInteractive({ useHandCursor: true });
            overlayObjects.push(card);
            
            const label = this.add.text(x, y, `${recipe.icon} ${recipe.name} (serves ${recipe.servings})`, {
                fontSize: '18px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(3003);
            overlayObjects.push(label);
            
            card.on('pointerdown', () => {
                const alreadySelected = this.selectedPresetRecipes.some(r => r.id === recipe.id);
                if (alreadySelected) {
                    this.selectedPresetRecipes = this.selectedPresetRecipes.filter(r => r.id !== recipe.id);
                    card.setFillStyle(0xF5F5F5);
                    card.setStrokeStyle(2, 0xCCCCCC);
                } else if (this.selectedPresetRecipes.length < 3) {
                    this.selectedPresetRecipes.push(recipe);
                    card.setFillStyle(0xE8F5E9);
                    card.setStrokeStyle(3, 0x4CAF50);
                }
                selectionText.setText(`Selected: ${this.selectedPresetRecipes.length}/3`);
            });
        });
        
        const continueBtn = this.add.rectangle(width / 2, height / 2 + 210, 280, 56, 0x4CAF50).setDepth(3002);
        continueBtn.setStrokeStyle(3, 0xffffff);
        continueBtn.setInteractive({ useHandCursor: true });
        overlayObjects.push(continueBtn);
        
        const continueLabel = this.add.text(width / 2, height / 2 + 210, 'Continue to Store', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3003);
        overlayObjects.push(continueLabel);
        
        let selectorDismissed = false;
        continueBtn.on('pointerdown', () => {
            if (selectorDismissed) return;
            selectorDismissed = true;
            const usingPlanning = this.selectedPresetRecipes.length > 0;
            this.household.recordDecision(
                usingPlanning ? 'shopping_planned' : 'shopping_unplanned',
                usingPlanning ? 8 : -4,
                { recipesSelected: this.selectedPresetRecipes.length }
            );
            this.household.presetRecipeIds = this.selectedPresetRecipes.map(r => r.id);
            overlayObjects.forEach(obj => {
                if (obj.disableInteractive) obj.disableInteractive();
                obj.destroy();
            });
            onComplete();
        });
    }
    
    /**
     * Select random recipes from list
     */
    selectRandomRecipes(recipes, count) {
        const pool = [...recipes].sort(() => Math.random() - 0.5);
        return pool.slice(0, Math.min(count, pool.length));
    }
    
    /**
     * Create header
     */
    createHeader() {
        const width = this.cameras.main.width;
        
        this.add.rectangle(0, 0, width, 70, 0x4CAF50).setOrigin(0, 0);
        
        this.add.text(30, 35, '🛒 Grocery Store', {
            fontSize: '36px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Exit button (no save)
        const exitBtn = this.add.text(width - 150, 35, '❌ Exit', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            backgroundColor: '#D32F2F',
            padding: { x: 15, y: 8 }
        }).setOrigin(1, 0.5);
        exitBtn.setInteractive({ useHandCursor: true });
        exitBtn.on('pointerdown', () => {
            console.log('Exiting shopping without saving...');
            this.scene.start('GroceryTravelScene', {
                direction: 'home',
                nextScene: 'ManagementScene'
            });
        });
        exitBtn.on('pointerover', () => exitBtn.setStyle({ backgroundColor: '#B71C1C' }));
        exitBtn.on('pointerout', () => exitBtn.setStyle({ backgroundColor: '#D32F2F' }));
        
        // Day indicator
        this.add.text(width - 30, 35, `Day ${this.household.day}`, {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff'
        }).setOrigin(1, 0.5);
    }
    
    /**
     * Generate shopping list based on household needs and current inventory
     */
    generateShoppingList() {
        this.shoppingList = [];
        
        if (this.planRecipesThisTrip && this.selectedPresetRecipes.length > 0) {
            const requiredIngredients = {};
            
            this.selectedPresetRecipes.forEach(recipe => {
                const servingsScale = Math.max(1, Math.ceil(this.household.familySize / Math.max(1, recipe.servings)));
                recipe.ingredients.forEach(ingredient => {
                    const needed = ingredient.quantity * servingsScale;
                    requiredIngredients[ingredient.name] = (requiredIngredients[ingredient.name] || 0) + needed;
                });
            });
            
            Object.keys(requiredIngredients).forEach(itemName => {
                const needed = Math.ceil(requiredIngredients[itemName]);
                if (!this.inventory.hasSufficientQuantity(itemName, needed)) {
                    this.shoppingList.push({
                        name: itemName,
                        needed: needed,
                        purchased: false
                    });
                }
            });
            
            console.log(`📝 Planned shopping list generated: ${this.shoppingList.length} items`);
            return;
        }
        
        const daysToShop = this.household.getShoppingFrequency();
        const totalServingsNeeded = this.household.getDailyServingsNeeded() * daysToShop;
        const currentServings = this.inventory.getTotalServings();
        
        // Need to shop if low on food
        const servingsDeficit = Math.max(0, totalServingsNeeded - currentServings);
        
        // Basic shopping list (simplified for prototype)
        const basicItems = [
            'Milk', 'Bread', 'Eggs', 'Chicken Breast',
            'Lettuce', 'Tomato', 'Onion', 'Pasta', 'Rice'
        ];
        
        // Filter items we already have sufficient quantity of
        basicItems.forEach(itemName => {
            const needed = Math.ceil(this.household.familySize * 0.5);
            if (!this.inventory.hasSufficientQuantity(itemName, needed)) {
                this.shoppingList.push({
                    name: itemName,
                    needed: needed,
                    purchased: false
                });
            }
        });
        
        console.log(`📝 Shopping list generated: ${this.shoppingList.length} items`);
    }
    
    /**
     * Create store inventory from database
     */
    createStoreInventory(foodDatabase) {
        const items = [];
        
        foodDatabase.foodItems.forEach(itemData => {
            // Create FoodItem instances for store
            const item = new FoodItem({
                name: itemData.name,
                category: itemData.category,
                price: itemData.avgPrice,
                daysUntilSpoilage: itemData.daysUntilSpoilage,
                quantity: 1,
                perishability: itemData.perishability,
                spriteKey: itemData.spriteKey,
                dayPurchased: this.household.day
            });
            
            item.educationalFact = itemData.educationalFact;
            items.push(item);
        });
        
        return items;
    }
    
    /**
     * Create store display with items
     */
    createStore() {
        const storeX = 30;
        const storeY = 90;
        const storeWidth = 750;
        const storeHeight = 550;
        
        // Store background
        const storeBg = this.add.rectangle(storeX, storeY, storeWidth, storeHeight, 0xffffff, 0.9);
        storeBg.setStrokeStyle(3, 0x333333);
        storeBg.setOrigin(0, 0);
        
        // Store title
        this.add.text(storeX + 20, storeY + 15, '🏪 Available Items (scroll down for more)', {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Create mask for scrollable area
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(storeX + 10, storeY + 60, storeWidth - 20, storeHeight - 70);
        const mask = maskShape.createGeometryMask();
        
        // Create container for scrollable content
        const scrollContainer = this.add.container(0, 0);
        scrollContainer.setMask(mask);
        
        // Create item grid
        const itemStartY = storeY + 130; // Moved down to fit properly in masked area
        const itemsPerRow = 4;
        const itemWidth = 160;
        const itemHeight = 140;
        const itemSpacingX = 180;
        const itemSpacingY = 150;
        
        this.availableItems.forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            
            const itemX = storeX + 110 + col * itemSpacingX; // Increased left padding
            const itemY = itemStartY + row * itemSpacingY;
            
            // Create all items (we'll handle scrolling)
            this.createStoreItem(itemX, itemY, item, scrollContainer);
        });
        
        // Store scroll container reference
        this.scrollContainer = scrollContainer;
        
        // Add scroll functionality
        this.scrollOffset = 0;
        this.maxScroll = Math.max(0, Math.ceil(this.availableItems.length / itemsPerRow) * itemSpacingY - storeHeight + 100);
        
        // Mouse wheel scrolling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (pointer.x >= storeX && pointer.x <= storeX + storeWidth &&
                pointer.y >= storeY && pointer.y <= storeY + storeHeight) {
                
                this.scrollOffset = Phaser.Math.Clamp(
                    this.scrollOffset + deltaY * 0.5,
                    0,
                    this.maxScroll
                );
                
                // Move all store items
                this.scrollContainer.setY(-this.scrollOffset);
            }
        });
        
        // Add up/down scroll buttons
        if (this.maxScroll > 0) {
            // Scroll indicator
            this.add.text(storeX + storeWidth / 2, storeY + storeHeight - 30, '⬇️ Scroll for more items ⬇️', {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#FF9800',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Up arrow button
            const upBtn = this.add.text(storeX + storeWidth - 40, storeY + 50, '⬆️', {
                fontSize: '32px',
                backgroundColor: '#ffffff',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
            upBtn.setInteractive({ useHandCursor: true });
            upBtn.on('pointerdown', () => {
                this.scrollOffset = Math.max(0, this.scrollOffset - 150);
                this.scrollContainer.setY(-this.scrollOffset);
            });
            
            // Down arrow button
            const downBtn = this.add.text(storeX + storeWidth - 40, storeY + storeHeight - 50, '⬇️', {
                fontSize: '32px',
                backgroundColor: '#ffffff',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
            downBtn.setInteractive({ useHandCursor: true });
            downBtn.on('pointerdown', () => {
                this.scrollOffset = Math.min(this.maxScroll, this.scrollOffset + 150);
                this.scrollContainer.setY(-this.scrollOffset);
            });
        }
    }
    
    /**
     * Create a single store item display
     */
    createStoreItem(x, y, foodItem, scrollContainer = null) {
        const container = this.add.container(x, y);
        
        // Add to scroll container if provided
        if (scrollContainer) {
            scrollContainer.add(container);
        }
        
        // Item background
        const bg = this.add.rectangle(0, 0, 150, 130, 0xf5f5f5);
        bg.setStrokeStyle(2, parseInt(foodItem.color.replace('#', '0x')));
        bg.setInteractive({ useHandCursor: true });
        
        // Item icon (using emoji for now, will be sprites later)
        const icons = {
            'produce': '🥬', 'dairy': '🥛', 'meat': '🥩', 
            'fish': '🐟', 'grains': '🍞', 'frozen': '❄️',
            'canned': '🥫', 'condiments': '🧂', 'other': '🍱'
        };
        const icon = icons[foodItem.category] || '🍱';
        
        const itemIcon = this.add.text(0, -30, icon, {
            fontSize: '48px'
        }).setOrigin(0.5);
        
        // Item name
        const itemName = this.add.text(0, 10, foodItem.name, {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold',
            wordWrap: { width: 140 },
            align: 'center'
        }).setOrigin(0.5);
        
        // Price
        const price = this.add.text(0, 35, `$${foodItem.price.toFixed(2)}`, {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#4CAF50',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Freshness indicator
        const freshness = this.add.text(0, 55, `Fresh: ${foodItem.daysUntilSpoilage}d`, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0.5);
        
        container.add([bg, itemIcon, itemName, price, freshness]);
        
        // Store reference for tooltip positioning
        container.setData('foodItem', foodItem);
        
        // Click to add to cart
        bg.on('pointerdown', () => {
            this.addItemToCart(foodItem);
        });
        
        // Hover effects (combined to avoid duplicate handlers)
        bg.on('pointerover', () => {
            bg.setFillStyle(0xe8e8e8);
            container.setScale(1.05);
            
            // Show tooltip
            if (foodItem.educationalFact) {
                this.showTooltip(foodItem.educationalFact, x, y - 80);
            }
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0xf5f5f5);
            container.setScale(1);
            
            // Hide tooltip
            this.hideTooltip();
        });
    }
    
    /**
     * Create shopping cart display
     */
    createShoppingCart() {
        const width = this.cameras.main.width;
        const cartX = width - 460;
        const cartY = 90;
        const cartWidth = 430;
        const cartHeight = 250; // Reduced from 350
        
        // Cart background
        this.cartPanel = this.add.rectangle(cartX, cartY, cartWidth, cartHeight, 0xffffff, 0.95);
        this.cartPanel.setStrokeStyle(3, 0x333333);
        this.cartPanel.setOrigin(0, 0);
        
        // Cart title
        this.add.text(cartX + 20, cartY + 15, '🛒 Your Cart', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Cart items will be added dynamically
        this.cartItemsY = cartY + 55;
        this.cartItemHeight = 35; // Reduced from 40 to fit better
        this.cartX = cartX;
    }
    
    /**
     * Create shopping list display
     */
    createShoppingList() {
        const width = this.cameras.main.width;
        const listX = width - 460;
        const listY = 360; // Moved up since cart is smaller
        const listWidth = 430;
        const listHeight = 168; // 40% larger (was 120, now 168)
        
        // List background
        this.add.rectangle(listX, listY, listWidth, listHeight, 0xE8F5E9, 0.95).setOrigin(0, 0);
        this.add.rectangle(listX, listY, listWidth, listHeight).setStrokeStyle(3, 0x4CAF50).setOrigin(0, 0);
        
        // List title
        this.listTitle = this.add.text(listX + 20, listY + 15, '📝 Shopping List', {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#2E7D32',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Store positions for dynamic updates
        this.listX = listX;
        this.listY = listY;
        this.listHeight = listHeight;
        
        // Initial render
        this.refreshShoppingListDisplay();
    }
    
    /**
     * Refresh shopping list display (call when items are purchased)
     */
    refreshShoppingListDisplay() {
        // Collect all list items to destroy (don't destroy during iteration)
        const toDestroy = [];
        this.children.list.forEach(child => {
            if (child.getData && child.getData('shoppingListItem')) {
                toDestroy.push(child);
            }
        });
        
        // Now safely destroy them
        toDestroy.forEach(child => child.destroy());
        
        // Sort list: unpurchased items first, then purchased
        const unpurchased = this.shoppingList.filter(item => !item.purchased);
        const purchased = this.shoppingList.filter(item => item.purchased);
        const sortedList = [...unpurchased, ...purchased];
        
        // Show first 4 items with better spacing (was 5)
        const listItemY = this.listY + 50;
        const lineHeight = 28; // Increased from 25 for better readability
        sortedList.slice(0, 4).forEach((item, index) => {
            // Count how many of this item are in cart
            const inCart = this.cart.filter(cartItem => 
                cartItem.name.toLowerCase() === item.name.toLowerCase()
            ).length;
            
            const checkmark = item.purchased ? '✅' : '⬜';
            const progress = `(${inCart}/${item.needed})`;
            const text = this.add.text(this.listX + 20, listItemY + index * lineHeight, `${checkmark} ${item.name} ${progress}`, {
                fontSize: '15px', // Slightly reduced from 16px
                fontFamily: 'Fredoka, Arial',
                color: item.purchased ? '#4CAF50' : '#333333',
                fontStyle: item.purchased ? 'normal' : 'bold'
            }).setOrigin(0, 0);
            text.setData('shoppingListItem', true);
        });
        
        // Show counts if more items
        if (this.shoppingList.length > 4) {
            const remainingTotal = this.shoppingList.length - 4;
            const remainingUnchecked = unpurchased.length - Math.min(4, unpurchased.length);
            
            let countText = `...and ${remainingTotal} more`;
            if (remainingUnchecked > 0) {
                countText += ` (${remainingUnchecked} needed)`;
            }
            
            const moreText = this.add.text(this.listX + 20, listItemY + 4 * lineHeight, countText, {
                fontSize: '13px',
                fontFamily: 'Fredoka, Arial',
                color: '#666666',
                fontStyle: 'italic'
            }).setOrigin(0, 0);
            moreText.setData('shoppingListItem', true);
        }
        
        // Show completion percentage (top right)
        const completedCount = purchased.length;
        const totalCount = this.shoppingList.length;
        const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        
        const completionText = this.add.text(this.listX + this.listWidth - 20, this.listY + 15, 
            `${completionPercent}% (${completedCount}/${totalCount})`, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: completionPercent >= 80 ? '#4CAF50' : '#666666',
            fontStyle: 'bold'
        }).setOrigin(1, 0);
        completionText.setData('shoppingListItem', true);
    }
    
    /**
     * Create budget display
     */
    createBudgetDisplay() {
        const width = this.cameras.main.width;
        const budgetX = width - 460;
        const budgetY = 548; // Adjusted for new list height (360 + 168 + 20)
        
        // Budget background (both need setOrigin for consistent positioning)
        this.add.rectangle(budgetX, budgetY, 430, 40, 0xFFECB3, 0.95).setOrigin(0, 0);
        this.add.rectangle(budgetX, budgetY, 430, 40).setStrokeStyle(3, 0xFF9800).setOrigin(0, 0);
        
        // Budget text
        this.budgetText = this.add.text(budgetX + 20, budgetY + 20, 
            `💰 Budget: $${this.household.budget.toFixed(2)} | Cart: $${this.cartTotal.toFixed(2)}`, {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#E65100',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
    }
    
    /**
     * Create checkout button
     */
    createCheckoutButton() {
        const width = this.cameras.main.width;
        const btnX = width - 245;
        const btnY = 660;
        
        const button = this.add.container(btnX, btnY);
        
        const bg = this.add.rectangle(0, 0, 380, 60, 0x4CAF50);
        bg.setStrokeStyle(4, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, '✅ Checkout', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0x66BB6A);
            button.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x4CAF50);
            button.setScale(1);
        });
        
        bg.on('pointerdown', () => {
            this.checkout();
        });
    }
    
    /**
     * Create hint panel
     */
    createHintPanel() {
        const hints = [
            '💡 Check expiration dates!',
            '💡 Compare prices between items',
            '💡 Buy what you need, not impulse items',
            '💡 Fresh food needs to be used soon'
        ];
        
        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        
        this.add.text(30, 660, randomHint, {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#FF9800',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
    }
    
    /**
     * Add item to cart
     */
    addItemToCart(foodItem) {
        // Check budget
        if (this.cartTotal + foodItem.price > this.household.budget) {
            console.warn('⚠️ Not enough budget!');
            this.showWarning('Not enough budget!', 0xFF5252);
            return;
        }
        
        // Clone the item for the cart
        const cartItem = foodItem.clone();
        this.cart.push(cartItem);
        this.cartTotal += cartItem.price;
        
        console.log(`➕ Added to cart: ${cartItem.name} ($${cartItem.price.toFixed(2)})`);
        
        // Check if item was on shopping list and update purchased status
        const listItem = this.shoppingList.find(item => 
            item.name.toLowerCase() === cartItem.name.toLowerCase()
        );
        if (listItem) {
            // Count how many of this item are now in cart
            const cartItemCount = this.cart.filter(ci => 
                ci.name.toLowerCase() === cartItem.name.toLowerCase()
            ).length;
            
            // Mark as purchased only if we have enough
            const wasPurchased = listItem.purchased;
            listItem.purchased = cartItemCount >= listItem.needed;
            
            // Visual feedback only when requirement is fully met
            if (listItem.purchased && !wasPurchased) {
                this.showListItemFeedback(cartItem.name);
            }
        }
        
        // Refresh displays
        this.refreshCartDisplay();
        this.refreshBudgetDisplay();
        this.refreshShoppingListDisplay();
        
        // Visual feedback
        this.tweens.add({
            targets: this.cartPanel,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100,
            yoyo: true
        });
    }
    
    /**
     * Refresh cart item display
     */
    refreshCartDisplay() {
        // Collect all cart items to destroy (don't destroy during iteration)
        const toDestroy = [];
        this.children.list.forEach(child => {
            if (child.getData && child.getData('cartItem')) {
                toDestroy.push(child);
            }
        });
        
        // Now safely destroy them
        toDestroy.forEach(child => child.destroy());
        
        // Display cart items
        const cartX = this.cameras.main.width - 440;
        const maxVisible = 5; // Reduced from 6 for better spacing
        
        this.cart.slice(-maxVisible).forEach((item, index) => {
            const y = this.cartItemsY + index * this.cartItemHeight;
            
            // Truncate long item names to fit
            let displayName = item.name;
            if (displayName.length > 15) {
                displayName = displayName.substring(0, 12) + '...';
            }
            
            const itemText = this.add.text(cartX, y, 
                `${displayName} - $${item.price.toFixed(2)}`, {
                fontSize: '16px', // Reduced from 18px
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                wordWrap: { width: 320 }
            }).setOrigin(0, 0);
            
            itemText.setData('cartItem', true);
            
            // Remove button (positioned to stay within cart bounds)
            const removeBtn = this.add.text(cartX + 360, y, '❌', {
                fontSize: '16px'
            }).setOrigin(0, 0);
            removeBtn.setInteractive({ useHandCursor: true });
            removeBtn.setData('cartItem', true);
            
            removeBtn.on('pointerdown', () => {
                this.removeFromCart(item.id);
            });
        });
        
        // Show count if more items (positioned to fit within cart bounds)
        if (this.cart.length > maxVisible) {
            const moreText = this.add.text(cartX, this.cartItemsY + (maxVisible * this.cartItemHeight) - 5,
                `...and ${this.cart.length - maxVisible} more items`, {
                fontSize: '13px',
                fontFamily: 'Fredoka, Arial',
                color: '#666666',
                fontStyle: 'italic'
            }).setOrigin(0, 0);
            moreText.setData('cartItem', true);
        }
    }
    
    /**
     * Remove item from cart
     */
    removeFromCart(itemId) {
        const index = this.cart.findIndex(item => item.id === itemId);
        
        if (index !== -1) {
            const item = this.cart[index];
            this.cartTotal -= item.price;
            this.cart.splice(index, 1);
            
            console.log(`➖ Removed from cart: ${item.name}`);
            
            // Update shopping list item status based on remaining cart quantity
            const cartItemCount = this.cart.filter(cartItem => 
                cartItem.name.toLowerCase() === item.name.toLowerCase()
            ).length;
            
            const listItem = this.shoppingList.find(listItem => 
                listItem.name.toLowerCase() === item.name.toLowerCase()
            );
            if (listItem) {
                // Mark as purchased only if cart quantity meets needed quantity
                listItem.purchased = cartItemCount >= listItem.needed;
            }
            
            this.refreshCartDisplay();
            this.refreshBudgetDisplay();
            this.refreshShoppingListDisplay();
        }
    }
    
    /**
     * Show visual feedback when list item is checked off
     */
    showListItemFeedback(itemName) {
        const width = this.cameras.main.width;
        
        const feedback = this.add.text(width - 245, 520, `✅ ${itemName} checked off list!`, {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#4CAF50',
            fontStyle: 'bold',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        feedback.setDepth(5000);
        
        // Fade out after 1.5 seconds
        this.tweens.add({
            targets: feedback,
            alpha: 0,
            duration: 500,
            delay: 1500,
            onComplete: () => feedback.destroy()
        });
    }
    
    /**
     * Refresh budget display
     */
    refreshBudgetDisplay() {
        const remaining = this.household.budget - this.cartTotal;
        const color = remaining < 0 ? '#F44336' : '#2E7D32';
        
        this.budgetText.setText(
            `💰 Budget: $${this.household.budget.toFixed(2)} | Cart: $${this.cartTotal.toFixed(2)} | Left: $${remaining.toFixed(2)}`
        );
        this.budgetText.setColor(color);
    }
    
    /**
     * Checkout and complete shopping
     */
    checkout() {
        if (this.cart.length === 0) {
            this.showWarning('Cart is empty!', 0xFFC107);
            return;
        }
        
        if (this.cartTotal > this.household.budget) {
            this.showWarning('Over budget! Remove items.', 0xFF5252);
            return;
        }
        
        console.log(`💳 Checking out: ${this.cart.length} items, $${this.cartTotal.toFixed(2)}`);
        
        // Add items to inventory and track total purchased kg (Fp for mass balance)
        let totalPurchasedKg = 0;
        this.cart.forEach(item => {
            this.inventory.addItem(item);
            // getTotalWeight returns lbs; convert to kg (×0.4536)
            totalPurchasedKg += item.getTotalWeight() * 0.4536;
        });
        this.household.addPurchasedKg(totalPurchasedKg);
        
        // Spend money
        this.household.spendMoney(this.cartTotal);
        
        // Record shopping trip
        this.household.recordShopping(this.cartTotal, this.cart);
        
        // Calculate score
        const score = this.calculateShoppingScore();
        this.household.recordDecision('shopping_trip', Math.round((score.score - 50) / 4), {
            listCompletion: score.listCompletion,
            spent: this.cartTotal
        });
        if (score.impulseCount <= 2) {
            this.household.recordDecision('shopping_low_impulse', 4, { impulseCount: score.impulseCount });
        }
        
        // Update awareness based on performance
        this.household.modifyWasteAwareness(score.awarenessChange);
        
        // Save game state
        gameState.save();
        
        // Show results
        this.showShoppingResults(score);
    }
    
    /**
     * Calculate shopping performance score
     */
    calculateShoppingScore() {
        let score = 50; // Base score
        let awarenessChange = 0;
        const feedback = [];
        
        // Bonus for shopping list completion
        const listCompletionRate = this.shoppingList.filter(item => item.purchased).length / 
                                   Math.max(1, this.shoppingList.length);
        score += listCompletionRate * 30;
        awarenessChange += listCompletionRate * 5;
        
        if (listCompletionRate >= 0.8) {
            feedback.push('✅ Great job following your list!');
        } else if (listCompletionRate < 0.5) {
            feedback.push('⚠️ Try to stick to your shopping list next time.');
        }
        
        // Bonus for staying under budget
        const budgetEfficiency = this.cartTotal / this.household.budget;
        if (budgetEfficiency <= 0.8) {
            score += 10;
            awarenessChange += 2;
            feedback.push('💰 Smart budgeting!');
        }
        
        // Check for perishable items
        const perishableCount = this.cart.filter(item => item.perishability >= 4).length;
        if (perishableCount > this.household.familySize) {
            score -= 10;
            awarenessChange -= 2;
            feedback.push('⚠️ Watch out for too many perishables!');
        } else {
            feedback.push('✅ Good balance of fresh and shelf-stable foods!');
        }
        
        // Impulse buy check (items not on list)
        const impulseCount = this.cart.filter(cartItem => {
            return !this.shoppingList.some(listItem => 
                listItem.name.toLowerCase() === cartItem.name.toLowerCase()
            );
        }).length;
        
        if (impulseCount > 3) {
            score -= 15;
            awarenessChange -= 3;
            feedback.push('⚠️ Avoid impulse purchases - stick to your list!');
        }
        
        return {
            score: Math.max(0, Math.min(100, score)),
            awarenessChange: awarenessChange,
            feedback: feedback,
            listCompletion: (listCompletionRate * 100).toFixed(0) + '%',
            totalSpent: this.cartTotal,
            itemsPurchased: this.cart.length,
            impulseCount: impulseCount
        };
    }
    
    /**
     * Show shopping results modal
     */
    showShoppingResults(score) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setOrigin(0, 0);
        overlay.setInteractive();
        overlay.setDepth(2000);
        
        // Results panel
        const panel = this.add.rectangle(width / 2, height / 2, 700, 500, 0xffffff);
        panel.setStrokeStyle(5, 0x4CAF50);
        panel.setDepth(2001);
        
        // Title
        this.add.text(width / 2, height / 2 - 200, '🛒 Shopping Complete!', {
            fontSize: '40px',
            fontFamily: 'Fredoka, Arial',
            color: '#4CAF50',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2002);
        
        // Hidden score is tracked internally; show rating only
        const rating = this.getShoppingRating(score.score);
        this.add.text(width / 2, height / 2 - 140, `Rating: ${rating}`, {
            fontSize: '32px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2002);
        
        // Stats
        const statsY = height / 2 - 80;
        const lineHeight = 35;
        
        const stats = [
            `Items Purchased: ${score.itemsPurchased}`,
            `Total Spent: $${score.totalSpent.toFixed(2)}`,
            `List Completion: ${score.listCompletion}`,
            '',
            ...score.feedback
        ];
        
        stats.forEach((line, index) => {
            this.add.text(width / 2, statsY + index * lineHeight, line, {
                fontSize: '22px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                align: 'center'
            }).setOrigin(0.5).setDepth(2002);
        });
        
        // Continue button
        const continueBtn = this.add.container(width / 2, height / 2 + 180).setDepth(2002);
        
        const bg = this.add.rectangle(0, 0, 250, 60, 0x4CAF50).setDepth(2002);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, 'Continue', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2002);
        
        continueBtn.add([bg, text]);
        
        bg.on('pointerdown', () => {
            // Show hydra feedback before returning
            const overspent = this.cartTotal > this.household.budget * 0.95;
            const underbudget = this.cartTotal < this.household.budget * 0.7;
            
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                // Hydra will call scene transition when dismissed
                hydraGuide.showFeedback('shopping-complete', {
                    overspent: overspent,
                    underbudget: underbudget,
                    listCompletion: score.listCompletion
                }, () => {
                    this.scene.start('GroceryTravelScene', {
                        direction: 'home',
                        nextScene: 'ManagementScene'
                    });
                });
            } else {
                // No hydra, go directly
                this.scene.start('GroceryTravelScene', {
                    direction: 'home',
                    nextScene: 'ManagementScene'
                });
            }
        });
    }
    
    /**
     * Convert hidden numeric score to visible rating
     */
    getShoppingRating(score) {
        if (score >= 85) return 'Excellent ✅';
        if (score >= 70) return 'Great 👍';
        if (score >= 55) return 'Solid 🙂';
        return 'Needs Improvement 💡';
    }
    
    /**
     * Show tooltip
     */
    showTooltip(text, x, y) {
        // Remove existing tooltip
        this.hideTooltip();
        
        const tooltip = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 300, 60, 0x333333, 0.95);
        bg.setStrokeStyle(2, 0xffffff);
        
        const tipText = this.add.text(0, 0, text, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            wordWrap: { width: 280 },
            align: 'center'
        }).setOrigin(0.5);
        
        tooltip.add([bg, tipText]);
        tooltip.setData('tooltip', true);
        tooltip.setDepth(3000);
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip() {
        this.children.list.forEach(child => {
            if (child.getData && child.getData('tooltip')) {
                child.destroy();
            }
        });
    }
    
    /**
     * Show warning message
     */
    showWarning(message, color = 0xFF5252) {
        const width = this.cameras.main.width;
        
        const warning = this.add.text(width / 2, 50, message, {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#' + color.toString(16),
            fontStyle: 'bold',
            backgroundColor: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        warning.setDepth(5000);
        
        // Fade out after 2 seconds
        this.tweens.add({
            targets: warning,
            alpha: 0,
            duration: 1000,
            delay: 2000,
            onComplete: () => warning.destroy()
        });
    }
}
