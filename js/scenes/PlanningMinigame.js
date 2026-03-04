/**
 * Meal Planning Minigame Scene
 * Plan meals for upcoming week using calendar and recipe library
 * Teaches planning ahead to reduce waste
 */

class PlanningMinigame extends Phaser.Scene {
    constructor() {
        super({ key: 'PlanningMinigame' });
        
        this.household = null;
        this.inventory = null;
        this.recipes = [];
        this.plannedMeals = {}; // { day_mealType: recipeId }
        this.planningDays = 7; // Plan for next 7 days
    }
    
    create() {
        console.log('📅 PlanningMinigame: Starting meal planning...');
        
        this.household = gameState.household;
        this.inventory = gameState.inventory;
        this.plannedMeals = {};
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0xF3E5F5).setOrigin(0, 0);
        
        // Header
        this.createHeader();
        
        // Load recipes
        const recipeData = this.cache.json.get('recipes');
        if (recipeData && recipeData.recipes) {
            this.recipes = recipeData.recipes;
        }
        
        // Create calendar grid
        this.createCalendar();
        
        // Create recipe library
        this.createRecipeLibrary();
        
        // Create info panel
        this.createInfoPanel();
        
        // Create completeness indicator
        this.createCompletenessIndicator();
        
        // Create submit button
        this.createSubmitButton();
        
        // Back button
        this.createBackButton();
        
        // Show hydra decision advice
        this.time.delayedCall(500, () => {
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                hydraGuide.showDecisionAdvice('planning-entry', {
                    daysPlanned: this.planningDays
                });
            }
        });
    }
    
    /**
     * Create header
     */
    createHeader() {
        const width = this.cameras.main.width;
        
        this.add.rectangle(0, 0, width, 70, 0x9C27B0).setOrigin(0, 0);
        
        this.add.text(30, 35, '📅 Plan Your Meals', {
            fontSize: '36px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Week text on left side
        this.add.text(300, 35, `Week ${this.household.week}`, {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Exit button (no save) - with proper spacing on right
        const exitBtn = this.add.text(width - 30, 35, '❌ Exit', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            backgroundColor: '#D32F2F',
            padding: { x: 15, y: 8 }
        }).setOrigin(1, 0.5);
        exitBtn.setInteractive({ useHandCursor: true });
        exitBtn.on('pointerdown', () => {
            console.log('Exiting meal planning without saving...');
            this.scene.start('ManagementScene');
        });
        exitBtn.on('pointerover', () => exitBtn.setStyle({ backgroundColor: '#B71C1C' }));
        exitBtn.on('pointerout', () => exitBtn.setStyle({ backgroundColor: '#D32F2F' }));
    }
    
    /**
     * Create calendar grid (7 days × 3 meals)
     */
    createCalendar() {
        const calendarX = 30;
        const calendarY = 90;
        const calendarWidth = 800;
        const calendarHeight = 500;
        
        // Calendar background
        this.add.rectangle(calendarX, calendarY, calendarWidth, calendarHeight, 0xffffff, 0.95).setOrigin(0, 0);
        this.add.rectangle(calendarX, calendarY, calendarWidth, calendarHeight).setStrokeStyle(3, 0x333333).setOrigin(0, 0);
        
        // Title
        this.add.text(calendarX + 20, calendarY + 15, '📆 This Week', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Days and meals
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const meals = ['Breakfast', 'Lunch', 'Dinner'];
        
        const cellWidth = 105;
        const cellHeight = 60;
        const gridStartX = calendarX + 110;
        const gridStartY = calendarY + 60;
        
        // Draw meal labels (rows)
        meals.forEach((meal, mealIndex) => {
            this.add.text(calendarX + 20, gridStartY + mealIndex * cellHeight + cellHeight / 2, meal, {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#666666',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
        });
        
        // Draw day labels (columns)
        days.forEach((day, dayIndex) => {
            this.add.text(gridStartX + dayIndex * cellWidth + cellWidth / 2, gridStartY - 20, day, {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#666666',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0);
        });
        
        // Draw calendar cells
        days.forEach((day, dayIndex) => {
            meals.forEach((meal, mealIndex) => {
                this.createCalendarCell(
                    gridStartX + dayIndex * cellWidth,
                    gridStartY + mealIndex * cellHeight,
                    cellWidth,
                    cellHeight,
                    dayIndex + 1, // day 1-7
                    meal
                );
            });
        });
        
        // Separator line
        this.add.rectangle(calendarX + 20, calendarY + calendarHeight - 100, calendarWidth - 40, 2, 0xE0E0E0);
        
        // Current inventory reminder (cleaner single line with better spacing)
        const invSummary = this.inventory.getSummary();
        this.add.text(calendarX + 20, calendarY + calendarHeight - 70, 
            `📦 Current Inventory: ${invSummary.totalItems} items (${invSummary.expiringItems} expiring soon)`, {
            fontSize: '17px',
            fontFamily: 'Fredoka, Arial',
            color: '#F44336',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Tip text
        this.add.text(calendarX + 20, calendarY + calendarHeight - 40, 
            '💡 Click cells to assign meals from the recipe library →', {
            fontSize: '15px',
            fontFamily: 'Fredoka, Arial',
            color: '#9C27B0',
            fontStyle: 'italic'
        }).setOrigin(0, 0);
    }
    
    /**
     * Create a modern calendar cell with depth and hover effects
     */
    createCalendarCell(x, y, width, height, day, mealType) {
        const cell = this.add.container(x, y);
        
        // Shadow
        const shadow = this.add.rectangle(2, 2, width - 5, height - 5, 0x000000, 0.08);
        shadow.setOrigin(0, 0);
        
        // Cell background with gradient
        const bg = this.add.rectangle(0, 0, width - 5, height - 5, 0xffffff);
        bg.setStrokeStyle(2, 0xBDBDBD);
        bg.setOrigin(0, 0);
        bg.setInteractive({ dropZone: true, useHandCursor: true });
        
        // Meal slot text (will show recipe icon when assigned)
        const slotText = this.add.text(width / 2 - 2.5, height / 2 - 2.5, '+', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#BDBDBD'
        }).setOrigin(0.5);
        
        cell.add([shadow, bg, slotText]);
        cell.setData('day', day);
        cell.setData('mealType', mealType);
        cell.setData('slotText', slotText);
        cell.setData('bg', bg);
        cell.setData('shadow', shadow);
        cell.setData('isCalendarCell', true);
        
        // Enhanced hover effects
        bg.on('pointerover', () => {
            bg.setFillStyle(0xE1BEE7);
            bg.setStrokeStyle(3, 0x9C27B0);
            shadow.setAlpha(0.15);
            cell.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0xffffff);
            bg.setStrokeStyle(2, 0xBDBDBD);
            shadow.setAlpha(0.08);
            cell.setScale(1);
        });
        
        // Click to select recipe
        bg.on('pointerdown', (_p, _x, _y, event) => {
            event.stopPropagation();
            this.showRecipeSelector(day, mealType, cell);
        });
        
        return cell;
    }
    
    /**
     * Show enhanced recipe selector modal
     */
    showRecipeSelector(day, mealType, cell) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // All modal objects tracked here for complete cleanup
        const modalObjects = [];
        let dismissed = false;

        const closeModal = () => {
            if (dismissed) return;
            dismissed = true;
            modalObjects.forEach(obj => {
                if (obj && obj.active) {
                    if (obj.disableInteractive) obj.disableInteractive();
                    obj.destroy();
                }
            });
        };
        
        // Animated overlay — stopPropagation blocks click-through to calendar cells
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        overlay.setOrigin(0, 0);
        overlay.setInteractive();
        overlay.setDepth(5000);
        overlay.on('pointerdown', (_p, _x, _y, event) => { event.stopPropagation(); });
        modalObjects.push(overlay);
        
        this.tweens.add({
            targets: overlay,
            alpha: 0.7,
            duration: 250,
            ease: 'Power2'
        });
        
        // Modern panel with shadow
        const panelWidth = 650;
        const panelHeight = 580;
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2;
        
        const panelShadow = this.add.rectangle(panelX + 5, panelY + 5, panelWidth, panelHeight, 0x000000, 0.25);
        panelShadow.setOrigin(0, 0).setDepth(5001);
        modalObjects.push(panelShadow);
        
        const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff);
        panel.setStrokeStyle(4, 0x9C27B0);
        panel.setOrigin(0, 0).setDepth(5001);
        modalObjects.push(panel);
        
        // Slide in animation
        panel.setY(panelY + 50);
        panelShadow.setY(panelY + 55);
        panel.setAlpha(0);
        panelShadow.setAlpha(0);
        
        this.tweens.add({
            targets: [panel, panelShadow],
            y: `-=50`,
            alpha: { from: 0, to: [1, 0.25] },
            duration: 350,
            delay: 100,
            ease: 'Back.easeOut'
        });
        
        // Gradient header
        const headerBar = this.add.rectangle(panelX, panelY, panelWidth, 70, 0x9C27B0);
        headerBar.setOrigin(0, 0).setDepth(5002);
        modalObjects.push(headerBar);
        
        // Title
        const title = this.add.text(width / 2, panelY + 35, `Day ${day} • ${mealType}`, {
            fontSize: '26px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(5003);
        modalObjects.push(title);
        
        // Meal type icon
        const mealIcons = {
            'Breakfast': '🌅',
            'Lunch': '☀️',
            'Dinner': '🌙'
        };
        const mealIcon = this.add.text(panelX + 30, panelY + 35, mealIcons[mealType] || '🍽️', {
            fontSize: '32px'
        }).setOrigin(0.5).setDepth(5003);
        modalObjects.push(mealIcon);
        
        // Filter recipes by meal category
        const categoryMap = {
            'Breakfast': 'breakfast',
            'Lunch': 'lunch',
            'Dinner': 'dinner'
        };
        const categoryFilter = categoryMap[mealType] || 'dinner';
        
        const availableRecipes = this.recipes.filter(recipe => 
            recipe.category === categoryFilter || categoryFilter === 'dinner'
        );
        
        // Recipe cards with enhanced styling
        const recipeStartY = panelY + 90;
        const recipeSpacing = 62;
        
        availableRecipes.slice(0, 7).forEach((recipe, index) => {
            const y = recipeStartY + index * recipeSpacing;
            const cardContainer = this.add.container(panelX + 20, y);
            
            // Card shadow
            const cardShadow = this.add.rectangle(2, 2, 610, 55, 0x000000, 0.1);
            cardShadow.setOrigin(0, 0);
            
            // Card background
            const cardBg = this.add.rectangle(0, 0, 610, 55, 0xffffff);
            cardBg.setStrokeStyle(2, 0xE0E0E0);
            cardBg.setOrigin(0, 0);
            cardBg.setInteractive({ useHandCursor: true });
            
            // Left accent
            const accent = this.add.rectangle(0, 0, 5, 55, 0x9C27B0);
            accent.setOrigin(0, 0);
            
            // Recipe icon with circular bg
            const iconCircle = this.add.circle(35, 27, 20, 0xF3E5F5);
            const recipeIcon = this.add.text(35, 27, recipe.icon, {
                fontSize: '28px'
            }).setOrigin(0.5);
            
            // Recipe name
            const recipeName = this.add.text(70, 18, recipe.name, {
                fontSize: '18px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                fontStyle: 'bold'
            }).setOrigin(0, 0);
            
            // Servings info
            const servingsInfo = this.add.text(70, 36, `Serves ${recipe.servings} people`, {
                fontSize: '14px',
                fontFamily: 'Fredoka, Arial',
                color: '#666666'
            }).setOrigin(0, 0);
            
            // Arrow indicator
            const arrow = this.add.text(585, 27, '→', {
                fontSize: '24px',
                color: '#9C27B0',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            
            cardContainer.add([cardShadow, cardBg, accent, iconCircle, recipeIcon, recipeName, servingsInfo, arrow]);
            cardContainer.setDepth(5003);
            modalObjects.push(cardContainer);
            
            // Hover effects
            cardBg.on('pointerover', () => {
                cardBg.setFillStyle(0xF3E5F5);
                cardBg.setStrokeStyle(3, 0x9C27B0);
                cardContainer.setScale(1.02);
            });
            
            cardBg.on('pointerout', () => {
                cardBg.setFillStyle(0xffffff);
                cardBg.setStrokeStyle(2, 0xE0E0E0);
                cardContainer.setScale(1);
            });
            
            cardBg.on('pointerdown', (_p, _x, _y, event) => {
                event.stopPropagation();
                this.assignRecipeToSlot(day, mealType, recipe, cell);
                closeModal();
            });
        });
        
        // Clear button with enhanced styling
        const clearBtn = this.add.container(width / 2 - 150, panelY + panelHeight - 45).setDepth(5004);
        modalObjects.push(clearBtn);
        
        const clearBg = this.add.rectangle(0, 0, 200, 50, 0xFF9800);
        clearBg.setStrokeStyle(3, 0xffffff);
        clearBg.setInteractive({ useHandCursor: true });
        
        const clearText = this.add.text(0, 0, '🗑️ Clear Meal', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        clearBtn.add([clearBg, clearText]);
        
        clearBg.on('pointerover', () => {
            clearBtn.setScale(1.05);
            clearBg.setFillStyle(0xFFA726);
        });
        
        clearBg.on('pointerout', () => {
            clearBtn.setScale(1);
            clearBg.setFillStyle(0xFF9800);
        });
        
        clearBg.on('pointerdown', (_p, _x, _y, event) => {
            event.stopPropagation();
            this.clearMealSlot(day, mealType, cell);
            closeModal();
        });
        
        // Cancel button
        const cancelBtn = this.add.container(width / 2 + 150, panelY + panelHeight - 45).setDepth(5004);
        modalObjects.push(cancelBtn);
        
        const cancelBg = this.add.rectangle(0, 0, 200, 50, 0x757575);
        cancelBg.setStrokeStyle(3, 0xffffff);
        cancelBg.setInteractive({ useHandCursor: true });
        
        const cancelText = this.add.text(0, 0, 'Cancel', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        cancelBtn.add([cancelBg, cancelText]);
        
        cancelBg.on('pointerover', () => {
            cancelBtn.setScale(1.05);
            cancelBg.setFillStyle(0x9E9E9E);
        });
        
        cancelBg.on('pointerout', () => {
            cancelBtn.setScale(1);
            cancelBg.setFillStyle(0x757575);
        });
        
        cancelBg.on('pointerdown', (_p, _x, _y, event) => {
            event.stopPropagation();
            closeModal();
        });
    }
    
    /**
     * Create recipe option button for selector
     */
    createRecipeOption(x, y, recipe) {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 540, 40, 0xF5F5F5);
        bg.setStrokeStyle(2, 0x9C27B0);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(-250, 0, `${recipe.icon} ${recipe.name}`, {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        const servings = this.add.text(240, 0, `Serves ${recipe.servings}`, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(1, 0.5);
        
        container.add([bg, text, servings]);
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0xE1BEE7);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0xF5F5F5);
        });
        
        return bg;
    }
    
    /**
     * Assign recipe to meal slot with visual feedback
     */
    assignRecipeToSlot(day, mealType, recipe, cell) {
        const key = `${day}_${mealType}`;
        this.plannedMeals[key] = recipe.id;
        
        // Update cell display with animation
        const slotText = cell.getData('slotText');
        const bg = cell.getData('bg');
        
        if (slotText) {
            slotText.setText(recipe.icon);
            slotText.setFontSize('32px');
            slotText.setColor('#333333');
            
            // Pop-in animation
            slotText.setScale(0);
            this.tweens.add({
                targets: slotText,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
                ease: 'Back.easeOut'
            });
        }
        
        // Highlight cell with colored border
        if (bg) {
            bg.setFillStyle(0xF3E5F5);
            bg.setStrokeStyle(3, 0x9C27B0);
            
            // Success flash
            this.tweens.add({
                targets: bg,
                alpha: 0.7,
                duration: 150,
                yoyo: true,
                repeat: 1
            });
        }
        
        // Add to household meal plan
        this.household.addMealToPlan(day, mealType.toLowerCase(), recipe.id);
        
        console.log(`📝 Planned: ${recipe.name} for Day ${day} ${mealType}`);
        
        // Update waste projection and completeness
        this.updateWasteProjection();
        this.updateCompletenessIndicator();
    }
    
    /**
     * Clear a meal slot with visual feedback
     */
    clearMealSlot(day, mealType, cell) {
        const key = `${day}_${mealType}`;
        delete this.plannedMeals[key];
        
        // Update cell display
        const slotText = cell.getData('slotText');
        const bg = cell.getData('bg');
        
        if (slotText) {
            // Fade out animation
            this.tweens.add({
                targets: slotText,
                scaleX: 0,
                scaleY: 0,
                duration: 200,
                ease: 'Back.easeIn',
                onComplete: () => {
                    slotText.setText('+');
                    slotText.setFontSize('28px');
                    slotText.setColor('#BDBDBD');
                    
                    // Fade back in
                    this.tweens.add({
                        targets: slotText,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 200,
                        ease: 'Back.easeOut'
                    });
                }
            });
        }
        
        if (bg) {
            bg.setFillStyle(0xffffff);
            bg.setStrokeStyle(2, 0xBDBDBD);
        }
        
        console.log(`🗑️ Cleared meal slot: Day ${day} ${mealType}`);
        
        // Update waste projection and completeness
        this.updateWasteProjection();
        this.updateCompletenessIndicator();
    }
    
    /**
     * Create visual completeness indicator
     */
    createCompletenessIndicator() {
        const indicatorX = 120;
        const indicatorY = 610;
        
        // Background panel
        const bgPanel = this.add.rectangle(indicatorX - 70, indicatorY - 35, 160, 70, 0xffffff, 0.95);
        bgPanel.setStrokeStyle(2, 0x9C27B0);
        bgPanel.setOrigin(0, 0);
        
        // Circular progress ring
        const totalMeals = this.planningDays * 3;
        this.completenessRing = this.createProgressRing(indicatorX, indicatorY, 25, 0, totalMeals, '0%');
        
        // Label
        this.completenessLabel = this.add.text(indicatorX, indicatorY + 38, 'Not Started', {
            fontSize: '13px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
    }
    
    /**
     * Update completeness indicator
     */
    updateCompletenessIndicator() {
        if (!this.completenessRing) return;
        
        const plannedMealsCount = Object.keys(this.plannedMeals).length;
        const optimalMealsCount = this.planningDays * 3;
        const percentage = plannedMealsCount / optimalMealsCount;
        
        // Update ring
        const angle = percentage * 360;
        
        let arcColor;
        if (percentage < 0.33) {
            arcColor = 0xF44336;
        } else if (percentage < 0.66) {
            arcColor = 0xFF9800;
        } else {
            arcColor = 0x4CAF50;
        }
        
        const progressArc = this.completenessRing.getData('progressArc');
        progressArc.clear();
        progressArc.lineStyle(12, arcColor, 1);
        progressArc.beginPath();
        progressArc.arc(0, 0, 25, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + angle), false);
        progressArc.strokePath();
        
        // Update text
        const text = this.completenessRing.getData('text');
        text.setText(`${Math.round(percentage * 100)}%`);
        
        // Update label
        let labelText;
        let labelColor;
        if (percentage === 0) {
            labelText = 'Not Started';
            labelColor = '#999999';
        } else if (percentage < 0.5) {
            labelText = 'In Progress';
            labelColor = '#FF9800';
        } else if (percentage < 1) {
            labelText = 'Almost Done';
            labelColor = '#FF9800';
        } else {
            labelText = 'Complete!';
            labelColor = '#4CAF50';
            this.addPulseAnimation(this.completenessLabel, 1.1, 500);
        }
        
        this.completenessLabel.setText(labelText);
        this.completenessLabel.setColor(labelColor);
    }
    
    /**
     * Create modern recipe library with card layout
     */
    createRecipeLibrary() {
        const libraryX = 860;
        const libraryY = 90;
        const libraryWidth = 370;
        const libraryHeight = 380;
        
        // Modern panel with shadow
        const libraryPanel = this.createModernPanel(libraryX, libraryY, libraryWidth, libraryHeight);
        
        // Gradient header
        const headerBar = this.add.rectangle(libraryX, libraryY, libraryWidth, 50, 0x9C27B0);
        headerBar.setOrigin(0, 0);
        
        // Title
        this.add.text(libraryX + 20, libraryY + 25, '📖 Recipe Library', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Recipe cards with hover effects
        const recipeY = libraryY + 65;
        const recipeSpacing = 45;
        
        this.recipes.slice(0, 6).forEach((recipe, index) => {
            const y = recipeY + index * recipeSpacing;
            const cardContainer = this.add.container(libraryX + 10, y);
            
            // Card background
            const cardBg = this.add.rectangle(0, 0, 350, 38, 0xF5F5F5);
            cardBg.setStrokeStyle(2, 0xE0E0E0);
            cardBg.setOrigin(0, 0);
            cardBg.setInteractive({ useHandCursor: true });
            
            // Recipe icon with background
            const iconBg = this.add.circle(25, 19, 16, 0x9C27B0, 0.15);
            const icon = this.add.text(25, 19, recipe.icon, {
                fontSize: '24px'
            }).setOrigin(0.5);
            
            // Recipe name
            const name = this.add.text(48, 19, recipe.name, {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
            
            // Servings badge
            const servingsBadge = this.add.circle(325, 19, 14, 0x2196F3);
            servingsBadge.setStrokeStyle(2, 0xffffff);
            
            const servingsText = this.add.text(325, 19, recipe.servings.toString(), {
                fontSize: '14px',
                fontFamily: 'Fredoka, Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            cardContainer.add([cardBg, iconBg, icon, name, servingsBadge, servingsText]);
            
            // Hover effects
            cardBg.on('pointerover', () => {
                cardBg.setFillStyle(0xE1BEE7);
                cardBg.setStrokeStyle(3, 0x9C27B0);
                cardContainer.setScale(1.03);
            });
            
            cardBg.on('pointerout', () => {
                cardBg.setFillStyle(0xF5F5F5);
                cardBg.setStrokeStyle(2, 0xE0E0E0);
                cardContainer.setScale(1);
            });
        });
        
        // Hint with icon
        this.add.text(libraryX + 20, libraryY + libraryHeight - 25, 
            '💡 Click calendar cells to assign meals', {
            fontSize: '15px',
            fontFamily: 'Fredoka, Arial',
            color: '#9C27B0',
            fontStyle: 'italic'
        }).setOrigin(0, 0);
    }
    
    /**
     * Create enhanced info panel with visual projections
     */
    createInfoPanel() {
        const infoX = 860;
        const infoY = 490;
        const infoWidth = 370;
        const infoHeight = 140;
        
        // Modern panel with shadow
        const infoPanel = this.createModernPanel(infoX, infoY, infoWidth, infoHeight, 0xFFF3E0);
        
        // Gradient header
        const headerBar = this.add.rectangle(infoX, infoY, infoWidth, 45, 0xFF9800);
        headerBar.setOrigin(0, 0);
        
        // Title with icon
        this.add.text(infoX + 20, infoY + 23, '🔮 Waste Projection', {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Waste amount (will be updated)
        this.wasteAmountText = this.add.text(infoX + 20, infoY + 70, '---', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Waste bar (will be updated)
        this.wasteBar = null;
        
        // Status text (will be updated)
        this.wasteStatusText = this.add.text(infoX + 20, infoY + 108, 
            'Plan meals to see projection...', {
            fontSize: '15px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            wordWrap: { width: infoWidth - 40 }
        }).setOrigin(0, 0);
    }
    
    /**
     * Update waste projection with visual indicators
     */
    updateWasteProjection() {
        const model = new StochasticModel();
        const projection = model.simulateFuture(this.household, this.inventory, this.planningDays);
        
        const plannedMealsCount = Object.keys(this.plannedMeals).length;
        const optimalMealsCount = this.planningDays * 3;
        const planCompleteness = plannedMealsCount / optimalMealsCount;
        
        const infoX = 860;
        const infoY = 490;
        
        if (planCompleteness === 0) {
            // No meals planned
            this.wasteAmountText.setText('No plan yet');
            this.wasteAmountText.setColor('#999999');
            this.wasteStatusText.setText('Start planning to reduce waste!');
            this.wasteStatusText.setColor('#666666');
            
            if (this.wasteBar) {
                this.wasteBar.destroy();
                this.wasteBar = null;
            }
        } else {
            // Show projected waste with animated counter
            const wasteValue = projection.projectedWaste.toFixed(1);
            
            this.tweens.addCounter({
                from: 0,
                to: projection.projectedWaste,
                duration: 800,
                ease: 'Cubic.out',
                onUpdate: (tween) => {
                    const value = tween.getValue().toFixed(1);
                    this.wasteAmountText.setText(`${value} lbs`);
                }
            });
            
            // Color code based on waste level
            let wasteColor;
            if (projection.projectedWaste < 2) {
                wasteColor = '#4CAF50';
                this.wasteStatusText.setText('✅ Excellent plan!');
            } else if (projection.projectedWaste < 4) {
                wasteColor = '#FF9800';
                this.wasteStatusText.setText('👍 Good plan!');
            } else {
                wasteColor = '#F44336';
                this.wasteStatusText.setText('⚠️ High waste - plan more meals!');
            }
            
            this.wasteAmountText.setColor(wasteColor);
            this.wasteStatusText.setColor(wasteColor);
            
            // Create or update waste bar
            if (this.wasteBar) {
                this.wasteBar.destroy();
            }
            
            // Waste bar (relative to typical 5 lbs baseline)
            const baselineWaste = 5;
            this.wasteBar = this.createProgressBar(
                infoX + 200, infoY + 70,
                150, 16,
                projection.projectedWaste, baselineWaste,
                { low: 0x4CAF50, mid: 0xFF9800, high: 0xF44336 }
            );
        }
    }
    
    /**
     * Create submit button
     */
    createSubmitButton() {
        const width = this.cameras.main.width;
        const btnX = width / 2 - 200;
        const btnY = 645;
        
        const button = this.add.container(btnX, btnY);
        
        const bg = this.add.rectangle(0, 0, 360, 60, 0x4CAF50);
        bg.setStrokeStyle(4, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, '✅ Finish Planning', {
            fontSize: '26px',
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
            this.finishPlanning();
        });
    }
    
    /**
     * Finish planning and calculate score
     */
    finishPlanning() {
        console.log('✅ Meal planning complete');
        
        // Calculate score
        const score = this.calculatePlanningScore();
        this.household.recordDecision('planning_session', Math.round((score.score - 40) / 5), {
            mealsPlanned: score.mealsPlanned,
            projectedWaste: score.projectedWaste
        });
        
        // Update household
        this.household.modifyWasteAwareness(score.awarenessChange);
        
        // Save game
        gameState.save();
        
        // Show results
        this.showPlanningResults(score);
    }
    
    /**
     * Calculate planning score
     */
    calculatePlanningScore() {
        let score = 40; // Base score
        let awarenessChange = 3; // Base change
        const feedback = [];
        
        const plannedCount = Object.keys(this.plannedMeals).length;
        const optimalCount = this.planningDays * 3;
        const completeness = plannedCount / optimalCount;
        
        // Completeness bonus
        score += completeness * 40;
        awarenessChange += completeness * 7;
        
        if (completeness >= 0.8) {
            feedback.push('✅ Comprehensive meal plan!');
        } else if (completeness >= 0.5) {
            feedback.push('👍 Good planning - try to fill more meals.');
        } else if (completeness < 0.3) {
            feedback.push('⚠️ Plan more meals to reduce waste!');
        }
        
        // Check if plan uses expiring items
        const expiringItems = this.inventory.getExpiringSoonItems();
        if (expiringItems.length > 0 && plannedCount >= 3) {
            score += 15;
            awarenessChange += 3;
            feedback.push('✅ Planning helps use expiring items!');
        }
        
        // Variety bonus (different recipes)
        const uniqueRecipes = new Set(Object.values(this.plannedMeals));
        if (uniqueRecipes.size >= 5) {
            score += 10;
            awarenessChange += 2;
            feedback.push('🌟 Good variety in your plan!');
        }
        
        // Run waste projection
        const model = new StochasticModel();
        const projection = model.simulateFuture(this.household, this.inventory, this.planningDays);
        
        return {
            score: Math.max(0, Math.min(100, score)),
            awarenessChange: Math.max(0, Math.min(15, awarenessChange)),
            feedback: feedback,
            mealsPlanned: plannedCount,
            projectedWaste: projection.projectedWaste,
            projectedWasteValue: projection.projectedWasteValue
        };
    }
    
    /**
     * Create recipe option for selector
     */
    createRecipeOption(x, y, recipe) {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 520, 35, 0xF5F5F5);
        bg.setStrokeStyle(2, 0x9C27B0);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(-240, 0, `${recipe.icon} ${recipe.name}`, {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333'
        }).setOrigin(0, 0.5);
        
        container.add([bg, text]);
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0xE1BEE7);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0xF5F5F5);
        });
        
        return bg;
    }
    
    /**
     * Show enhanced planning results modal
     */
    showPlanningResults(score) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Animated overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        overlay.setOrigin(0, 0);
        overlay.setInteractive();
        overlay.setDepth(6000);
        
        this.tweens.add({
            targets: overlay,
            alpha: 0.75,
            duration: 300,
            ease: 'Power2'
        });
        
        // Modern panel with shadow
        const panelWidth = 750;
        const panelHeight = 580;
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2;
        
        const panelShadow = this.add.rectangle(panelX + 6, panelY + 6, panelWidth, panelHeight, 0x000000, 0.3);
        panelShadow.setOrigin(0, 0).setDepth(6001);
        
        const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff);
        panel.setStrokeStyle(4, 0x9C27B0);
        panel.setOrigin(0, 0).setDepth(6001);
        
        // Gradient header bar
        const headerBar = this.add.rectangle(panelX, panelY, panelWidth, 85, 0x9C27B0);
        headerBar.setOrigin(0, 0).setDepth(6002);
        
        // Title with animation
        const title = this.add.text(width / 2, panelY + 42, '📅 Planning Complete!', {
            fontSize: '40px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6003);
        
        title.setAlpha(0);
        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 400,
            ease: 'Power2'
        });
        
        // Score badge with animation
        const scoreY = panelY + 145;
        const scoreBadge = this.createBadge(
            width / 2, scoreY,
            '⭐', '',
            0xFFD700, 85, true
        );
        scoreBadge.setDepth(6003);
        scoreBadge.setAlpha(0);
        scoreBadge.setScale(0.5);
        
        this.tweens.add({
            targets: scoreBadge,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            delay: 200,
            ease: 'Back.easeOut'
        });
        
        // Animated score text
        const rating = this.getPlanningRating(score.score);
        this.add.text(width / 2, scoreY + 2, rating, {
            fontSize: '34px',
            fontFamily: 'Fredoka, Arial',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6004);
        
        // Stats section with modern layout
        const statsY = panelY + 240;
        const statSpacing = 75;
        
        // Row 1: Meals planned
        const mealsIcon = this.add.text(width / 2 - 260, statsY, '📋', {
            fontSize: '32px'
        }).setOrigin(0, 0.5).setDepth(6003);
        
        this.add.text(width / 2 - 215, statsY - 10, 'Meals Planned', {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0, 0).setDepth(6003);
        
        this.createCountingText(width / 2 - 215, statsY + 8, 0, score.mealsPlanned, '', ` / ${this.planningDays * 3}`, {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(6003);
        
        // Row 1: Projected waste
        const wasteIcon = this.add.text(width / 2 + 40, statsY, '🗑️', {
            fontSize: '32px'
        }).setOrigin(0, 0.5).setDepth(6003);
        
        this.add.text(width / 2 + 85, statsY - 10, 'Projected Waste', {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0, 0).setDepth(6003);
        
        const wasteColor = score.projectedWaste < 2 ? '#4CAF50' : score.projectedWaste < 4 ? '#FF9800' : '#F44336';
        this.createCountingText(width / 2 + 85, statsY + 8, 0, score.projectedWaste, '', ' lbs', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: wasteColor,
            fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(6003);
        
        // Row 2: Waste value bar
        const valueY = statsY + statSpacing;
        
        this.add.text(width / 2 - 200, valueY, '💵 Projected Waste Value', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(6003);
        
        // Value amount
        this.createCountingText(width / 2 - 200, valueY + 30, 0, score.projectedWasteValue, '$', '', {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: wasteColor,
            fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(6003);
        
        // Feedback badges
        const feedbackY = panelY + panelHeight - 190;
        score.feedback.forEach((feedback, index) => {
            const feedbackText = this.add.text(width / 2, feedbackY + index * 32, feedback, {
                fontSize: '18px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                align: 'center',
                backgroundColor: '#F3E5F5',
                padding: { x: 15, y: 5 }
            }).setOrigin(0.5).setDepth(6003);
            
            // Fade in animation
            feedbackText.setAlpha(0);
            this.tweens.add({
                targets: feedbackText,
                alpha: 1,
                duration: 300,
                delay: 400 + index * 150,
                ease: 'Power2'
            });
        });
        
        // Tip banner
        const tipY = panelY + panelHeight - 100;
        const tipBanner = this.add.rectangle(width / 2, tipY, 680, 45, 0xFFF3E0);
        tipBanner.setStrokeStyle(2, 0xFF9800);
        tipBanner.setDepth(6003);
        
        this.add.text(width / 2, tipY, '💡 Good planning reduces waste by 25-30%!', {
            fontSize: '17px',
            fontFamily: 'Fredoka, Arial',
            color: '#FF9800',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6004);
        
        // Continue button with enhanced styling
        const continueBtn = this.add.container(width / 2, panelY + panelHeight - 40).setDepth(6005);
        
        const btnBg = this.add.rectangle(0, 0, 280, 65, 0x4CAF50);
        btnBg.setStrokeStyle(4, 0xffffff);
        btnBg.setInteractive({ useHandCursor: true });
        
        const btnText = this.add.text(0, 0, 'Continue', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        continueBtn.add([btnBg, btnText]);
        
        btnBg.on('pointerover', () => {
            continueBtn.setScale(1.05);
            btnBg.setFillStyle(0x66BB6A);
        });
        
        btnBg.on('pointerout', () => {
            continueBtn.setScale(1);
            btnBg.setFillStyle(0x4CAF50);
        });
        
        btnBg.on('pointerdown', () => {
            const mealsPlanned = Object.keys(this.plannedMeals).length;
            
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                hydraGuide.showFeedback('planning-complete', {
                    mealsPlanned: mealsPlanned,
                    projectedWaste: score.projectedWaste
                }, () => {
                    this.scene.start('ManagementScene');
                });
            } else {
                this.scene.start('ManagementScene');
            }
        });
    }
    
    /**
     * Create back button
     */
    createBackButton() {
        const button = this.add.container(60, 35);
        
        const bg = this.add.circle(0, 0, 25, 0xffffff, 0.9);
        bg.setStrokeStyle(3, 0x333333);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, '←', {
            fontSize: '28px',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        button.setDepth(100);
        
        bg.on('pointerdown', () => {
            this.scene.start('ManagementScene');
        });
    }
    
    /**
     * Create a modernized panel with shadow effect
     */
    createModernPanel(x, y, width, height, color = 0xffffff) {
        const container = this.add.container(x, y);
        
        const shadow = this.add.rectangle(4, 4, width, height, 0x000000, 0.15);
        shadow.setOrigin(0, 0);
        
        const panel = this.add.rectangle(0, 0, width, height, color);
        panel.setStrokeStyle(2, 0xcccccc);
        panel.setOrigin(0, 0);
        
        container.add([shadow, panel]);
        return container;
    }
    
    /**
     * Create a horizontal progress bar with color gradient
     */
    createProgressBar(x, y, width, height, value, maxValue, colors = {low: 0xF44336, mid: 0xFF9800, high: 0x4CAF50}) {
        const container = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, width, height, 0xe0e0e0);
        bg.setOrigin(0, 0.5);
        
        const percentage = Math.max(0, Math.min(1, value / maxValue));
        const fillWidth = width * percentage;
        
        let fillColor;
        if (percentage < 0.33) {
            fillColor = colors.low;
        } else if (percentage < 0.66) {
            fillColor = colors.mid;
        } else {
            fillColor = colors.high;
        }
        
        const fill = this.add.rectangle(0, 0, fillWidth, height - 4, fillColor);
        fill.setOrigin(0, 0.5);
        
        const border = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        border.setStrokeStyle(2, 0x666666);
        border.setOrigin(0, 0.5);
        
        container.add([bg, fill, border]);
        container.setData('fill', fill);
        container.setData('percentage', percentage);
        
        return container;
    }
    
    /**
     * Create a circular progress ring
     */
    createProgressRing(x, y, radius, value, maxValue, label = '') {
        const container = this.add.container(x, y);
        
        const percentage = Math.max(0, Math.min(1, value / maxValue));
        const angle = percentage * 360;
        
        let arcColor;
        if (percentage < 0.33) {
            arcColor = 0xF44336;
        } else if (percentage < 0.66) {
            arcColor = 0xFF9800;
        } else {
            arcColor = 0x4CAF50;
        }
        
        const bgCircle = this.add.circle(0, 0, radius, 0xe0e0e0);
        
        const progressArc = this.add.graphics();
        progressArc.lineStyle(12, arcColor, 1);
        progressArc.beginPath();
        progressArc.arc(0, 0, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + angle), false);
        progressArc.strokePath();
        
        const displayValue = label || `${Math.round(percentage * 100)}%`;
        const text = this.add.text(0, 0, displayValue, {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([bgCircle, progressArc, text]);
        container.setData('progressArc', progressArc);
        container.setData('text', text);
        container.setData('percentage', percentage);
        
        return container;
    }
    
    /**
     * Create an animated badge with icon
     */
    createBadge(x, y, icon, label, color = 0xFFD700, size = 60, shouldGlow = false) {
        const container = this.add.container(x, y);
        
        const bg = this.add.circle(0, 0, size / 2, color);
        bg.setStrokeStyle(3, 0xffffff);
        
        const iconText = this.add.text(0, -5, icon, {
            fontSize: `${size * 0.5}px`
        }).setOrigin(0.5);
        
        if (label) {
            const labelText = this.add.text(0, size / 2 + 15, label, {
                fontSize: '14px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0);
            container.add(labelText);
        }
        
        container.add([bg, iconText]);
        
        if (shouldGlow) {
            this.tweens.add({
                targets: bg,
                scaleX: 1.1,
                scaleY: 1.1,
                alpha: 0.8,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        return container;
    }
    
    /**
     * Create animated counting text that counts up to a value
     */
    createCountingText(x, y, startValue, endValue, prefix = '', suffix = '', config = {}) {
        const text = this.add.text(x, y, `${prefix}${startValue}${suffix}`, config);
        
        this.tweens.addCounter({
            from: startValue,
            to: endValue,
            duration: 1000,
            ease: 'Cubic.out',
            onUpdate: (tween) => {
                const value = Math.round(tween.getValue());
                text.setText(`${prefix}${value}${suffix}`);
            }
        });
        
        return text;
    }
    
    /**
     * Add pulse animation to a game object
     */
    addPulseAnimation(target, scale = 1.1, duration = 600) {
        this.tweens.add({
            targets: target,
            scaleX: scale,
            scaleY: scale,
            duration: duration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    /**
     * Convert hidden planning score into visible rating
     */
    getPlanningRating(score) {
        if (score >= 85) return 'Excellent ✅';
        if (score >= 70) return 'Great 👍';
        if (score >= 55) return 'Solid 🙂';
        return 'Needs Improvement 💡';
    }
}
