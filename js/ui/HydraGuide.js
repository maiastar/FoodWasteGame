/**
 * Adviser Guide System
 * Provides context-aware prompt-style advice at decision points and after actions.
 * Replaces the three-character Hydra panel with a single clean advice card.
 */

class HydraGuide {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.dialogueData = null;
        this.container = null;

        if (scene.cache.json.has('hydraDialogue')) {
            this.dialogueData = scene.cache.json.get('hydraDialogue');
        }
    }

    /**
     * Show advice before an action (decision point)
     * @param {string} context - e.g. 'shopping-entry'
     * @param {object} gameState - current game state for context-aware text
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
     * Show advice after an action (feedback)
     * @param {string} context - e.g. 'shopping-complete'
     * @param {object} results - action results
     * @param {function} onComplete - called when panel is dismissed
     */
    showFeedback(context, results = {}, onComplete = null) {
        if (this.isVisible || !this.dialogueData) {
            if (onComplete) onComplete();
            return;
        }

        const feedbackKey = this.selectFeedbackVariant(context, results);
        const dialogue = this.dialogueData.feedback[feedbackKey];

        if (!dialogue) {
            console.warn(`No dialogue found for feedback: ${feedbackKey}`);
            if (onComplete) onComplete();
            return;
        }

        this.show(dialogue, 'feedback', results, onComplete);
    }

    /**
     * Show introduction advice (tutorial)
     */
    introduceSelf(onComplete = null) {
        if (!this.dialogueData || !this.dialogueData.introduction) return;
        this.show(this.dialogueData.introduction, 'tutorial', {}, onComplete);
    }

    /**
     * Day-one dashboard intro: ideal minigame order (single card, tutorial styling)
     * @param {function} onComplete - when user dismisses the card
     */
    introduceDayOneIdealFlow(onComplete = null) {
        if (!this.dialogueData) return;
        const d = this.dialogueData.decisions && this.dialogueData.decisions['day1-ideal-flow'];
        if (d) {
            this.show(d, 'tutorial', {}, onComplete);
        } else if (this.dialogueData.introduction) {
            this.show(this.dialogueData.introduction, 'tutorial', {}, onComplete);
        }
    }

    /**
     * Render the advice card
     */
    show(dialogue, type = 'decision', context = {}, onComplete = null) {
        if (this.isVisible) return;

        if (onComplete) {
            this.onCompleteCallback = onComplete;
        }

        this.isVisible = true;
        const width  = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(9500);

        // Dim overlay
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.65);
        overlay.setOrigin(0, 0);
        this.container.add(overlay);

        // Card centered on screen
        const cardW = 520;
        const cardH = 290;
        const cx    = width  / 2;
        const cy    = height / 2;

        // Shadow
        const shadow = this.scene.add.rectangle(cx + 5, cy + 5, cardW, cardH, 0x000000, 0.25);
        this.container.add(shadow);

        // Card background
        const card = this.scene.add.rectangle(cx, cy, cardW, cardH, 0xFFFDE7);
        card.setStrokeStyle(4, 0xF9A825);
        card.setScale(0.85);
        this.scene.tweens.add({
            targets: [card, shadow],
            scale: 1,
            duration: 350,
            ease: 'Back.easeOut'
        });
        this.container.add(card);

        // Header icon + label
        const icons = { tutorial: '👋', decision: '💡', feedback: '✅' };
        const icon = this.scene.add.text(cx - cardW / 2 + 28, cy - cardH / 2 + 22, icons[type] || '💡', {
            fontSize: '36px'
        }).setOrigin(0, 0);
        this.container.add(icon);

        const headers = {
            tutorial: 'Welcome!',
            decision: 'Before you go...',
            feedback: 'How did it go?'
        };
        const header = this.scene.add.text(cx - cardW / 2 + 76, cy - cardH / 2 + 26, headers[type] || 'Tip', {
            fontSize: '22px',
            fontFamily: 'Fredoka, Arial',
            color: '#E65100',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.container.add(header);

        // Divider line
        const divider = this.scene.add.rectangle(cx, cy - cardH / 2 + 72, cardW - 40, 2, 0xF9A825, 0.5);
        this.container.add(divider);

        // Advice text
        const adviceText = (dialogue && dialogue.advice) ? dialogue.advice : 'Keep going — you\'re doing great!';
        const advice = this.scene.add.text(cx, cy - 20, adviceText, {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#4E342E',
            wordWrap: { width: cardW - 60 },
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5, 0.5);
        this.container.add(advice);

        // Continue button
        const btnLabel = type === 'tutorial' ? 'Got It!' : (type === 'decision' ? "Let's Go!" : 'Continue');
        const btnX = cx;
        const btnY = cy + cardH / 2 - 36;

        const btnBg = this.scene.add.rectangle(btnX, btnY, 180, 46, 0xF9A825);
        btnBg.setStrokeStyle(3, 0xffffff);
        btnBg.setInteractive({ useHandCursor: true });
        this.container.add(btnBg);

        const btnText = this.scene.add.text(btnX, btnY, btnLabel, {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(btnText);

        // Button pulse
        this.scene.tweens.add({
            targets: btnBg,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        btnBg.on('pointerover', () => btnBg.setFillStyle(0xFFA000));
        btnBg.on('pointerout',  () => btnBg.setFillStyle(0xF9A825));
        btnBg.on('pointerdown', () => this.hide());

        // Hydra sprite — added LAST so it always renders in front of the card.
        // Positioned to the left of the card, vertically centred.
        // Transparent PNG so no blend mode trick needed.
        // postFX saturation boost makes the colours more vivid.
        if (this.scene.textures.exists('hydraGuide')) {
            const spriteX = cx - cardW / 2 - 150;
            const sprite  = this.scene.add.image(spriteX, cy, 'hydraGuide');
            sprite.setDisplaySize(320, 320);
            if (sprite.postFX) {
                sprite.postFX.addColorMatrix().saturate(1);
            }
            this.container.add(sprite);
        }
    }

    /**
     * Select the appropriate feedback variant based on results
     */
    selectFeedbackVariant(baseContext, results) {
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
     * Dismiss the advice card
     */
    hide() {
        if (!this.isVisible || !this.container) return;

        this.container.destroy();
        this.container = null;
        this.isVisible = false;

        if (this.onCompleteCallback) {
            this.onCompleteCallback();
            this.onCompleteCallback = null;
        }
    }

    /**
     * Check if adviser should be shown (respects user preference)
     */
    shouldShow() {
        const setting = localStorage.getItem('foodWasteSimulator_hydraGuide');
        return setting !== 'disabled';
    }
}
