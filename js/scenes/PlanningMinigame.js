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
        
        // Bloom's Taxonomy: per-session objective tracking (reset each time scene starts)
        this.sessionObjectives = {
            l1_checked: false,          // Remember: viewed expiring items
            l2_lowWaste: false,         // Understand: projected waste < 3 lbs
            l3_expiringMealsCount: 0,   // Apply: meals using expiring ingredients
            l4_balanced: false          // Analyze: all 3 meal types + 4+ unique recipes
        };
        this.objectiveTexts = [];       // Phaser text objects for live checkmark updates
    }
    
    create() {
        console.log('📅 PlanningMinigame: Starting meal planning...');
        
        this.household = gameState.household;
        this.inventory = gameState.inventory;

        // If the player already used "Check Expiring Items" today, pre-complete L1
        const lastCheck = this.household.planningObjectives?.lastExpiringCheckDay ?? 0;
        if (lastCheck === this.household.day) {
            this.sessionObjectives.l1_checked = true;
        }

        // Prune expired meal plan entries (days before today)
        this.household.mealPlan = this.household.mealPlan.filter(
            meal => meal.day >= this.household.day
        );

        // Rebuild local plannedMeals map from remaining household plan
        this.plannedMeals = {};
        this.household.mealPlan.forEach(meal => {
            const capitalType = meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1);
            this.plannedMeals[`${meal.day}_${capitalType}`] = meal.recipeId;
        });
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0xF3E5F5).setOrigin(0, 0);
        
        // Header
        this.createHeader();

        // Full-width progress strip (sits between header and calendar)
        this.createProgressStrip();
        
        // Load recipes
        const recipeData = this.cache.json.get('recipes');
        if (recipeData && recipeData.recipes) {
            this.recipes = recipeData.recipes;
        }
        
        // Create calendar grid
        this.createCalendar();
        this.restorePlannedMealVisuals();
        
        // Create recipe library
        this.createRecipeLibrary();
        
        // Create info panel
        this.createInfoPanel();
        
        // Create learning objectives panel (Bloom's Taxonomy)
        this.createObjectivesPanel();
        
        // Create completeness indicator
        this.createCompletenessIndicator();
        
        // Create submit button
        this.createSubmitButton();
        
        // Sync objectives panel checkmarks with any pre-seeded state (e.g. L1 already done in fridge)
        this.updateObjectivesPanel();

        // Initialize progress strip and completeness indicator with current state
        this.updateCompletenessIndicator();

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
        this.add.text(500, 35, `Week ${this.household.week}`, {
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
        this.calendarCells = {};
        const calendarX = 30;
        const calendarY = 90;
        const calendarWidth = 800;
        const calendarHeight = 500;
        
        // Calendar background
        this.add.rectangle(calendarX, calendarY, calendarWidth, calendarHeight, 0xffffff, 0.95).setOrigin(0, 0);
        this.add.rectangle(calendarX, calendarY, calendarWidth, calendarHeight).setStrokeStyle(3, 0x333333).setOrigin(0, 0);
        
        // Title
        this.add.text(calendarX + calendarWidth / 2, calendarY + 15, '📆 This Week', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        
        // Days and meals
        const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const meals = ['Breakfast', 'Lunch', 'Dinner'];

        // Rotate the day-name array so column 0 always shows the real current weekday.
        // household.day is 1-based; (day-1) % 7 gives 0=Mon … 6=Sun.
        const todayDayOfWeek = ((this.household.day - 1) % 7); // 0-6
        const days = Array.from({ length: 7 }, (_, i) => allDays[(todayDayOfWeek + i) % 7]);
        
        const cellWidth = 96;   // 7 cols × 96 = 672px; gridStartX(140) + 672 = 812 ≤ calendarRight(830)
        const cellHeight = 95;
        const gridStartX = calendarX + 110;
        const gridStartY = calendarY + 90;  // pushed down to clear "This Week" title
        
        // Draw meal labels (rows) — each meal type gets a distinct color + left accent bar
        const mealColors  = ['#E65100', '#00695C', '#283593']; // Breakfast / Lunch / Dinner
        const mealAccents = [0xE65100,   0x00695C,   0x283593];

        meals.forEach((meal, mealIndex) => {
            const rowY = gridStartY + mealIndex * cellHeight + cellHeight / 2;

            // Colored accent bar on the far left
            this.add.rectangle(calendarX + 2, rowY, 6, cellHeight - 10, mealAccents[mealIndex])
                .setOrigin(0, 0.5);

            // Label with matching color
            this.add.text(calendarX + 14, rowY, meal, {
                fontSize: '14px',
                fontFamily: 'Fredoka, Arial',
                color: mealColors[mealIndex],
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);
        });
        
        // Draw day labels (columns) — column 0 is always today, highlighted in orange
        days.forEach((day, dayIndex) => {
            const isToday = dayIndex === 0;
            this.add.text(gridStartX + dayIndex * cellWidth + cellWidth / 2, gridStartY - 20, day, {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: isToday ? '#E65100' : '#666666',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0);
        });

        // TODAY pill above column 0 (always the current game day)
        const todayX = gridStartX + cellWidth / 2;
        this.add.rectangle(todayX, gridStartY - 36, 54, 17, 0xFF9800).setOrigin(0.5);
        this.add.text(todayX, gridStartY - 36, 'TODAY', {
            fontSize: '10px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtle warm tint on all cells in the first (today) column
        meals.forEach((_, mealIndex) => {
            this.add.rectangle(
                gridStartX,
                gridStartY + mealIndex * cellHeight,
                cellWidth - 5,
                cellHeight - 5,
                0xFFF3E0, 0.6
            ).setOrigin(0, 0);
        });
        
        // Draw calendar cells — use absolute game-day numbers so the meal plan
        // and the stochastic simulation share the same day-key space.
        days.forEach((day, dayIndex) => {
            const absDay = this.household.day + dayIndex; // absolute day (e.g. 8, 9, …)
            meals.forEach((meal, mealIndex) => {
                const cellKey = `${absDay}_${meal}`;
                this.calendarCells[cellKey] = this.createCalendarCell(
                    gridStartX + dayIndex * cellWidth,
                    gridStartY + mealIndex * cellHeight,
                    cellWidth,
                    cellHeight,
                    absDay,
                    meal
                );
            });
        });
        
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
        const slotText = this.add.text(width / 2 - 2.5, height * 0.38, '+', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#BDBDBD'
        }).setOrigin(0.5);

        // Recipe name label shown below icon when a meal is assigned
        const nameText = this.add.text(width / 2 - 2.5, height * 0.68, '', {
            fontSize: '11px',
            fontFamily: 'Fredoka, Arial',
            color: '#555555',
            align: 'center',
            wordWrap: { width: width - 10 }
        }).setOrigin(0.5, 0);
        
        cell.add([shadow, bg, slotText, nameText]);
        cell.setData('day', day);
        cell.setData('mealType', mealType);
        cell.setData('slotText', slotText);
        cell.setData('nameText', nameText);
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
            const assigned = !!this.plannedMeals[`${day}_${mealType}`];
            bg.setFillStyle(assigned ? 0xF3E5F5 : 0xffffff);
            bg.setStrokeStyle(assigned ? 3 : 2, assigned ? 0x9C27B0 : 0xBDBDBD);
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
            alpha: 0.85,
            duration: 250,
            ease: 'Power2'
        });
        
        // Modern panel with shadow
        const panelWidth = 650;
        const panelHeight = 640;
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
        
        // Derive weekday name from absolute game day (day 1 = Mon, day 2 = Tue, …)
        const _dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const _dayLabel = _dayNames[((day - 1) % 7)];

        // Title
        const title = this.add.text(width / 2, panelY + 35, `${_dayLabel} • ${mealType}`, {
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
        
        // Filter recipes by meal category — strict match, fall back to all if < 2 found
        const categoryMap = {
            'Breakfast': 'breakfast',
            'Lunch': 'lunch',
            'Dinner': 'dinner'
        };
        const categoryFilter = categoryMap[mealType] || 'dinner';
        const strictMatch = this.recipes.filter(r => r.category === categoryFilter);
        const availableRecipes = strictMatch.length >= 2 ? strictMatch : this.recipes;

        // Track which recipe is already assigned to this slot (if any)
        const assignedRecipeId = this.plannedMeals[`${day}_${mealType}`] || null;
        
        // Recipe cards with enhanced styling
        const recipeStartY = panelY + 90;
        const recipeSpacing = 76;
        
        availableRecipes.slice(0, 6).forEach((recipe, index) => {
            const y = recipeStartY + index * recipeSpacing;
            const cardContainer = this.add.container(panelX + 20, y);
            const isAssigned = recipe.id === assignedRecipeId;

            // Card shadow
            const cardShadow = this.add.rectangle(2, 2, 610, 72, 0x000000, 0.1);
            cardShadow.setOrigin(0, 0);
            
            // Card background — pre-highlighted if already assigned
            const cardBg = this.add.rectangle(0, 0, 610, 72, isAssigned ? 0xEDE7F6 : 0xffffff);
            cardBg.setStrokeStyle(isAssigned ? 3 : 2, isAssigned ? 0x7B1FA2 : 0xE0E0E0);
            cardBg.setOrigin(0, 0);
            cardBg.setInteractive({ useHandCursor: true });
            
            // Left accent — deeper purple for assigned
            const accent = this.add.rectangle(0, 0, 5, 72, isAssigned ? 0x7B1FA2 : 0x9C27B0);
            accent.setOrigin(0, 0);
            
            // Recipe icon with circular bg
            const iconCircle = this.add.circle(35, 36, 20, isAssigned ? 0xD1C4E9 : 0xF3E5F5);
            const recipeIcon = this.add.text(35, 36, recipe.icon, {
                fontSize: '28px'
            }).setOrigin(0.5);
            
            // Recipe name
            const recipeName = this.add.text(70, 10, recipe.name, {
                fontSize: '18px',
                fontFamily: 'Fredoka, Arial',
                color: isAssigned ? '#4A148C' : '#333333',
                fontStyle: 'bold'
            }).setOrigin(0, 0);
            
            // Servings info
            const servingsInfo = this.add.text(70, 30, `Serves ${recipe.servings} people`, {
                fontSize: '14px',
                fontFamily: 'Fredoka, Arial',
                color: '#666666'
            }).setOrigin(0, 0);

            // Ingredient list
            const ingredientStr = recipe.ingredients && recipe.ingredients.length
                ? recipe.ingredients.map(i => i.name).join(', ')
                : 'No ingredients listed';
            const ingredientText = this.add.text(70, 49, ingredientStr, {
                fontSize: '13px',
                fontFamily: 'Fredoka, Arial',
                color: '#888888',
                fontStyle: 'italic',
                wordWrap: { width: 440 }
            }).setOrigin(0, 0);
            
            // Right-side indicator: checkmark if assigned, arrow if not
            const indicator = this.add.text(585, 36, isAssigned ? '✓' : '→', {
                fontSize: '24px',
                color: isAssigned ? '#7B1FA2' : '#9C27B0',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            
            cardContainer.add([cardShadow, cardBg, accent, iconCircle, recipeIcon, recipeName, servingsInfo, ingredientText, indicator]);
            cardContainer.setDepth(5003);
            modalObjects.push(cardContainer);
            
            // Hover effects — preserve assigned tint on pointerout
            cardBg.on('pointerover', () => {
                cardBg.setFillStyle(0xF3E5F5);
                cardBg.setStrokeStyle(3, 0x9C27B0);
                cardContainer.setScale(1.02);
            });
            
            cardBg.on('pointerout', () => {
                cardBg.setFillStyle(isAssigned ? 0xEDE7F6 : 0xffffff);
                cardBg.setStrokeStyle(isAssigned ? 3 : 2, isAssigned ? 0x7B1FA2 : 0xE0E0E0);
                cardContainer.setScale(1);
            });
            
            cardBg.on('pointerdown', (_p, _x, _y, event) => {
                event.stopPropagation();
                this.assignRecipeToSlot(day, mealType, recipe, cell);
                closeModal();
            });
        });
        
        const numShown = Math.min(availableRecipes.length, 6);
        const btnY = recipeStartY + numShown * recipeSpacing + 45;
        
        // Clear button with enhanced styling
        const clearBtn = this.add.container(width / 2 - 150, btnY).setDepth(5004);
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
        const cancelBtn = this.add.container(width / 2 + 150, btnY).setDepth(5004);
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
            slotText.setFontSize('28px');
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

        // Show truncated recipe name below the icon
        const nameText = cell.getData('nameText');
        if (nameText) {
            const label = recipe.name.length > 12 ? recipe.name.slice(0, 11) + '\u2026' : recipe.name;
            nameText.setText(label);
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

        // L3 (Apply): recount unique slots using expiring ingredients after this assignment.
        // A full recount (rather than an increment) prevents double-counting when a slot is
        // replaced and avoids phantom counts if the same slot is assigned multiple times.
        this.recalculateL3Count();

        // L4 (Analyze): check balanced plan status
        this.checkL4Balance();
        this.updateObjectivesPanel();
        
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

        // Keep household.mealPlan in sync so the simulation reflects the removal
        this.household.mealPlan = this.household.mealPlan.filter(
            meal => !(meal.day === day && meal.mealType === mealType.toLowerCase())
        );
        
        // Update cell display
        const slotText = cell.getData('slotText');
        const bg = cell.getData('bg');
        
        // Clear recipe name label
        const nameText = cell.getData('nameText');
        if (nameText) nameText.setText('');

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

        // L3 (Apply): recount after removal so cleared expiring-ingredient slots reduce the counter
        this.recalculateL3Count();

        // L4 (Analyze): re-evaluate balance after removal
        this.checkL4Balance();
        this.updateObjectivesPanel();
        
        // Update waste projection and completeness
        this.updateWasteProjection();
        this.updateCompletenessIndicator();
    }
    
    /**
     * Silently restore visual state for all pre-populated planned meals
     * Called on open, after createCalendar(), without animations
     */
    restorePlannedMealVisuals() {
        Object.entries(this.plannedMeals).forEach(([key, recipeId]) => {
            const cell = this.calendarCells[key];
            const recipe = this.recipes.find(r => r.id === recipeId);
            if (!cell || !recipe) return;

            const slotText = cell.getData('slotText');
            const bg = cell.getData('bg');

            if (slotText) {
                slotText.setText(recipe.icon);
                slotText.setFontSize('28px');
                slotText.setColor('#333333');
            }
            if (bg) {
                bg.setFillStyle(0xF3E5F5);
                bg.setStrokeStyle(3, 0x9C27B0);
            }
            const nameText = cell.getData('nameText');
            if (nameText) {
                const label = recipe.name.length > 12 ? recipe.name.slice(0, 11) + '\u2026' : recipe.name;
                nameText.setText(label);
            }
        });
    }

    /**
     * Create visual completeness indicator
     */
    createCompletenessIndicator() {
        const indicatorX = 120;
        const indicatorY = 655;
        
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
     * Update completeness indicator and full-width progress strip
     */
    updateCompletenessIndicator() {
        const plannedMealsCount = Object.keys(this.plannedMeals).length;
        const optimalMealsCount = this.planningDays * 3;
        const percentage = plannedMealsCount / optimalMealsCount;

        // Update full-width progress strip
        if (this.progressFill) {
            const fillWidth = this.cameras.main.width * percentage;
            this.progressFill.setDisplaySize(Math.max(0, fillWidth), 16);
        }
        if (this.progressLabel) {
            this.progressLabel.setText(`${plannedMealsCount} / ${optimalMealsCount} meals planned`);
        }

        if (!this.completenessRing) return;
        
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
        const libraryHeight = 315;
        
        // Modern panel with shadow
        const libraryPanel = this.createModernPanel(libraryX, libraryY, libraryWidth, libraryHeight);
        
        // Gradient header
        const headerBar = this.add.rectangle(libraryX, libraryY, libraryWidth, 50, 0x9C27B0);
        headerBar.setOrigin(0, 0);
        
        // Title
        this.add.text(libraryX + 20, libraryY + 25, '📖 Cookable Now', {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Score each recipe by cookability against current inventory
        const scored = this.recipes.map(recipe => {
            const total = recipe.ingredients.length;
            const met   = recipe.ingredients.filter(ing =>
                this.inventory.hasSufficientQuantity(ing.name, ing.quantity)
            ).length;
            const cookable = met === total;   // all ingredients present
            const partial  = !cookable && met > 0; // some ingredients present
            return { recipe, met, total, cookable, partial };
        });

        // Sort: fully cookable first, then partial, then unavailable; ties keep original order
        scored.sort((a, b) => {
            const rank = r => r.cookable ? 0 : r.partial ? 1 : 2;
            return rank(a) - rank(b);
        });

        const cookableCount = scored.filter(s => s.cookable).length;
        // Update header to show how many are cookable
        this.add.text(libraryX + libraryWidth - 16, libraryY + 25,
            `${cookableCount} ready`, {
            fontSize: '13px',
            fontFamily: 'Fredoka, Arial',
            color: cookableCount > 0 ? '#A5D6A7' : '#EF9A9A',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);

        // Recipe cards — up to 6, cookable ones first
        const recipeY = libraryY + 65;
        const recipeSpacing = 40;

        scored.slice(0, 6).forEach(({ recipe, met, total, cookable, partial }, index) => {
            const y = recipeY + index * recipeSpacing;
            const cardContainer = this.add.container(libraryX + 10, y);

            // Card style based on cookability
            const bgColor     = cookable ? 0xF1F8E9 : partial ? 0xFFF8E1 : 0xF5F5F5;
            const borderColor = cookable ? 0x81C784 : partial ? 0xFFB74D : 0xE0E0E0;
            const nameColor   = cookable ? '#2E7D32' : partial ? '#E65100' : '#9E9E9E';

            const cardBg = this.add.rectangle(0, 0, 350, 38, bgColor);
            cardBg.setStrokeStyle(2, borderColor);
            cardBg.setOrigin(0, 0);
            cardBg.setInteractive({ useHandCursor: true });

            // Left accent bar showing cookability
            const accentBar = this.add.rectangle(0, 0, 4, 38, borderColor);
            accentBar.setOrigin(0, 0);

            // Recipe icon
            const iconBg = this.add.circle(25, 19, 16, cookable ? 0x4CAF50 : partial ? 0xFF9800 : 0x9C27B0, 0.15);
            const icon   = this.add.text(25, 19, recipe.icon, { fontSize: '22px' }).setOrigin(0.5);

            // Recipe name
            const name = this.add.text(48, 19, recipe.name, {
                fontSize: '14px',
                fontFamily: 'Fredoka, Arial',
                color: nameColor,
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            // Ingredient progress (e.g. "2/3")
            const progressText = this.add.text(295, 19, `${met}/${total}`, {
                fontSize: '12px',
                fontFamily: 'Fredoka, Arial',
                color: cookable ? '#4CAF50' : partial ? '#FF9800' : '#BDBDBD',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);

            // Cookability dot
            const dotColor = cookable ? 0x4CAF50 : partial ? 0xFF9800 : 0xBDBDBD;
            const dot = this.add.circle(330, 19, 8, dotColor);

            cardContainer.add([cardBg, accentBar, iconBg, icon, name, progressText, dot]);

            // Hover effects (preserve cookability tint)
            cardBg.on('pointerover', () => {
                cardBg.setFillStyle(cookable ? 0xC8E6C9 : partial ? 0xFFE0B2 : 0xE1BEE7);
                cardBg.setStrokeStyle(3, borderColor);
                cardContainer.setScale(1.03);
            });
            cardBg.on('pointerout', () => {
                cardBg.setFillStyle(bgColor);
                cardBg.setStrokeStyle(2, borderColor);
                cardContainer.setScale(1);
            });
        });
        
    }
    
    /**
     * Create Bloom's Taxonomy learning objectives panel
     * Positioned below the recipe library (y=445), above the waste projection panel (y=595)
     */
    createObjectivesPanel() {
        const panelX = 860;
        const panelY = 415;
        const panelWidth = 370;
        const panelH = 130;

        // Panel background
        const shadow = this.add.rectangle(panelX + 4, panelY + 4, panelWidth, panelH, 0x000000, 0.12);
        shadow.setOrigin(0, 0);

        const bg = this.add.rectangle(panelX, panelY, panelWidth, panelH, 0xffffff);
        bg.setStrokeStyle(2, 0x7B1FA2);
        bg.setOrigin(0, 0);

        // Header bar
        const header = this.add.rectangle(panelX, panelY, panelWidth, 36, 0x7B1FA2);
        header.setOrigin(0, 0);

        this.add.text(panelX + 14, panelY + 18, '🎯 Learning Objectives', {
            fontSize: '17px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);

        // Objective definitions: [icon placeholder, label, bloom level tag]
        const objectives = [
            { label: 'Check expiring items',                tag: 'Remember' },
            { label: 'Get projected waste < 3 lbs',        tag: 'Understand' },
            { label: 'Plan 2+ meals with expiring items',  tag: 'Apply' },
            { label: 'Cover all meals + 4 recipes',        tag: 'Analyze' }
        ];

        const rowStartY = panelY + 50;
        const rowSpacing = 22;

        objectives.forEach((obj, i) => {
            const rowY = rowStartY + i * rowSpacing;

            // Level tag pill
            const tagBg = this.add.rectangle(panelX + 14, rowY, 68, 16, 0xEDE7F6);
            tagBg.setOrigin(0, 0.5);
            this.add.text(panelX + 48, rowY, obj.tag, {
                fontSize: '10px',
                fontFamily: 'Fredoka, Arial',
                color: '#7B1FA2',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);

            // Objective label
            this.add.text(panelX + 90, rowY, obj.label, {
                fontSize: '13px',
                fontFamily: 'Fredoka, Arial',
                color: '#444444'
            }).setOrigin(0, 0.5);

            // Status icon (○ or ✓) — stored for later updates
            const statusText = this.add.text(panelX + panelWidth - 20, rowY, '○', {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#BDBDBD',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);

            this.objectiveTexts.push(statusText);
        });

    }

    /**
     * Re-render each objective row's status icon based on current sessionObjectives state.
     * Called after every tracking event so the panel reflects live progress.
     */
    updateObjectivesPanel() {
        if (!this.objectiveTexts || this.objectiveTexts.length < 4) return;

        const states = [
            this.sessionObjectives.l1_checked,
            this.sessionObjectives.l2_lowWaste,
            this.sessionObjectives.l3_expiringMealsCount >= 2,
            this.sessionObjectives.l4_balanced
        ];

        states.forEach((done, i) => {
            const t = this.objectiveTexts[i];
            if (!t) return;
            if (done) {
                t.setText('✓');
                t.setColor('#4CAF50');
                // Brief pop animation on first completion
                if (!t.getData('animated')) {
                    t.setData('animated', true);
                    t.setScale(0.5);
                    this.tweens.add({
                        targets: t,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 300,
                        ease: 'Back.easeOut'
                    });
                }
            } else {
                t.setText('○');
                t.setColor('#BDBDBD');
            }
        });

    }


    /**
     * Full-width planning progress strip between header and calendar.
     * Shows a fill bar + "X / 21 meals planned" counter that updates live.
     */
    createProgressStrip() {
        const total  = this.planningDays * 3;   // 21
        const stripY = 70;
        const stripH = 16;
        const width  = this.cameras.main.width; // 1280

        // Dark background track
        this.add.rectangle(0, stripY, width, stripH, 0x6A1B9A).setOrigin(0, 0);

        // Fill bar — width driven by planned meal count
        this.progressFill = this.add.rectangle(0, stripY, 0, stripH, 0xCE93D8).setOrigin(0, 0);

        // Counter label centred on the strip
        this.progressLabel = this.add.text(width / 2, stripY + stripH / 2,
            `0 / ${total} meals planned`, {
            fontSize: '12px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    /**
     * L3 (Apply): Check whether a recipe's ingredients include any expiring inventory items.
     * Uses a fuzzy name match so "Chicken Breast" matches an item named "Chicken".
     * @param {Object} recipe - Recipe object with ingredients array
     * @returns {boolean} True if at least one ingredient is expiring soon
     */
    recipeUsesExpiringItems(recipe) {
        if (!recipe || !recipe.ingredients) return false;
        const expiring = this.inventory.getExpiringSoonItems ? this.inventory.getExpiringSoonItems() : [];
        if (expiring.length === 0) return false;
        const expiringNames = expiring.map(i => i.name.toLowerCase());
        return recipe.ingredients.some(ing => {
            const ingName = ing.name.toLowerCase();
            return expiringNames.some(n => n.includes(ingName) || ingName.includes(n));
        });
    }

    /**
     * Recount L3 from scratch by scanning every currently-planned slot.
     * Calling this after any assign or clear prevents double-counting when a slot
     * is replaced and avoids the missing-decrement bug when a slot is cleared.
     */
    recalculateL3Count() {
        let count = 0;
        Object.values(this.plannedMeals).forEach(recipeId => {
            const recipe = this.recipes.find(r => r.id === recipeId);
            if (recipe && this.recipeUsesExpiringItems(recipe)) {
                count++;
            }
        });
        this.sessionObjectives.l3_expiringMealsCount = count;
    }

    /**
     * L4 (Analyze): Check whether the current plan covers all 3 meal types and uses 4+ unique recipes.
     */
    checkL4Balance() {
        const types = new Set(Object.keys(this.plannedMeals).map(k => k.split('_')[1]));
        const unique = new Set(Object.values(this.plannedMeals));
        this.sessionObjectives.l4_balanced = types.size >= 3 && unique.size >= 4;
    }

    /**
     * Create enhanced info panel with visual projections
     */
    createInfoPanel() {
        const infoX = 860;
        const infoY = 555;
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
        const projection = model.simulateFuture(
            this.household, this.inventory, this.planningDays,
            { recipes: this.recipes, iterations: 10 }
        );
        
        const plannedMealsCount = Object.keys(this.plannedMeals).length;
        const optimalMealsCount = this.planningDays * 3;
        const planCompleteness = plannedMealsCount / optimalMealsCount;
        
        const infoX = 860;
        const infoY = 555;
        
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

            // L2 (Understand): check if projected waste is below 3 lbs
            if (projection.projectedWaste < 3) {
                this.sessionObjectives.l2_lowWaste = true;
                this.updateObjectivesPanel();
            }
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
        
        // Write unique planned recipe IDs so ShoppingMinigame can auto-populate the list
        this.household.presetRecipeIds = [...new Set(Object.values(this.plannedMeals))];

        // Bloom's Taxonomy: accumulate per-session objective completions into persistent counters
        const planObj = this.household.planningObjectives;
        if (this.sessionObjectives.l1_checked)       planObj.sessionsCheckedExpiring++;
        if (this.sessionObjectives.l2_lowWaste)       planObj.sessionsWithLowWaste++;
        planObj.totalExpiringItemsSaved += this.sessionObjectives.l3_expiringMealsCount;
        if (this.sessionObjectives.l4_balanced)       planObj.balancedPlansCreated++;
        
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
        
        // Run waste projection (averaged over 10 Monte Carlo runs for a stable score)
        const model = new StochasticModel();
        const projection = model.simulateFuture(
            this.household, this.inventory, this.planningDays,
            { recipes: this.recipes, iterations: 10 }
        );
        
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
        
        // Modern panel with shadow — expanded to include objectives section
        const panelWidth = 750;
        const panelHeight = 680;
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
        
        // Feedback badge (first item only, space-constrained)
        if (score.feedback.length > 0) {
            const fbText = this.add.text(width / 2, statsY + statSpacing + 60, score.feedback[0], {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                align: 'center',
                backgroundColor: '#F3E5F5',
                padding: { x: 12, y: 4 }
            }).setOrigin(0.5).setDepth(6003);
            fbText.setAlpha(0);
            this.tweens.add({ targets: fbText, alpha: 1, duration: 300, delay: 500, ease: 'Power2' });
        }

        // ---- Bloom's Taxonomy Objectives Section ----
        const objSectionY = statsY + statSpacing + 90;

        // Section header
        const objHeaderBg = this.add.rectangle(width / 2, objSectionY, 700, 32, 0x7B1FA2)
            .setDepth(6003);
        this.add.text(width / 2, objSectionY, '🎯 Learning Objectives', {
            fontSize: '17px', fontFamily: 'Fredoka, Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setDepth(6004);

        // Compute session completion count
        const sessionStates = [
            this.sessionObjectives.l1_checked,
            this.sessionObjectives.l2_lowWaste,
            this.sessionObjectives.l3_expiringMealsCount >= 2,
            this.sessionObjectives.l4_balanced
        ];
        const completedCount = sessionStates.filter(Boolean).length;

        // Completion badge in header right
        const badgeColor = completedCount === 4 ? 0x4CAF50 : completedCount >= 2 ? 0xFF9800 : 0x9E9E9E;
        this.add.text(width / 2 + 310, objSectionY, `${completedCount}/4`, {
            fontSize: '16px', fontFamily: 'Fredoka, Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(1, 0.5).setDepth(6005);

        const objLabels = [
            { tag: 'Remember',    text: 'Check which items expire soon' },
            { tag: 'Understand',  text: 'Get projected waste below 3 lbs' },
            { tag: 'Apply',       text: 'Plan 2+ meals with expiring items' },
            { tag: 'Analyze',     text: 'Cover all meal types + 4 recipes' }
        ];

        const objRowStartY = objSectionY + 24;
        objLabels.forEach((obj, i) => {
            const rowY = objRowStartY + i * 26;
            const done = sessionStates[i];

            // Tag pill
            const pillBg = this.add.rectangle(panelX + 28, rowY, 72, 18, done ? 0xE8F5E9 : 0xF3E5F5)
                .setOrigin(0, 0.5).setDepth(6003);
            this.add.text(panelX + 64, rowY, obj.tag, {
                fontSize: '11px', fontFamily: 'Fredoka, Arial',
                color: done ? '#2E7D32' : '#7B1FA2', fontStyle: 'bold'
            }).setOrigin(0.5, 0.5).setDepth(6004);

            // Label
            this.add.text(panelX + 110, rowY, obj.text, {
                fontSize: '13px', fontFamily: 'Fredoka, Arial', color: done ? '#333333' : '#888888'
            }).setOrigin(0, 0.5).setDepth(6003);

            // Checkmark
            this.add.text(panelX + panelWidth - 24, rowY, done ? '✓' : '✗', {
                fontSize: '16px', fontFamily: 'Fredoka, Arial',
                color: done ? '#4CAF50' : '#BDBDBD', fontStyle: 'bold'
            }).setOrigin(1, 0.5).setDepth(6004);
        });

        // Cumulative lifetime stats strip
        const obj = this.household.planningObjectives;
        const statsStripY = objRowStartY + objLabels.length * 26 + 12;
        const statsBg = this.add.rectangle(width / 2, statsStripY, 700, 28, 0xF3E5F5)
            .setDepth(6003);
        this.add.text(width / 2, statsStripY,
            `All-time: ${obj.sessionsCheckedExpiring} checks  |  ${obj.sessionsWithLowWaste} low-waste sessions  |  ${obj.totalExpiringItemsSaved} expiring meals saved  |  ${obj.balancedPlansCreated} balanced plans`, {
            fontSize: '11px', fontFamily: 'Fredoka, Arial', color: '#7B1FA2', align: 'center'
        }).setOrigin(0.5, 0.5).setDepth(6004);

        // Continue button with enhanced styling
        const continueBtn = this.add.container(width / 2, panelY + panelHeight - 32).setDepth(6005);
        
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
