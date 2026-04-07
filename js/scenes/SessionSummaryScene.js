/**
 * Session Summary Scene
 * Shows hidden score and behavior insights at end of full session
 */
class SessionSummaryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SessionSummaryScene' });
        this.summary = null;
        this.sessionSummaryBgm = null;
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
        
        const bd = summary.scoreBreakdown || { Pm: 0, Ps: 0, Pc: 0, E: 0 };

        // ── Two-column layout constants ──
        const boxY   = 128;
        const boxH   = 270;
        const boxW   = 580;
        const leftX  = 50;           // left edge of left box
        const rightX = leftX + boxW + 20; // left edge of right box (gap = 20px)
        const fullW  = boxW * 2 + 20;    // combined width for panels below

        // ── LEFT BOX — Score Breakdown ──
        const scoreBox = this.add.rectangle(leftX + boxW / 2, boxY + boxH / 2, boxW, boxH, 0xffffff, 0.97);
        scoreBox.setStrokeStyle(3, 0xA5D6A7);

        this.add.text(leftX + 14, boxY + 12, '📐 Score Breakdown', {
            fontSize: '16px', fontFamily: 'Fredoka, Arial', color: '#555555', fontStyle: 'bold'
        }).setOrigin(0, 0);

        const metrics = [
            { label: 'Meal Planning', value: bd.Pm, color: 0x2196F3 },
            { label: 'Storage',       value: bd.Ps, color: 0x9C27B0 },
            { label: 'Cooking',       value: bd.Pc, color: 0xFF9800 },
            { label: 'Efficiency',    value: bd.E,  color: 0x4CAF50 },
        ];

        const rowH      = 38;
        const labelColW = 150;
        const barX      = leftX + labelColW + 10;
        const barW      = boxW - labelColW - 70; // leave room for score value
        const rowStartY = boxY + 42;

        metrics.forEach((m, i) => {
            const ry = rowStartY + i * rowH;

            this.add.text(leftX + 14, ry + 10, m.label, {
                fontSize: '16px', fontFamily: 'Fredoka, Arial', color: '#333333', fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            this.add.rectangle(barX, ry + rowH / 2, barW, 16, 0xEEEEEE).setOrigin(0, 0.5);
            const fillW = Math.max(4, (m.value / 100) * barW);
            this.add.rectangle(barX, ry + rowH / 2, fillW, 16, m.color).setOrigin(0, 0.5);

            this.add.text(barX + barW + 8, ry + 10, `${m.value}`, {
                fontSize: '16px', fontFamily: 'Fredoka, Arial', color: '#333333', fontStyle: 'bold'
            }).setOrigin(0, 0.5);
        });

        // Final score row
        const scoreRowY = rowStartY + metrics.length * rowH + 8;
        this.add.rectangle(leftX + boxW / 2, scoreRowY, boxW - 28, 2, 0xDDDDDD).setOrigin(0.5, 0);
        this.add.text(leftX + 14, scoreRowY + 8, '🏆 Final Score', {
            fontSize: '19px', fontFamily: 'Fredoka, Arial', color: '#2E7D32', fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.add.text(barX, scoreRowY + 8, `${summary.score} / 100`, {
            fontSize: '21px', fontFamily: 'Fredoka, Arial', color: '#2E7D32', fontStyle: 'bold'
        }).setOrigin(0, 0);

        // ── RIGHT BOX — What This Means ──
        const rightBox = this.add.rectangle(rightX + boxW / 2, boxY + boxH / 2, boxW, boxH, 0xffffff, 0.97);
        rightBox.setStrokeStyle(3, 0xA5D6A7);

        this.add.text(rightX + 14, boxY + 12, '💬 What This Means', {
            fontSize: '16px', fontFamily: 'Fredoka, Arial', color: '#555555', fontStyle: 'bold'
        }).setOrigin(0, 0);

        // Behavioral interpretation — specific to the player's actual score values
        const behaviorData = [
            {
                label: 'Meal Planning',
                color: '#2196F3',
                text: bd.Pm >= 80
                    ? `Your score of ${bd.Pm} reflects strong planning — you thought ahead about meals and shopped to match, so what you brought home lined up with what you actually ate.`
                    : bd.Pm >= 60
                    ? `Your score of ${bd.Pm} suggests shopping sometimes got ahead of your plan: when purchases don’t line up with what you’ve scheduled to cook, extra food can sit unused.`
                    : `Your score of ${bd.Pm} points to shopping without much look-ahead — without a clear picture of upcoming meals, it’s easy to buy food you never get around to using.`
            },
            {
                label: 'Storage',
                color: '#9C27B0',
                text: bd.Ps >= 80
                    ? `Your score of ${bd.Ps} shows food was stored correctly, keeping it fresh as long as possible.`
                    : bd.Ps >= 60
                    ? `Your score of ${bd.Ps} suggests some food was stored incorrectly, speeding up spoilage.`
                    : `Your score of ${bd.Ps} shows food was often placed in the wrong spot, accelerating spoilage.`
            },
            {
                label: 'Cooking',
                color: '#FF9800',
                text: bd.Pc >= 80
                    ? `Your score of ${bd.Pc} shows you used expiring items first and cooked the right portions.`
                    : bd.Pc >= 60
                    ? `Your score of ${bd.Pc} suggests you sometimes missed chances to use older food before it expired.`
                    : `Your score of ${bd.Pc} indicates expiring food was often skipped when cooking.`
            },
            {
                label: 'Efficiency',
                color: '#4CAF50',
                text: bd.E >= 80
                    ? `Your score of ${bd.E} means nearly all food you bought was eaten — excellent habits overall.`
                    : bd.E >= 60
                    ? `Your score of ${bd.E} means a noticeable share of purchased food went uneaten this session.`
                    : `Your score of ${bd.E} means a large amount of food you bought was never consumed.`
            },
        ];

        const bRowH     = 56; // taller rows to accommodate two lines of text
        const bStartY   = boxY + 42;
        const bTextW    = boxW - 28;

        behaviorData.forEach((b, i) => {
            const by = bStartY + i * bRowH;

            // Coloured label
            this.add.text(rightX + 14, by + 2, b.label, {
                fontSize: '14px', fontFamily: 'Fredoka, Arial',
                color: b.color, fontStyle: 'bold'
            }).setOrigin(0, 0);

            // Behavioral interpretation text
            this.add.text(rightX + 14, by + 20, b.text, {
                fontSize: '14px', fontFamily: 'Fredoka, Arial',
                color: '#333333', wordWrap: { width: bTextW }
            }).setOrigin(0, 0);
        });

        // ── Waste Stats (full width, below both boxes) ──
        const statsY = boxY + boxH + 12;
        const statsH = 90;
        const statsBox = this.add.rectangle(leftX + fullW / 2, statsY + statsH / 2, fullW, statsH, 0xffffff, 0.95);
        statsBox.setStrokeStyle(3, 0xA5D6A7);

        const effPct = Math.round((summary.efficiencyRatio || 0) * 100);
        const statsLines = [
            `⚡ Efficiency: ${effPct}%   |   🗑️ Avoidable waste: ${summary.totalWaste.toFixed(2)} lbs  ($${summary.totalWasteValue.toFixed(2)})`,
            `🍎 Inedible prep waste: ${summary.inedibleWasteWeight.toFixed(2)} lbs${household ? `   |   👨‍👩‍👧 ${household.familySize} people, ages ${household.ageRange}` : ''}`,
        ];
        statsLines.forEach((line, i) => {
            this.add.text(leftX + fullW / 2, statsY + 16 + i * 32, line, {
                fontSize: '18px', fontFamily: 'Fredoka, Arial', color: '#333333',
                align: 'center', wordWrap: { width: fullW - 20 }
            }).setOrigin(0.5, 0);
        });

        // ── Financial Waste Panel ──
        const finY = statsY + statsH + 10;
        const finH = 110;
        const finBox = this.add.rectangle(leftX + fullW / 2, finY + finH / 2, fullW, finH, 0xffffff, 0.97);
        finBox.setStrokeStyle(3, 0xA5D6A7);

        const wasteDollars = summary.totalWasteValue || 0;
        const totalSpent   = summary.totalSpent || 0;
        const wastePct     = totalSpent > 0 ? Math.round((wasteDollars / totalSpent) * 100) : 0;
        const usedDollars  = Math.max(0, totalSpent - wasteDollars);
        const usedPct      = 100 - wastePct;

        // Left column — dollar amount wasted
        const colMid = leftX + fullW / 4;
        this.add.text(colMid, finY + 18, '💸 Money Thrown Away', {
            fontSize: '14px', fontFamily: 'Fredoka, Arial', color: '#888888', fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.add.text(colMid, finY + 38, `$${wasteDollars.toFixed(2)}`, {
            fontSize: '36px', fontFamily: 'Fredoka, Arial', color: '#E53935', fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.add.text(colMid, finY + 82, 'in avoidable food waste', {
            fontSize: '13px', fontFamily: 'Fredoka, Arial', color: '#AAAAAA', fontStyle: 'italic'
        }).setOrigin(0.5, 0);

        // Divider
        this.add.rectangle(leftX + fullW / 2, finY + finH / 2, 2, finH - 24, 0xDDDDDD).setOrigin(0.5, 0.5);

        // Right column — percentage breakdown
        const colMid2 = leftX + (fullW * 3) / 4;
        this.add.text(colMid2, finY + 18, `${wastePct}% of your grocery budget was wasted`, {
            fontSize: '17px', fontFamily: 'Fredoka, Arial', color: '#E53935', fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.add.text(colMid2, finY + 50, `${usedPct}% was used well`, {
            fontSize: '17px', fontFamily: 'Fredoka, Arial', color: '#2E7D32', fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.add.text(colMid2, finY + 76, `($${usedDollars.toFixed(2)} out of $${totalSpent.toFixed(2)} spent)`, {
            fontSize: '14px', fontFamily: 'Fredoka, Arial', color: '#777777'
        }).setOrigin(0.5, 0);
        
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

        if (this.cache.audio.exists('sessionSummaryBgm')) {
            this.sessionSummaryBgm = this.sound.add('sessionSummaryBgm', { loop: true, volume: 0.35 });
            this.sessionSummaryBgm.play();
            if (typeof wireBgmAfterAutoplayPolicy === 'function') {
                wireBgmAfterAutoplayPolicy(this, () => this.sessionSummaryBgm);
            }
        }
        const shutdownEv = (typeof Phaser !== 'undefined' && Phaser.Scenes && Phaser.Scenes.Events && Phaser.Scenes.Events.SHUTDOWN)
            ? Phaser.Scenes.Events.SHUTDOWN
            : 'shutdown';
        this.events.once(shutdownEv, () => {
            if (this.sessionSummaryBgm) {
                this.sessionSummaryBgm.stop();
                this.sessionSummaryBgm.destroy();
                this.sessionSummaryBgm = null;
            }
        });
    }
}
