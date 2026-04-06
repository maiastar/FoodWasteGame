/**
 * Fridge Organization Minigame
 * Drag items to correct storage zones: Fridge, Freezer, Pantry
 * Teaches FIFO (First In, First Out) and proper food storage
 */

class FridgeMinigame extends Phaser.Scene {
    constructor() {
        super({ key: 'FridgeMinigame' });
        
        this.household = null;
        this.inventory = null;
        this.draggedItem = null;
        this.storageZones = [];       // active tab's zones (updated by switchTab)
        this.itemContainers = [];     // ALL item containers across all tabs
        this.timeLimit = 60;
        this.timeRemaining = 60;
        this.timerText = null;
        
        // Tab state
        this.activeTab = 'fridge';
        this.tabButtons = {};
        this.fridgeZoneGroup = null;
        this.freezerZoneGroup = null;
        this.pantryZoneGroup = null;
        this.fridgeStorageZones = [];
        this.freezerStorageZones = [];
        this.pantryStorageZones = [];
        this.fridgeItemGroup = null;
        this.freezerItemGroup = null;
        this.pantryItemGroup = null;

        // Scroll state for the item panel
        this.VISIBLE_COUNT = 6;
        this.scrollIndexes = { fridge: 0, freezer: 0, pantry: 0 };
        this.scrollUpBtn = null;
        this.scrollDownBtn = null;
    }
    
    create() {
        console.log('📦 FridgeMinigame: Starting storage organization...');
        
        // Reset all state arrays
        this.storageZones = [];
        this.itemContainers = [];
        this.fridgeStorageZones = [];
        this.freezerStorageZones = [];
        this.pantryStorageZones = [];
        this.tabButtons = {};
        this.activeTab = 'fridge';
        this.scrollIndexes = { fridge: 0, freezer: 0, pantry: 0 };
        // Clear handles to GameObjects from a previous run (scene instance is reused).
        // restoreZonePlacements() calls updateItemListLayout before createScrollButtons();
        // stale scrollUpBtn/scrollDownBtn would point at destroyed Text → setColor → null 'cut'.
        this.scrollUpBtn = null;
        this.scrollDownBtn = null;
        this.scrollPageLabel = null;
        this.progressLabel = null;
        this.progressBar = null;
        this.progressText = null;
        this.timerGauge = null;
        this.timerIcon = null;
        
        this.household = gameState.household;
        this.inventory = gameState.inventory;
        this.timeRemaining = this.timeLimit;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        try {
        // Background
        this.add.rectangle(0, 0, width, height, 0xE1F5FE).setOrigin(0, 0);
        
        // Header
        this.createHeader();
        
        // Create zone groups (fridge/freezer/pantry panels)
        this.createFridgeLayout();

        // Tab bar above the storage panel
        this.createTabBar();
        
        // Static items panel background
        this.createItemAreaBackground();
        
        // Create draggable items for all three tabs
        this.fridgeItemGroup  = this.createFoodItems('fridge');
        this.freezerItemGroup = this.createFoodItems('freezer');
        this.pantryItemGroup  = this.createFoodItems('pantry');

        // Initially show fridge items only
        this.freezerItemGroup.setVisible(false);
        this.pantryItemGroup.setVisible(false);

        // Restore any zone placements from a previous visit
        this.restoreZonePlacements();

        // Progress tracker (uses this.itemContainers which now holds all tabs)
        this.createProgressTracker();

        // Scroll buttons for the item panel
        this.createScrollButtons();
        this.updateItemListLayout(this.activeTab);

        // Create done button
        this.createDoneButton();

        const shutdownEv = (typeof Phaser !== 'undefined' && Phaser.Scenes && Phaser.Scenes.Events && Phaser.Scenes.Events.SHUTDOWN)
            ? Phaser.Scenes.Events.SHUTDOWN
            : 'shutdown';
        this.events.once(shutdownEv, () => {
            if (this.tweens) this.tweens.killAll();
        });

        // Hydra guide advice
        this.time.delayedCall(500, () => {
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                hydraGuide.showDecisionAdvice('fridge-entry', {
                    totalItems: this.inventory.items.length,
                    storageQuality: this.household.storageQuality
                });
            }
        });
        } catch (err) {
            console.error('[FridgeMinigame create]', err);
            this.add.rectangle(0, 0, width, height, 0xE1F5FE).setOrigin(0, 0);
            this.add.text(width / 2, height / 2, 'Could not load Organize Fridge.\n\n' + (err && err.message ? err.message : String(err)), {
                fontSize: '18px', fontFamily: 'Fredoka, Arial', color: '#B71C1C', align: 'center', wordWrap: { width: width - 80 }
            }).setOrigin(0.5);
            const back = this.add.text(width / 2, height / 2 + 120, 'Tap to return to dashboard', {
                fontSize: '22px', fontFamily: 'Fredoka, Arial', color: '#1565C0', backgroundColor: '#ffffff', padding: { x: 16, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            back.on('pointerup', () => this.scene.start('ManagementScene'));
        }
    }
    
    /**
     * Create header
     */
    createHeader() {
        const width = this.cameras.main.width;
        
        this.add.rectangle(0, 0, width, 70, 0x2196F3).setOrigin(0, 0);
        
        this.add.text(30, 35, '📦 Organize Your Storage', {
            fontSize: '36px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Exit button
        const exitBtn = this.add.text(width - 30, 35, '❌ Exit', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            backgroundColor: '#D32F2F',
            padding: { x: 15, y: 8 }
        }).setOrigin(1, 0.5);
        exitBtn.setInteractive({ useHandCursor: true });
        exitBtn.on('pointerup', () => {
            console.log('Exiting storage organization without saving...');
            this.time.delayedCall(0, () => this.scene.start('ManagementScene'));
        });
        exitBtn.on('pointerover', () => exitBtn.setStyle({ backgroundColor: '#B71C1C' }));
        exitBtn.on('pointerout', () => exitBtn.setStyle({ backgroundColor: '#D32F2F' }));
    }
    
    /**
     * Create the tab bar above the storage panel
     */
    createTabBar() {
        const tabY = 88; // vertically centred in the 70-110 gap
        const tabWidth = 228;
        const tabHeight = 38;
        const startX = 50;
        const gap = 7;
        
        const tabDefs = [
            { key: 'fridge',  label: '🧊 Fridge'  },
            { key: 'freezer', label: '❄️ Freezer' },
            { key: 'pantry',  label: '🏺 Pantry'  },
        ];
        
        tabDefs.forEach(({ key, label }, i) => {
            const x = startX + i * (tabWidth + gap);
            const isActive = key === this.activeTab;
            
            const btn = this.add.container(x, tabY);
            
            const bg = this.add.rectangle(0, 0, tabWidth, tabHeight,
                isActive ? 0x2196F3 : 0xBBDEFB);
            bg.setOrigin(0, 0.5);
            bg.setStrokeStyle(2, 0x1565C0);
            bg.setInteractive({ useHandCursor: true });
            
            const labelText = this.add.text(tabWidth / 2, 0, label, {
                fontSize: '19px',
                fontFamily: 'Fredoka, Arial',
                color: isActive ? '#ffffff' : '#1565C0',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            btn.add([bg, labelText]);
            btn.setData('bg', bg);
            btn.setData('label', labelText);
            
            bg.on('pointerdown', () => this.switchTab(key));
            bg.on('pointerover', () => {
                if (this.activeTab !== key) bg.setFillStyle(0x90CAF9);
            });
            bg.on('pointerout', () => {
                if (this.activeTab !== key) bg.setFillStyle(0xBBDEFB);
            });
            
            this.tabButtons[key] = btn;
        });
    }
    
    /**
     * Switch the active storage tab
     */
    switchTab(tabName) {
        if (this.activeTab === tabName) return;
        this.activeTab = tabName;
        
        // Show/hide zone panels
        this.fridgeZoneGroup.setVisible(tabName === 'fridge');
        this.freezerZoneGroup.setVisible(tabName === 'freezer');
        this.pantryZoneGroup.setVisible(tabName === 'pantry');
        
        // Show/hide item card groups
        this.fridgeItemGroup.setVisible(tabName === 'fridge');
        this.freezerItemGroup.setVisible(tabName === 'freezer');
        this.pantryItemGroup.setVisible(tabName === 'pantry');
        
        // Update active drop zones
        if (tabName === 'fridge')   this.storageZones = this.fridgeStorageZones;
        else if (tabName === 'freezer') this.storageZones = this.freezerStorageZones;
        else if (tabName === 'pantry')  this.storageZones = this.pantryStorageZones;
        
        // Re-highlight tab buttons
        Object.entries(this.tabButtons).forEach(([tab, btn]) => {
            const active = tab === tabName;
            btn.getData('bg').setFillStyle(active ? 0x2196F3 : 0xBBDEFB);
            btn.getData('label').setColor(active ? '#ffffff' : '#1565C0');
        });
        
        console.log(`🔄 Switched to ${tabName} tab`);

        this.updateItemListLayout(tabName);
    }

    /**
     * Reposition and show/hide item cards for the given tab according to the current
     * scroll index, skipping any already-placed cards.
     */
    updateItemListLayout(tab) {
        const group = tab === 'fridge'  ? this.fridgeItemGroup
                    : tab === 'freezer' ? this.freezerItemGroup
                                       : this.pantryItemGroup;
        if (!group) return;

        const ax = 800;
        const itemStartY = 100 + 120; // ay + 120
        const itemHeight = 70;
        const scrollIndex = this.scrollIndexes[tab] || 0;
        const VISIBLE_COUNT = this.VISIBLE_COUNT;

        // Gather unplaced cards from this group, ordered by their listIndex
        const children = group.getAll();
        const unplaced = children
            .filter(c => c.getData && c.getData('listIndex') !== undefined && !c.getData('placed'))
            .sort((a, b) => a.getData('listIndex') - b.getData('listIndex'));

        let slot = 0;
        unplaced.forEach(container => {
            if (slot >= scrollIndex && slot < scrollIndex + VISIBLE_COUNT) {
                const newY = itemStartY + (slot - scrollIndex) * itemHeight;
                container.x = ax + 20;
                container.y = newY;
                container.setData('originalX', ax + 20);
                container.setData('originalY', newY);
                container.setVisible(true);
            } else {
                container.setVisible(false);
            }
            slot++;
        });

        // Update scroll button states
        const canScrollUp   = scrollIndex > 0;
        const canScrollDown = slot > scrollIndex + VISIBLE_COUNT;
        if (this.scrollUpBtn) {
            this.scrollUpBtn.bg.setFillStyle(canScrollUp ? 0x2196F3 : 0xBBDEFB);
            this.scrollUpBtn.bg.setAlpha(canScrollUp ? 1 : 0.5);
            this.scrollUpBtn.text.setColor(canScrollUp ? '#ffffff' : '#90CAF9');
        }
        if (this.scrollDownBtn) {
            this.scrollDownBtn.bg.setFillStyle(canScrollDown ? 0x2196F3 : 0xBBDEFB);
            this.scrollDownBtn.bg.setAlpha(canScrollDown ? 1 : 0.5);
            this.scrollDownBtn.text.setColor(canScrollDown ? '#ffffff' : '#90CAF9');
        }

        // Show/hide the scroll area label
        if (this.scrollPageLabel) {
            const total = unplaced.length;
            if (total > VISIBLE_COUNT) {
                const firstShown = Math.min(scrollIndex + 1, total);
                const lastShown  = Math.min(scrollIndex + VISIBLE_COUNT, total);
                this.scrollPageLabel.setText(`${firstShown}–${lastShown} of ${total}`);
                this.scrollPageLabel.setVisible(true);
            } else {
                this.scrollPageLabel.setVisible(false);
            }
        }
    }
    
    /**
     * Update the item-name list shown inside a storage zone after a placement or restore.
     * Shows up to 4 names; appends "…+N more" when there are additional items.
     */
    refreshZoneItemNames(zone) {
        const zoneData      = zone.getData('zoneData');
        const namesText     = zone.getData('zoneItemNames');
        const capacityText  = zone.getData('capacityText');
        if (!namesText || !zoneData) return;

        const placed = this.itemContainers.filter(
            c => c.getData('placed') && c.getData('zone') === zoneData.name
        );

        if (placed.length === 0) {
            namesText.setText('');
            if (capacityText) { capacityText.setText('Empty'); capacityText.setColor('#999999'); }
            return;
        }

        const MAX_SHOWN = 4;
        const names = placed.map(c => c.getData('foodItem')?.name || '?');
        let display = names.slice(0, MAX_SHOWN).join('\n');
        if (names.length > MAX_SHOWN) {
            display += `\n…+${names.length - MAX_SHOWN} more`;
        }
        namesText.setText(display);

        if (capacityText) {
            const n = placed.length;
            capacityText.setText(`${n} item${n > 1 ? 's' : ''}`);
            capacityText.setColor('#333333');
        }
    }

    /**
     * Build all three zone panels and default to showing only fridge
     */
    createFridgeLayout() {
        this.fridgeZoneGroup  = this.createFridgeZones();
        this.freezerZoneGroup = this.createFreezerZones();
        this.pantryZoneGroup  = this.createPantryZones();
        
        this.freezerZoneGroup.setVisible(false);
        this.pantryZoneGroup.setVisible(false);
        
        // Start with fridge zones active
        this.storageZones = this.fridgeStorageZones;
    }
    
    /**
     * Fridge zones: Top Shelf (other/dairy), Middle Shelf (dairy), Crisper Drawer (produce)
     */
    createFridgeZones() {
        const group = this.add.container(0, 0);
        const fx = 50, fy = 110, fw = 700, fh = 580;
        
        const outline = this.add.rectangle(fx, fy, fw, fh, 0xffffff).setOrigin(0, 0);
        const border  = this.add.rectangle(fx, fy, fw, fh).setStrokeStyle(5, 0x1976D2).setOrigin(0, 0);
        group.add([outline, border]);
        
        const zones = [
            { name: 'Top Shelf',    description: 'Ready-to-eat, Leftovers', y: fy + 20,  height: 170, color: 0xE8F5E9, acceptsCategories: ['other', 'dairy'] },
            { name: 'Middle Shelf', description: 'Dairy, Eggs',              y: fy + 200, height: 170, color: 0xFFF9C4, acceptsCategories: ['dairy'] },
            { name: 'Crisper Drawer', description: 'Produce, Vegetables',    y: fy + 380, height: 170, color: 0xC8E6C9, acceptsCategories: ['produce'] },
        ];
        
        zones.forEach(z => this.createStorageZone(fx, z.y, fw, z.height, z, group, this.fridgeStorageZones));
        return group;
    }
    
    /**
     * Freezer zones: Frozen Goods (frozen), Raw Meat & Fish (meat/fish)
     */
    createFreezerZones() {
        const group = this.add.container(0, 0);
        const fx = 50, fy = 110, fw = 700, fh = 580;
        
        const outline = this.add.rectangle(fx, fy, fw, fh, 0xE3F2FD).setOrigin(0, 0);
        const border  = this.add.rectangle(fx, fy, fw, fh).setStrokeStyle(5, 0x0288D1).setOrigin(0, 0);
        group.add([outline, border]);
        
        const zones = [
            { name: 'Frozen Goods',      description: 'Frozen meals, Ice cream', y: fy + 20,  height: 260, color: 0xB3E5FC, acceptsCategories: ['frozen'] },
            { name: 'Raw Meat & Fish',   description: 'Meat, Seafood',           y: fy + 290, height: 260, color: 0xFFCDD2, acceptsCategories: ['meat', 'fish'] },
        ];
        
        zones.forEach(z => this.createStorageZone(fx, z.y, fw, z.height, z, group, this.freezerStorageZones));
        return group;
    }
    
    /**
     * Pantry zones: Dry Goods (grains/canned), Condiments (condiments)
     */
    createPantryZones() {
        const group = this.add.container(0, 0);
        const fx = 50, fy = 110, fw = 700, fh = 580;

        // Warm cream background fills the full panel so transparent/black edges blend cleanly
        const panelBg = this.add.rectangle(fx + fw / 2, fy + fh / 2, fw, fh, 0xFFF8E1).setOrigin(0.5);
        group.add(panelBg);

        // Cabinet image (skip if texture/source missing — avoids thrown errors halting create())
        const pantryCabinetScale = 1.0;
        if (this.textures.exists('pantryCabinet')) {
            const tex = this.textures.get('pantryCabinet');
            const src = tex && tex.getSourceImage ? tex.getSourceImage() : null;
            if (src && src.width > 0 && src.height > 0) {
                const cabinetImg = this.add.image(fx + fw / 2, fy + fh / 2, 'pantryCabinet');
                const cropFraction = 0;
                const cropTop = Math.round(src.height * cropFraction);
                const cropH = src.height - cropTop * 2;
                cabinetImg.setCrop(0, cropTop, src.width, cropH);
                cabinetImg.setDisplaySize(fw, fh);
                cabinetImg.setScale(pantryCabinetScale);

                if (pantryCabinetScale > 1) {
                    const pantryMaskShape = this.make.graphics();
                    pantryMaskShape.fillStyle(0xffffff);
                    pantryMaskShape.fillRect(fx, fy, fw, fh);
                    const pantryMask = pantryMaskShape.createGeometryMask();
                    cabinetImg.setMask(pantryMask);
                    pantryMaskShape.setVisible(false);
                }

                group.add(cabinetImg);
            }
        }

        // Drop zones align with the three inner shelf compartments.
        // innerX/innerW match the interior space between the cabinet doors.
        // y positions are recalculated for the cropped image (cabinet now fills full fh=580).
        const innerX = fx + 145;
        const innerW = 410;

        const zones = [
            { name: 'Grains',      description: 'Cereals, Rice, Pasta',  y: fy + 5,   height: 193,
              color: 0xffffff, bgAlpha: 0.08, acceptsCategories: ['grains'] },
            { name: 'Canned Goods', description: 'Canned, Tinned items', y: fy + 208, height: 176,
              color: 0xffffff, bgAlpha: 0.08, acceptsCategories: ['canned'] },
            { name: 'Condiments',  description: 'Sauces, Spreads',        y: fy + 389, height: 182,
              color: 0xffffff, bgAlpha: 0.08, acceptsCategories: ['condiments'] },
        ];

        zones.forEach(z =>
            this.createStorageZone(innerX, z.y, innerW, z.height, z, group, this.pantryStorageZones)
        );
        return group;
    }
    
    /**
     * Create a storage zone with modern styling.
     * @param {Phaser.GameObjects.Container} group - parent container (for tab show/hide)
     * @param {Array} zonesArray - per-tab array to push into
     */
    createStorageZone(x, y, width, height, zoneData, group = null, zonesArray = null) {
        const zone = this.add.container(x, y);
        
        const shadowAlpha = (zoneData.bgAlpha !== undefined && zoneData.bgAlpha < 0.5) ? 0 : 0.1;
        const shadow = this.add.rectangle(3, 3, width, height, 0x000000, shadowAlpha);
        shadow.setOrigin(0, 0);
        
        const bgAlpha = zoneData.bgAlpha !== undefined ? zoneData.bgAlpha : 0.85;
        const bg = this.add.rectangle(0, 0, width, height, zoneData.color, bgAlpha);
        if (bgAlpha >= 0.5) {
            bg.setStrokeStyle(3, 0x333333);
        } else {
            // Subtle dashed-style border for transparent pantry zones
            bg.setStrokeStyle(2, 0x999999, 0.4);
        }
        bg.setOrigin(0, 0);
        
        const zoneIcons = {
            'Top Shelf': '🍱',
            'Middle Shelf': '🥛',
            'Crisper Drawer': '🥬',
            'Frozen Goods': '❄️',
            'Raw Meat & Fish': '🥩',
            'Dry Goods': '🌾',
            'Condiments': '🧂',
            'Grains': '🌾',
            'Canned Goods': '🥫',
        };
        const zoneIcon = zoneIcons[zoneData.name] || '📦';
        
        const iconBadge = this.add.circle(width - 25, 25, 20, 0xffffff, 0.9);
        iconBadge.setStrokeStyle(2, 0x333333);
        
        const icon = this.add.text(width - 25, 25, zoneIcon, {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        const label = this.add.text(15, 15, zoneData.name, {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        const desc = this.add.text(15, 42, zoneData.description, {
            fontSize: '15px',
            fontFamily: 'Fredoka, Arial',
            color: '#555555',
            fontStyle: 'italic'
        }).setOrigin(0, 0);
        
        const capacityText = this.add.text(15, height - 15, 'Empty', {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#999999'
        }).setOrigin(0, 1);

        // Item name list shown below the zone description
        const zoneItemNames = this.add.text(15, 63, '', {
            fontSize: '13px',
            fontFamily: 'Fredoka, Arial',
            color: '#555555',
            wordWrap: { width: width - 35 }
        }).setOrigin(0, 0);

        zone.add([shadow, bg, iconBadge, icon, label, desc, zoneItemNames, capacityText]);
        zone.setData('zoneData', zoneData);
        zone.setData('isZone', true);
        zone.setData('bg', bg);
        zone.setData('capacityText', capacityText);
        zone.setData('zoneItemNames', zoneItemNames);
        zone.setData('itemsInZone', 0);
        
        bg.setInteractive({ dropZone: true });
        
        // Add to parent group and the per-tab zones array
        if (group) group.add(zone);
        (zonesArray || this.storageZones).push(zone);
    }
    
    /**
     * Create the static items panel background and title (drawn once)
     */
    createItemAreaBackground() {
        const ax = 800, ay = 100, aw = 430, ah = 580;
        
        this.add.rectangle(ax, ay, aw, ah, 0xffffff, 0.95).setOrigin(0, 0);
        this.add.rectangle(ax, ay, aw, ah).setStrokeStyle(3, 0x333333).setOrigin(0, 0);
        
        this.add.text(ax + 20, ay + 15, '🧺 Items to Organize', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
    }
    
    /**
     * Create draggable food item cards for a given tab.
     * Items are added to a new Container returned by this method.
     * They are also pushed into this.itemContainers for score tracking.
     *
     * @param {string} tab - 'fridge' | 'freezer' | 'pantry'
     * @returns {Phaser.GameObjects.Container} group containing the tab's item cards
     */
    createFoodItems(tab) {
        const tabCategories = {
            'fridge':  ['produce', 'dairy', 'other'],
            'freezer': ['meat', 'fish', 'frozen'],
            'pantry':  ['grains', 'canned', 'condiments'],
        };
        const categories = tabCategories[tab] || ['produce', 'dairy', 'other'];
        
        const group = this.add.container(0, 0);
        
        const ax = 800, ay = 100, aw = 430;
        const itemStartY = ay + 120;
        const itemHeight = 70;
        
        const filtered = this.inventory.items.filter(item =>
            categories.includes(item.category) && !item.isSpoiled()
        );
        filtered.sort(FoodItem.compareByFreshness);
        
        filtered.forEach((item, index) => {
            const itemY = itemStartY + index * itemHeight;
            this.createDraggableItem(ax + 20, itemY, item, group);
            // Tag each card with its position in the sorted list for scroll layout
            this.itemContainers[this.itemContainers.length - 1].setData('listIndex', index);
        });
        
        if (filtered.length === 0) {
            const emptyMsg = this.add.text(ax + aw / 2, ay + 200,
                'No items here!\nGo shopping first.', {
                    fontSize: '20px',
                    fontFamily: 'Fredoka, Arial',
                    color: '#999999',
                    align: 'center'
                }).setOrigin(0.5);
            group.add(emptyMsg);
        }
        
        return group;
    }
    
    /**
     * Create a draggable food item card with modern styling.
     * Pushes the container into this.itemContainers and adds it to the provided group.
     *
     * @param {number} x
     * @param {number} y
     * @param {FoodItem} foodItem
     * @param {Phaser.GameObjects.Container} group - parent group for tab visibility
     */
    createDraggableItem(x, y, foodItem, group) {
        const container = this.add.container(x, y);
        
        const shadow = this.add.rectangle(3, 3, 380, 65, 0x000000, 0.12);
        shadow.setOrigin(0, 0);
        
        const rawColor = foodItem.color;
        const itemColor = (typeof rawColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(rawColor))
            ? parseInt(rawColor.slice(1), 16)
            : 0x757575;
        const bg = this.add.rectangle(0, 0, 380, 65, 0xffffff);
        bg.setStrokeStyle(3, itemColor);
        bg.setOrigin(0, 0);
        
        const accentBar = this.add.rectangle(0, 0, 8, 65, itemColor);
        accentBar.setOrigin(0, 0);
        
        // Icons including new storage categories
        const icons = {
            'produce':    '🥬',
            'dairy':      '🥛',
            'meat':       '🥩',
            'fish':       '🐟',
            'other':      '🍱',
            'frozen':     '🧊',
            'grains':     '🌾',
            'canned':     '🥫',
            'condiments': '🧂',
        };
        const icon = icons[foodItem.category] || '🍱';
        
        const iconBg   = this.add.circle(35, 32, 22, itemColor, 0.2);
        const iconText = this.add.text(35, 32, icon, { fontSize: '32px' }).setOrigin(0.5);
        
        const nameText = this.add.text(68, 18, foodItem.name, {
            fontSize: '19px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        const rawPct = foodItem.getFreshnessPercentage();
        const freshnessPercentage = Number.isFinite(rawPct) ? rawPct : 0;
        const daysNum = Number(foodItem.freshness);
        const daysLeft = Number.isFinite(daysNum) ? daysNum.toFixed(1) : '?';
        
        const barWidth = 100, barHeight = 8, barX = 68, barY = 45;
        
        const freshnessBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0xe0e0e0);
        freshnessBg.setOrigin(0, 0.5);
        
        let freshnessColor;
        if (freshnessPercentage >= 60) {
            freshnessColor = 0x4CAF50;
        } else if (freshnessPercentage >= 30) {
            freshnessColor = 0xFF9800;
        } else {
            freshnessColor = 0xF44336;
        }
        
        const freshnessFill = this.add.rectangle(barX, barY, barWidth * (freshnessPercentage / 100), barHeight - 2, freshnessColor);
        freshnessFill.setOrigin(0, 0.5);
        
        const daysText = this.add.text(barX + barWidth + 8, barY, `${daysLeft}d`, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: freshnessPercentage < 30 ? '#F44336' : '#666666',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        const qtyBadge = this.add.circle(360, 32, 16, 0x2196F3);
        qtyBadge.setStrokeStyle(2, 0xffffff);
        
        const qtyText = this.add.text(360, 32, String(foodItem.quantity != null ? foodItem.quantity : 0), {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([shadow, bg, accentBar, iconBg, iconText, nameText, freshnessBg, freshnessFill, daysText, qtyBadge, qtyText]);
        container.setData('foodItem', foodItem);
        container.setData('isDraggable', true);
        container.setData('originalX', x);
        container.setData('originalY', y);
        container.setData('bg', bg);
        container.setData('shadow', shadow);
        container.setSize(380, 65);
        
        bg.setInteractive({ draggable: true, useHandCursor: true });
        
        // Track in the global list (used by progress & score)
        this.itemContainers.push(container);
        
        // Add to the per-tab group for visibility toggling
        if (group) group.add(container);
        
        this.input.setDraggable(bg);
        
        bg.on('dragstart', (pointer) => {
            container.setData('dragging', true);
            container.setData('dragOffsetX', pointer.x - container.x);
            container.setData('dragOffsetY', pointer.y - container.y);
            
            container.setScale(1.08);
            container.setDepth(1000);
            bg.setStrokeStyle(4, itemColor);
            shadow.setAlpha(0.25);
            
            // Highlight compatible zones in the ACTIVE tab only
            this.storageZones.forEach(zone => {
                const zoneData = zone.getData('zoneData');
                const cats = zoneData && zoneData.acceptsCategories;
                if (Array.isArray(cats) && cats.includes(foodItem.category)) {
                    const zoneBg = zone.getData('bg');
                    if (zoneBg) {
                        zoneBg.setStrokeStyle(5, 0x4CAF50);
                        zoneBg.setAlpha(1);
                    }
                }
            });
        });
        
        bg.on('drag', (pointer) => {
            const offsetX = container.getData('dragOffsetX') || 0;
            const offsetY = container.getData('dragOffsetY') || 0;
            container.x = pointer.x - offsetX;
            container.y = pointer.y - offsetY;
        });
        
        bg.on('dragend', () => {
            container.setData('dragging', false);
            container.setScale(1);
            container.setDepth(0);
            bg.setStrokeStyle(3, itemColor);
            shadow.setAlpha(0.12);
            
            // Remove zone highlighting
            this.storageZones.forEach(zone => {
                const zoneBg = zone.getData('bg');
                if (zoneBg) {
                    zoneBg.setStrokeStyle(3, 0x333333);
                    zoneBg.setAlpha(0.85);
                }
            });
            
            const itemCenterX = container.x + container.width / 2;
            const itemCenterY = container.y + container.height / 2;
            const zone = this.getZoneAt(itemCenterX, itemCenterY);
            
            if (zone) {
                this.placeItemInZone(container, zone);
            } else {
                this.tweens.add({
                    targets: container,
                    x: container.getData('originalX'),
                    y: container.getData('originalY'),
                    duration: 300,
                    ease: 'Back.easeOut'
                });
            }
        });
        
        bg.on('pointerover', () => {
            if (!container.getData('dragging')) container.setScale(1.03);
        });
        bg.on('pointerout', () => {
            if (!container.getData('dragging')) container.setScale(1);
        });
    }
    
    /**
     * Get zone at position — only checks active tab's zones
     */
    getZoneAt(x, y) {
        for (let zone of this.storageZones) {
            const zoneBg = zone.getData('bg');
            if (zoneBg) {
                const bounds = zoneBg.getBounds();
                if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    return zone;
                }
            }
        }
        return null;
    }
    
    /**
     * Place item in zone with feedback and moveToLocation() call
     */
    placeItemInZone(itemContainer, zone) {
        const foodItem = itemContainer.getData('foodItem');
        const zoneData = zone.getData('zoneData');
        const cats = zoneData && zoneData.acceptsCategories;
        const isCorrect = Array.isArray(cats) && cats.includes(foodItem.category);
        
        // Map zone to storage location and update the food item's decay model
        const locationMap = {
            'fridge':  ['Top Shelf', 'Middle Shelf', 'Crisper Drawer'],
            'freezer': ['Frozen Goods', 'Raw Meat & Fish'],
            'pantry':  ['Dry Goods', 'Condiments', 'Grains', 'Canned Goods'],
        };
        let targetLocation = 'fridge';
        for (const [loc, zoneNames] of Object.entries(locationMap)) {
            if (zoneNames.includes(zoneData.name)) {
                targetLocation = loc;
                break;
            }
        }
        foodItem.moveToLocation(targetLocation);
        foodItem.zoneName = zoneData.name;   // persist specific shelf
        
        if (isCorrect) {
            console.log(`✅ Correctly placed ${foodItem.name} in ${zoneData.name} (${targetLocation})`);
            foodItem.isProperlyStored = true;
            
            this.showFeedback('Perfect! ✓', 0x4CAF50, itemContainer.x, itemContainer.y - 40);
            
            const zoneBg = zone.getData('bg');
            this.tweens.add({ targets: zoneBg, alpha: 1, duration: 150, yoyo: true, repeat: 1 });
        } else {
            console.log(`⚠️ ${foodItem.name} in wrong zone (${zoneData.name})`);
            foodItem.isProperlyStored = false;
            
            this.showFeedback('Wrong zone!', 0xFF5722, itemContainer.x, itemContainer.y - 40);
            
            const zoneBg = zone.getData('bg');
            this.tweens.add({ targets: zoneBg, alpha: 0.6, duration: 150, yoyo: true, repeat: 2 });
        }
        
        const currentCount = zone.getData('itemsInZone') || 0;
        zone.setData('itemsInZone', currentCount + 1);
        const capacityText = zone.getData('capacityText');
        if (capacityText) {
            capacityText.setText(`${currentCount + 1} item${currentCount + 1 > 1 ? 's' : ''}`);
            capacityText.setColor('#333333');
        }
        
        itemContainer.setVisible(false);
        itemContainer.setData('placed', true);
        itemContainer.setData('zone', zoneData.name);

        this.refreshZoneItemNames(zone);
        this.updateItemListLayout(this.activeTab);
        this.updateProgressTracker();
    }

    /**
     * Silently restore zone placements for items that were already organized in a previous visit.
     * Called once during create(), after all item groups and zone groups are built.
     */
    restoreZonePlacements() {
        const allZones = [
            ...this.fridgeStorageZones,
            ...this.freezerStorageZones,
            ...this.pantryStorageZones,
        ];

        this.itemContainers.forEach(container => {
            const foodItem = container.getData('foodItem');
            if (!foodItem || !foodItem.zoneName) return;

            const zone = allZones.find(z => z.getData('zoneData')?.name === foodItem.zoneName);
            if (!zone) return;

            container.setVisible(false);
            container.setData('placed', true);
            container.setData('zone', foodItem.zoneName);

            const currentCount = zone.getData('itemsInZone') || 0;
            zone.setData('itemsInZone', currentCount + 1);
            const capacityText = zone.getData('capacityText');
            if (capacityText) {
                const n = currentCount + 1;
                capacityText.setText(`${n} item${n > 1 ? 's' : ''}`);
                capacityText.setColor('#333333');
            }
        });

        // Re-layout the active tab so placed items are hidden and remaining ones fill slots
        this.updateItemListLayout(this.activeTab);

        // Refresh item name labels in every zone
        allZones.forEach(zone => this.refreshZoneItemNames(zone));

        this.updateProgressTracker();
    }

    /**
     * Create scroll ▲/▼ buttons and a page label at the bottom of the items panel.
     * These allow the player to page through more than VISIBLE_COUNT items per tab.
     */
    createScrollButtons() {
        const ax = 800, ay = 100, aw = 430, ah = 580;
        const btnY  = ay + ah - 18;   // y=662 — inside the panel, bottom strip
        const btnW  = 44, btnH = 26;

        // ▲ Up button
        const upBg = this.add.rectangle(ax + aw - 60, btnY, btnW, btnH, 0xBBDEFB)
            .setStrokeStyle(2, 0x1565C0).setAlpha(0.5);
        const upText = this.add.text(ax + aw - 60, btnY, '▲', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#90CAF9',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        upBg.setInteractive({ useHandCursor: true });
        upBg.on('pointerdown', () => {
            if (this.scrollIndexes[this.activeTab] > 0) {
                this.scrollIndexes[this.activeTab]--;
                this.updateItemListLayout(this.activeTab);
            }
        });
        upBg.on('pointerover', () => { if (upBg.alpha > 0.5) upBg.setFillStyle(0x90CAF9); });
        upBg.on('pointerout',  () => { if (upBg.alpha > 0.5) upBg.setFillStyle(0x2196F3); });

        // ▼ Down button
        const downBg = this.add.rectangle(ax + aw - 12, btnY, btnW, btnH, 0xBBDEFB)
            .setStrokeStyle(2, 0x1565C0).setAlpha(0.5);
        const downText = this.add.text(ax + aw - 12, btnY, '▼', {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#90CAF9',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        downBg.setInteractive({ useHandCursor: true });
        downBg.on('pointerdown', () => {
            this.scrollIndexes[this.activeTab]++;
            this.updateItemListLayout(this.activeTab);
        });
        downBg.on('pointerover', () => { if (downBg.alpha > 0.5) downBg.setFillStyle(0x90CAF9); });
        downBg.on('pointerout',  () => { if (downBg.alpha > 0.5) downBg.setFillStyle(0x2196F3); });

        // Page indicator label (e.g. "1–6 of 10")
        this.scrollPageLabel = this.add.text(ax + aw - 115, btnY, '', {
            fontSize: '13px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0.5).setVisible(false);

        this.scrollUpBtn   = { bg: upBg,   text: upText   };
        this.scrollDownBtn = { bg: downBg, text: downText };
    }

    /**
     * Create animated progress tracker at top of items area
     */
    createProgressTracker() {
        const ax = 800, ay = 100, aw = 430;
        const progX = ax + 20;
        const progY = ay + 60;
        
        this.progressLabel = this.add.text(progX, progY - 10, '📊 Progress', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        const totalItems = this.itemContainers.length;
        this.progressBar = this.createProgressBar(progX, progY + 20, 380, 20, 0, totalItems);
        
        this.progressText = this.add.text(progX + 190, progY + 42, '0 / ' + totalItems + ' organized', {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0.5, 0);
    }
    
    /**
     * Update progress tracker — counts placed items across ALL tabs
     */
    updateProgressTracker() {
        if (!this.progressBar || !this.progressText) return;
        
        const placedItems = this.itemContainers.filter(item => item.getData('placed'));
        const totalItems  = this.itemContainers.length;
        const placed      = placedItems.length;
        
        const percentage = totalItems > 0 ? placed / totalItems : 0;
        const fillWidth   = 380 * percentage;
        
        let fillColor;
        if (percentage < 0.33)      fillColor = 0xF44336;
        else if (percentage < 0.66) fillColor = 0xFF9800;
        else                        fillColor = 0x4CAF50;
        
        const fill = this.progressBar.getData('fill');
        if (!fill || typeof fillWidth !== 'number' || Number.isNaN(fillWidth)) return;
        
        this.tweens.add({
            targets: fill,
            width: fillWidth,
            duration: 300,
            ease: 'Cubic.out',
            onUpdate: () => fill.setFillStyle(fillColor)
        });
        
        this.tweens.addCounter({
            from: placed - 1,
            to: placed,
            duration: 300,
            ease: 'Cubic.out',
            onUpdate: (tween) => {
                const value = Math.round(tween.getValue());
                this.progressText.setText(`${value} / ${totalItems} organized`);
            }
        });
        
        if (placed === totalItems && totalItems > 0) {
            this.addPulseAnimation(this.progressText, 1.1, 500);
            this.progressText.setColor('#4CAF50');
            this.progressText.setFontStyle('bold');
        }
    }
    
    /**
     * Show enhanced feedback with animations
     */
    showFeedback(message, color, x, y) {
        const bubble = this.add.rectangle(x, y, message.length * 11 + 30, 40, 0xffffff);
        bubble.setStrokeStyle(3, color);
        bubble.setDepth(2000);
        
        const text = this.add.text(x, y, message, {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#' + color.toString(16).padStart(6, '0'),
            fontStyle: 'bold'
        }).setOrigin(0.5);
        text.setDepth(2001);
        
        for (let i = 0; i < 5; i++) {
            const star = this.add.text(
                x + (Math.random() - 0.5) * 40, y, '✨', { fontSize: '16px' }
            ).setOrigin(0.5).setDepth(2002);
            
            this.tweens.add({
                targets: star,
                y: y - 40 - Math.random() * 30,
                x: star.x + (Math.random() - 0.5) * 60,
                alpha: 0,
                duration: 800 + Math.random() * 400,
                ease: 'Power2',
                onComplete: () => star.destroy()
            });
        }
        
        this.tweens.add({
            targets: [bubble, text],
            y: y - 50,
            alpha: 0,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => { bubble.destroy(); text.destroy(); }
        });
        
        bubble.setScale(0.5);
        text.setScale(0.5);
        this.tweens.add({
            targets: [bubble, text],
            scaleX: 1, scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }
    
    /**
     * Create circular timer display
     */
    createTimer() {
        const width = this.cameras.main.width;
        const timerX = width - 150;
        const timerY = 35;
        
        const timerContainer = this.add.container(timerX, timerY);
        
        const timerBg = this.add.circle(0, 0, 42, 0xffffff, 0.95);
        timerBg.setStrokeStyle(3, 0x2196F3);
        
        this.timerGauge = this.createCircularGauge(0, 0, 35, this.timeRemaining, this.timeLimit, `${this.timeRemaining}s`);
        
        this.timerIcon = this.add.text(0, -60, '⏱️', { fontSize: '24px' }).setOrigin(0.5);
        
        timerContainer.add([timerBg, this.timerIcon]);
        timerContainer.setDepth(100);
    }
    
    /**
     * Start countdown timer
     */
    startTimer() {
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeRemaining--;
                
                if (this.timerGauge) {
                    const percentage = this.timeRemaining / this.timeLimit;
                    const angle = percentage * 270;
                    
                    let arcColor;
                    if (percentage < 0.17)      arcColor = 0xF44336;
                    else if (percentage < 0.33) arcColor = 0xFF9800;
                    else                        arcColor = 0x4CAF50;
                    
                    const valueArc = this.timerGauge.getData('valueArc');
                    valueArc.clear();
                    valueArc.lineStyle(10, arcColor, 1);
                    valueArc.beginPath();
                    valueArc.arc(0, 0, 35, Phaser.Math.DegToRad(-225), Phaser.Math.DegToRad(-225 + angle), false);
                    valueArc.strokePath();
                    
                    const text = this.timerGauge.getData('text');
                    text.setText(`${this.timeRemaining}s`);
                    
                    if (this.timeRemaining <= 10) {
                        text.setColor('#F44336');
                        if (!this.timerIcon.getData('pulsing')) {
                            this.addPulseAnimation(this.timerIcon, 1.2, 400);
                            this.timerIcon.setData('pulsing', true);
                        }
                    } else if (this.timeRemaining <= 20) {
                        text.setColor('#FF9800');
                    }
                }
                
                if (this.timeRemaining <= 0) {
                    this.finishOrganizing();
                }
            },
            repeat: this.timeLimit - 1
        });
    }
    
    /**
     * Create done button
     */
    createDoneButton() {
        const width  = this.cameras.main.width;
        const height = this.cameras.main.height;
        const btnH   = 60;
        const bottomPad = 16;
        const btnX   = width / 2;
        const btnY   = height - bottomPad - btnH / 2;
        
        const button = this.add.container(btnX, btnY);
        
        const bg = this.add.rectangle(0, 0, 300, 60, 0x4CAF50);
        bg.setStrokeStyle(4, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, '✅ Done Organizing', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.add([bg, text]);
        
        bg.on('pointerover', () => { bg.setFillStyle(0x66BB6A); button.setScale(1.05); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x4CAF50); button.setScale(1); });
        bg.on('pointerdown', () => this.finishOrganizing());
    }
    
    /**
     * Finish organizing and calculate score
     */
    finishOrganizing() {
        console.log('✅ Storage organization complete');
        
        const score = this.calculateOrganizationScore();
        
        this.household.updateStorageQuality(score.storageQuality);
        this.household.modifyWasteAwareness(score.awarenessChange);
        
        gameState.save();
        
        this.showResults(score);
    }
    
    /**
     * Calculate organization score across ALL tabs combined
     */
    calculateOrganizationScore() {
        let score = 40;
        let storageQuality = 0.5;
        let awarenessChange = 0;
        const feedback = [];
        
        // Use all item containers (fridge + freezer + pantry)
        const placedItems = this.itemContainers.filter(item => item.getData('placed'));
        const totalItems  = this.itemContainers.length;
        
        if (totalItems === 0) {
            return {
                score: 50, storageQuality: 0.7, awarenessChange: 0,
                feedback: ['No items to organize'],
                placedCount: 0, correctCount: 0, totalCount: 0, timeBonus: 0
            };
        }
        
        const placementRate = placedItems.length / totalItems;
        score += placementRate * 30;
        storageQuality += placementRate * 0.2;
        
        let correctCount = 0;
        placedItems.forEach(item => {
            const foodItem = item.getData('foodItem');
            if (foodItem.isProperlyStored) correctCount++;
        });
        
        const correctRate = placedItems.length > 0 ? correctCount / placedItems.length : 0;
        score += correctRate * 20;
        storageQuality += correctRate * 0.2;
        awarenessChange += correctRate * 5;
        
        if (correctRate >= 0.8)      feedback.push('✅ Excellent storage organization!');
        else if (correctRate >= 0.5) feedback.push('👍 Good effort! Check food categories.');
        else                         feedback.push('⚠️ Many items in wrong zones. Review storage tips!');
        
        let timeBonus = 0;
        if (this.timeRemaining > 30) {
            timeBonus = 10;
            score += timeBonus;
            awarenessChange += 2;
            feedback.push('⚡ Speed bonus!');
        }
        
        if (placedItems.length >= totalItems * 0.8) {
            score += 10;
            storageQuality += 0.1;
            awarenessChange += 2;
            feedback.push('✅ Great organization!');
        }
        
        return {
            score: Math.max(0, Math.min(100, score)),
            storageQuality: Math.max(0.5, Math.min(1.0, storageQuality)),
            awarenessChange: Math.max(-5, Math.min(10, awarenessChange)),
            feedback,
            placedCount: placedItems.length,
            correctCount,
            totalCount: totalItems,
            timeBonus
        };
    }
    
    /**
     * Show enhanced results modal with animations
     */
    showResults(score) {
        const width  = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.75);
        overlay.setOrigin(0, 0).setInteractive().setDepth(4000);
        
        const panelWidth  = 700, panelHeight = 550;
        const panelX = width  / 2 - panelWidth  / 2;
        const panelY = height / 2 - panelHeight / 2;
        
        const panelShadow = this.add.rectangle(panelX + 6, panelY + 6, panelWidth, panelHeight, 0x000000, 0.3);
        panelShadow.setOrigin(0, 0).setDepth(4001);
        
        const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff);
        panel.setStrokeStyle(4, 0x2196F3).setOrigin(0, 0).setDepth(4001);
        
        const headerBar = this.add.rectangle(panelX, panelY, panelWidth, 80, 0x2196F3);
        headerBar.setOrigin(0, 0).setDepth(4002);
        
        const title = this.add.text(width / 2, panelY + 40, '📦 Organization Complete!', {
            fontSize: '38px', fontFamily: 'Fredoka, Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4003).setAlpha(0);
        this.tweens.add({ targets: title, alpha: 1, duration: 400, ease: 'Power2' });
        
        const scoreY    = panelY + 130;
        const scoreBadge = this.createBadge(width / 2, scoreY, '⭐', '', 0xFFD700, 80, true);
        scoreBadge.setDepth(4003).setAlpha(0).setScale(0.5);
        this.tweens.add({ targets: scoreBadge, alpha: 1, scaleX: 1, scaleY: 1, duration: 500, delay: 200, ease: 'Back.easeOut' });
        
        this.createCountingText(width / 2, scoreY, 0, score.score, '', '/100', {
            fontSize: '32px', fontFamily: 'Fredoka, Arial', color: '#FFD700', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4004);
        
        const statsY      = panelY + 220;
        const statSpacing = 70;
        
        this.add.text(width / 2 - 230, statsY, '📦', { fontSize: '28px' }).setOrigin(0, 0.5).setDepth(4003);
        this.add.text(width / 2 - 190, statsY - 8, 'Items Organized', {
            fontSize: '16px', fontFamily: 'Fredoka, Arial', color: '#666666'
        }).setOrigin(0, 0).setDepth(4003);
        this.createCountingText(width / 2 - 190, statsY + 10, 0, score.placedCount, '', ` / ${score.totalCount}`, {
            fontSize: '24px', fontFamily: 'Fredoka, Arial', color: '#333333', fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(4003);
        
        this.add.text(width / 2 + 30, statsY, '✓', {
            fontSize: '32px', color: '#4CAF50', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(4003);
        this.add.text(width / 2 + 70, statsY - 8, 'Correct', {
            fontSize: '16px', fontFamily: 'Fredoka, Arial', color: '#666666'
        }).setOrigin(0, 0).setDepth(4003);
        this.createCountingText(width / 2 + 70, statsY + 10, 0, score.correctCount, '', '', {
            fontSize: '24px', fontFamily: 'Fredoka, Arial', color: '#4CAF50', fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(4003);
        
        const qualityY = statsY + statSpacing;
        this.add.text(width / 2 - 160, qualityY, '🏆 Storage Quality', {
            fontSize: '18px', fontFamily: 'Fredoka, Arial', color: '#666666', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(4003);
        const qualityBar = this.createProgressBar(width / 2 - 160, qualityY + 30, 280, 20, score.storageQuality * 100, 100);
        qualityBar.setDepth(4003);
        
        if (score.timeBonus > 0) {
            const timeBadge = this.createBadge(width / 2, qualityY + 65, '⚡', `+${score.timeBonus} Speed Bonus!`, 0xFFD700, 50, true);
            timeBadge.setDepth(4003);
        }
        
        const feedbackY = panelY + panelHeight - 140;
        score.feedback.forEach((fb, index) => {
            this.add.text(width / 2, feedbackY + index * 30, fb, {
                fontSize: '18px', fontFamily: 'Fredoka, Arial', color: '#333333', align: 'center'
            }).setOrigin(0.5).setDepth(4003);
        });
        
        const continueBtn = this.add.container(width / 2, panelY + panelHeight - 50).setDepth(4004);
        const btnBg   = this.add.rectangle(0, 0, 280, 65, 0x4CAF50);
        btnBg.setStrokeStyle(4, 0xffffff).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(0, 0, 'Continue', {
            fontSize: '28px', fontFamily: 'Fredoka, Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        continueBtn.add([btnBg, btnText]);
        
        btnBg.on('pointerover', () => { continueBtn.setScale(1.05); btnBg.setFillStyle(0x66BB6A); });
        btnBg.on('pointerout',  () => { continueBtn.setScale(1);    btnBg.setFillStyle(0x4CAF50); });
        btnBg.on('pointerup', () => {
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                hydraGuide.showFeedback('fridge-complete', {
                    score: score.score,
                    itemsOrganized: this.inventory.items.length
                }, () => this.time.delayedCall(0, () => this.scene.start('ManagementScene')));
            } else {
                this.time.delayedCall(0, () => this.scene.start('ManagementScene'));
            }
        });
    }
    
    // ─── Shared UI utilities (unchanged) ────────────────────────────────────────
    
    createModernPanel(x, y, width, height, color = 0xffffff) {
        const container = this.add.container(x, y);
        const shadow = this.add.rectangle(4, 4, width, height, 0x000000, 0.15);
        shadow.setOrigin(0, 0);
        const panel = this.add.rectangle(0, 0, width, height, color);
        panel.setStrokeStyle(2, 0xcccccc).setOrigin(0, 0);
        container.add([shadow, panel]);
        return container;
    }
    
    createProgressBar(x, y, width, height, value, maxValue, colors = { low: 0xF44336, mid: 0xFF9800, high: 0x4CAF50 }) {
        const container  = this.add.container(x, y);
        const bg         = this.add.rectangle(0, 0, width, height, 0xe0e0e0);
        bg.setOrigin(0, 0.5);
        
        const safeMax = (typeof maxValue === 'number' && maxValue > 0) ? maxValue : 1;
        const percentage = Math.max(0, Math.min(1, value / safeMax));
        const fillWidth  = width * percentage;
        
        let fillColor;
        if (percentage < 0.33)      fillColor = colors.low;
        else if (percentage < 0.66) fillColor = colors.mid;
        else                        fillColor = colors.high;
        
        const fill   = this.add.rectangle(0, 0, fillWidth, height - 4, fillColor);
        fill.setOrigin(0, 0.5);
        
        const border = this.add.rectangle(0, 0, width, height, 0x000000, 0);
        border.setStrokeStyle(2, 0x666666).setOrigin(0, 0.5);
        
        container.add([bg, fill, border]);
        container.setData('fill', fill);
        container.setData('percentage', percentage);
        return container;
    }
    
    createCircularGauge(x, y, radius, value, maxValue, label = '') {
        const container  = this.add.container(x, y);
        const safeMax = (typeof maxValue === 'number' && maxValue > 0) ? maxValue : 1;
        const percentage = Math.max(0, Math.min(1, value / safeMax));
        const angle      = percentage * 270;
        
        let arcColor;
        if (percentage < 0.33)      arcColor = 0xF44336;
        else if (percentage < 0.66) arcColor = 0xFF9800;
        else                        arcColor = 0x4CAF50;
        
        const bgArc = this.add.graphics();
        bgArc.lineStyle(10, 0xe0e0e0, 1);
        bgArc.beginPath();
        bgArc.arc(0, 0, radius, Phaser.Math.DegToRad(-225), Phaser.Math.DegToRad(45), false);
        bgArc.strokePath();
        
        const valueArc = this.add.graphics();
        valueArc.lineStyle(10, arcColor, 1);
        valueArc.beginPath();
        valueArc.arc(0, 0, radius, Phaser.Math.DegToRad(-225), Phaser.Math.DegToRad(-225 + angle), false);
        valueArc.strokePath();
        
        const displayValue = label || `${Math.round(percentage * 100)}%`;
        const text = this.add.text(0, 0, displayValue, {
            fontSize: '24px', fontFamily: 'Fredoka, Arial', color: '#333333', fontStyle: 'bold'
        }).setOrigin(0.5);
        
        container.add([bgArc, valueArc, text]);
        container.setData('valueArc', valueArc);
        container.setData('text', text);
        container.setData('percentage', percentage);
        return container;
    }
    
    createBadge(x, y, icon, label, color = 0xFFD700, size = 60, shouldGlow = false) {
        const container = this.add.container(x, y);
        const bg        = this.add.circle(0, 0, size / 2, color);
        bg.setStrokeStyle(3, 0xffffff);
        
        const iconText = this.add.text(0, -5, icon, { fontSize: `${size * 0.5}px` }).setOrigin(0.5);
        
        if (label) {
            const labelText = this.add.text(0, size / 2 + 15, label, {
                fontSize: '14px', fontFamily: 'Fredoka, Arial', color: '#333333', fontStyle: 'bold'
            }).setOrigin(0.5, 0);
            container.add(labelText);
        }
        
        container.add([bg, iconText]);
        
        if (shouldGlow) {
            this.tweens.add({
                targets: bg, scaleX: 1.1, scaleY: 1.1, alpha: 0.8,
                duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }
        
        return container;
    }
    
    createCountingText(x, y, startValue, endValue, prefix = '', suffix = '', config = {}) {
        const text = this.add.text(x, y, `${prefix}${startValue}${suffix}`, config);
        
        this.tweens.addCounter({
            from: startValue, to: endValue, duration: 1000, ease: 'Cubic.out',
            onUpdate: (tween) => {
                const value = Math.round(tween.getValue());
                text.setText(`${prefix}${value}${suffix}`);
            }
        });
        
        return text;
    }
    
    addPulseAnimation(target, scale = 1.1, duration = 600) {
        this.tweens.add({
            targets: target, scaleX: scale, scaleY: scale,
            duration, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }
}
