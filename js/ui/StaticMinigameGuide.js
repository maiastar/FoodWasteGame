/**
 * Static game guide (summarized from HOW_TO_PLAY.md).
 * Paginated; separate from HydraGuide contextual popups.
 */

class StaticMinigameGuide {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.container = null;
        this._pageIndex = 0;
        this._subtitleText = null;
        this._bodyText = null;
        this._pageLabelText = null;
        this._prevBg = null;
        this._nextBg = null;
        this._nextLabel = null;
    }

    /** Lightly summarized from HOW_TO_PLAY.md */
    static get PAGES() {
        return [
            {
                subtitle: 'Welcome and setup',
                body:
                    'Learn to cut food waste while running a household: shop, cook, store, and plan smarter.\n\n' +
                    'At start you choose: family size (1–6), income (affects weekly budget), store distance ' +
                    '(how often you shop), and diet (omnivore, vegetarian, or pescatarian). These shape recipes, ' +
                    'budget, and how fast food turns over.'
            },
            {
                subtitle: 'Your dashboard',
                body:
                    'Stats (top-left): budget, waste awareness, total waste, and your grade.\n\n' +
                    'Inventory (top-right): everything you own; colors hint at freshness.\n\n' +
                    'Events (bottom-left): reminders, shopping days, expiring items.\n\n' +
                    'Actions (bottom-right): open minigames and End Day.'
            },
            {
                subtitle: 'Shopping minigame',
                body:
                    'Goal: buy what you need without overspending.\n\n' +
                    '1) Review your list.\n2) Browse and tap items for details.\n3) Add to cart; watch the budget meter.\n' +
                    '4) Remove mistakes with the remove control.\n5) Checkout when ready.\n\n' +
                    'Tips: prefer longer sell-by dates, stick to the list, compare similar items, balance fresh and shelf-stable.\n\n' +
                    'You are scored on list completion, budget, and smart choices.'
            },
            {
                subtitle: 'Cooking minigame',
                body:
                    'Goal: cook from your fridge with the right portions.\n\n' +
                    'Pick a recipe, check ingredients, choose portion size, then cook. Items are used automatically.\n\n' +
                    'Tips: use items that expire soon first (FIFO), size meals for your family, plan to use leftovers.\n\n' +
                    'Oversized meals can add leftovers back with limited freshness. Scoring looks at expiring-first use, portions, and efficiency.'
            },
            {
                subtitle: 'Organize storage minigame',
                body:
                    'Goal: put food where it stays safe and fresh.\n\n' +
                    'Use the Fridge, Freezer, and Pantry tabs. Drag items from the list into the correct zones ' +
                    '(each tab has its own shelves and rules).\n\n' +
                    'Fridge example zones: top shelf for ready-to-eat, middle for dairy, bottom for raw meat, crisper for produce.\n\n' +
                    'Correct placement and finishing organized items improve your score; good storage lowers spoilage risk in the simulation.'
            },
            {
                subtitle: 'Meal planning minigame',
                body:
                    'Goal: fill the week so less food is forgotten.\n\n' +
                    'Open meal slots on the 7-day calendar, assign recipes, and watch the waste projection change.\n\n' +
                    'Prefer recipes that use what you already have and schedule items that expire soon.\n\n' +
                    'Finish planning when you are satisfied; stronger plans noticeably reduce projected waste.'
            },
            {
                subtitle: 'End Day, odds, and strategy',
                body:
                    'The game uses probabilities—not fixed spoil dates. Good storage and planning improve your chances; bad habits worsen them.\n\n' +
                    'End Day: food ages, each item may spoil or be eaten, small random events can happen, then stats and awareness update and the game saves.\n\n' +
                    'Quick wins: list before shopping, cook oldest items first, organize storage regularly, plan the week from inventory.\n\n' +
                    'Awareness and letter grades track learning; aim to push waste down over time, not perfection every single day.'
            }
        ];
    }

    show() {
        if (this.isVisible) return;

        this.isVisible = true;
        this._pageIndex = 0;
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const cardW = Math.min(600, width - 36);
        const cardH = Math.min(540, height - 36);
        const cx = width / 2;
        const cy = height / 2;
        const pages = StaticMinigameGuide.PAGES;
        const total = pages.length;

        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(9300);

        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.55);
        overlay.setOrigin(0, 0);
        overlay.setInteractive({ useHandCursor: true });
        overlay.on('pointerdown', () => this.hide());
        this.container.add(overlay);

        const shadow = this.scene.add.rectangle(cx + 4, cy + 4, cardW, cardH, 0x000000, 0.2);
        this.container.add(shadow);

        const card = this.scene.add.rectangle(cx, cy, cardW, cardH, 0xFFFDE7);
        card.setStrokeStyle(4, 0xF9A825);
        card.setInteractive({ useHandCursor: false });
        card.on('pointerdown', (p) => {
            if (p && p.event) p.event.stopPropagation();
        });
        this.container.add(card);

        const title = this.scene.add.text(cx, cy - cardH / 2 + 22, '📖 Game guide', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#E65100',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.container.add(title);

        this._subtitleText = this.scene.add.text(cx, cy - cardH / 2 + 50, '', {
            fontSize: '17px',
            fontFamily: 'Fredoka, Arial',
            color: '#6D4C41',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.container.add(this._subtitleText);

        const navBtnH = 36;
        const navY = cy + cardH / 2 - 66;
        const bodyTop = cy - cardH / 2 + 78;
        const bodyBottomY = navY - navBtnH / 2 - 8;
        const bodyMaxH = Math.max(140, bodyBottomY - bodyTop);
        const bodyWrapW = cardW - 40;

        this._bodyText = this.scene.add.text(cx, bodyTop, '', {
            fontSize: '20px',
            fontFamily: 'Fredoka, Arial',
            color: '#4E342E',
            wordWrap: { width: bodyWrapW },
            lineSpacing: 5,
            align: 'left'
        }).setOrigin(0.5, 0);
        this._bodyText.setFixedSize(bodyWrapW, bodyMaxH);
        this.container.add(this._bodyText);

        const navBtnW = 108;
        const navGap = 16;

        this._prevBg = this.scene.add.rectangle(cx - navBtnW - navGap / 2, navY, navBtnW, navBtnH, 0xF9A825);
        this._prevBg.setStrokeStyle(2, 0xffffff);
        this._prevBg.setInteractive({ useHandCursor: true });
        this.container.add(this._prevBg);
        const prevLbl = this.scene.add.text(this._prevBg.x, navY, 'Previous', {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(prevLbl);

        this._pageLabelText = this.scene.add.text(cx, navY, '', {
            fontSize: '15px',
            fontFamily: 'Fredoka, Arial',
            color: '#6D4C41'
        }).setOrigin(0.5);
        this.container.add(this._pageLabelText);

        this._nextBg = this.scene.add.rectangle(cx + navBtnW + navGap / 2, navY, navBtnW, navBtnH, 0xF9A825);
        this._nextBg.setStrokeStyle(2, 0xffffff);
        this._nextBg.setInteractive({ useHandCursor: true });
        this.container.add(this._nextBg);
        this._nextLabel = this.scene.add.text(this._nextBg.x, navY, 'Next', {
            fontSize: '16px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(this._nextLabel);

        const wireNavHover = (bg) => {
            bg.on('pointerover', () => {
                if (bg.input && bg.input.enabled) bg.setFillStyle(0xFFA000);
            });
            bg.on('pointerout', () => bg.setFillStyle(0xF9A825));
        };
        wireNavHover(this._prevBg);
        wireNavHover(this._nextBg);

        this._prevBg.on('pointerdown', (p) => {
            if (p && p.event) p.event.stopPropagation();
            if (this._pageIndex <= 0) return;
            this._pageIndex--;
            this._updatePage(total);
        });
        this._nextBg.on('pointerdown', (p) => {
            if (p && p.event) p.event.stopPropagation();
            if (this._pageIndex >= total - 1) {
                this.hide();
                return;
            }
            this._pageIndex++;
            this._updatePage(total);
        });

        const closeY = cy + cardH / 2 - 26;
        const btnBg = this.scene.add.rectangle(cx, closeY, 200, 40, 0xF9A825);
        btnBg.setStrokeStyle(3, 0xffffff);
        btnBg.setInteractive({ useHandCursor: true });
        this.container.add(btnBg);
        const btnText = this.scene.add.text(cx, closeY, 'Close', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.container.add(btnText);
        btnBg.on('pointerover', () => btnBg.setFillStyle(0xFFA000));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0xF9A825));
        btnBg.on('pointerdown', (p) => {
            if (p && p.event) p.event.stopPropagation();
            this.hide();
        });

        this._updatePage(total);
    }

    _updatePage(total) {
        const p = StaticMinigameGuide.PAGES[this._pageIndex];
        this._subtitleText.setText(p.subtitle);
        this._bodyText.setText(p.body);
        this._pageLabelText.setText(`${this._pageIndex + 1} / ${total}`);

        const atFirst = this._pageIndex === 0;
        const atLast = this._pageIndex >= total - 1;

        this._prevBg.setAlpha(atFirst ? 0.4 : 1);
        this._prevBg.setFillStyle(0xF9A825);
        this._prevBg.input.enabled = !atFirst;

        this._nextBg.setFillStyle(0xF9A825);
        this._nextLabel.setText(atLast ? 'Done' : 'Next');
    }

    hide() {
        if (!this.isVisible || !this.container) return;
        this.container.destroy(true);
        this.container = null;
        this.isVisible = false;
        this._subtitleText = null;
        this._bodyText = null;
        this._pageLabelText = null;
        this._prevBg = null;
        this._nextBg = null;
        this._nextLabel = null;
    }
}
