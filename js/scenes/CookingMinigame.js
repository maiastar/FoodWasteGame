/**
 * Cooking Minigame Scene
 * Select recipe, match ingredients from inventory, cook meal
 * Teaches portion control and using ingredients efficiently
 */

class CookingMinigame extends Phaser.Scene {
    constructor() {
        super({ key: 'CookingMinigame' });
        
        this.household = null;
        this.inventory = null;
        this.selectedRecipe = null;
        this.recipes = [];
        this.selectedIngredients = [];
        this.portionMultiplier = 1.0;
        this.lastInedibleWaste = null;
    }
    
    create() {
        console.log('🍳 CookingMinigame: Starting cooking session...');
        
        this.household = gameState.household;
        this.inventory = gameState.inventory;
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0xFFF3E0).setOrigin(0, 0);
        
        // Header
        this.createHeader();
        
        // Load recipes
        const recipeData = this.cache.json.get('recipes');
        if (recipeData && recipeData.recipes) {
            this.recipes = recipeData.recipes;
        }
        
        // Show hydra decision advice first
        const hydraGuide = new HydraGuide(this);
        if (hydraGuide.shouldShow()) {
            hydraGuide.showDecisionAdvice('cooking-entry', {
                expiringItems: this.inventory.getExpiringSoonItems().length
            });
        }
        
        // Show recipe selection
        this.showRecipeSelection();

        if (this.cache.audio.exists('CookingMusic')) {
            this.CookingMusic = this.sound.add('CookingMusic', { loop: true, volume: 0.4 });
            this.CookingMusic.play();
            if (typeof wireBgmAfterAutoplayPolicy === 'function') {
                wireBgmAfterAutoplayPolicy(this, () => this.CookingMusic, 'CookingMinigame');
            }
        }

        const shutdownEv = (typeof Phaser !== 'undefined' && Phaser.Scenes && Phaser.Scenes.Events && Phaser.Scenes.Events.SHUTDOWN)
            ? Phaser.Scenes.Events.SHUTDOWN
            : 'shutdown';
        this.events.once(shutdownEv, () => {
            if (this.tweens) this.tweens.killAll();
            if (this.CookingMusic) {
                this.CookingMusic.stop();
                this.CookingMusic.destroy();
                this.CookingMusic = null;
            }
        });
    }
    
    /**
     * Create header
     */
    createHeader() {
        const width = this.cameras.main.width;
        
        this.add.rectangle(0, 0, width, 70, 0xFF9800).setOrigin(0, 0);
        
        this.add.text(30, 35, '🍳 Cooking Time!', {
            fontSize: '36px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Exit button (no save)
        const exitBtn = this.add.text(width - 30, 35, '❌ Exit', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            backgroundColor: '#D32F2F',
            padding: { x: 15, y: 8 }
        }).setOrigin(1, 0.5);
        exitBtn.setInteractive({ useHandCursor: true });
        exitBtn.on('pointerdown', () => {
            console.log('Exiting cooking without saving...');
            this.scene.start('ManagementScene');
        });
        exitBtn.on('pointerover', () => exitBtn.setStyle({ backgroundColor: '#B71C1C' }));
        exitBtn.on('pointerout', () => exitBtn.setStyle({ backgroundColor: '#D32F2F' }));
    }
    
    /**
     * Show recipe selection screen
     */
    showRecipeSelection() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Title
        this.add.text(width / 2, 120, 'Choose a Recipe', {
            fontSize: '40px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Prioritise recipes the player planned for today
        let recipesToShow = this.getPlannedRecipesForToday();

        if (recipesToShow.length === 0) {
            // No planned meals for today — show what can be made from inventory
            const availableRecipes = this.getAvailableRecipes();
            recipesToShow = this.selectRandomRecipes(availableRecipes, 3);
        }

        // Fallback: if no recipes available, show recipes that are "almost" makeable
        if (recipesToShow.length === 0) {
            console.log('⚠️ No perfect recipes available, showing best alternatives...');
            const partialRecipes = this.getPartiallyAvailableRecipes();
            recipesToShow = this.selectRandomRecipes(partialRecipes, 3);
        }
        
        // Prepend "Reheat Leftovers" card if leftover food items are in inventory
        const leftoverItems = this.getLeftoverFoodItems();
        if (leftoverItems.length > 0) {
            const totalServings = leftoverItems.reduce((sum, item) => sum + item.quantity, 0);
            recipesToShow.unshift({
                id: 'reheat_leftovers',
                name: 'Reheat Leftovers',
                icon: '🍱',
                cookTime: 5,
                servings: totalServings,
                difficulty: 'Easy',
                ingredients: [],
                isLeftoverReheat: true
            });
        }

        if (recipesToShow.length === 0) {
            // Still no recipes and no leftovers
            this.showNoRecipesAvailable();
            return;
        }
        
        // Display recipe cards
        const cardSpacing = 280;
        const startX = width / 2 - ((recipesToShow.length - 1) * cardSpacing) / 2;
        const cardY = height / 2;
        
        recipesToShow.forEach((recipe, index) => {
            this.createRecipeCard(startX + index * cardSpacing, cardY, recipe);
        });
    }
    
    /**
     * Get recipes planned for today's meals in PlanningMinigame
     * Returns up to 3 unique recipe objects, or empty array if none planned
     */
    getPlannedRecipesForToday() {
        const todaysMeals = this.household.getMealsForDay(this.household.day);
        const seen = new Set();
        return todaysMeals
            .map(meal => this.recipes.find(r => r.id === meal.recipeId))
            .filter(recipe => {
                if (!recipe || seen.has(recipe.id)) return false;
                seen.add(recipe.id);
                return true;
            })
            .slice(0, 3);
    }

    /**
     * Get recipes that can be made with current inventory
     */
    /**
     * Return unspoiled leftover FoodItems from inventory (category 'other')
     */
    getLeftoverFoodItems() {
        return this.inventory.items.filter(item => item.category === 'other' && !item.isSpoiled());
    }

    getAvailableRecipes() {
        console.log('🔍 Checking available recipes...');
        console.log('Current inventory:', this.inventory.items.map(i => `${i.name} (qty: ${i.quantity}, spoiled: ${i.isSpoiled()})`));
        
        return this.recipes.filter(recipe => {
            const canMake = recipe.ingredients.every(ingredient => {
                const hasSufficient = this.inventory.hasSufficientQuantity(ingredient.name, ingredient.quantity);
                console.log(`  ${recipe.name}: needs ${ingredient.name} (${ingredient.quantity}) = ${hasSufficient ? '✓' : '✗'}`);
                return hasSufficient;
            });
            console.log(`  ➜ ${recipe.name}: ${canMake ? '✅ CAN MAKE' : '❌ CANNOT MAKE'}`);
            return canMake;
        });
    }
    
    /**
     * Get recipes where we have at least some ingredients (fallback)
     */
    getPartiallyAvailableRecipes() {
        return this.recipes.filter(recipe => {
            // Check if we have at least 50% of ingredients
            const hasCount = recipe.ingredients.filter(ingredient => {
                return this.inventory.hasItem(ingredient.name);
            }).length;
            return hasCount >= Math.ceil(recipe.ingredients.length * 0.5);
        });
    }
    
    /**
     * Select random recipes from available list
     */
    selectRandomRecipes(recipes, count) {
        const shuffled = [...recipes].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }
    
    /**
     * Create recipe card
     */
    createRecipeCard(x, y, recipe) {
        const container = this.add.container(x, y);
        
        // Card background
        const bg = this.add.rectangle(0, 0, 250, 350, 0xffffff);
        bg.setStrokeStyle(4, 0xFF9800);
        bg.setInteractive({ useHandCursor: true });
        
        // Recipe icon — use sprite if available, otherwise fall back to emoji
        const COMPLEX_MEAL_FRAMES    = { 'fish-dinner':0,'rice-bowl':1,'yogurt-parfait':2,'french-toast':3,'spinach-omelette':4,'morning-smoothie':5,'grilled-cheese':6,'beef-tacos':7,'beef-fried-rice':8,'cheesy-veggie-pasta':9 };
        const BASIC_MEAL_RECIPE_FRAMES = { 'pasta-tomato':2,'scrambled-eggs':3,'grilled-chicken':4,'veggie-stir-fry':5,'rice-bowl':6,'simple-salad':7 };
        const rskCard = recipe.spriteKey || recipe.id;
        let icon;
        if (rskCard && COMPLEX_MEAL_FRAMES[rskCard] !== undefined && this.textures.exists('complexMealSprites')) {
            icon = this.add.image(0, -100, 'complexMealSprites', COMPLEX_MEAL_FRAMES[rskCard]).setDisplaySize(120, 120).setOrigin(0.5);
        } else if (rskCard && BASIC_MEAL_RECIPE_FRAMES[rskCard] !== undefined && this.textures.exists('basicMealSprites')) {
            icon = this.add.image(0, -100, 'basicMealSprites', BASIC_MEAL_RECIPE_FRAMES[rskCard]).setDisplaySize(120, 120).setOrigin(0.5);
        } else {
            icon = this.add.text(0, -130, recipe.icon, { fontSize: '80px' }).setOrigin(0.5);
        }
        
        // Recipe name
        const name = this.add.text(0, -50, recipe.name, {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold',
            wordWrap: { width: 230 },
            align: 'center'
        }).setOrigin(0.5);
        
        // Details
        const details = this.add.text(0, 10, 
            `⏱️ ${recipe.cookTime} min\n👨‍👩‍👧‍👦 Serves ${recipe.servings}\n📊 ${recipe.difficulty}`, {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            align: 'center'
        }).setOrigin(0.5);
        
        // Ingredients preview
        const ingredientsText = recipe.ingredients.map(ing => ing.name).slice(0, 3).join(', ');
        const ingredients = this.add.text(0, 80, ingredientsText, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#999999',
            wordWrap: { width: 230 },
            align: 'center'
        }).setOrigin(0.5);
        
        // Select button
        const selectBtn = this.add.rectangle(0, 140, 200, 50, 0xFF9800);
        selectBtn.setInteractive({ useHandCursor: true });
        
        const selectText = this.add.text(0, 140, 'Cook This!', {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([bg, icon, name, details, ingredients, selectBtn, selectText]);
        
        // Hover effects on background
        bg.on('pointerover', () => {
            container.setScale(1.05);
            bg.setFillStyle(0xfff8e1);
            selectBtn.setFillStyle(0xFFA726);
        });
        
        bg.on('pointerout', () => {
            container.setScale(1);
            bg.setFillStyle(0xffffff);
            selectBtn.setFillStyle(0xFF9800);
        });
        
        // Make entire card clickable
        bg.on('pointerdown', (_p, _x, _y, event) => {
            event.stopPropagation();
            this.selectRecipe(recipe);
        });
    }
    
    /**
     * Select a recipe and start cooking
     */
    selectRecipe(recipe) {
        this.selectedRecipe = recipe;
        console.log(`📖 Selected recipe: ${recipe.name}`);
        
        // destroy(true) propagates to container children, removing their input registrations
        this.children.list.slice().forEach(obj => obj.destroy(true));
        
        if (recipe.isLeftoverReheat) {
            this.reheatLeftovers();
        } else {
            this.showCookingInterface();
        }
    }
    
    /**
     * Show cooking interface
     */
    showCookingInterface() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0xFFF3E0).setOrigin(0, 0);
        this.createHeader();
        
        // Recipe card (left side)
        this.createRecipeDisplay();
        
        // Inventory panel (right side)
        this.createInventoryPanel();
        
        // Portion selector
        this.createPortionSelector();
        
        // Cook button
        this.createCookButton();
    }
    
    /**
     * Create recipe display
     */
    createRecipeDisplay() {
        const recipeX = 50;
        const recipeY = 100;
        const recipeWidth = 380;
        const recipeHeight = 500;
        
        // Panel
        const panel = this.add.rectangle(recipeX, recipeY, recipeWidth, recipeHeight, 0xffffff, 0.95);
        panel.setStrokeStyle(4, 0xFF9800);
        panel.setOrigin(0, 0);
        
        // Recipe name
        this.add.text(recipeX + 20, recipeY + 20, this.selectedRecipe.name, {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold',
            wordWrap: { width: 340 }
        }).setOrigin(0, 0);
        
        // Recipe icon — use sprite if available, otherwise fall back to emoji
        const COMPLEX_MEAL_FRAMES_SEL    = { 'fish-dinner':0,'rice-bowl':1,'yogurt-parfait':2,'french-toast':3,'spinach-omelette':4,'morning-smoothie':5,'grilled-cheese':6,'beef-tacos':7,'beef-fried-rice':8,'cheesy-veggie-pasta':9 };
        const BASIC_MEAL_RECIPE_FRAMES_SEL = { 'pasta-tomato':2,'scrambled-eggs':3,'grilled-chicken':4,'veggie-stir-fry':5,'rice-bowl':6,'simple-salad':7 };
        const rsk = this.selectedRecipe.spriteKey || this.selectedRecipe.id;
        if (rsk && COMPLEX_MEAL_FRAMES_SEL[rsk] !== undefined && this.textures.exists('complexMealSprites')) {
            this.add.image(recipeX + recipeWidth / 2, recipeY + 100, 'complexMealSprites', COMPLEX_MEAL_FRAMES_SEL[rsk]).setDisplaySize(140, 140).setOrigin(0.5);
        } else if (rsk && BASIC_MEAL_RECIPE_FRAMES_SEL[rsk] !== undefined && this.textures.exists('basicMealSprites')) {
            this.add.image(recipeX + recipeWidth / 2, recipeY + 100, 'basicMealSprites', BASIC_MEAL_RECIPE_FRAMES_SEL[rsk]).setDisplaySize(140, 140).setOrigin(0.5);
        } else {
            this.add.text(recipeX + recipeWidth / 2, recipeY + 100, this.selectedRecipe.icon, { fontSize: '100px' }).setOrigin(0.5);
        }
        
        // Details
        this.add.text(recipeX + 20, recipeY + 180, 
            `⏱️ Cook Time: ${this.selectedRecipe.cookTime} minutes\n` +
            `👨‍👩‍👧‍👦 Serves: ${this.selectedRecipe.servings} people\n` +
            `📊 Difficulty: ${this.selectedRecipe.difficulty}`, {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            lineSpacing: 8
        }).setOrigin(0, 0);
        
        // Ingredients list
        this.add.text(recipeX + 20, recipeY + 270, '📝 Ingredients Needed:', {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        const ingredientsY = recipeY + 310;
        this.selectedRecipe.ingredients.forEach((ingredient, index) => {
            const hasIt      = this.inventory.hasSufficientQuantity(ingredient.name, ingredient.quantity);
            const hasSome    = !hasIt && this.inventory.hasItem(ingredient.name);
            const ownsSpoiled = !hasIt && !hasSome && this.inventory.hasItemAny(ingredient.name);

            let checkmark, color, suffix;
            if (hasIt) {
                checkmark = '✅'; color = '#4CAF50'; suffix = '';
            } else if (hasSome) {
                checkmark = '⚠️'; color = '#FF9800'; suffix = ' (need more)';
            } else if (ownsSpoiled) {
                checkmark = '🔴'; color = '#FF6F00'; suffix = ' (spoiled!)';
            } else {
                checkmark = '❌'; color = '#F44336'; suffix = ' (not in stock)';
            }

            this.add.text(recipeX + 30, ingredientsY + index * 30,
                `${checkmark} ${ingredient.name} (${ingredient.quantity})${suffix}`, {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: color
            }).setOrigin(0, 0);
        });
        
        // Waste reduction tip
        this.add.text(recipeX + 20, recipeY + recipeHeight - 60, '💡 Tip:', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#FF9800',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        this.add.text(recipeX + 20, recipeY + recipeHeight - 35, this.selectedRecipe.wasteReductionTip, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            wordWrap: { width: 340 }
        }).setOrigin(0, 0);
    }
    
    /**
     * Create inventory panel showing available ingredients
     */
    createInventoryPanel() {
        const width = this.cameras.main.width;
        const panelX = width / 2 + 50;
        const panelY = 100;
        const panelWidth = 530;
        const panelHeight = 400;
        
        // Panel
        this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff, 0.95).setOrigin(0, 0);
        this.add.rectangle(panelX, panelY, panelWidth, panelHeight).setStrokeStyle(3, 0x333333).setOrigin(0, 0);
        
        // Title
        this.add.text(panelX + 20, panelY + 15, '🧊 Your Ingredients', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Show relevant inventory items
        const relevantItems = this.getRelevantInventoryItems();
        const itemY = panelY + 60;
        const itemHeight = 50;
        
        relevantItems.slice(0, 6).forEach((item, index) => {
            const y = itemY + index * itemHeight;
            
            // Item icon — use sprite if available, otherwise fall back to category emoji
            const PRODUCE_FRAMES       = { 'apple':0,'banana':1,'lettuce':2,'tomato':3,'carrot':4,'broccoli':5,'potato':6,'onion':7 };
            const PROTEIN_DAIRY_FRAMES = { 'milk':0,'yogurt':1,'eggs':2,'cheese':3,'chicken':4,'beef':5,'salmon':7 };
            const PANTRY_FRAMES        = { 'strawberry':0,'spinach':1,'orange-juice':2,'grains':3,'bread':4,'pasta':5,'rice':6,'canned-beans':7 };
            const BASIC_MEAL_GROCERY_FRAMES = { 'frozen-peas':0,'leftovers':1 };
            const sk = item.spriteKey;
            if (PRODUCE_FRAMES[sk] !== undefined && this.textures.exists('produceSprites')) {
                this.add.image(panelX + 36, y + 16, 'produceSprites', PRODUCE_FRAMES[sk]).setDisplaySize(36, 36).setOrigin(0.5);
            } else if (PROTEIN_DAIRY_FRAMES[sk] !== undefined && this.textures.exists('proteinDairySprites')) {
                this.add.image(panelX + 36, y + 16, 'proteinDairySprites', PROTEIN_DAIRY_FRAMES[sk]).setDisplaySize(36, 36).setOrigin(0.5);
            } else if (PANTRY_FRAMES[sk] !== undefined && this.textures.exists('pantrySprites')) {
                this.add.image(panelX + 36, y + 16, 'pantrySprites', PANTRY_FRAMES[sk]).setDisplaySize(36, 36).setOrigin(0.5);
            } else if (BASIC_MEAL_GROCERY_FRAMES[sk] !== undefined && this.textures.exists('basicMealSprites')) {
                this.add.image(panelX + 36, y + 16, 'basicMealSprites', BASIC_MEAL_GROCERY_FRAMES[sk]).setDisplaySize(36, 36).setOrigin(0.5);
            } else {
                const icons = {
                    'produce': '🥬', 'dairy': '🥛', 'meat': '🥩',
                    'fish': '🐟', 'grains': '🍞', 'frozen': '❄️',
                    'canned': '🥫', 'condiments': '🧂', 'other': '🍱'
                };
                this.add.text(panelX + 20, y, icons[item.category] || '🍱', {
                    fontSize: '32px'
                }).setOrigin(0, 0);
            }
            
            const statusColor = item.getFreshnessColor();
            const statusEmoji = item.getStatus() === 'fresh' ? '🟢' : 
                               item.getStatus() === 'aging' ? '🟡' : 
                               item.getStatus() === 'expiring' ? '🟠' : '🔴';
            
            this.add.text(panelX + 70, y + 16, 
                `${item.name} (${item.quantity}) ${statusEmoji}`, {
                fontSize: '18px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333'
            }).setOrigin(0, 0.5);
            
            // Freshness bar
            const barWidth = 100;
            const barX = panelX + panelWidth - 130;
            
            this.add.rectangle(barX, y + 16, barWidth, 15, 0xe0e0e0).setOrigin(0, 0.5);
            this.add.rectangle(barX, y + 16, barWidth * (item.getFreshnessPercentage() / 100), 15, 
                parseInt(statusColor.replace('#', '0x'))).setOrigin(0, 0.5);
        });
        
        if (relevantItems.length > 6) {
            this.add.text(panelX + 20, itemY + 6 * itemHeight, 
                `...and ${relevantItems.length - 6} more items`, {
                fontSize: '14px',
                fontFamily: 'Fredoka, Arial',
                color: '#999999',
                fontStyle: 'italic'
            }).setOrigin(0, 0);
        }
    }
    
    /**
     * Get inventory items relevant to cooking
     */
    getRelevantInventoryItems() {
        // Prioritize items needed for recipe
        const neededItems = [];
        const otherItems = [];
        
        this.inventory.items.forEach(item => {
            const isNeeded = this.selectedRecipe.ingredients.some(ing => 
                ing.name.toLowerCase() === item.name.toLowerCase()
            );
            
            if (isNeeded) {
                neededItems.push(item);
            } else {
                otherItems.push(item);
            }
        });
        
        // Sort by freshness (use expiring items first)
        neededItems.sort(FoodItem.compareByFreshness);
        otherItems.sort(FoodItem.compareByFreshness);
        
        return [...neededItems, ...otherItems];
    }
    
    /**
     * Create portion size selector
     */
    createPortionSelector() {
        const width = this.cameras.main.width;
        const selectorX = width / 2 + 50;
        const selectorY = 520;
        
        // Label
        this.add.text(selectorX + 20, selectorY, '🍽️ Portion Size:', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Buttons
        const btnY = selectorY + 50;
        const portions = [
            { multiplier: 0.5, label: 'Small (½×)', servings: Math.ceil(this.selectedRecipe.servings * 0.5) },
            { multiplier: 1.0, label: 'Normal (1×)', servings: this.selectedRecipe.servings },
            { multiplier: 1.5, label: 'Large (1.5×)', servings: Math.ceil(this.selectedRecipe.servings * 1.5) }
        ];
        
        portions.forEach((portion, index) => {
            const portionContainer = this.createPortionButton(
                selectorX + 60 + index * 160,
                btnY,
                portion.label,
                portion.servings,
                portion.multiplier === this.portionMultiplier
            );
            portionContainer.setDepth(1000);
            portionContainer.setData('portionMultiplier', portion.multiplier);

            const bg = portionContainer.getData('bg');
            bg.on('pointerdown', () => {
                console.log(`🍽️ Portion selected: ${portion.label}`);
                this.portionMultiplier = portion.multiplier;
                this.refreshPortionButtons();
            });
        });
        
        // Recommendation
        const recommended = this.household.familySize;
        this.add.text(selectorX + 265, btnY + 70, 
            `💡 Recommended for ${this.household.familySize} people: ${recommended} servings`, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            fontStyle: 'italic'
        }).setOrigin(0.5, 0);
    }
    
    /**
     * Create portion button
     */
    createPortionButton(x, y, label, servings, selected) {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 140, 60, selected ? 0xFF9800 : 0xffffff);
        if (selected) {
            bg.setStrokeStyle(4, 0xE65100);
        } else {
            bg.setStrokeStyle(3, 0x333333);
        }
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, -5, label, {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: selected ? '#ffffff' : '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const servingsText = this.add.text(0, 15, `(${servings} servings)`, {
            fontSize: '12px',
            fontFamily: 'Fredoka, Arial',
            color: selected ? '#ffffff' : '#666666'
        }).setOrigin(0.5);
        
        container.add([bg, text, servingsText]);
        container.setData('bg', bg);
        container.setData('text', text);
        container.setData('servingsText', servingsText);
        container.setData('portionButton', true);
        container.setDepth(1000);
        container.setScale(selected ? 1.06 : 1);
        
        bg.on('pointerover', () => {
            const isSel = container.getData('portionMultiplier') === this.portionMultiplier;
            container.setScale(isSel ? 1.06 : 1.05);
        });
        bg.on('pointerout', () => {
            const isSel = container.getData('portionMultiplier') === this.portionMultiplier;
            container.setScale(isSel ? 1.06 : 1);
        });
        
        return container;
    }
    
    /**
     * Refresh portion buttons
     */
    refreshPortionButtons() {
        this.children.list.forEach(child => {
            if (child.getData && child.getData('portionButton')) {
                const isSelected = child.getData('portionMultiplier') === this.portionMultiplier;
                
                const bg = child.getData('bg');
                const text = child.getData('text');
                const servingsText = child.getData('servingsText');
                
                if (bg && text && servingsText) {
                    bg.setFillStyle(isSelected ? 0xFF9800 : 0xffffff);
                    if (isSelected) {
                        bg.setStrokeStyle(4, 0xE65100);
                    } else {
                        bg.setStrokeStyle(3, 0x333333);
                    }
                    text.setColor(isSelected ? '#ffffff' : '#333333');
                    servingsText.setColor(isSelected ? '#ffffff' : '#666666');
                    child.setScale(isSelected ? 1.06 : 1);
                }
            }
        });
    }
    
    /**
     * Create cook button
     */
    createCookButton() {
        const width = this.cameras.main.width;
        const btnX = width / 2 + 265;
        const btnY = 640;
        
        const button = this.add.container(btnX, btnY);
        
        const bg = this.add.rectangle(0, 0, 480, 70, 0x4CAF50);
        bg.setStrokeStyle(5, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, '🍽️ Cook Meal!', {
            fontSize: '32px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        button.setDepth(1000); // Ensure button is on top
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0x66BB6A);
            button.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x4CAF50);
            button.setScale(1);
        });
        
        bg.on('pointerdown', (_p, _x, _y, event) => {
            event.stopPropagation();
            this.cookMeal();
        });
    }
    
    /**
     * Cook the meal
     */
    cookMeal() {
        console.log('👨‍🍳 Cooking meal...');
        
        // Check if we have all ingredients
        const missingIngredients = [];
        
        this.selectedRecipe.ingredients.forEach(ingredient => {
            const needed = Math.ceil(ingredient.quantity * this.portionMultiplier);
            if (!this.inventory.hasSufficientQuantity(ingredient.name, needed)) {
                missingIngredients.push(ingredient.name);
            }
        });
        
        if (missingIngredients.length > 0) {
            alert(`Missing ingredients: ${missingIngredients.join(', ')}`);
            return;
        }
        
        // Consume ingredients (prioritize expiring items) and track Fc for mass balance
        this.selectedRecipe.ingredients.forEach(ingredient => {
            const needed = Math.ceil(ingredient.quantity * this.portionMultiplier);

            for (let i = 0; i < needed; i++) {
                const item = this.inventory.findBestItemForRecipe(ingredient.name);
                if (item) {
                    // Track consumed kg (lbs → kg: ×0.4536) before removing from inventory
                    this.household.addConsumedKg(item.getWeightPerServing() * 0.4536);
                    this.inventory.consumeItem(item.id, 1);
                }
            }
        });
        
        // Track visible inedible food-part waste (not player error)
        const inedibleWaste = this.calculateInedibleWaste();
        this.lastInedibleWaste = inedibleWaste;
        if (inedibleWaste.totalWeight > 0) {
            this.household.addWaste(inedibleWaste.totalWeight, inedibleWaste.totalValue, 'inedible_parts');
            this.showInedibleWasteNotice(inedibleWaste);
        }
        
        // Calculate cooking score
        const score = this.calculateCookingScore();
        this.household.recordDecision('cooking_trip', Math.round((score.score - 60) / 4), {
            recipeId: this.selectedRecipe.id,
            portionMultiplier: this.portionMultiplier
        });
        
        // Update household stats
        const servingsMade = Math.ceil(this.selectedRecipe.servings * this.portionMultiplier);
        this.household.recordMeal(this.selectedRecipe.id, servingsMade);
        this.household.modifyWasteAwareness(score.awarenessChange);
        
        // Auto-store leftovers in fridge; player can organize them in the Fridge minigame
        if (servingsMade > this.household.familySize * 1.5) {
            const leftoverServings = servingsMade - this.household.familySize;
            this.storeLeftovers(leftoverServings, 'fridge');
        }
        
        this.finalizeCookingFlow(score, servingsMade);
    }
    
    /**
     * Finalize cooking flow after leftover handling
     */
    finalizeCookingFlow(score, servingsMade) {
        gameState.save();
        this.showCookingResults(score, servingsMade);
    }

    /**
     * Consume leftover items from inventory and record as a cooked meal
     */
    reheatLeftovers() {
        const leftoverItems = this.getLeftoverFoodItems();
        const totalServings = leftoverItems.reduce((sum, item) => sum + item.quantity, 0);

        // Consume leftover items from inventory
        leftoverItems.forEach(item => this.inventory.removeItem(item.id));

        // Record as a cooked meal and award awareness for using leftovers
        this.household.recordMeal('reheat_leftovers', totalServings);
        this.household.recordDecision('leftover_good_storage', 5, { reheated: true });

        const score = {
            score: 90,
            awarenessChange: 6,
            feedback: [
                '✅ Great job using your leftovers!',
                'Reheating leftovers is one of the best ways to reduce food waste.'
            ]
        };
        this.household.modifyWasteAwareness(score.awarenessChange);
        this.finalizeCookingFlow(score, totalServings);
    }

    /**
     * Calculate cooking performance score
     */
    calculateCookingScore() {
        let score = 60; // Base score
        let awarenessChange = 2; // Base awareness gain
        const feedback = [];
        
        // Bonus for using expiring ingredients
        let usedExpiringItems = 0;
        this.selectedRecipe.ingredients.forEach(ingredient => {
            const item = this.inventory.findBestItemForRecipe(ingredient.name);
            if (item && item.isExpiringSoon()) {
                usedExpiringItems++;
            }
        });
        
        if (usedExpiringItems > 0) {
            score += usedExpiringItems * 10;
            awarenessChange += usedExpiringItems * 2;
            feedback.push(`✅ Great! You used ${usedExpiringItems} item(s) before expiration!`);
        }
        
        // Check portion size appropriateness
        const servingsMade = Math.ceil(this.selectedRecipe.servings * this.portionMultiplier);
        const servingsNeeded = this.household.familySize;
        
        if (servingsMade === servingsNeeded || servingsMade === servingsNeeded + 1) {
            score += 15;
            awarenessChange += 3;
            feedback.push('✅ Perfect portion size!');
        } else if (servingsMade > servingsNeeded * 1.5) {
            score -= 10;
            awarenessChange -= 2;
            feedback.push('⚠️ You made too much - leftovers may go to waste.');
        } else if (servingsMade < servingsNeeded) {
            feedback.push('⚠️ Not enough food - family still hungry!');
        }
        
        return {
            score: Math.max(0, Math.min(100, score)),
            awarenessChange: awarenessChange,
            feedback: feedback
        };
    }
    
    /**
     * Show cooking results
     */
    showCookingResults(score, servingsMade) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Overlay — blocks all clicks from reaching the scene beneath
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setOrigin(0, 0);
        overlay.setInteractive();
        overlay.setDepth(3000);
        overlay.on('pointerdown', (_p, _x, _y, event) => { event.stopPropagation(); });
        
        // Results panel
        const panel = this.add.rectangle(width / 2, height / 2, 700, 500, 0xffffff);
        panel.setStrokeStyle(5, 0xFF9800);
        panel.setDepth(3001);
        
        // Title
        this.add.text(width / 2, height / 2 - 200, '🍳 Meal Cooked!', {
            fontSize: '44px',
            fontFamily: 'Fredoka, Arial',
            color: '#FF9800',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3002);
        
        // Recipe name
        this.add.text(width / 2, height / 2 - 140, this.selectedRecipe.name, {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333'
        }).setOrigin(0.5).setDepth(3002);
        
        // Hidden score is tracked internally; show rating only
        const rating = this.getCookingRating(score.score);
        this.add.text(width / 2, height / 2 - 90, `Cooking Rating: ${rating}`, {
            fontSize: '32px',
            fontFamily: 'Fredoka, Arial',
            color: '#4CAF50',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3002);
        
        // Details
        const detailsY = height / 2 - 40;
        const lineHeight = 35;
        
        const details = [
            `🍽️ Servings Made: ${servingsMade}`,
            `👨‍👩‍👧‍👦 Family Size: ${this.household.familySize}`,
            '',
            ...score.feedback
        ];
        
        details.forEach((line, index) => {
            this.add.text(width / 2, detailsY + index * lineHeight, line, {
                fontSize: '20px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                align: 'center'
            }).setOrigin(0.5).setDepth(3002);
        });
        
        // Continue button
        const continueBtn = this.add.container(width / 2, height / 2 + 190).setDepth(3002);
        
        const bg = this.add.rectangle(0, 0, 250, 60, 0x4CAF50).setDepth(3002);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, 'Back to Home', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3002);
        
        continueBtn.add([bg, text]);
        
        bg.on('pointerdown', (_p, _x, _y, event) => {
            event.stopPropagation();
            // Show hydra feedback before returning
            const usedExpiringItems = this.selectedIngredients.some(item => 
                item.daysRemaining <= 2
            );
            const portionsTooLarge = this.portionMultiplier > 1.5;
            
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                // Hydra will call scene transition when dismissed
                hydraGuide.showFeedback('cooking-complete', {
                    usedExpiringItems: usedExpiringItems,
                    portionsTooLarge: portionsTooLarge,
                    servingsCooked: this.selectedRecipe ? this.selectedRecipe.servings * this.portionMultiplier : 0
                }, () => {
                    this.scene.start('ManagementScene');
                });
            } else {
                // No hydra, go directly
                this.scene.start('ManagementScene');
            }
        });
    }
    
    /**
     * Estimate inedible trim generated by recipe ingredients
     */
    calculateInedibleWaste() {
        const profiles = {
            'Onion': { ratio: 0.10, note: 'onion skins/ends' },
            'Tomato': { ratio: 0.05, note: 'cores/seeds' },
            'Lettuce': { ratio: 0.08, note: 'outer leaves' },
            'Chicken Breast': { ratio: 0.12, note: 'fat/trim' },
            'Salmon': { ratio: 0.18, note: 'skin/bones' },
            'Banana': { ratio: 0.30, note: 'peel' },
            'Carrot': { ratio: 0.12, note: 'peels/tops' },
            'Broccoli': { ratio: 0.10, note: 'thick stems' }
        };
        
        let totalWeight = 0;
        let totalValue = 0;
        const parts = [];
        
        this.selectedRecipe.ingredients.forEach((ingredient) => {
            const profile = profiles[ingredient.name];
            if (!profile) {
                return;
            }
            
            const needed = Math.ceil(ingredient.quantity * this.portionMultiplier);
            const item = this.inventory.findBestItemForRecipe(ingredient.name);
            const weightPerServing = item ? item.getWeightPerServing() : 0.3;
            const pricePerServing = item ? Math.max(0, item.price / Math.max(1, item.originalQuantity)) : 0.5;
            const wasteWeight = needed * weightPerServing * profile.ratio;
            const wasteValue = needed * pricePerServing * profile.ratio;
            
            totalWeight += wasteWeight;
            totalValue += wasteValue;
            parts.push(`${ingredient.name}: ${profile.note}`);
        });
        
        return {
            totalWeight: Number(totalWeight.toFixed(2)),
            totalValue: Number(totalValue.toFixed(2)),
            parts: parts
        };
    }
    
    /**
     * Show inedible waste educational banner
     */
    showInedibleWasteNotice(inedibleWaste) {
        const width = this.cameras.main.width;
        const lines = [
            `♻️ Inedible prep waste: ${inedibleWaste.totalWeight.toFixed(2)} lbs`,
            ...(inedibleWaste.parts.slice(0, 2))
        ];
        
        const notice = this.add.text(width / 2, 95, lines.join('\n'), {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            align: 'center',
            backgroundColor: '#455A64',
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setDepth(5000);
        
        this.tweens.add({
            targets: notice,
            alpha: 0,
            delay: 2500,
            duration: 500,
            onComplete: () => notice.destroy()
        });
    }
    
    /**
     * Ask how player wants to store leftovers
     */
    showLeftoverStorageChoice(leftoverServings, onChosen) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0, 0).setDepth(3500);
        overlay.setInteractive();
        overlay.on('pointerdown', (_p, _x, _y, event) => { event.stopPropagation(); });
        
        const panel = this.add.rectangle(width / 2, height / 2, 760, 360, 0xffffff).setDepth(3501);
        panel.setStrokeStyle(4, 0xFF9800);
        panel.setInteractive();
        panel.on('pointerdown', (_p, _x, _y, event) => { event.stopPropagation(); });
        
        const title = this.add.text(width / 2, height / 2 - 120, `📦 You made ${leftoverServings} leftover serving(s)!`, {
            fontSize: '30px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3502);
        
        const options = [
            { id: 'fridge', label: '🧊 Store in fridge (eat soon)', y: -40 },
            { id: 'freezer', label: '❄️ Freeze for later', y: 20 },
            { id: 'counter', label: '⚠️ Leave out (riskier)', y: 80 }
        ];
        
        let dismissed = false;
        const objects = [overlay, panel, title];
        options.forEach((option) => {
            const button = this.add.rectangle(width / 2, height / 2 + option.y, 520, 48, 0xF5F5F5).setDepth(3502);
            button.setStrokeStyle(2, 0xCCCCCC);
            button.setInteractive({ useHandCursor: true });
            const label = this.add.text(width / 2, height / 2 + option.y, option.label, {
                fontSize: '20px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(3503);
            objects.push(button, label);
            
            button.on('pointerdown', (_p, _x, _y, event) => {
                event.stopPropagation();
                if (dismissed) return;
                dismissed = true;
                objects.forEach(obj => {
                    if (obj.disableInteractive) obj.disableInteractive();
                    obj.destroy();
                });
                onChosen(option.id);
            });
        });
    }
    
    /**
     * Store leftovers according to chosen method
     */
    storeLeftovers(leftoverServings, storageChoice) {
        const configByChoice = {
            fridge: { daysUntilSpoilage: 3, location: 'fridge', scoreDelta: 3, decision: 'leftover_good_storage' },
            freezer: { daysUntilSpoilage: 8, location: 'freezer', scoreDelta: 5, decision: 'leftover_good_storage' },
            counter: { daysUntilSpoilage: 1, location: 'counter', scoreDelta: -4, decision: 'leftover_poor_storage' }
        };
        
        const choice = configByChoice[storageChoice] || configByChoice.fridge;
        const leftovers = new FoodItem({
            name: 'Leftovers',
            category: 'other',
            price: 0,
            daysUntilSpoilage: choice.daysUntilSpoilage,
            quantity: leftoverServings,
            dayPurchased: this.household.day,
            location: choice.location
        });
        this.inventory.addItem(leftovers);
        this.household.recordDecision(choice.decision, choice.scoreDelta, {
            storageChoice: storageChoice,
            leftoverServings: leftoverServings
        });
    }
    
    /**
     * Convert hidden numeric cooking score to visible label
     */
    getCookingRating(score) {
        if (score >= 85) return 'Excellent ✅';
        if (score >= 70) return 'Great 👍';
        if (score >= 55) return 'Solid 🙂';
        return 'Needs Improvement 💡';
    }
    
    /**
     * Show message when no recipes available
     */
    showNoRecipesAvailable() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.add.text(width / 2, height / 2 - 50, 
            '🛒 Not enough ingredients to cook!\nGo shopping first.', {
            fontSize: '32px',
            fontFamily: 'Fredoka, Arial',
            color: '#F44336',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        
        // Back button
        const backBtn = this.add.container(width / 2, height / 2 + 50);
        
        const bg = this.add.rectangle(0, 0, 250, 60, 0x4CAF50);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, 'Back to Home', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        backBtn.add([bg, text]);
        
        bg.on('pointerdown', () => {
            this.scene.start('ManagementScene');
        });
    }
    
}
