/**
 * Fridge Organization Minigame
 * Drag items to correct storage zones, organize by expiration date
 * Teaches FIFO (First In, First Out) and proper food storage
 */

class FridgeMinigame extends Phaser.Scene {
    constructor() {
        super({ key: 'FridgeMinigame' });
        
        this.household = null;
        this.inventory = null;
        this.draggedItem = null;
        this.storageZones = [];
        this.itemContainers = [];
        this.timeLimit = 60; // 60 seconds
        this.timeRemaining = 60;
        this.timerText = null;
    }
    
    create() {
        console.log('📦 FridgeMinigame: Starting fridge organization...');
        
        // Clear arrays from previous play to prevent stale references
        this.storageZones = [];
        this.itemContainers = [];
        
        this.household = gameState.household;
        this.inventory = gameState.inventory;
        this.timeRemaining = this.timeLimit;
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(0, 0, width, height, 0xE1F5FE).setOrigin(0, 0);
        
        // Header
        this.createHeader();
        
        // Create fridge layout
        this.createFridgeLayout();
        
        // Create items to organize
        this.createFoodItems();
        
        // Create progress tracker
        this.createProgressTracker();
        
        // Create timer
        this.createTimer();
        
        // Create done button
        this.createDoneButton();
        
        // Instructions
        this.showInstructions();
        
        // Show hydra decision advice
        this.time.delayedCall(500, () => {
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                hydraGuide.showDecisionAdvice('fridge-entry', {
                    totalItems: this.inventory.items.length,
                    storageQuality: this.household.storageQuality
                });
            }
        });
        
        // Start timer
        this.startTimer();
    }
    
    /**
     * Create header
     */
    createHeader() {
        const width = this.cameras.main.width;
        
        this.add.rectangle(0, 0, width, 70, 0x2196F3).setOrigin(0, 0);
        
        this.add.text(30, 35, '📦 Organize Your Fridge', {
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
            console.log('Exiting fridge organization without saving...');
            this.scene.start('ManagementScene');
        });
        exitBtn.on('pointerover', () => exitBtn.setStyle({ backgroundColor: '#B71C1C' }));
        exitBtn.on('pointerout', () => exitBtn.setStyle({ backgroundColor: '#D32F2F' }));
    }
    
    /**
     * Create fridge layout with storage zones
     */
    createFridgeLayout() {
        const fridgeX = 50;
        const fridgeY = 100;
        const fridgeWidth = 700;
        const fridgeHeight = 580;
        
        // Fridge outline
        this.add.rectangle(fridgeX, fridgeY, fridgeWidth, fridgeHeight, 0xffffff).setOrigin(0, 0);
        this.add.rectangle(fridgeX, fridgeY, fridgeWidth, fridgeHeight).setStrokeStyle(5, 0x333333).setOrigin(0, 0);
        
        // Define storage zones
        const zones = [
            {
                name: 'Top Shelf',
                description: 'Ready-to-eat, Leftovers',
                y: fridgeY + 20,
                height: 120,
                color: 0xE8F5E9,
                acceptsCategories: ['other', 'dairy']
            },
            {
                name: 'Middle Shelf',
                description: 'Dairy, Eggs',
                y: fridgeY + 150,
                height: 120,
                color: 0xFFF9C4,
                acceptsCategories: ['dairy']
            },
            {
                name: 'Bottom Shelf',
                description: 'Raw Meat, Fish',
                y: fridgeY + 280,
                height: 120,
                color: 0xFFCDD2,
                acceptsCategories: ['meat', 'fish']
            },
            {
                name: 'Crisper Drawer',
                description: 'Produce, Vegetables',
                y: fridgeY + 410,
                height: 120,
                color: 0xC8E6C9,
                acceptsCategories: ['produce']
            }
        ];
        
        zones.forEach((zone) => {
            this.createStorageZone(fridgeX, zone.y, fridgeWidth, zone.height, zone);
        });
    }
    
    /**
     * Create a storage zone with modern styling
     */
    createStorageZone(x, y, width, height, zoneData) {
        const zone = this.add.container(x, y);
        
        // Shadow
        const shadow = this.add.rectangle(3, 3, width, height, 0x000000, 0.1);
        shadow.setOrigin(0, 0);
        
        // Zone background with enhanced color
        const bg = this.add.rectangle(0, 0, width, height, zoneData.color, 0.85);
        bg.setStrokeStyle(3, 0x333333);
        bg.setOrigin(0, 0);
        
        // Add zone icon badge
        const zoneIcons = {
            'Top Shelf': '🍱',
            'Middle Shelf': '🥛',
            'Bottom Shelf': '🥩',
            'Crisper Drawer': '🥬'
        };
        const zoneIcon = zoneIcons[zoneData.name] || '📦';
        
        const iconBadge = this.add.circle(width - 25, 25, 20, 0xffffff, 0.9);
        iconBadge.setStrokeStyle(2, 0x333333);
        
        const icon = this.add.text(width - 25, 25, zoneIcon, {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        // Zone label with modern styling
        const label = this.add.text(15, 15, zoneData.name, {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Zone description
        const desc = this.add.text(15, 42, zoneData.description, {
            fontSize: '15px',
            fontFamily: 'Fredoka, Arial',
            color: '#555555',
            fontStyle: 'italic'
        }).setOrigin(0, 0);
        
        // Capacity indicator
        const capacityText = this.add.text(15, height - 15, 'Empty', {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#999999'
        }).setOrigin(0, 1);
        
        zone.add([shadow, bg, iconBadge, icon, label, desc, capacityText]);
        zone.setData('zoneData', zoneData);
        zone.setData('isZone', true);
        zone.setData('bg', bg);
        zone.setData('capacityText', capacityText);
        zone.setData('itemsInZone', 0);
        
        // Make zone interactive for drop
        bg.setInteractive({ dropZone: true });
        
        this.storageZones.push(zone);
    }
    
    /**
     * Create draggable food items
     */
    createFoodItems() {
        const itemAreaX = 800;
        const itemAreaY = 100;
        const itemAreaWidth = 430;
        const itemAreaHeight = 580;
        
        // Items background
        this.add.rectangle(itemAreaX, itemAreaY, itemAreaWidth, itemAreaHeight, 0xffffff, 0.95).setOrigin(0, 0);
        this.add.rectangle(itemAreaX, itemAreaY, itemAreaWidth, itemAreaHeight).setStrokeStyle(3, 0x333333).setOrigin(0, 0);
        
        // Title
        this.add.text(itemAreaX + 20, itemAreaY + 15, '🧺 Items to Organize', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Get fridge items (only items that should be in fridge)
        const fridgeItems = this.inventory.items.filter(item => 
            ['produce', 'dairy', 'meat', 'fish', 'other'].includes(item.category) && !item.isSpoiled()
        );
        
        // Sort by expiration (teach FIFO)
        fridgeItems.sort(FoodItem.compareByFreshness);
        
        // Create draggable items (start below progress bar)
        const itemStartY = itemAreaY + 120;
        const itemHeight = 70;
        
        fridgeItems.slice(0, 6).forEach((item, index) => {
            const itemY = itemStartY + index * itemHeight;
            this.createDraggableItem(itemAreaX + 20, itemY, item);
        });
        
        if (fridgeItems.length === 0) {
            this.add.text(itemAreaX + itemAreaWidth / 2, itemAreaY + 150, 
                'Fridge is empty!\nGo shopping first.', {
                fontSize: '22px',
                fontFamily: 'Fredoka, Arial',
                color: '#999999',
                align: 'center'
            }).setOrigin(0.5);
        }
    }
    
    /**
     * Create draggable food item with modern card styling
     */
    createDraggableItem(x, y, foodItem) {
        const container = this.add.container(x, y);
        
        // Shadow
        const shadow = this.add.rectangle(3, 3, 380, 65, 0x000000, 0.12);
        shadow.setOrigin(0, 0);
        
        // Item background with gradient effect
        const itemColor = parseInt(foodItem.color.replace('#', '0x'));
        const bg = this.add.rectangle(0, 0, 380, 65, 0xffffff);
        bg.setStrokeStyle(3, itemColor);
        bg.setOrigin(0, 0);
        
        // Colored left accent bar
        const accentBar = this.add.rectangle(0, 0, 8, 65, itemColor);
        accentBar.setOrigin(0, 0);
        
        // Icon with circular background
        const icons = {
            'produce': '🥬', 'dairy': '🥛', 'meat': '🥩', 
            'fish': '🐟', 'other': '🍱'
        };
        const icon = icons[foodItem.category] || '🍱';
        
        const iconBg = this.add.circle(35, 32, 22, itemColor, 0.2);
        const iconText = this.add.text(35, 32, icon, {
            fontSize: '32px'
        }).setOrigin(0.5);
        
        // Name
        const nameText = this.add.text(68, 18, foodItem.name, {
            fontSize: '19px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // Freshness bar and days left
        const freshnessPercentage = foodItem.getFreshnessPercentage();
        const daysLeft = foodItem.freshness.toFixed(1);
        
        // Freshness mini progress bar
        const barWidth = 100;
        const barHeight = 8;
        const barX = 68;
        const barY = 45;
        
        const freshnessBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0xe0e0e0);
        freshnessBg.setOrigin(0, 0.5);
        
        let freshnessColor;
        if (freshnessPercentage >= 60) {
            freshnessColor = 0x4CAF50; // Green
        } else if (freshnessPercentage >= 30) {
            freshnessColor = 0xFF9800; // Orange
        } else {
            freshnessColor = 0xF44336; // Red
        }
        
        const freshnessFill = this.add.rectangle(barX, barY, barWidth * (freshnessPercentage / 100), barHeight - 2, freshnessColor);
        freshnessFill.setOrigin(0, 0.5);
        
        // Days left text
        const daysText = this.add.text(barX + barWidth + 8, barY, `${daysLeft}d`, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: freshnessPercentage < 30 ? '#F44336' : '#666666',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        // Quantity badge (right side)
        const qtyBadge = this.add.circle(360, 32, 16, 0x2196F3);
        qtyBadge.setStrokeStyle(2, 0xffffff);
        
        const qtyText = this.add.text(360, 32, foodItem.quantity.toString(), {
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
        
        // Make draggable
        bg.setInteractive({ draggable: true, useHandCursor: true });
        
        this.itemContainers.push(container);
        
        // Drag events with enhanced feedback
        this.input.setDraggable(bg);
        
        bg.on('dragstart', (pointer) => {
            // Store the offset between pointer and container position
            container.setData('dragOffsetX', pointer.x - container.x);
            container.setData('dragOffsetY', pointer.y - container.y);
            
            container.setScale(1.08);
            container.setDepth(1000);
            bg.setStrokeStyle(4, itemColor);
            shadow.setAlpha(0.25);
            
            // Highlight all compatible zones
            this.storageZones.forEach(zone => {
                const zoneData = zone.getData('zoneData');
                if (zoneData.acceptsCategories.includes(foodItem.category)) {
                    const zoneBg = zone.getData('bg');
                    if (zoneBg) {
                        zoneBg.setStrokeStyle(5, 0x4CAF50);
                        zoneBg.setAlpha(1);
                    }
                }
            });
        });
        
        bg.on('drag', (pointer, dragX, dragY) => {
            // Apply the offset so item stays where user grabbed it
            const offsetX = container.getData('dragOffsetX') || 0;
            const offsetY = container.getData('dragOffsetY') || 0;
            container.x = pointer.x - offsetX;
            container.y = pointer.y - offsetY;
        });
        
        bg.on('dragend', () => {
            container.setScale(1);
            container.setDepth(0);
            bg.setStrokeStyle(3, itemColor);
            shadow.setAlpha(0.12);
            
            // Remove zone highlighting
            this.storageZones.forEach(zone => {
                const zoneBg = zone.getData('bg');
                const zoneData = zone.getData('zoneData');
                if (zoneBg) {
                    zoneBg.setStrokeStyle(3, 0x333333);
                    zoneBg.setAlpha(0.85);
                }
            });
            
            // Check if dropped on valid zone using item's center point
            const itemCenterX = container.x + container.width / 2;
            const itemCenterY = container.y + container.height / 2;
            const zone = this.getZoneAt(itemCenterX, itemCenterY);
            
            if (zone) {
                this.placeItemInZone(container, zone);
            } else {
                // Snap back with bounce animation
                this.tweens.add({
                    targets: container,
                    x: container.getData('originalX'),
                    y: container.getData('originalY'),
                    duration: 300,
                    ease: 'Back.easeOut'
                });
            }
        });
        
        // Hover effect when not dragging
        bg.on('pointerover', () => {
            if (!this.input.dragState) {
                container.setScale(1.03);
            }
        });
        
        bg.on('pointerout', () => {
            if (!this.input.dragState) {
                container.setScale(1);
            }
        });
    }
    
    /**
     * Get zone at position (using zone background bounds)
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
     * Place item in zone with enhanced feedback
     */
    placeItemInZone(itemContainer, zone) {
        const foodItem = itemContainer.getData('foodItem');
        const zoneData = zone.getData('zoneData');
        
        // Check if correct category
        const isCorrect = zoneData.acceptsCategories.includes(foodItem.category);
        
        if (isCorrect) {
            console.log(`✅ Correctly placed ${foodItem.name} in ${zoneData.name}`);
            foodItem.isProperlyStored = true;
            
            // Enhanced visual feedback
            this.showFeedback('Perfect! ✓', 0x4CAF50, itemContainer.x, itemContainer.y - 40);
            
            // Flash zone green
            const zoneBg = zone.getData('bg');
            this.tweens.add({
                targets: zoneBg,
                alpha: 1,
                duration: 150,
                yoyo: true,
                repeat: 1
            });
        } else {
            console.log(`⚠️ ${foodItem.name} in wrong zone (${zoneData.name})`);
            foodItem.isProperlyStored = false;
            
            // Visual feedback
            this.showFeedback('Wrong zone!', 0xFF5722, itemContainer.x, itemContainer.y - 40);
            
            // Flash zone orange
            const zoneBg = zone.getData('bg');
            this.tweens.add({
                targets: zoneBg,
                alpha: 0.6,
                duration: 150,
                yoyo: true,
                repeat: 2
            });
        }
        
        // Update zone capacity display
        const currentCount = zone.getData('itemsInZone') || 0;
        zone.setData('itemsInZone', currentCount + 1);
        const capacityText = zone.getData('capacityText');
        if (capacityText) {
            capacityText.setText(`${currentCount + 1} item${currentCount + 1 > 1 ? 's' : ''}`);
            capacityText.setColor('#333333');
        }
        
        // Remove item from holding area (it's now "placed")
        itemContainer.setVisible(false);
        itemContainer.setData('placed', true);
        itemContainer.setData('zone', zoneData.name);
        
        // Update progress tracker
        this.updateProgressTracker();
    }
    
    /**
     * Create animated progress tracker at top of items area
     */
    createProgressTracker() {
        const itemAreaX = 800;
        const itemAreaY = 100;
        const itemAreaWidth = 430;
        
        // Progress bar container (moved to top, below title)
        const progX = itemAreaX + 20;
        const progY = itemAreaY + 60;
        
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
     * Update progress tracker animation
     */
    updateProgressTracker() {
        if (!this.progressBar || !this.progressText) return;
        
        const placedItems = this.itemContainers.filter(item => item.getData('placed'));
        const totalItems = this.itemContainers.length;
        const placed = placedItems.length;
        
        // Update bar fill
        const percentage = totalItems > 0 ? placed / totalItems : 0;
        const fillWidth = 380 * percentage;
        
        let fillColor;
        if (percentage < 0.33) {
            fillColor = 0xF44336;
        } else if (percentage < 0.66) {
            fillColor = 0xFF9800;
        } else {
            fillColor = 0x4CAF50;
        }
        
        const fill = this.progressBar.getData('fill');
        
        // Animate bar growth
        this.tweens.add({
            targets: fill,
            width: fillWidth,
            duration: 300,
            ease: 'Cubic.out',
            onUpdate: () => {
                fill.setFillStyle(fillColor);
            }
        });
        
        // Update text with counting animation
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
        
        // Celebrate when complete
        if (placed === totalItems) {
            this.addPulseAnimation(this.progressText, 1.1, 500);
            this.progressText.setColor('#4CAF50');
            this.progressText.setFontStyle('bold');
        }
    }
    
    /**
     * Show enhanced feedback with animations
     */
    showFeedback(message, color, x, y) {
        // Background bubble
        const bubble = this.add.rectangle(x, y, message.length * 11 + 30, 40, 0xffffff);
        bubble.setStrokeStyle(3, color);
        bubble.setDepth(2000);
        
        // Text
        const text = this.add.text(x, y, message, {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#' + color.toString(16).padStart(6, '0'),
            fontStyle: 'bold'
        }).setOrigin(0.5);
        text.setDepth(2001);
        
        // Particle effect (stars)
        for (let i = 0; i < 5; i++) {
            const star = this.add.text(
                x + (Math.random() - 0.5) * 40,
                y,
                '✨',
                { fontSize: '16px' }
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
        
        // Float up and fade
        this.tweens.add({
            targets: [bubble, text],
            y: y - 50,
            alpha: 0,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => {
                bubble.destroy();
                text.destroy();
            }
        });
        
        // Scale animation
        bubble.setScale(0.5);
        text.setScale(0.5);
        this.tweens.add({
            targets: [bubble, text],
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }
    
    /**
     * Create circular timer display
     */
    createTimer() {
        const width = this.cameras.main.width;
        
        // Timer container with modern panel
        const timerX = width - 150;
        const timerY = 35;
        
        const timerContainer = this.add.container(timerX, timerY);
        
        // Background circle
        const timerBg = this.add.circle(0, 0, 42, 0xffffff, 0.95);
        timerBg.setStrokeStyle(3, 0x2196F3);
        
        // Circular gauge for time
        this.timerGauge = this.createCircularGauge(0, 0, 35, this.timeRemaining, this.timeLimit, `${this.timeRemaining}s`);
        
        // Clock icon
        this.timerIcon = this.add.text(0, -60, '⏱️', {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        timerContainer.add([timerBg, this.timerIcon]);
        timerContainer.setDepth(100);
    }
    
    /**
     * Start countdown timer with visual updates
     */
    startTimer() {
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeRemaining--;
                
                // Update circular gauge
                if (this.timerGauge) {
                    const percentage = this.timeRemaining / this.timeLimit;
                    const angle = percentage * 270;
                    
                    // Determine color
                    let arcColor;
                    if (percentage < 0.17) {
                        arcColor = 0xF44336; // Red (last 10 seconds)
                    } else if (percentage < 0.33) {
                        arcColor = 0xFF9800; // Orange
                    } else {
                        arcColor = 0x4CAF50; // Green
                    }
                    
                    // Update arc
                    const valueArc = this.timerGauge.getData('valueArc');
                    valueArc.clear();
                    valueArc.lineStyle(10, arcColor, 1);
                    valueArc.beginPath();
                    valueArc.arc(0, 0, 35, Phaser.Math.DegToRad(-225), Phaser.Math.DegToRad(-225 + angle), false);
                    valueArc.strokePath();
                    
                    // Update text
                    const text = this.timerGauge.getData('text');
                    text.setText(`${this.timeRemaining}s`);
                    
                    // Color warning
                    if (this.timeRemaining <= 10) {
                        text.setColor('#F44336');
                        // Pulse animation on icon
                        if (!this.timerIcon.getData('pulsing')) {
                            this.addPulseAnimation(this.timerIcon, 1.2, 400);
                            this.timerIcon.setData('pulsing', true);
                        }
                    } else if (this.timeRemaining <= 20) {
                        text.setColor('#FF9800');
                    }
                }
                
                // Time's up
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
        const width = this.cameras.main.width;
        const btnX = width / 2;
        const btnY = 660;
        
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
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0x66BB6A);
            button.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x4CAF50);
            button.setScale(1);
        });
        
        bg.on('pointerdown', () => {
            this.finishOrganizing();
        });
    }
    
    /**
     * Show instructions
     */
    showInstructions() {
        const instructionX = 50;
        const instructionY = 690;
        
        this.add.text(instructionX, instructionY, 
            '💡 Drag items to the correct shelf! Use expiring items first (FIFO).', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            backgroundColor: '#ffffff',
            padding: { x: 15, y: 8 }
        }).setOrigin(0, 0);
    }
    
    /**
     * Finish organizing and calculate score
     */
    finishOrganizing() {
        console.log('✅ Fridge organization complete');
        
        // Calculate score
        const score = this.calculateOrganizationScore();
        
        // Update household storage quality
        this.household.updateStorageQuality(score.storageQuality);
        this.household.modifyWasteAwareness(score.awarenessChange);
        
        // Save game
        gameState.save();
        
        // Show results
        this.showResults(score);
    }
    
    /**
     * Calculate organization score
     */
    calculateOrganizationScore() {
        let score = 40; // Base score
        let storageQuality = 0.5; // Base quality
        let awarenessChange = 0;
        const feedback = [];
        
        // Count items placed
        const placedItems = this.itemContainers.filter(item => item.getData('placed'));
        const totalItems = this.itemContainers.length;
        
        if (totalItems === 0) {
            return {
                score: 50,
                storageQuality: 0.7,
                awarenessChange: 0,
                feedback: ['No items to organize'],
                placedCount: 0,
                correctCount: 0,
                totalCount: 0,
                timeBonus: 0
            };
        }
        
        const placementRate = placedItems.length / totalItems;
        score += placementRate * 30;
        storageQuality += placementRate * 0.2;
        
        // Count correctly placed items
        let correctCount = 0;
        placedItems.forEach(item => {
            const foodItem = item.getData('foodItem');
            if (foodItem.isProperlyStored) {
                correctCount++;
            }
        });
        
        const correctRate = placedItems.length > 0 ? correctCount / placedItems.length : 0;
        score += correctRate * 20;
        storageQuality += correctRate * 0.2;
        awarenessChange += correctRate * 5;
        
        if (correctRate >= 0.8) {
            feedback.push('✅ Excellent storage organization!');
        } else if (correctRate >= 0.5) {
            feedback.push('👍 Good effort! Check food categories.');
        } else {
            feedback.push('⚠️ Many items in wrong zones. Review storage tips!');
        }
        
        // Time bonus
        let timeBonus = 0;
        if (this.timeRemaining > 30) {
            timeBonus = 10;
            score += timeBonus;
            awarenessChange += 2;
            feedback.push('⚡ Speed bonus!');
        }
        
        // Check FIFO (items sorted by expiration)
        // For simplicity, we'll give bonus if they placed items at all
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
            feedback: feedback,
            placedCount: placedItems.length,
            correctCount: correctCount,
            totalCount: totalItems,
            timeBonus: timeBonus
        };
    }
    
    /**
     * Show enhanced results modal with animations
     */
    showResults(score) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.75);
        overlay.setOrigin(0, 0);
        overlay.setInteractive();
        overlay.setDepth(4000);
        
        // Modern panel with shadow
        const panelWidth = 700;
        const panelHeight = 550;
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2;
        
        const panelShadow = this.add.rectangle(panelX + 6, panelY + 6, panelWidth, panelHeight, 0x000000, 0.3);
        panelShadow.setOrigin(0, 0).setDepth(4001);
        
        const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff);
        panel.setStrokeStyle(4, 0x2196F3);
        panel.setOrigin(0, 0).setDepth(4001);
        
        // Gradient header bar
        const headerBar = this.add.rectangle(panelX, panelY, panelWidth, 80, 0x2196F3);
        headerBar.setOrigin(0, 0).setDepth(4002);
        
        // Title with animation
        const title = this.add.text(width / 2, panelY + 40, '📦 Organization Complete!', {
            fontSize: '38px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4003);
        
        title.setAlpha(0);
        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 400,
            ease: 'Power2'
        });
        
        // Score badge with animation
        const scoreY = panelY + 130;
        const scoreBadge = this.createBadge(
            width / 2, scoreY,
            '⭐', '',
            0xFFD700, 80, true
        );
        scoreBadge.setDepth(4003);
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
        this.createCountingText(width / 2, scoreY, 0, score.score, '', '/100', {
            fontSize: '32px',
            fontFamily: 'Fredoka, Arial',
            color: '#FFD700',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4004);
        
        // Stats section with modern layout
        const statsY = panelY + 220;
        const statSpacing = 70;
        
        // Row 1: Items organized
        const itemsIcon = this.add.text(width / 2 - 230, statsY, '📦', {
            fontSize: '28px'
        }).setOrigin(0, 0.5).setDepth(4003);
        
        this.add.text(width / 2 - 190, statsY - 8, 'Items Organized', {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0, 0).setDepth(4003);
        
        this.createCountingText(width / 2 - 190, statsY + 10, 0, score.placedCount, '', ` / ${score.totalCount}`, {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(4003);
        
        // Row 1: Correct placements
        const correctIcon = this.add.text(width / 2 + 30, statsY, '✓', {
            fontSize: '32px',
            color: '#4CAF50',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(4003);
        
        this.add.text(width / 2 + 70, statsY - 8, 'Correct', {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0, 0).setDepth(4003);
        
        this.createCountingText(width / 2 + 70, statsY + 10, 0, score.correctCount, '', '', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#4CAF50',
            fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(4003);
        
        // Row 2: Storage quality gauge
        const qualityY = statsY + statSpacing;
        
        this.add.text(width / 2 - 160, qualityY, '🏆 Storage Quality', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(4003);
        
        const qualityBar = this.createProgressBar(
            width / 2 - 160, qualityY + 30,
            280, 20,
            score.storageQuality * 100, 100
        );
        qualityBar.setDepth(4003);
        
        // Row 3: Time bonus
        if (score.timeBonus > 0) {
            const timeY = qualityY + 65;
            const timeBadge = this.createBadge(
                width / 2, timeY,
                '⚡', `+${score.timeBonus} Speed Bonus!`,
                0xFFD700, 50, true
            );
            timeBadge.setDepth(4003);
        }
        
        // Feedback messages
        const feedbackY = panelY + panelHeight - 140;
        score.feedback.forEach((feedback, index) => {
            this.add.text(width / 2, feedbackY + index * 30, feedback, {
                fontSize: '18px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                align: 'center'
            }).setOrigin(0.5).setDepth(4003);
        });
        
        // Continue button with enhanced styling
        const continueBtn = this.add.container(width / 2, panelY + panelHeight - 50).setDepth(4004);
        
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
            const hydraGuide = new HydraGuide(this);
            if (hydraGuide.shouldShow()) {
                hydraGuide.showFeedback('fridge-complete', {
                    score: score.score,
                    itemsOrganized: this.inventory.items.length
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
        const button = this.add.container(950, 35);
        
        const bg = this.add.circle(0, 0, 25, 0xffffff, 0.9);
        bg.setStrokeStyle(3, 0x333333);
        bg.setInteractive({ useHandCursor: true });
        
        const text = this.add.text(0, 0, '🏠', {
            fontSize: '24px'
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
     * Create a circular gauge/arc meter (used for timer)
     */
    createCircularGauge(x, y, radius, value, maxValue, label = '') {
        const container = this.add.container(x, y);
        
        const percentage = Math.max(0, Math.min(1, value / maxValue));
        const angle = percentage * 270;
        
        let arcColor;
        if (percentage < 0.33) {
            arcColor = 0xF44336;
        } else if (percentage < 0.66) {
            arcColor = 0xFF9800;
        } else {
            arcColor = 0x4CAF50;
        }
        
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
}
