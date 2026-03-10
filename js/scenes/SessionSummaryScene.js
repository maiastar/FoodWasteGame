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
            scoreBreakdown: { Pm: 0, Ps: 0, Pc: 0, E: 0 },
            efficiencyRatio: 0,
            totalFoodPurchasedKg: 0,
            totalFoodConsumedKg: 0,
            totalWaste: 0,
            totalWasteValue: 0,
            inedibleWasteWeight: 0,
            insights: ['No insights available.']
        };
        
        this.add.rectangle(0, 0, width, height, 0xE8F5E9).setOrigin(0, 0);
        
        // ── Title ──
        this.add.text(width / 2, 55, '🏁 Session Complete!', {
            fontSize: '48px',
            fontFamily: 'Fredoka, Arial',
            color: '#2E7D32',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.add.text(width / 2, 108, summary.tier, {
            fontSize: '30px',
            fontFamily: 'Fredoka, Arial',
            color: '#1B5E20',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // ── Score Breakdown Panel ──
        // Formula: Score = 0.30*Pm + 0.25*Ps + 0.25*Pc + 0.20*E
        const bd = summary.scoreBreakdown || { Pm: 0, Ps: 0, Pc: 0, E: 0 };
        const panelX = width / 2 - 370;
        const panelY = 135;
        const panelW = 740;
        const panelH = 185;
        
        const scoreBox = this.add.rectangle(width / 2, panelY + panelH / 2, panelW, panelH, 0xffffff, 0.97);
        scoreBox.setStrokeStyle(3, 0xA5D6A7);
        
        this.add.text(panelX + 14, panelY + 12, '📐 Score Breakdown  (w₁·Pm + w₂·Ps + w₃·Pc + w₄·E)', {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#555555',
            fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        const metrics = [
            { label: 'Pm  Meal Planning', weight: 0.30, value: bd.Pm, color: 0x2196F3 },
            { label: 'Ps  Storage',       weight: 0.25, value: bd.Ps, color: 0x9C27B0 },
            { label: 'Pc  Cooking',       weight: 0.25, value: bd.Pc, color: 0xFF9800 },
            { label: 'E   Efficiency',    weight: 0.20, value: bd.E,  color: 0x4CAF50 },
        ];
        
        const barAreaX = panelX + 180;
        const barW = 360;
        const rowH = 30;
        const rowStartY = panelY + 46;
        
        metrics.forEach((m, i) => {
            const ry = rowStartY + i * rowH;
            this.add.text(panelX + 14, ry + 4, m.label, {
                fontSize: '17px', fontFamily: 'Fredoka, Arial', color: '#333333'
            }).setOrigin(0, 0);
            
            // Weight tag
            this.add.text(panelX + 170, ry + 4, `w=${m.weight}`, {
                fontSize: '13px', fontFamily: 'Fredoka, Arial', color: '#888888'
            }).setOrigin(1, 0);
            
            // Bar background
            this.add.rectangle(barAreaX, ry + 12, barW, 18, 0xEEEEEE).setOrigin(0, 0.5);
            // Bar fill
            const fillW = Math.max(4, (m.value / 100) * barW);
            this.add.rectangle(barAreaX, ry + 12, fillW, 18, m.color).setOrigin(0, 0.5);
            
            // Score value
            this.add.text(barAreaX + barW + 10, ry + 4, `${m.value}`, {
                fontSize: '17px', fontFamily: 'Fredoka, Arial', color: '#333333', fontStyle: 'bold'
            }).setOrigin(0, 0);
            
            // Weighted contribution
            const contrib = Math.round(m.weight * m.value);
            this.add.text(barAreaX + barW + 50, ry + 4, `→ ${contrib}`, {
                fontSize: '15px', fontFamily: 'Fredoka, Arial', color: '#888888'
            }).setOrigin(0, 0);
        });
        
        // Final score bar
        const scoreBarY = rowStartY + metrics.length * rowH + 6;
        this.add.rectangle(width / 2, scoreBarY, panelW - 30, 2, 0xDDDDDD).setOrigin(0.5, 0);
        this.add.text(panelX + 14, scoreBarY + 6, `🏆 Final Score`, {
            fontSize: '20px', fontFamily: 'Fredoka, Arial', color: '#2E7D32', fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.add.text(barAreaX, scoreBarY + 6, `${summary.score} / 100`, {
            fontSize: '22px', fontFamily: 'Fredoka, Arial', color: '#2E7D32', fontStyle: 'bold'
        }).setOrigin(0, 0);
        
        // ── Waste Stats + Efficiency ──
        const statsY = panelY + panelH + 16;
        const statsH = 115;
        const statsBox = this.add.rectangle(width / 2, statsY + statsH / 2, panelW, statsH, 0xffffff, 0.95);
        statsBox.setStrokeStyle(3, 0xA5D6A7);
        
        const effPct = Math.round((summary.efficiencyRatio || 0) * 100);
        const fp = (summary.totalFoodPurchasedKg || 0).toFixed(2);
        const fc = (summary.totalFoodConsumedKg || 0).toFixed(2);
        
        const statsLines = [
            `⚡ Efficiency  E = Fc/Fp: ${fc} kg consumed / ${fp} kg purchased = ${effPct}%`,
            `🗑️ Avoidable waste: ${summary.totalWaste.toFixed(2)} lbs  ($${summary.totalWasteValue.toFixed(2)})`,
            `🍎 Inedible prep parts: ${summary.inedibleWasteWeight.toFixed(2)} lbs   |   ${household ? `👨‍👩‍👧 ${household.familySize} people, ages ${household.ageRange}` : ''}`,
        ];
        statsLines.forEach((line, i) => {
            this.add.text(width / 2, statsY + 16 + i * 32, line, {
                fontSize: '20px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                align: 'center',
                wordWrap: { width: panelW - 20 }
            }).setOrigin(0.5, 0);
        });
        
        // ── Insights ──
        const insightsY = statsY + statsH + 14;
        this.add.text(width / 2, insightsY, '📘 Personalized Insights', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#2E7D32',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        summary.insights.slice(0, 4).forEach((insight, index) => {
            this.add.text(width / 2, insightsY + 38 + index * 36, `• ${insight}`, {
                fontSize: '19px',
                fontFamily: 'Fredoka, Arial',
                color: '#2f2f2f',
                align: 'center',
                wordWrap: { width: 950 }
            }).setOrigin(0.5);
        });
        
        // ── Restart Button ──
        const restartBtn = this.add.rectangle(width / 2, height - 48, 340, 60, 0x4CAF50);
        restartBtn.setStrokeStyle(4, 0xffffff);
        restartBtn.setInteractive({ useHandCursor: true });
        
        this.add.text(width / 2, height - 48, '▶  Start New Session', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        restartBtn.on('pointerover', () => restartBtn.setFillStyle(0x66BB6A));
        restartBtn.on('pointerout',  () => restartBtn.setFillStyle(0x4CAF50));
        restartBtn.on('pointerdown', () => {
            gameState.clearSave();
            this.scene.start('SetupScene');
        });
    }
}
