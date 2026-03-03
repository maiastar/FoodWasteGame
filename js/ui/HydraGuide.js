/**
 * Hydra Guide System
 * Three-headed hydra representing id, ego, and superego perspectives
 * Provides context-aware advice and feedback on food waste decisions
 */

class HydraGuide {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.dialogueData = null;
        this.container = null;
        
        // Load dialogue data
        if (scene.cache.json.has('hydraDialogue')) {
            this.dialogueData = scene.cache.json.get('hydraDialogue');
        }
    }
    
    /**
     * Show hydra at decision points (before action)
     * @param {string} context - Decision context (e.g., 'shopping-entry')
     * @param {object} gameState - Current game state for context-aware dialogue
     */
    showDecisionAdvice(context, gameState = {}) {
        if (this.isVisible || !this.dialogueData) return;
        
        const dialogue = this.dialogueData.decisions[context];
        if (!dialogue) {
            console.warn(`No dialogue found for context: ${context}`);
            return;
        }
        
        this.show(dialogue, 'decision', gameState);
    }
    
    /**
     * Show hydra as feedback (after action)
     * @param {string} context - Feedback context (e.g., 'shopping-complete')
     * @param {object} results - Action results for analysis
     * @param {function} onComplete - Callback to run when dismissed
     */
    showFeedback(context, results = {}, onComplete = null) {
        if (this.isVisible || !this.dialogueData) {
            if (onComplete) onComplete();
            return;
        }
        
        // Store callback
        this.onCompleteCallback = onComplete;
        
        // Determine which feedback variant to show based on results
        const feedbackKey = this.selectFeedbackVariant(context, results);
        const dialogue = this.dialogueData.feedback[feedbackKey];
        
        if (!dialogue) {
            console.warn(`No dialogue found for feedback: ${feedbackKey}`);
            if (onComplete) onComplete();
            return;
        }
        
        this.show(dialogue, 'feedback', results);
    }
    
    /**
     * Show hydra introduction (tutorial)
     */
    introduceSelf() {
        if (!this.dialogueData || !this.dialogueData.introduction) return;
        
        this.show(this.dialogueData.introduction, 'tutorial');
    }
    
    /**
     * Main display method - shows hydra panel with all three heads
     */
    show(dialogue, type = 'decision', context = {}) {
        if (this.isVisible) return;
        
        this.isVisible = true;
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Container for all hydra UI elements
        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(9500);
        
        // Semi-transparent overlay (non-interactive so buttons work)
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setOrigin(0, 0);
        this.container.add(overlay);
        
        // Main panel with shadow effect
        const panelWidth = 600;
        const panelHeight = 550;
        const panelX = width / 2;
        const panelY = height / 2;
        
        // Shadow
        const shadow = this.scene.add.rectangle(panelX + 4, panelY + 4, panelWidth, panelHeight, 0x000000, 0.3);
        this.container.add(shadow);
        
        const panel = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xF5F5DC);
        panel.setStrokeStyle(6, 0x2F4F2F);
        
        // Scale in animation
        panel.setScale(0.8);
        shadow.setScale(0.8);
        this.scene.tweens.add({
            targets: [panel, shadow],
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        this.container.add(panel);
        
        // Hydra image (top) with animation
        if (this.scene.textures.exists('hydraGuide')) {
            const hydraImg = this.scene.add.image(panelX, panelY - 180, 'hydraGuide');
            hydraImg.setScale(0.25);
            hydraImg.setAlpha(0);
            this.container.add(hydraImg);
            
            // Fade in and gentle bob animation
            this.scene.tweens.add({
                targets: hydraImg,
                alpha: 1,
                duration: 600,
                ease: 'Power2'
            });
            
            this.scene.tweens.add({
                targets: hydraImg,
                y: hydraImg.y - 5,
                duration: 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // Title (based on type)
        const titles = {
            'tutorial': '🐉 Meet Your Guides!',
            'decision': '🤔 What Should We Do?',
            'feedback': '💭 How Did We Do?'
        };
        
        const title = this.scene.add.text(panelX, panelY - 220, titles[type] || '🐉 Hydra Wisdom', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#2F4F2F',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(title);
        
        // Three perspectives (stacked vertically)
        const perspectiveY = panelY - 100;
        const perspectiveSpacing = 90;
        
        // LY (Left Head - Orange)
        this.createPerspectiveBox(
            panelX, perspectiveY,
            'Ly says:', dialogue.ly,
            0xFF9800, panelWidth - 40, false
        );
        
        // MA (Center Head - Teal/Cyan)
        this.createPerspectiveBox(
            panelX, perspectiveY + perspectiveSpacing,
            'Ma says:', dialogue.ma,
            0x00BCD4, panelWidth - 40, false
        );
        
        // AL (Right Head - Purple)
        this.createPerspectiveBox(
            panelX, perspectiveY + perspectiveSpacing * 2,
            'Al says:', dialogue.al,
            0x9C27B0, panelWidth - 40, false
        );
        
        // Continue button with animation
        const btnY = panelY + panelHeight / 2 - 40;
        const btnText = type === 'tutorial' ? 'Got It!' : (type === 'decision' ? 'Let\'s Go!' : 'Continue');
        const continueBtn = this.createButton(panelX, btnY, btnText, 0x4CAF50);
        
        // Pulse animation on button
        this.scene.tweens.add({
            targets: continueBtn,
            scale: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        continueBtn.on('pointerdown', () => {
            this.hide();
        });
    }
    
    /**
     * Create a perspective box for one head
     */
    createPerspectiveBox(x, y, label, message, color, width, isHighlighted = false) {
        const boxHeight = 70;
        
        // Background box (highlighted ego gets extra styling)
        const bg = this.scene.add.rectangle(x, y, width, boxHeight, color, isHighlighted ? 0.25 : 0.15);
        bg.setStrokeStyle(isHighlighted ? 4 : 2, color, isHighlighted ? 1 : 0.6);
        this.container.add(bg);
        
        // Label
        const labelText = this.scene.add.text(x - width / 2 + 15, y - boxHeight / 2 + 10, label, {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: Phaser.Display.Color.IntegerToColor(color).lighten(isHighlighted ? 0 : 20).rgba,
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.container.add(labelText);
        
        // Message
        const messageText = this.scene.add.text(x - width / 2 + 15, y - boxHeight / 2 + 32, message, {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            wordWrap: { width: width - 30 }
        }).setOrigin(0, 0);
        this.container.add(messageText);
        
        // Add glow effect to highlighted ego
        if (isHighlighted) {
            this.scene.tweens.add({
                targets: bg,
                alpha: 0.35,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    /**
     * Create a button
     */
    createButton(x, y, label, color) {
        const btnWidth = 200;
        const btnHeight = 50;
        
        const bg = this.scene.add.rectangle(x, y, btnWidth, btnHeight, color);
        bg.setStrokeStyle(3, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        this.container.add(bg);
        
        const text = this.scene.add.text(x, y, label, {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(text);
        
        // Hover effects
        bg.on('pointerover', () => {
            bg.setScale(1.05);
        });
        
        bg.on('pointerout', () => {
            bg.setScale(1);
        });
        
        return bg;
    }
    
    /**
     * Select appropriate feedback variant based on results
     */
    selectFeedbackVariant(baseContext, results) {
        // Analyze results to determine which feedback to show
        switch (baseContext) {
            case 'shopping-complete':
                if (results.overspent) return 'shopping-complete-overspent';
                if (results.underbudget) return 'shopping-complete-underbudget';
                return 'shopping-complete-good';
                
            case 'cooking-complete':
                if (results.portionsTooLarge) return 'cooking-complete-toolarge';
                if (results.usedExpiringItems) return 'cooking-complete-smart';
                return 'cooking-complete-good';
                
            case 'day-summary':
                if (results.wasteWeight < 1) return 'day-summary-excellent';
                if (results.wasteWeight < 2) return 'day-summary-good';
                if (results.wasteWeight < 4) return 'day-summary-okay';
                return 'day-summary-poor';
                
            default:
                return baseContext;
        }
    }
    
    /**
     * Hide hydra panel
     */
    hide() {
        if (!this.isVisible || !this.container) return;
        
        this.container.destroy();
        this.container = null;
        this.isVisible = false;
        
        // Call completion callback if provided
        if (this.onCompleteCallback) {
            this.onCompleteCallback();
            this.onCompleteCallback = null;
        }
    }
    
    /**
     * Check if hydra guide should be shown (respects user settings)
     */
    shouldShow() {
        // Could add localStorage preference check here
        const setting = localStorage.getItem('foodWasteSimulator_hydraGuide');
        return setting !== 'disabled';
    }
}
