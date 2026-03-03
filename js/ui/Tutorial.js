/**
 * Tutorial System
 * Shows helpful tips and guides for first-time players
 * Age-appropriate messaging
 */

class Tutorial {
    constructor(scene) {
        this.scene = scene;
        this.currentStep = 0;
        this.isActive = false;
        this.tutorialData = null;
    }
    
    /**
     * Initialize tutorial system
     */
    initialize() {
        // Check if this is first time playing
        const hasSeenTutorial = localStorage.getItem('foodWasteSimulator_tutorialComplete');
        
        if (!hasSeenTutorial) {
            this.isActive = true;
        }
        
        // Load educational content
        if (this.scene.cache.json.has('educationalContent')) {
            this.tutorialData = this.scene.cache.json.get('educationalContent');
        }
    }
    
    /**
     * Show tutorial step for current scene
     * @param {string} sceneKey - Scene identifier
     */
    showTutorialForScene(sceneKey) {
        if (!this.isActive || !this.tutorialData) {
            return;
        }
        
        const step = this.tutorialData.tutorialSteps.find(s => s.scene === sceneKey);
        
        if (step) {
            this.showTutorialPanel(step.title, step.message);
        }
    }
    
    /**
     * Show tutorial panel
     * @param {string} title - Tutorial title
     * @param {string} message - Tutorial message
     */
    showTutorialPanel(title, message) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Semi-transparent overlay
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.6);
        overlay.setOrigin(0, 0);
        overlay.setDepth(8000);
        overlay.setData('tutorial', true);
        
        // Tutorial panel
        const panel = this.scene.add.rectangle(width / 2, height / 2, 700, 300, 0xffffff);
        panel.setStrokeStyle(5, 0xFF9800);
        panel.setDepth(8001);
        panel.setData('tutorial', true);
        
        // Tutorial icon
        this.scene.add.text(width / 2, height / 2 - 100, '💡', {
            fontSize: '60px'
        }).setOrigin(0.5).setDepth(8002).setData('tutorial', true);
        
        // Title
        this.scene.add.text(width / 2, height / 2 - 40, title, {
            fontSize: '32px',
            fontFamily: 'Fredoka, Arial',
            color: '#333333',
            fontStyle: 'bold',
            wordWrap: { width: 650 },
            align: 'center'
        }).setOrigin(0.5).setDepth(8002).setData('tutorial', true);
        
        // Message
        this.scene.add.text(width / 2, height / 2 + 20, message, {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666',
            wordWrap: { width: 650 },
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5).setDepth(8002).setData('tutorial', true);
        
        // Got it button
        const button = this.scene.add.container(width / 2, height / 2 + 110).setDepth(8002);
        button.setData('tutorial', true);
        
        const bg = this.scene.add.rectangle(0, 0, 200, 50, 0xFF9800).setDepth(8002);
        bg.setInteractive({ useHandCursor: true });
        bg.setData('tutorial', true);
        
        const text = this.scene.add.text(0, 0, 'Got it!', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(8002);
        text.setData('tutorial', true);
        
        button.add([bg, text]);
        
        bg.on('pointerdown', () => {
            this.closeTutorial();
        });
    }
    
    /**
     * Close tutorial and remove UI elements
     */
    closeTutorial() {
        // Remove all tutorial elements
        this.scene.children.list.forEach(child => {
            if (child.getData && child.getData('tutorial')) {
                child.destroy();
            }
        });
    }
    
    /**
     * Complete tutorial (don't show again)
     */
    completeTutorial() {
        this.isActive = false;
        localStorage.setItem('foodWasteSimulator_tutorialComplete', 'true');
        console.log('✅ Tutorial completed');
    }
    
    /**
     * Reset tutorial (for testing)
     */
    static resetTutorial() {
        localStorage.removeItem('foodWasteSimulator_tutorialComplete');
        console.log('🔄 Tutorial reset');
    }
    
    /**
     * Show random tip based on context
     * @param {string} category - Tip category
     */
    showRandomTip(category) {
        if (!this.tutorialData || !this.tutorialData.tips[category]) {
            return null;
        }
        
        const tips = this.tutorialData.tips[category];
        return tips[Math.floor(Math.random() * tips.length)];
    }
    
    /**
     * Get age-appropriate waste fact
     * @param {string} ageGroup - '4-8', '9-12', or '13-15'
     */
    getWasteFact(ageGroup = '9-12') {
        if (!this.tutorialData || !this.tutorialData.wasteFactsByAge[ageGroup]) {
            return 'Food waste is a big problem - but we can fix it together!';
        }
        
        const facts = this.tutorialData.wasteFactsByAge[ageGroup];
        return facts[Math.floor(Math.random() * facts.length)];
    }
    
    /**
     * Introduce the Hydra Guide on first gameplay
     */
    introduceHydraGuide() {
        const hasSeenHydra = localStorage.getItem('foodWasteSimulator_hydraIntroComplete');
        
        if (!hasSeenHydra && this.isActive) {
            const hydraGuide = new HydraGuide(this.scene);
            hydraGuide.introduceSelf();
            localStorage.setItem('foodWasteSimulator_hydraIntroComplete', 'true');
        }
    }
}
