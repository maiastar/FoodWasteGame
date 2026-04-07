/**
 * Management Scene
 * Main hub - shows household dashboard, triggers daily events and minigames
 */

class ManagementScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ManagementScene' });
        this.household = null;
        this.inventory = null;
        this.homeScreenMusic = null;
    }
    
    create() {
        console.log('📊 ManagementScene: Loading dashboard...');
        
        // Get game state
        this.household = gameState.household;
        this.inventory = gameState.inventory;
        
        if (!this.household) {
            console.error('No household found - returning to setup');
            this.scene.start('SetupScene');
            return;
        }
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background: household setup page art on dashboard; fallback to homescreen, then solid color
        const dashBgKey = this.textures.exists('setupPageBg')
            ? 'setupPageBg'
            : (this.textures.exists('homescreen') ? 'homescreen' : null);
        if (dashBgKey) {
            const bg = this.add.image(width / 2, height / 2, dashBgKey);
            const coverScale = Math.max(width / bg.width, height / bg.height);
            bg.setScale(coverScale);
        } else {
            this.add.rectangle(0, 0, width, height, 0xE3F2FD).setOrigin(0, 0);
        }
        
        // Create dashboard layout (4 quadrants)
        this.createHeader();
        this.createStatsPanel();
        this.createInventoryPanel();
        this.createCalendarPanel();
        this.createActionPanel();

        if (this.cache.audio.exists('homescreenSynthwaveMusic')) {
            this.homeScreenMusic = this.sound.add('homescreenSynthwaveMusic', { loop: true, volume: 0.35 });
            this.homeScreenMusic.play();
            if (typeof wireBgmAfterAutoplayPolicy === 'function') {
                wireBgmAfterAutoplayPolicy(this, () => this.homeScreenMusic);
            }
        }
        const shutdownEv = (typeof Phaser !== 'undefined' && Phaser.Scenes && Phaser.Scenes.Events && Phaser.Scenes.Events.SHUTDOWN)
            ? Phaser.Scenes.Events.SHUTDOWN
            : 'shutdown';
        this.events.once(shutdownEv, () => {
            if (this.homeScreenMusic) {
                this.homeScreenMusic.stop();
                this.homeScreenMusic.destroy();
                this.homeScreenMusic = null;
            }
            if (this.endDayBgm) {
                this.endDayBgm.stop();
                this.endDayBgm.destroy();
                this.endDayBgm = null;
            }
        });
        
        // Show hydra introduction on first visit
        const tutorial = new Tutorial(this);
        tutorial.initialize();
        tutorial.introduceHydraGuide();

    }
    
    /**
     * Create header with title and day counter
     */
    createHeader() {
        const width = this.cameras.main.width;
        
        // Background bar
        this.add.rectangle(0, 0, width, 80, 0x2196F3).setOrigin(0, 0);
        
        // Title
        this.add.text(30, 40, '🏠 Household Dashboard', {
            fontSize: '36px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Day counter
        const dayText = `📅 Day ${this.household.day} • Week ${this.household.week}`;
        this.dayCounter = this.add.text(width - 30, 40, dayText, {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5);

        // Static minigame reference (all days); separate from Hydra contextual popups
        const gap = 14;
        const iconDisplay = 52;
        const radius = iconDisplay / 2;
        const iconX = this.dayCounter.x - this.dayCounter.width - gap - iconDisplay / 2;
        const guideBtn = this.add.container(iconX, 40);
        const guideCircle = this.add.circle(0, 0, radius, 0xffffff, 0.95);
        guideCircle.setStrokeStyle(2, 0x1565c0);
        const guideMark = this.add.text(0, 0, '?', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#1565C0',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        guideBtn.add([guideCircle, guideMark]);
        guideBtn.setDepth(1);
        guideBtn.setInteractive({
            hitArea: new Phaser.Geom.Circle(0, 0, radius),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            useHandCursor: true
        });
        guideBtn.on('pointerup', () => {
            new StaticMinigameGuide(this).show();
        });
    }
    
    /**
     * Create stats panel (top-left quadrant)
     */
    createStatsPanel() {
        const panelX = 30;
        const panelY = 100;
        const panelWidth = 380;
        const panelHeight = 240;
        
        // Modern panel with shadow
        const panelContainer = this.createModernPanel(panelX, panelY, panelWidth, panelHeight);
        
        // Panel title
        this.add.text(panelX + 20, panelY + 20, '📊 Stats', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Get stats
        const stats = this.household.getStats();
        const initialBudget = 100; // Assume starting budget for progress bar
        
        // Budget Progress Bar
        this.add.text(panelX + 20, panelY + 60, '💰 Weekly Budget', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        const budgetBar = this.createProgressBar(
            panelX + 20, panelY + 88, 
            150, 18,
            stats.budget, initialBudget
        );
        
        // Budget amount with counting animation (below progress bar)
        this.createCountingText(panelX + 20, panelY + 112, 0, stats.budget, '$', '', {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);

        // Happiness meter
        const happiness = this.household.happiness ?? 100;
        const happinessColor = happiness >= 80 ? '#4CAF50' : happiness >= 50 ? '#FFC107' : '#F44336';

        this.add.text(panelX + 20, panelY + 145, '😊 Household Mood', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            fontStyle: 'bold'
        }).setOrigin(0, 0);

        this.createProgressBar(panelX + 20, panelY + 173, 150, 18, happiness, 100);

        this.add.text(panelX + 185, panelY + 173, `${Math.round(happiness)}%`, {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: happinessColor,
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Achievement Badges (show up to 3)
        const achievementIds = this.household.achievements || [];
        const achievementData = {
            'waste_warrior': {icon: '⚔️', name: 'Waste Warrior', color: 0x4CAF50},
            'budget_boss': {icon: '💰', name: 'Budget Boss', color: 0xFFD700},
            'fresh_champion': {icon: '🌟', name: 'Fresh Champion', color: 0x2196F3}
        };
        
        const displayAchievements = achievementIds.slice(-3); // Show last 3
        displayAchievements.forEach((achId, index) => {
            const ach = achievementData[achId];
            if (ach) {
                this.createBadge(
                    panelX + 240 + index * 50, panelY + 215,
                    ach.icon, '', ach.color, 35, false
                );
            }
        });
    }
    
    /**
     * Create inventory panel (top-right quadrant)
     */
    createInventoryPanel() {
        const width = this.cameras.main.width;
        const panelX = width / 2 + 20;
        const panelY = 100;
        const panelWidth = width / 2 - 50;
        const panelHeight = 250;
        
        // Modern panel with shadow
        const panelContainer = this.createModernPanel(panelX, panelY, panelWidth, panelHeight);
        
        // Panel title
        this.add.text(panelX + 20, panelY + 20, '🧊 Inventory', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Get inventory summary
        const summary = this.inventory.getSummary();
        const totalItems = summary.totalItems || 1; // Avoid division by zero
        
        // Quick stats with icons
        this.add.text(panelX + 20, panelY + 60, '📦 Total Items', {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0, 0);
        
        this.createCountingText(panelX + 20, panelY + 78, 0, summary.totalItems, '', '', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        this.add.text(panelX + 150, panelY + 60, '🍽️ Servings', {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0, 0);
        
        this.createCountingText(panelX + 150, panelY + 78, 0, summary.totalServings, '', '', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Visual Freshness Breakdown - Colored Circles
        this.add.text(panelX + 20, panelY + 115, 'Freshness Breakdown', {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        const freshnessY = panelY + 165;
        const circleSpacing = 90;
        
        // Fresh items (green)
        const freshRadius = Math.max(15, Math.min(30, 15 + (summary.freshItems / totalItems) * 15));
        const freshCircle = this.add.circle(panelX + 40, freshnessY, freshRadius, 0x4CAF50);
        freshCircle.setStrokeStyle(2, 0xffffff);
        this.add.text(panelX + 40, freshnessY, summary.freshItems.toString(), {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(panelX + 40, freshnessY + freshRadius + 8, '🟢 Fresh', {
            fontSize: '12px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0.5, 0);
        
        // Aging items (yellow)
        const agingRadius = Math.max(15, Math.min(30, 15 + (summary.agingItems / totalItems) * 15));
        const agingCircle = this.add.circle(panelX + 40 + circleSpacing, freshnessY, agingRadius, 0xFFEB3B);
        agingCircle.setStrokeStyle(2, 0xffffff);
        this.add.text(panelX + 40 + circleSpacing, freshnessY, summary.agingItems.toString(), {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(panelX + 40 + circleSpacing, freshnessY + agingRadius + 8, '🟡 Aging', {
            fontSize: '12px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0.5, 0);
        
        // Expiring items (orange) with pulse if > 0
        const expiringRadius = Math.max(15, Math.min(30, 15 + (summary.expiringItems / totalItems) * 15));
        const expiringCircle = this.add.circle(panelX + 40 + circleSpacing * 2, freshnessY, expiringRadius, 0xFF9800);
        expiringCircle.setStrokeStyle(2, 0xffffff);
        this.add.text(panelX + 40 + circleSpacing * 2, freshnessY, summary.expiringItems.toString(), {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(panelX + 40 + circleSpacing * 2, freshnessY + expiringRadius + 8, '🟠 Expiring', {
            fontSize: '12px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0.5, 0);
        
        // Add pulse animation to expiring circle if items are expiring
        if (summary.expiringItems > 0) {
            this.addPulseAnimation(expiringCircle, 1.15, 800);
        }
        
        // Spoiled items (red)
        const spoiledRadius = Math.max(15, Math.min(30, 15 + (summary.spoiledItems / totalItems) * 15));
        const spoiledCircle = this.add.circle(panelX + 40 + circleSpacing * 3, freshnessY, spoiledRadius, 0xF44336);
        spoiledCircle.setStrokeStyle(2, 0xffffff);
        this.add.text(panelX + 40 + circleSpacing * 3, freshnessY, summary.spoiledItems.toString(), {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(panelX + 40 + circleSpacing * 3, freshnessY + spoiledRadius + 8, '🔴 Spoiled', {
            fontSize: '12px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0.5, 0);
        
        // Urgency alert at bottom if items expiring
        if (summary.expiringItems > 0) {
            const alertText = this.add.text(panelX + panelWidth / 2, panelY + panelHeight - 30, 
                `⚠️ ${summary.expiringItems} items need attention!`, {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#F44336',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            // Pulse animation for alert
            this.addPulseAnimation(alertText, 1.05, 600);
        }
    }
    
    /**
     * Create calendar/time panel (bottom-left quadrant)
     */
    createCalendarPanel() {
        const panelX = 30;
        const panelY = 370;
        const panelWidth = 380;
        const panelHeight = 270;
        
        // Modern panel with shadow
        const panelContainer = this.createModernPanel(panelX, panelY, panelWidth, panelHeight);
        
        // Panel title
        this.add.text(panelX + 20, panelY + 20, '📅 Today\'s Events', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Check for events
        const eventsY = panelY + 70;
        const lineHeight = 50;
        
        let eventIndex = 0;
        
        // Check for expiring items (URGENT - show first)
        const expiringItems = this.inventory.getExpiringSoonItems();
        if (expiringItems.length > 0) {
            // Priority background for urgent items
            const urgentBg = this.add.rectangle(panelX + 10, eventsY + eventIndex * lineHeight - 5, 
                panelWidth - 20, 45, 0xFFEBEE, 0.8);
            urgentBg.setOrigin(0, 0);
            urgentBg.setStrokeStyle(2, 0xF44336);
            
            const urgentText = this.add.text(panelX + 20, eventsY + eventIndex * lineHeight + 10, 
                `⚠️ ${expiringItems.length} items expiring soon!`, {
                fontSize: '20px',
                fontFamily: 'Fredoka, Arial',
                color: '#F44336',
                fontStyle: 'bold'
            }).setOrigin(0, 0);
            
            // Pulse animation for urgency
            this.addPulseAnimation(urgentBg, 1.02, 700);
            this.addPulseAnimation(urgentText, 1.03, 700);
            
            eventIndex++;
        }
        
        // Shopping day? (IMPORTANT) — hide once the player has shopped today
        if (this.household.isShoppingDay() && this.household.lastShoppingDay !== this.household.day) {
            const shopIcon = this.add.text(panelX + 20, eventsY + eventIndex * lineHeight + 10, '🛒', {
                fontSize: '28px'
            }).setOrigin(0, 0);
            
            this.add.text(panelX + 60, eventsY + eventIndex * lineHeight + 10, 'Shopping Day!', {
                fontSize: '20px',
                fontFamily: 'Fredoka, Arial',
                color: '#4CAF50',
                fontStyle: 'bold'
            }).setOrigin(0, 0);
            
            // Subtle bounce animation
            this.tweens.add({
                targets: shopIcon,
                y: shopIcon.y - 3,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            eventIndex++;
        }
        
        // Meal time (ROUTINE) — hide once the player has cooked a meal today
        const mealsToday = this.household.dailyHistory?.[this.household.day - 1]?.mealsCooked;
        if (!mealsToday || mealsToday.length === 0) {
            const cookIcon = this.add.text(panelX + 20, eventsY + eventIndex * lineHeight + 10, '🍳', {
                fontSize: '28px'
            }).setOrigin(0, 0);
            
            this.add.text(panelX + 60, eventsY + eventIndex * lineHeight + 10, 'Time to Cook!', {
                fontSize: '20px',
                fontFamily: 'Fredoka, Arial',
                color: '#FF9800'
            }).setOrigin(0, 0);
            
            eventIndex++;
        }
        
        // Weekly organization reminder — hide once the player has organized the fridge today
        if (this.household.day % 7 === 0 && this.household.lastFridgeDay !== this.household.day) {
            const fridgeIcon = this.add.text(panelX + 20, eventsY + eventIndex * lineHeight + 10, '📦', {
                fontSize: '28px'
            }).setOrigin(0, 0);
            
            this.add.text(panelX + 60, eventsY + eventIndex * lineHeight + 10, 'Weekly Fridge Check!', {
                fontSize: '20px',
                fontFamily: 'Fredoka, Arial',
                color: '#9C27B0',
                fontStyle: 'bold'
            }).setOrigin(0, 0);
            
            eventIndex++;
        }
    }
    
    /**
     * Day 1: enforce Plan → Shop → Fridge → Cook on the dashboard
     */
    isDay1Sequenced() {
        return this.household.day === 1;
    }

    getDay1StepUnlock() {
        const h = this.household;
        return {
            plan: true,
            shop: (h.mealPlan && h.mealPlan.length > 0),
            fridge: h.lastShoppingDay === h.day,
            cook: h.lastFridgeDay === h.day
        };
    }

    /**
     * Wire pointerup for an action button; on day 1, lock until prior steps are done
     * @param {Phaser.GameObjects.Rectangle} bg - interactive hit area returned by button helpers
     * @param {number} baseColor - fill color when enabled
     * @param {boolean} enabled - whether the action is allowed today
     * @param {string} lockedContextKey - hydra-dialogue decisions key when locked
     * @param {function} onAllowed - runs when the player uses an unlocked button
     */
    /**
     * Determine whether the household actually needs to go grocery shopping.
     *
     * Returns { needed: boolean, urgency: 'urgent' | 'borderline' | 'stocked' }
     *
     * Uses distinct item count rather than serving math because item quantities
     * in this game are typically 1–3 per item, which makes serving-based "days
     * of food" collapse to < 1 even for a well-stocked pantry.
     *
     * Thresholds scale with family size:
     *   urgent    : scheduled shopping day, OR items ≤ familySize
     *   borderline: items ≤ familySize * 2
     *   stocked   : items >  familySize * 2  (Hydra will discourage shopping)
     */
    _needsGroceries() {
        const itemCount     = this.inventory.getItemCount();
        const familySize    = Math.max(1, this.household.familySize);
        const isShoppingDay = this.household.isShoppingDay();

        if (isShoppingDay || itemCount <= familySize) {
            return { needed: true,  urgency: 'urgent' };
        }
        if (itemCount <= familySize * 2) {
            return { needed: true,  urgency: 'borderline' };
        }
        return { needed: false, urgency: 'stocked' };
    }

    configureDay1ActionButton(bg, baseColor, enabled, lockedContextKey, onAllowed) {
        if (!this.isDay1Sequenced()) {
            bg.on('pointerup', onAllowed);
            return;
        }
        if (enabled) {
            bg.on('pointerup', onAllowed);
            return;
        }
        bg.removeAllListeners();
        const dim = Phaser.Display.Color.IntegerToColor(baseColor).darken(38).color;
        bg.setFillStyle(dim);
        bg.setAlpha(0.72);
        bg.setStrokeStyle(4, 0xcccccc);
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => bg.setAlpha(0.88));
        bg.on('pointerout', () => bg.setAlpha(0.72));
        bg.on('pointerup', () => this.showDay1SequenceHint(lockedContextKey));
    }

    showDay1SequenceHint(contextKey) {
        const hydra = new HydraGuide(this);
        if (hydra.shouldShow()) {
            hydra.showDecisionAdvice(contextKey);
            return;
        }
        const raw = this.cache.json.has('hydraDialogue')
            ? this.cache.json.get('hydraDialogue')
            : null;
        const advice = (raw && raw.decisions && raw.decisions[contextKey] && raw.decisions[contextKey].advice)
            ? raw.decisions[contextKey].advice
            : 'On day 1, follow this order: Plan Meals, then Go Shopping, then Organize Fridge, then Cook Meal.';
        this.showDay1FallbackHintModal(advice);
    }

    showDay1FallbackHintModal(advice) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.5)
            .setOrigin(0, 0).setDepth(2000).setInteractive();

        const panel = this.add.rectangle(width / 2, height / 2, 540, 240, 0xffffff)
            .setStrokeStyle(4, 0xF9A825).setDepth(2001);

        const titleText = this.add.text(width / 2, height / 2 - 70, 'Tip', {
            fontSize: '30px', fontFamily: 'Fredoka, Arial',
            color: '#E65100', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2002);

        const bodyText = this.add.text(width / 2, height / 2 - 15, advice, {
            fontSize: '18px', fontFamily: 'Fredoka, Arial',
            color: '#333333', align: 'center',
            wordWrap: { width: 480 }
        }).setOrigin(0.5).setDepth(2002);

        const okBg = this.add.rectangle(width / 2, height / 2 + 85, 180, 46, 0xF9A825)
            .setDepth(2002).setInteractive({ useHandCursor: true });
        const okText = this.add.text(width / 2, height / 2 + 85, 'OK', {
            fontSize: '20px', fontFamily: 'Fredoka, Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2003);

        const dismiss = () => {
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            bodyText.destroy();
            okBg.destroy();
            okText.destroy();
        };

        okBg.on('pointerdown', dismiss);
        overlay.on('pointerdown', dismiss);
    }

    /**
     * Create action panel (bottom-right quadrant)
     */
    createActionPanel() {
        const width = this.cameras.main.width;
        const panelX = width / 2 + 20;
        const panelY = 370;
        const panelWidth = width / 2 - 50;
        const panelHeight = 270;
        
        // Modern panel with shadow
        const panelContainer = this.createModernPanel(panelX, panelY, panelWidth, panelHeight);
        
        // Panel title
        this.add.text(panelX + 20, panelY + 20, '🎮 Actions', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Action buttons
        const centerX = panelX + panelWidth / 2;
        const buttonsY = panelY + 70;
        const buttonSpacing = 58;
        const buttonHeight = 52;
        
        // Get game state for notifications
        const expiringItems = this.inventory.getExpiringSoonItems();
        const summary = this.inventory.getSummary();
        const isShoppingDay = this.household.isShoppingDay();

        const day1 = this.isDay1Sequenced();
        const gate = day1 ? this.getDay1StepUnlock() : null;
        const shopEnabled = !day1 || gate.shop;
        const fridgeEnabled = !day1 || gate.fridge;
        const cookEnabled = !day1 || gate.cook;
        
        // Shopping button (with badge if shopping day)
        const shopBtn = this.createEnhancedActionButton(
            centerX, buttonsY, '🛒 Go Shopping', 0x4CAF50, 250, buttonHeight,
            isShoppingDay ? {icon: '!', color: 0xFFD700} : null
        );
        this.configureDay1ActionButton(shopBtn, 0x4CAF50, shopEnabled, 'day1-need-plan', () => {
            const goToStore = () => {
                this.scene.start('GroceryTravelScene', {
                    direction: 'store',
                    nextScene: 'ShoppingMinigame'
                });
            };

            const { urgency } = this._needsGroceries();
            if (urgency === 'urgent') {
                goToStore();
                return;
            }

            // Fridge is stocked — ask Hydra before proceeding
            const ctx = urgency === 'borderline' ? 'shopping-low-stock' : 'shopping-not-needed';
            const hydra = new HydraGuide(this);
            hydra.showWarning(ctx, goToStore, null);
        });
        
        // Cooking button (with badge if items expiring)
        const cookingBadge = expiringItems.length > 0 ? {icon: expiringItems.length.toString(), color: 0xF44336} : null;
        const cookBtn = this.createEnhancedActionButton(
            centerX, buttonsY + buttonSpacing, '🍳 Cook Meal', 0xFF9800, 250, buttonHeight,
            cookingBadge
        );
        this.configureDay1ActionButton(cookBtn, 0xFF9800, cookEnabled, 'day1-need-fridge', () => {
            this.time.delayedCall(0, () => this.scene.start('CookingMinigame'));
        });
        
        // Fridge button (with badge if organization needed)
        const needsOrganization = summary.totalItems > 10 && this.household.storageQuality < 0.8;
        const fridgeBadge = needsOrganization ? {icon: '!', color: 0x2196F3} : null;
        const fridgeBtn = this.createEnhancedActionButton(
            centerX, buttonsY + buttonSpacing * 2, '📦 Organize Fridge', 0x2196F3, 250, buttonHeight,
            fridgeBadge
        );
        this.configureDay1ActionButton(fridgeBtn, 0x2196F3, fridgeEnabled, 'day1-need-shop', () => {
            this.time.delayedCall(0, () => this.scene.start('FridgeMinigame'));
        });
        
        // Planning button (aligned with others)
        const planBtn = this.createActionButton(centerX, buttonsY + buttonSpacing * 3, '📅 Plan Meals', 0x9C27B0, 250, buttonHeight);
        planBtn.on('pointerup', () => {
            this.time.delayedCall(0, () => this.scene.start('PlanningMinigame'));
        });

        if (day1 && gate) {
            if (!gate.shop) {
                this.addPulseAnimation(planBtn, 1.04, 700);
            } else if (!gate.fridge) {
                this.addPulseAnimation(shopBtn, 1.04, 700);
            } else if (!gate.cook) {
                this.addPulseAnimation(fridgeBtn, 1.04, 700);
            } else {
                this.addPulseAnimation(cookBtn, 1.04, 700);
            }
        }
        
        // End Day button (bottom-right corner of screen, not hardcoded Y)
        const height = this.cameras.main.height;
        const advanceBtn = this.createActionButton(width - 120, height - 50, '⏭️ End Day', 0x9C27B0, 220, 50);
        advanceBtn.on('pointerdown', () => {
            this.advanceDay();
        });

        const quitBtn = this.createActionButton(120, height - 50, 'Return to title', 0x607D8B, 220, 50);
        quitBtn.on('pointerdown', () => {
            if (!window.confirm('End your current game and return to the title screen? Your saved progress will be cleared.')) {
                return;
            }
            gameState.clearSave();
            gameState.household = null;
            gameState.inventory = null;
            this.scene.start('TitleScene');
        });
    }
    
    /**
     * Create an action button
     */
    createActionButton(x, y, label, color, width = 200, height = 55) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, width, height, color);
        bg.setStrokeStyle(4, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, label, {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        
        // Hover effects
        bg.on('pointerover', () => {
            button.setScale(1.05);
            bg.setFillStyle(Phaser.Display.Color.GetColor32(
                Phaser.Display.Color.IntegerToColor(color).lighten(20).color
            ));
        });
        
        bg.on('pointerout', () => {
            button.setScale(1);
            bg.setFillStyle(color);
        });
        
        return bg; // Return bg for event binding
    }
    
    /**
     * Create an enhanced action button with notification badge
     */
    createEnhancedActionButton(x, y, label, color, width = 200, height = 55, badge = null) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, width, height, color);
        bg.setStrokeStyle(4, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, label, {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        
        // Add notification badge if provided
        if (badge) {
            const badgeCircle = this.add.circle(width / 2 - 10, -height / 2 + 10, 18, badge.color);
            badgeCircle.setStrokeStyle(3, 0xffffff);
            
            const badgeText = this.add.text(width / 2 - 10, -height / 2 + 10, badge.icon, {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            button.add([badgeCircle, badgeText]);
            
            // Pulse animation for badge
            this.addPulseAnimation(badgeCircle, 1.15, 600);
        }
        
        // Enhanced hover effects with glow
        bg.on('pointerover', () => {
            button.setScale(1.08);
            bg.setFillStyle(Phaser.Display.Color.GetColor32(
                Phaser.Display.Color.IntegerToColor(color).lighten(20).color
            ));
            bg.setStrokeStyle(5, 0xFFFFFF);
        });
        
        bg.on('pointerout', () => {
            button.setScale(1);
            bg.setFillStyle(color);
            bg.setStrokeStyle(4, 0xffffff);
        });
        
        return bg; // Return bg for event binding
    }
    
    /**
     * Advance to next day
     */
    advanceDay() {
        console.log('⏩ Advancing to next day...');

        // Block end-of-day if no meal has been cooked today
        const mealsToday = this.household.dailyHistory?.[this.household.day - 1]?.mealsCooked;
        if (!mealsToday || mealsToday.length === 0) {
            this.showCookingRequiredMessage();
            return;
        }
        
        // Run daily simulation
        const dailyResults = gameState.advanceDay();
        
        // Show results (scene will restart when user clicks button)
        this.showDailyResults(dailyResults);
    }
    
    /**
     * Show a blocking modal when the player tries to end the day without cooking
     */
    showCookingRequiredMessage() {
        const width  = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.5)
            .setOrigin(0, 0).setDepth(2000).setInteractive();

        const panel = this.add.rectangle(width / 2, height / 2, 520, 220, 0xffffff)
            .setStrokeStyle(4, 0xF44336).setDepth(2001);

        const titleText = this.add.text(width / 2, height / 2 - 60, 'Not so fast!', {
            fontSize: '34px', fontFamily: 'Fredoka, Arial',
            color: '#F44336', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2002);

        const bodyText = this.add.text(width / 2, height / 2 - 10, 'You need to cook a meal\nbefore ending the day.', {
            fontSize: '22px', fontFamily: 'Fredoka, Arial',
            color: '#333333', align: 'center'
        }).setOrigin(0.5).setDepth(2002);

        const okBg = this.add.rectangle(width / 2, height / 2 + 70, 180, 50, 0xF44336)
            .setDepth(2002).setInteractive({ useHandCursor: true });
        const okText = this.add.text(width / 2, height / 2 + 70, 'OK, got it', {
            fontSize: '22px', fontFamily: 'Fredoka, Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2003);

        const dismiss = () => {
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            bodyText.destroy();
            okBg.destroy();
            okText.destroy();
        };

        okBg.on('pointerdown', dismiss);
        overlay.on('pointerdown', dismiss);
    }

    /**
     * Show daily simulation results
     */
    showDailyResults(results) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Swap BGM for end-of-day modal
        if (this.homeScreenMusic && this.homeScreenMusic.isPlaying) {
            this.homeScreenMusic.stop();
        }
        if (this.cache.audio.exists('endDayBgm')) {
            this.endDayBgm = this.sound.add('endDayBgm', { loop: true, volume: 0.4 });
            this.endDayBgm.play();
            if (typeof wireBgmAfterAutoplayPolicy === 'function') {
                wireBgmAfterAutoplayPolicy(this, () => this.endDayBgm, 'EndDayModal');
            }
        }
        
        // Create modal overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setOrigin(0, 0);
        overlay.setInteractive();
        overlay.setDepth(1000);
        
        // Results panel — taller at end of week to show mass balance
        const isEndOfWeek = results.day % 7 === 0;
        const panelHeight = isEndOfWeek ? 520 : 400;
        const panel = this.add.rectangle(width / 2, height / 2, 600, panelHeight, 0xffffff);
        panel.setStrokeStyle(5, 0x333333);
        panel.setDepth(1001);
        
        // Title
        const titleText = this.add.text(width / 2, height / 2 - (panelHeight / 2 - 40), `📅 Day ${results.day} Summary`, {
            fontSize: '36px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1002);
        
        // Results
        const panelTop = height / 2 - panelHeight / 2;
        const resultsY = panelTop + 80;
        const lineHeight = 38;
        
        const lines = [
            `🗑️ Waste: ${results.wasteResults.wasteWeight.toFixed(2)} lbs ($${results.wasteResults.wasteCost.toFixed(2)})`,
            `🍽️ Items consumed: ${results.wasteResults.consumedItems.length}`,
        ];
        
        // Random event?
        if (results.randomEvent) {
            lines.push('');
            lines.push(`${results.randomEvent.icon} ${results.randomEvent.name}!`);
            lines.push(results.randomEvent.description);
        }
        
        const resultTexts = [];
        lines.forEach((line, index) => {
            const text = this.add.text(width / 2, resultsY + index * lineHeight, line, {
                fontSize: '22px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333'
            }).setOrigin(0.5).setDepth(1002);
            resultTexts.push(text);
        });
        
        // Weekly Mass Balance block (shown when day is a multiple of 7)
        // Fp - Fc - Fw = dFs/dt  (Conservation of Mass)
        if (isEndOfWeek && this.household.lastWeekMassBalance) {
            const mb = this.household.lastWeekMassBalance;
            const mbY = resultsY + lines.length * lineHeight + 18;
            
            const divider = this.add.rectangle(width / 2, mbY, 520, 2, 0xDDDDDD);
            divider.setDepth(1002);
            resultTexts.push(divider);
            
            const mbTitle = this.add.text(width / 2, mbY + 10, '⚖️ Weekly Mass Balance  (Fp − Fc − Fw = ΔFs)', {
                fontSize: '17px',
                fontFamily: 'Fredoka, Arial',
                color: '#555555',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0).setDepth(1002);
            resultTexts.push(mbTitle);
            
            const mbLines = [
                `Purchased  (Fp): ${mb.purchased.toFixed(2)} kg`,
                `Consumed   (Fc): ${mb.consumed.toFixed(2)} kg`,
                `Wasted     (Fw): ${mb.wasted.toFixed(2)} kg`,
                `Stored change (ΔFs): ${mb.stored >= 0 ? '+' : ''}${mb.stored.toFixed(2)} kg`,
            ];
            const mbColors = ['#2196F3', '#4CAF50', '#F44336', mb.stored >= 0 ? '#9C27B0' : '#FF9800'];
            
            mbLines.forEach((line, i) => {
                const t = this.add.text(width / 2, mbY + 35 + i * 30, line, {
                    fontSize: '18px',
                    fontFamily: 'Fredoka, Arial',
                    color: mbColors[i]
                }).setOrigin(0.5, 0).setDepth(1002);
                resultTexts.push(t);
            });
        }
        
        // Show hydra feedback on daily results
        this.time.delayedCall(800, () => {
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                hydraGuide.showFeedback('day-summary', {
                    wasteWeight: results.wasteResults.wasteWeight,
                    wasteCost: results.wasteResults.wasteCost,
                    itemsConsumed: results.wasteResults.consumedItems.length
                });
            }
        });
        
        // Go to Bed button — pinned near bottom of panel
        const bedBtn = this.add.container(width / 2, height / 2 + panelHeight / 2 - 45);
        
        const btnBg = this.add.rectangle(0, 0, 250, 65, 0x4CAF50);
        btnBg.setStrokeStyle(5, 0xffffff);
        btnBg.setInteractive({ useHandCursor: true });
        
        const btnText = this.add.text(0, 0, '⏭️ Start New Day', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        bedBtn.add([btnBg, btnText]);
        bedBtn.setDepth(1002);
        
        // Hover effects
        btnBg.on('pointerover', () => {
            bedBtn.setScale(1.05);
            btnBg.setFillStyle(0x66BB6A);
        });
        
        btnBg.on('pointerout', () => {
            bedBtn.setScale(1);
            btnBg.setFillStyle(0x4CAF50);
        });
        
        // Click to continue to next day
        btnBg.once('pointerdown', () => {
            console.log('😴 Going to bed... starting new day');
            
            // Clean up modal elements
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            resultTexts.forEach(text => text.destroy());
            bedBtn.destroy();

            // Stop end-of-day BGM before transitioning
            if (this.endDayBgm) {
                this.endDayBgm.stop();
                this.endDayBgm.destroy();
                this.endDayBgm = null;
            }
            
            // End session only when hidden summary is ready
            if (results.sessionComplete && results.sessionSummary) {
                this.scene.start('SessionSummaryScene', { summary: results.sessionSummary });
            } else {
                // Restart scene for next day
                this.scene.restart();
            }
        });
    }
    
    /**
     * Create a horizontal progress bar with color gradient
     */
    createProgressBar(x, y, width, height, value, maxValue, colors = {low: 0xF44336, mid: 0xFF9800, high: 0x4CAF50}) {
        const container = this.add.container(x, y);
        
        // Background
        const bg = this.add.rectangle(0, 0, width, height, 0xe0e0e0);
        bg.setOrigin(0, 0.5);
        
        // Calculate fill width and color
        const percentage = Math.max(0, Math.min(1, value / maxValue));
        const fillWidth = width * percentage;
        
        // Determine color based on percentage
        let fillColor;
        if (percentage < 0.33) {
            fillColor = colors.low;
        } else if (percentage < 0.66) {
            fillColor = colors.mid;
        } else {
            fillColor = colors.high;
        }
        
        // Fill bar
        const fill = this.add.rectangle(0, 0, fillWidth, height - 4, fillColor);
        fill.setOrigin(0, 0.5);
        
        // Border
        const border = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        border.setStrokeStyle(2, 0x666666);
        border.setOrigin(0, 0.5);
        
        container.add([bg, fill, border]);
        container.setData('fill', fill);
        container.setData('percentage', percentage);
        
        return container;
    }
    
    /**
     * Create a circular gauge/arc meter
     */
    createCircularGauge(x, y, radius, value, maxValue, label = '') {
        const container = this.add.container(x, y);
        
        // Calculate angle (0 to 270 degrees arc)
        const percentage = Math.max(0, Math.min(1, value / maxValue));
        const angle = percentage * 270;
        
        // Determine color based on percentage
        let arcColor;
        if (percentage < 0.33) {
            arcColor = 0xF44336; // Red
        } else if (percentage < 0.66) {
            arcColor = 0xFF9800; // Orange
        } else {
            arcColor = 0x4CAF50; // Green
        }
        
        // Background arc (gray)
        const bgArc = this.add.graphics();
        bgArc.lineStyle(10, 0xe0e0e0, 1);
        bgArc.beginPath();
        bgArc.arc(0, 0, radius, Phaser.Math.DegToRad(-225), Phaser.Math.DegToRad(45), false);
        bgArc.strokePath();
        
        // Value arc (colored)
        const valueArc = this.add.graphics();
        valueArc.lineStyle(10, arcColor, 1);
        valueArc.beginPath();
        valueArc.arc(0, 0, radius, Phaser.Math.DegToRad(-225), Phaser.Math.DegToRad(-225 + angle), false);
        valueArc.strokePath();
        
        // Center text
        const displayValue = label || `${Math.round(percentage * 100)}%`;
        const text = this.add.text(0, 0, displayValue, {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([bgArc, valueArc, text]);
        container.setData('valueArc', valueArc);
        container.setData('text', text);
        container.setData('percentage', percentage);
        
        return container;
    }
    
    /**
     * Create an animated badge with icon
     */
    createBadge(x, y, icon, label, color = 0xFFD700, size = 60, shouldGlow = false) {
        const container = this.add.container(x, y);
        
        // Background circle
        const bg = this.add.circle(0, 0, size / 2, color);
        bg.setStrokeStyle(3, 0xffffff);
        
        // Icon
        const iconText = this.add.text(0, -5, icon, {
            fontSize: `${size * 0.5}px`
        }).setOrigin(0.5);
        
        // Label below
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
        
        // Add glow/pulse animation if requested
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
        
        // Animate counting
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
     * Create a modernized panel with shadow effect
     */
    createModernPanel(x, y, width, height, color = 0xffffff) {
        const container = this.add.container(x, y);
        
        // Shadow (offset slightly)
        const shadow = this.add.rectangle(4, 4, width, height, 0x000000, 0.15);
        shadow.setOrigin(0, 0);
        
        // Main panel
        const panel = this.add.rectangle(0, 0, width, height, color);
        panel.setStrokeStyle(2, 0xcccccc);
        panel.setOrigin(0, 0);
        
        container.add([shadow, panel]);
        container.setAlpha(0.85);
        return container;
    }
}
