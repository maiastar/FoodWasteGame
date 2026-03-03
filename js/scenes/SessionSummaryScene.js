/**
 * Session Summary Scene
 * Shows hidden score and behavior insights at end of full session
 */
class SessionSummaryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SessionSummaryScene' });
        this.summary = null;
    }
    
    init(data) {
        this.summary = data && data.summary ? data.summary : (gameState.sessionSummary || null);
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const household = gameState.household;
        const summary = this.summary || {
            score: 0,
            tier: 'Learning',
            totalWaste: 0,
            totalWasteValue: 0,
            inedibleWasteWeight: 0,
            insights: ['No insights available.']
        };
        
        this.add.rectangle(0, 0, width, height, 0xE8F5E9).setOrigin(0, 0);
        
        this.add.text(width / 2, 70, '🏁 Session Complete!', {
            fontSize: '52px',
            fontFamily: 'Fredoka, Arial',
            color: '#2E7D32',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 130, `${summary.tier} • Hidden Score ${summary.score}`, {
            fontSize: '34px',
            fontFamily: 'Fredoka, Arial',
            color: '#1B5E20',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const statsBox = this.add.rectangle(width / 2, 250, 760, 170, 0xffffff, 0.95).setOrigin(0.5);
        statsBox.setStrokeStyle(3, 0xA5D6A7);
        
        const lines = [
            `🗑️ Total food waste: ${summary.totalWaste.toFixed(2)} lbs`,
            `💵 Estimated waste value: $${summary.totalWasteValue.toFixed(2)}`,
            `🍎 Inedible prep parts: ${summary.inedibleWasteWeight.toFixed(2)} lbs`,
            household ? `👨‍👩‍👧‍👦 Household size: ${household.familySize} • Age range: ${household.ageRange}` : ''
        ].filter(Boolean);
        
        lines.forEach((line, index) => {
            this.add.text(width / 2, 205 + index * 34, line, {
                fontSize: '24px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                align: 'center'
            }).setOrigin(0.5);
        });
        
        this.add.text(width / 2, 370, '📘 Personalized Insights', {
            fontSize: '34px',
            fontFamily: 'Fredoka, Arial',
            color: '#2E7D32',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        summary.insights.slice(0, 5).forEach((insight, index) => {
            this.add.text(width / 2, 420 + index * 42, `• ${insight}`, {
                fontSize: '22px',
                fontFamily: 'Fredoka, Arial',
                color: '#2f2f2f',
                align: 'center',
                wordWrap: { width: 980 }
            }).setOrigin(0.5);
        });
        
        const restartBtn = this.add.rectangle(width / 2, height - 55, 360, 64, 0x4CAF50);
        restartBtn.setStrokeStyle(4, 0xffffff);
        restartBtn.setInteractive({ useHandCursor: true });
        
        this.add.text(width / 2, height - 55, 'Start New Session', {
            fontSize: '30px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        restartBtn.on('pointerdown', () => {
            gameState.clearSave();
            this.scene.start('SetupScene');
        });
    }
}
